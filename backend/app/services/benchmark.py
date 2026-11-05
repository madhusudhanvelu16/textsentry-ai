"""Benchmarking and Comparison Service for TextSentry AI.

Compares Regex vs DFA on matching accuracy, exact offset agreement,
lines of code, and nanosecond-resolution execution timings.
"""

from __future__ import annotations
import os
import re
import statistics
import time
from typing import List, Dict, Tuple, Any
from ..models.schemas import (
    BenchmarkSizeResult,
    CompareResult,
)
from .dfa_engine import scan_document_dfa, get_dfa_spans

# Precompiled regex for the target pattern
RE_TARGET = re.compile(r" {2,}")


def generate_benchmark_corpus(target_bytes: int) -> str:
    """Generate a controlled text corpus with periodic multiple space occurrences."""
    # A standard sentence with 3 controlled multiple-space runs
    # Run 1: 'system  analyzes' (2 spaces)
    # Run 2: 'text  efficiently' (2 spaces)
    # Run 3: 'and   reliably.' (3 spaces)
    sentence = "The system  analyzes text  efficiently and   reliably in automata theory.\n"
    unit_size = len(sentence.encode("utf-8"))
    repeat_count = max(1, target_bytes // unit_size)
    corpus = sentence * repeat_count
    return corpus


def run_single_benchmark(corpus: str, iterations: int = 20) -> BenchmarkSizeResult:
    """Benchmark Regex vs DFA on a given corpus string over repeated iterations."""
    # Warm-up runs
    for _ in range(2):
        _ = list(RE_TARGET.finditer(corpus))
        _ = scan_document_dfa(corpus)

    regex_times: List[int] = []
    dfa_times: List[int] = []

    for _ in range(iterations):
        # Time Regex
        t0 = time.perf_counter_ns()
        re_matches = list(RE_TARGET.finditer(corpus))
        t1 = time.perf_counter_ns()
        regex_times.append(t1 - t0)

        # Time DFA
        t2 = time.perf_counter_ns()
        dfa_result = scan_document_dfa(corpus)
        t3 = time.perf_counter_ns()
        dfa_times.append(t3 - t2)

    re_median = statistics.median(regex_times)
    dfa_median = statistics.median(dfa_times)
    re_min = min(regex_times)
    dfa_min = min(dfa_times)
    re_std = statistics.stdev(regex_times) if len(regex_times) > 1 else 0.0
    dfa_std = statistics.stdev(dfa_times) if len(dfa_times) > 1 else 0.0

    return BenchmarkSizeResult(
        size_label=f"{len(corpus) // 1000} KB" if len(corpus) < 1_000_000 else f"{len(corpus) // 1_000_000} MB",
        char_count=len(corpus),
        regex_median_ns=float(re_median),
        dfa_median_ns=float(dfa_median),
        regex_min_ns=float(re_min),
        dfa_min_ns=float(dfa_min),
        regex_std_ns=float(re_std),
        dfa_std_ns=float(dfa_std),
        regex_median_ms=float(re_median) / 1_000_000.0,
        dfa_median_ms=float(dfa_median) / 1_000_000.0,
        matches_found=len(re_matches),
    )


def count_loc(file_path: str) -> Dict[str, int]:
    """Calculate verifiable Lines of Code metrics for a Python source file."""
    if not os.path.exists(file_path):
        return {"total": 0, "code": 0, "comments": 0, "blank": 0}

    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    total = len(lines)
    blank = 0
    comments = 0
    code = 0
    in_multiline_docstring = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            blank += 1
            continue

        if '"""' in stripped or "'''" in stripped:
            count_delim = stripped.count('"""') + stripped.count("'''")
            if count_delim == 1:
                in_multiline_docstring = not in_multiline_docstring
                comments += 1
                continue
            elif count_delim >= 2 and (stripped.startswith('"""') or stripped.startswith("'''")):
                comments += 1
                continue

        if in_multiline_docstring:
            comments += 1
            continue

        if stripped.startswith("#"):
            comments += 1
        else:
            code += 1

    return {"total": total, "code": code, "comments": comments, "blank": blank}


def get_codebase_metrics() -> Dict[str, Any]:
    """Retrieve verified LOC and engineering metrics for Regex vs DFA modules."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    regex_file = os.path.join(base_dir, "regex_engine.py")
    dfa_file = os.path.join(base_dir, "dfa_engine.py")

    regex_loc = count_loc(regex_file)
    dfa_loc = count_loc(dfa_file)

    return {
        "regex_engine": {
            "file": "backend/app/services/regex_engine.py",
            **regex_loc,
            "architecture": "Compiled C-Extension Engine (PCRE/Python SRE)",
            "cognitive_complexity": "Low (Declarative regex patterns)",
            "flexibility": "High for complex grammatical rules",
        },
        "dfa_engine": {
            "file": "backend/app/services/dfa_engine.py",
            **dfa_loc,
            "architecture": "Pure Deterministic Finite Automaton (Q={q0,q1,q2,qdead})",
            "cognitive_complexity": "Moderate (Explicit state transition table & scanner loop)",
            "flexibility": "Strictly limited to regular languages L(M)",
        },
    }


def execute_comparison(text: str, include_benchmarks: bool = True) -> CompareResult:
    """Perform a live comparative analysis between Regular Expressions and DFA."""
    # 1. Spans from regex
    re_matches = list(RE_TARGET.finditer(text))
    re_spans = [(m.start(), m.end()) for m in re_matches]

    # 2. Spans from DFA
    dfa_spans = get_dfa_spans(text)

    # 3. Exact agreement check
    exact_agreement = (re_spans == dfa_spans)

    benchmarks: List[BenchmarkSizeResult] = []
    if include_benchmarks:
        # Benchmark across 1 KB, 10 KB, 100 KB, 1 MB
        sizes = [
            ("1 KB", 1024, 25),
            ("10 KB", 10_240, 15),
            ("100 KB", 102_400, 8),
            ("1 MB", 1_048_576, 3),
        ]
        for label, byte_count, iters in sizes:
            corpus = generate_benchmark_corpus(byte_count)
            res = run_single_benchmark(corpus, iterations=iters)
            res.size_label = label
            benchmarks.append(res)

    code_metrics = get_codebase_metrics()

    analysis_comparison = {
        "pattern": "Multiple Consecutive Spaces (` {2,}`)",
        "theoretical_complexity": {
            "regex": "O(N) for linear matching; backreferences in other patterns can degrade to O(N^2)",
            "dfa": "Strict O(N) worst-case time complexity, independent of alphabet size",
        },
        "space_complexity": {
            "regex": "O(N) memory allocation for match objects and capture groups",
            "dfa": "O(1) auxiliary working memory (single integer state pointer and index)",
        },
        "runtime_nature": {
            "regex": "Compiled C extension loop with vectorized byte scanning in Python's SRE engine",
            "dfa": "Pure Python bytecode loop interpreting state transitions per character",
        },
        "academic_conclusion": (
            "While pure DFA guarantees theoretical linear time O(N) with O(1) auxiliary memory, "
            "Python's native `re` module is compiled in optimized C, often yielding lower clock time "
            "for simple patterns. However, DFA provides verifiable formal guarantees against catastrophic backtracking."
        ),
    }

    return CompareResult(
        text_tested_chars=len(text),
        regex_occurrences=len(re_spans),
        dfa_occurrences=len(dfa_spans),
        exact_matches_agreement=exact_agreement,
        regex_spans=re_spans,
        dfa_spans=dfa_spans,
        benchmarks=benchmarks,
        code_metrics=code_metrics,
        analysis_comparison=analysis_comparison,
    )

