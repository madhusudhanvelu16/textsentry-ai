"""Correction Engine for TextSentry AI.

Provides conflict-free single-pass and multi-stage text correction pipelines.
Ensures zero offset-drift artifacts and handles overlapping error regions cleanly.
"""

from __future__ import annotations
import re
from typing import List, Optional, Tuple, Set
from ..models.schemas import DetectedError, CorrectionResult
from .regex_engine import detect_all_errors, RE_LOWER_SENTENCE


def apply_stage_corrections(text: str, enabled_categories: Optional[Set[str]] = None) -> Tuple[str, int, List[str]]:
    """Execute the multi-stage deterministic correction pipeline.

    Order of operations is mathematically chosen to avoid conflicting edits:
    1. Repeated words: Collapses 'is is' -> 'is'
    2. Space before punctuation: Removes ' ?' -> '?'
    3. Missing space after punctuation: Inserts ',W' -> ', W'
    4. Multiple consecutive spaces: Collapses '  ' -> ' '
    5. Standalone lowercase pronoun 'i': Capitalizes 'i' -> 'I'
    6. Sentence start capitalization: Capitalizes 'c' -> 'C' after '.', '!', '?', or start of line
    """
    summary: List[str] = []
    current_text = text
    applied_count = 0

    all_enabled = enabled_categories is None

    # Stage 1: Repeated words
    if all_enabled or "repeated_words" in enabled_categories:
        stage1_pat = re.compile(r"\b([A-Za-z]+)[ \t]+\1\b", re.IGNORECASE)
        matches = list(stage1_pat.finditer(current_text))
        if matches:
            current_text = stage1_pat.sub(r"\1", current_text)
            applied_count += len(matches)
            summary.append(f"Stage 1: Resolved {len(matches)} repeated word instance(s).")

    # Stage 2: Space before punctuation
    if all_enabled or "space_before_punct" in enabled_categories:
        stage2_pat = re.compile(r" +(?=[,.;:!?])")
        matches = list(stage2_pat.finditer(current_text))
        if matches:
            current_text = stage2_pat.sub("", current_text)
            applied_count += len(matches)
            summary.append(f"Stage 2: Removed unnecessary space before {len(matches)} punctuation mark(s).")

    # Stage 3: Missing space after punctuation
    if all_enabled or "missing_space_after_punct" in enabled_categories:
        stage3_pat = re.compile(r"(?<=[,.;:!?])(?=[A-Za-z])")
        matches = list(stage3_pat.finditer(current_text))
        if matches:
            current_text = stage3_pat.sub(" ", current_text)
            applied_count += len(matches)
            summary.append(f"Stage 3: Inserted spacing after {len(matches)} punctuation mark(s).")

    # Stage 4: Multiple spaces
    if all_enabled or "multiple_spaces" in enabled_categories:
        stage4_pat = re.compile(r" {2,}")
        matches = list(stage4_pat.finditer(current_text))
        if matches:
            current_text = stage4_pat.sub(" ", current_text)
            applied_count += len(matches)
            summary.append(f"Stage 4: Normalised {len(matches)} multiple space run(s).")

    # Stage 5: Standalone lowercase pronoun 'i'
    if all_enabled or "lowercase_pronoun_i" in enabled_categories:
        stage5_pat = re.compile(r"(?<![A-Za-z])i(?![A-Za-z])")
        matches = list(stage5_pat.finditer(current_text))
        if matches:
            current_text = stage5_pat.sub("I", current_text)
            applied_count += len(matches)
            summary.append(f"Stage 5: Capitalized {len(matches)} pronoun 'i' occurrence(s).")

    # Stage 6: Sentence start capitalization
    if all_enabled or "lowercase_sentence_start" in enabled_categories:
        stage6_pat = re.compile(r"(?m)(?:^|(?<=[.!?]))[ \t]*([a-z])")
        matches = list(stage6_pat.finditer(current_text))
        if matches:
            current_text = stage6_pat.sub(lambda m: m.group(0)[:-1] + m.group(1).upper(), current_text)
            applied_count += len(matches)
            summary.append(f"Stage 6: Capitalized {len(matches)} sentence initial character(s).")

    return current_text, applied_count, summary


def apply_selective_corrections(text: str, target_error_ids: Set[str]) -> Tuple[str, int, List[str]]:
    """Apply corrections strictly for the user-selected error IDs.

    Uses right-to-left substitution along the string to prevent offset mutation
    from invalidating earlier positions.
    """
    errors, _ = detect_all_errors(text)
    selected_errors = [e for e in errors if e.id in target_error_ids]

    if not selected_errors:
        return text, 0, ["No matching errors selected."]

    # Sort descending by start offset, and zero-width matches last within same offset
    selected_errors.sort(key=lambda e: (e.start, 1 if e.is_zero_width else 0), reverse=True)

    applied_count = 0
    summary = []
    current_chars = list(text)

    # Track occupied spans to avoid conflicting overlapping edits
    occupied_intervals: List[Tuple[int, int]] = []

    def overlaps_with_previous(s: int, e: int) -> bool:
        for prev_s, prev_e in occupied_intervals:
            # For zero-width insertions:
            if s == e:
                if prev_s <= s < prev_e:
                    return True
            else:
                if max(s, prev_s) < min(e, prev_e):
                    return True
        return False

    for err in selected_errors:
        s, e = err.start, err.end
        if overlaps_with_previous(s, e):
            # If span was already modified by an overlapping edit, skip
            continue

        replacement = err.suggested_correction
        # Apply replacement to character list
        current_chars[s:e] = list(replacement)
        occupied_intervals.append((s, max(s + len(replacement), e)))
        applied_count += 1
        summary.append(f"Applied correction for '{err.pattern_name}' at line {err.line}, col {err.column}.")

    corrected_text = "".join(current_chars)
    return corrected_text, applied_count, summary


def correct_document(
    text: str,
    selected_error_ids: Optional[List[str]] = None,
    enabled_categories: Optional[List[str]] = None,
) -> CorrectionResult:
    """Entry point for document correction."""
    if not text:
        return CorrectionResult(
            original_text="",
            corrected_text="",
            corrections_applied=0,
            remaining_errors_count=0,
            summary=["Empty text provided."],
            remaining_errors=[],
        )

    if selected_error_ids is not None:
        target_ids = set(selected_error_ids)
        corrected_text, count, summary = apply_selective_corrections(text, target_ids)
    else:
        cats = set(enabled_categories) if enabled_categories else None
        corrected_text, count, summary = apply_stage_corrections(text, cats)

    # Re-evaluate remaining errors
    remaining_errors, counts = detect_all_errors(corrected_text)

    return CorrectionResult(
        original_text=text,
        corrected_text=corrected_text,
        corrections_applied=count,
        remaining_errors_count=len(remaining_errors),
        summary=summary,
        remaining_errors=remaining_errors,
    )

