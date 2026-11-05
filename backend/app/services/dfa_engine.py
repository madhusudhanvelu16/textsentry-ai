"""Pure Deterministic Finite Automaton (DFA) Engine for TextSentry AI.

Theory of Computation Formal Specification:
Pattern: Multiple Consecutive Spaces equivalent to regex ` {2,}`
Language L = { w in {SPACE, OTHER}* | w is a sequence of 2 or more spaces }

Formal 5-tuple: M = (Q, Sigma, delta, q0, F)
- Q = {q0, q1, q2, qdead}
- Sigma = {SPACE, OTHER}
- q0 = Starting State
- F = {q2} (Accepting State)

Transition Table delta:
+---------------+-------+-------+
| Current State | SPACE | OTHER |
+---------------+-------+-------+
| q0            | q1    | qdead |
| q1            | q2    | qdead |
| q2            | q2    | qdead |
| qdead         | qdead | qdead |
+---------------+-------+-------+

NOTE: This module strictly DOES NOT import or invoke any regular expression
library (`re`, `regex`, etc.). All matching is performed via deterministic
state machine transitions.
"""

from __future__ import annotations
import time
from typing import List, Dict, Tuple, Any
from ..models.schemas import (
    DFAStep,
    DFASimulateResult,
    DFAMatch,
    DFAScanResult,
)

# Formal States
STATE_Q0 = "q0"        # Start: 0 spaces consumed
STATE_Q1 = "q1"        # 1 space consumed (non-accepting)
STATE_Q2 = "q2"        # >= 2 spaces consumed (ACCEPTING)
STATE_QDEAD = "qdead"  # Dead / trap state for invalid whole-string inputs

STATES = [STATE_Q0, STATE_Q1, STATE_Q2, STATE_QDEAD]
START_STATE = STATE_Q0
ACCEPTING_STATES = {STATE_Q2}

# Transition Table mapping: delta[current_state][symbol_type] -> next_state
TRANSITIONS: Dict[str, Dict[str, str]] = {
    STATE_Q0: {"SPACE": STATE_Q1, "OTHER": STATE_QDEAD},
    STATE_Q1: {"SPACE": STATE_Q2, "OTHER": STATE_QDEAD},
    STATE_Q2: {"SPACE": STATE_Q2, "OTHER": STATE_QDEAD},
    STATE_QDEAD: {"SPACE": STATE_QDEAD, "OTHER": STATE_QDEAD},
}

STATE_DESCRIPTIONS: Dict[str, str] = {
    STATE_Q0: "Start state: 0 spaces consumed so far.",
    STATE_Q1: "Prefix state: exactly 1 space consumed (non-accepting).",
    STATE_Q2: "Accepting state: 2 or more consecutive spaces consumed.",
    STATE_QDEAD: "Dead/trap state: non-space character received in whole-string recognition.",
}


def classify_char(char: str) -> str:
    """Map character to DFA alphabet Sigma = {SPACE, OTHER}."""
    return "SPACE" if char == " " else "OTHER"


def format_char_display(char: str) -> str:
    """Format character for human visual display in UI traces."""
    if char == " ":
        return "[SPACE]"
    if char == "\t":
        return "[TAB]"
    if char == "\n":
        return "[NEWLINE]"
    if char == "\r":
        return "[CR]"
    return char


def simulate_formal_dfa(input_string: str) -> DFASimulateResult:
    """Execute the formal DFA on a candidate string to test membership in L(M).

    Consumes characters strictly left-to-right from q0 without restarting.
    """
    current_state = START_STATE
    steps: List[DFAStep] = []

    for idx, char in enumerate(input_string):
        symbol = classify_char(char)
        next_state = TRANSITIONS[current_state][symbol]
        is_accepting = next_state in ACCEPTING_STATES

        action_desc = (
            f"Read {format_char_display(char)} ({symbol}) -> "
            f"transitioned from {current_state} to {next_state}. "
            f"{'Entered accepting state!' if is_accepting else ('Entered dead state!' if next_state == STATE_QDEAD else 'Continues in non-accepting state.')}"
        )

        steps.append(
            DFAStep(
                step_index=idx + 1,
                current_state=current_state,
                symbol=symbol,
                char_display=format_char_display(char),
                char_code=ord(char),
                next_state=next_state,
                is_accepting=is_accepting,
                action_description=action_desc,
            )
        )
        current_state = next_state

    accepted = current_state in ACCEPTING_STATES

    return DFASimulateResult(
        input_string=input_string,
        accepted=accepted,
        final_state=current_state,
        steps=steps,
    )


def scan_document_dfa(text: str) -> DFAScanResult:
    """Scan an arbitrary document text using the DFA state transitions.

    Unlike whole-string recognition, a document scanner resets on non-space
    characters. It identifies every maximal contiguous substring matching
    two or more spaces.

    This function does NOT use regex.
    """
    start_ns = time.perf_counter_ns()
    matches: List[DFAMatch] = []
    text_len = len(text)

    state = STATE_Q0
    run_start = -1

    # Pre-calculate line starts for fast line/col computation without regex
    line_starts = [0]
    for idx, c in enumerate(text):
        if c == "\n":
            line_starts.append(idx + 1)

    def compute_line_col(pos: int) -> Tuple[int, int]:
        # Binary search or scan
        low = 0
        high = len(line_starts) - 1
        best_line = 0
        while low <= high:
            mid = (low + high) // 2
            if line_starts[mid] <= pos:
                best_line = mid
                low = mid + 1
            else:
                high = mid - 1
        line_num = best_line + 1
        col_num = pos - line_starts[best_line] + 1
        return (line_num, col_num)

    for i in range(text_len):
        char = text[i]

        if char == " ":
            if state == STATE_Q0:
                state = STATE_Q1
                run_start = i
            elif state == STATE_Q1:
                state = STATE_Q2
            elif state == STATE_Q2:
                # Remain in q2 for 3rd, 4th, ... space
                state = STATE_Q2
        else:
            # Encountered OTHER
            if state == STATE_Q2 and run_start != -1:
                run_end = i
                l_num, c_num = compute_line_col(run_start)
                matches.append(
                    DFAMatch(
                        start=run_start,
                        end=run_end,
                        length=run_end - run_start,
                        matched_text=text[run_start:run_end],
                        line=l_num,
                        column=c_num,
                    )
                )
            state = STATE_Q0
            run_start = -1

    # Check terminal state at end of document
    if state == STATE_Q2 and run_start != -1:
        run_end = text_len
        l_num, c_num = compute_line_col(run_start)
        matches.append(
            DFAMatch(
                start=run_start,
                end=run_end,
                length=run_end - run_start,
                matched_text=text[run_start:run_end],
                line=l_num,
                column=c_num,
            )
        )

    end_ns = time.perf_counter_ns()
    duration_ns = end_ns - start_ns
    duration_ms = duration_ns / 1_000_000.0

    return DFAScanResult(
        pattern_name="Multiple Consecutive Spaces",
        regex_equivalent=r" {2,}",
        total_occurrences=len(matches),
        matches=matches,
        execution_time_ns=duration_ns,
        execution_time_ms=duration_ms,
    )


def get_dfa_spans(text: str) -> List[Tuple[int, int]]:
    """Convenience helper returning list of (start, end) tuples for multiple spaces."""
    result = scan_document_dfa(text)
    return [(m.start, m.end) for m in result.matches]

