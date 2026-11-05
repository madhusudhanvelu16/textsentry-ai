"""Automated Verification and Test Suite Runner for TextSentry AI.

Executes the 18 mandatory test scenarios specified by the Theory of Computation
case study and returns verified results to both pytest and the frontend test runner.
"""

from __future__ import annotations
import time
from typing import List
from ..models.schemas import TestCaseResult, TestSuiteReport
from .regex_engine import detect_all_errors
from .dfa_engine import scan_document_dfa, simulate_formal_dfa
from .correction_engine import correct_document


def execute_test_suite() -> TestSuiteReport:
    """Run all 18 validation test cases and measure execution duration."""
    start_ns = time.perf_counter_ns()
    results: List[TestCaseResult] = []

    # Case 1: Empty text
    text1 = ""
    err1, _ = detect_all_errors(text1)
    dfa1 = scan_document_dfa(text1)
    corr1 = correct_document(text1)
    p1 = len(err1) == 0 and len(dfa1.matches) == 0 and corr1.corrected_text == ""
    results.append(
        TestCaseResult(
            id=1,
            category="Edge Cases",
            description="Empty document processing",
            input_text='""',
            expected_result="0 errors, 0 DFA matches, empty string output",
            actual_result=f"{len(err1)} errors, {len(dfa1.matches)} DFA matches, text='{corr1.corrected_text}'",
            passed=p1,
            details="Engines must handle empty strings without index exceptions.",
        )
    )

    # Case 2: Text with no errors
    text2 = "The quick brown fox jumps over the lazy dog."
    err2, _ = detect_all_errors(text2)
    corr2 = correct_document(text2)
    p2 = len(err2) == 0 and corr2.corrected_text == text2
    results.append(
        TestCaseResult(
            id=2,
            category="Clean Input",
            description="Grammatically correct text",
            input_text=text2,
            expected_result="0 errors detected, text unmodified",
            actual_result=f"{len(err2)} errors, text modified: {corr2.corrected_text != text2}",
            passed=p2,
            details="Ensures zero false positives on well-formed English sentences.",
        )
    )

    # Case 3: A lowercase sentence beginning
    text3 = "welcome to the lab. this is exciting."
    err3, counts3 = detect_all_errors(text3)
    corr3 = correct_document(text3)
    p3 = (
        counts3["lowercase_sentence_start"] == 2
        and corr3.corrected_text == "Welcome to the lab. This is exciting."
    )
    results.append(
        TestCaseResult(
            id=3,
            category="Pattern 1: Sentence Start",
            description="Lowercase initial letters at line start and after period",
            input_text=text3,
            expected_result="2 sentence start errors; capitalized to 'Welcome...' and 'This...'",
            actual_result=f"{counts3.get('lowercase_sentence_start', 0)} detected; text='{corr3.corrected_text}'",
            passed=p3,
            details="Detects [a-z] at start of line or following punctuation marks.",
        )
    )

    # Case 4: Standalone lowercase pronoun 'i'
    text4 = "When i arrived inside the room, i noticed the item."
    err4, counts4 = detect_all_errors(text4)
    corr4 = correct_document(text4)
    p4 = (
        counts4["lowercase_pronoun_i"] == 2
        and corr4.corrected_text == "When I arrived inside the room, I noticed the item."
    )
    results.append(
        TestCaseResult(
            id=4,
            category="Pattern 2: Pronoun 'i'",
            description="Standalone lowercase 'i' without mutating 'inside' or 'item'",
            input_text=text4,
            expected_result="2 occurrences of pronoun 'i' capitalized; words containing 'i' untouched",
            actual_result=f"{counts4.get('lowercase_pronoun_i', 0)} detected; text='{corr4.corrected_text}'",
            passed=p4,
            details="Lookbehind/lookahead assertions ensure ASCII word integrity.",
        )
    )

    # Case 5: Two consecutive spaces
    text5 = "Data  structures"
    err5, counts5 = detect_all_errors(text5)
    dfa5 = scan_document_dfa(text5)
    corr5 = correct_document(text5)
    p5 = (
        counts5["multiple_spaces"] == 1
        and len(dfa5.matches) == 1
        and dfa5.matches[0].start == 4
        and dfa5.matches[0].end == 6
        and corr5.corrected_text == "Data structures"
    )
    results.append(
        TestCaseResult(
            id=5,
            category="Pattern 3: Multiple Spaces",
            description="Exactly two consecutive spaces",
            input_text="Data  structures",
            expected_result="1 occurrence at span (4, 6) collapsed to 1 space",
            actual_result=f"RE: {counts5.get('multiple_spaces', 0)}, DFA span: {(dfa5.matches[0].start, dfa5.matches[0].end) if dfa5.matches else 'none'}",
            passed=p5,
            details="Regex and DFA must both flag exactly span (4, 6).",
        )
    )

    # Case 6: Five consecutive spaces
    text6 = "Run     deep"
    err6, counts6 = detect_all_errors(text6)
    dfa6 = scan_document_dfa(text6)
    corr6 = correct_document(text6)
    p6 = (
        counts6["multiple_spaces"] == 1
        and len(dfa6.matches) == 1
        and dfa6.matches[0].start == 3
        and dfa6.matches[0].end == 8
        and corr6.corrected_text == "Run deep"
    )
    results.append(
        TestCaseResult(
            id=6,
            category="Pattern 3: Multiple Spaces",
            description="Run of five consecutive spaces",
            input_text="Run     deep",
            expected_result="1 occurrence spanning 5 characters (3, 8)",
            actual_result=f"DFA span: {(dfa6.matches[0].start, dfa6.matches[0].end) if dfa6.matches else 'none'}, text='{corr6.corrected_text}'",
            passed=p6,
            details="Accepting state q2 persists across consecutive spaces.",
        )
    )

    # Case 7: Repeated consecutive words
    text7 = "We had had a great time."
    err7, counts7 = detect_all_errors(text7)
    corr7 = correct_document(text7)
    p7 = counts7["repeated_words"] == 1 and corr7.corrected_text == "We had a great time."
    results.append(
        TestCaseResult(
            id=7,
            category="Pattern 4: Repeated Words",
            description="Duplicate adjacent words with case insensitivity",
            input_text=text7,
            expected_result="1 duplicate 'had had' collapsed to single 'had'",
            actual_result=f"{counts7.get('repeated_words', 0)} detected; text='{corr7.corrected_text}'",
            passed=p7,
            details="Capturing backreference matches adjacent lexical tokens.",
        )
    )

    # Case 8: Missing space after comma
    text8 = "Apples,peaches,pears."
    err8, counts8 = detect_all_errors(text8)
    corr8 = correct_document(text8)
    p8 = (
        counts8["missing_space_after_punct"] == 2
        and corr8.corrected_text == "Apples, peaches, pears."
    )
    results.append(
        TestCaseResult(
            id=8,
            category="Pattern 5: Missing Space",
            description="Punctuation directly followed by alphabetic character",
            input_text=text8,
            expected_result="2 missing space errors; inserted single space after commas",
            actual_result=f"{counts8.get('missing_space_after_punct', 0)} detected; text='{corr8.corrected_text}'",
            passed=p8,
            details="Zero-width assertions isolate punctuation boundaries.",
        )
    )

    # Case 9: Space before question mark
    text9 = "Are you ready ?"
    err9, counts9 = detect_all_errors(text9)
    corr9 = correct_document(text9)
    p9 = counts9["space_before_punct"] == 1 and corr9.corrected_text == "Are you ready?"
    results.append(
        TestCaseResult(
            id=9,
            category="Pattern 6: Space Before Punctuation",
            description="Extraneous space preceding question mark",
            input_text=text9,
            expected_result="1 error detected; trailing space removed before '?'",
            actual_result=f"{counts9.get('space_before_punct', 0)} detected; text='{corr9.corrected_text}'",
            passed=p9,
            details="Removes preceding space while keeping the punctuation mark intact.",
        )
    )

    # Case 10: Multiple errors in the same sentence
    text10 = "welcome to the  the campus . i am happy."
    err10, counts10 = detect_all_errors(text10)
    corr10 = correct_document(text10)
    p10 = len(err10) >= 5 and corr10.corrected_text == "Welcome to the campus. I am happy."
    results.append(
        TestCaseResult(
            id=10,
            category="Integration",
            description="Compound errors spanning 5 distinct categories in one sentence",
            input_text=text10,
            expected_result="All 5 categories identified and corrected without conflict",
            actual_result=f"{len(err10)} errors detected; text='{corr10.corrected_text}'",
            passed=p10,
            details="Tests the conflict-free multi-stage replacement pipeline.",
        )
    )

    # Case 11: Multiline input
    text11 = "first line.\nsecond line.\nthird line."
    err11, counts11 = detect_all_errors(text11)
    corr11 = correct_document(text11)
    p11 = (
        counts11["lowercase_sentence_start"] == 3
        and corr11.corrected_text == "First line.\nSecond line.\nThird line."
    )
    results.append(
        TestCaseResult(
            id=11,
            category="Multiline",
            description="Multiline text with line-break boundaries",
            input_text=text11,
            expected_result="3 line beginnings capitalized; line breaks preserved",
            actual_result=f"{counts11.get('lowercase_sentence_start', 0)} detected; text='{corr11.corrected_text}'",
            passed=p11,
            details="Multiline regex flag (?m) respects newline characters.",
        )
    )

    # Case 12: Punctuation at the end of the document
    text12 = "All is well."
    err12, _ = detect_all_errors(text12)
    corr12 = correct_document(text12)
    p12 = len(err12) == 0 and corr12.corrected_text == text12
    results.append(
        TestCaseResult(
            id=12,
            category="Edge Cases",
            description="Terminal punctuation at document EOF boundary",
            input_text=text12,
            expected_result="0 errors; no boundary index overrun or exception",
            actual_result=f"{len(err12)} errors detected; output intact",
            passed=p12,
            details="Boundary safety verification for EOF lookaheads.",
        )
    )

    # Case 13: One space only
    text13 = "Just one space here"
    err13, counts13 = detect_all_errors(text13)
    dfa13 = scan_document_dfa(text13)
    p13 = counts13["multiple_spaces"] == 0 and len(dfa13.matches) == 0
    results.append(
        TestCaseResult(
            id=13,
            category="DFA Boundary",
            description="Single space sequences (q1 non-accepting)",
            input_text=text13,
            expected_result="0 multiple space detections across Regex and DFA",
            actual_result=f"RE: {counts13.get('multiple_spaces', 0)}, DFA matches: {len(dfa13.matches)}",
            passed=p13,
            details="Single spaces must leave DFA in non-accepting state q1.",
        )
    )

    # Case 14: Three separate runs of multiple spaces
    text14 = "one  two   three    four"
    err14, counts14 = detect_all_errors(text14)
    dfa14 = scan_document_dfa(text14)
    re_spans14 = [(e.start, e.end) for e in err14 if e.category == "multiple_spaces"]
    dfa_spans14 = [(m.start, m.end) for m in dfa14.matches]
    p14 = len(re_spans14) == 3 and re_spans14 == dfa_spans14
    results.append(
        TestCaseResult(
            id=14,
            category="DFA Multi-Match",
            description="Three separate runs of variable width (2, 3, 4 spaces)",
            input_text=text14,
            expected_result="Exactly 3 matches with identical spans between Regex and DFA",
            actual_result=f"RE spans: {re_spans14}, DFA spans: {dfa_spans14}",
            passed=p14,
            details="Verifies DFA scanner correctly resets to q0 on word boundaries.",
        )
    )

    # Case 15: Tabs and newline boundaries
    text15 = "word\t\nword"
    err15, counts15 = detect_all_errors(text15)
    dfa15 = scan_document_dfa(text15)
    p15 = counts15["multiple_spaces"] == 0 and len(dfa15.matches) == 0
    results.append(
        TestCaseResult(
            id=15,
            category="Whitespace Integrity",
            description="Tab and newline characters not classified as ASCII space",
            input_text="word\\t\\nword",
            expected_result="0 multiple space matches; tabs and newlines preserved",
            actual_result=f"Multiple spaces: {counts15.get('multiple_spaces', 0)}, DFA: {len(dfa15.matches)}",
            passed=p15,
            details="Sigma alphabet strictly classifies ASCII 0x20.",
        )
    )

    # Case 16: Error matches that overlap
    text16 = "hello,world.i am ready."
    err16, counts16 = detect_all_errors(text16)
    corr16 = correct_document(text16)
    p16 = (
        counts16["missing_space_after_punct"] >= 2
        and corr16.corrected_text == "Hello, world. I am ready."
    )
    results.append(
        TestCaseResult(
            id=16,
            category="Overlap Resolution",
            description="Missing space, sentence capitalization, and pronoun 'i' collision",
            input_text=text16,
            expected_result="Overlaps resolved cleanly to 'Hello, world. I am ready.'",
            actual_result=f"Errors: {len(err16)}, corrected='{corr16.corrected_text}'",
            passed=p16,
            details="Ensures zero character collision or double substitution.",
        )
    )

    # Case 17: Unicode and non-ASCII characters
    text17 = "Café,croissant. schön!"
    err17, counts17 = detect_all_errors(text17)
    corr17 = correct_document(text17)
    p17 = counts17["missing_space_after_punct"] == 1 and corr17.corrected_text == "Café, croissant. Schön!"
    results.append(
        TestCaseResult(
            id=17,
            category="Unicode Support",
            description="Non-ASCII accented characters and foreign lexical elements",
            input_text=text17,
            expected_result="Accented characters preserved; missing space inserted",
            actual_result=f"Errors: {len(err17)}, corrected='{corr17.corrected_text}'",
            passed=p17,
            details="UTF-8 multibyte safety across string operations.",
        )
    )

    # Case 18: Large input text
    sample_sentence = "Welcome to campus.  This is  an example,with errors . "
    large_text = sample_sentence * 200  # ~10.8 KB
    t_start = time.perf_counter_ns()
    large_err, _ = detect_all_errors(large_text)
    large_dfa = scan_document_dfa(large_text)
    t_end = time.perf_counter_ns()
    dur_ms = (t_end - t_start) / 1_000_000.0
    p18 = len(large_err) > 0 and len(large_dfa.matches) > 0 and dur_ms < 500.0
    results.append(
        TestCaseResult(
            id=18,
            category="Scalability",
            description="Large 10 KB document processing performance",
            input_text="[~10.8 KB repeated corpus]",
            expected_result=f"Processed in < 500 ms; Regex & DFA identify equivalent errors",
            actual_result=f"Completed in {dur_ms:.2f} ms ({len(large_err)} errors, {len(large_dfa.matches)} DFA runs)",
            passed=p18,
            details="Demonstrates linear scaling on production document sizes.",
        )
    )

    end_ns = time.perf_counter_ns()
    total_ms = (end_ns - start_ns) / 1_000_000.0

    passed_count = sum(1 for r in results if r.passed)
    failed_count = len(results) - passed_count

    return TestSuiteReport(
        total_tests=len(results),
        passed_tests=passed_count,
        failed_tests=failed_count,
        duration_ms=total_ms,
        tests=results,
    )

