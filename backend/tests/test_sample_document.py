"""Pytest suite for sample document validation."""

import os
import pytest
from app.services.regex_engine import detect_all_errors
from app.services.dfa_engine import scan_document_dfa
from app.services.correction_engine import correct_document


SAMPLE_TEXT = """welcome to the the campus.  i am a a student.
this is  an example,with errors  in spacing .
the course is is useful.hello,world!
can you  fix this ? i i think so."""

EXPECTED_CORRECTED = """Welcome to the campus. I am a student.
This is an example, with errors in spacing.
The course is useful. Hello, world!
Can you fix this? I think so."""


def test_sample_document_exact_error_counts():
    """Verify that sample document produces exactly 23 pattern matches with specified breakdown."""
    errors, counts = detect_all_errors(SAMPLE_TEXT)

    assert len(errors) == 23, f"Expected 23 total matches, got {len(errors)}"
    assert counts["lowercase_sentence_start"] == 7, f"Expected 7 sentence start errors, got {counts['lowercase_sentence_start']}"
    assert counts["lowercase_pronoun_i"] == 3, f"Expected 3 pronoun i errors, got {counts['lowercase_pronoun_i']}"
    assert counts["multiple_spaces"] == 4, f"Expected 4 multiple spaces errors, got {counts['multiple_spaces']}"
    assert counts["repeated_words"] == 4, f"Expected 4 repeated words errors, got {counts['repeated_words']}"
    assert counts["missing_space_after_punct"] == 3, f"Expected 3 missing spaces errors, got {counts['missing_space_after_punct']}"
    assert counts["space_before_punct"] == 2, f"Expected 2 space before punct errors, got {counts['space_before_punct']}"


def test_sample_document_exact_corrected_text():
    """Verify that auto-correction yields the exact specified corrected text."""
    res = correct_document(SAMPLE_TEXT)
    assert res.corrected_text == EXPECTED_CORRECTED, "Corrected text does not match expected output"


def test_corrected_sample_reanalysis_zero_errors():
    """Verify that re-analysis of the corrected sample text finds 0 remaining errors."""
    res = correct_document(SAMPLE_TEXT)
    remaining_errors, counts = detect_all_errors(res.corrected_text)
    assert len(remaining_errors) == 0, f"Expected 0 remaining errors, found {len(remaining_errors)}"
    for cat, count in counts.items():
        assert count == 0, f"Category {cat} still has {count} errors"


def test_sample_dfa_scanner_agreement():
    """Verify that DFA scanner detects exactly 4 multiple space runs agreeing with Regex."""
    errors, _ = detect_all_errors(SAMPLE_TEXT)
    re_multispace_spans = [(e.start, e.end) for e in errors if e.category == "multiple_spaces"]

    dfa_res = scan_document_dfa(SAMPLE_TEXT)
    dfa_spans = [(m.start, m.end) for m in dfa_res.matches]

    assert len(dfa_spans) == 4, f"Expected 4 DFA space runs, got {len(dfa_spans)}"
    assert dfa_spans == re_multispace_spans, f"DFA spans {dfa_spans} do not match regex spans {re_multispace_spans}"

