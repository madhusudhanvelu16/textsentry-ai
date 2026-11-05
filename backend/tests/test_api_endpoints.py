"""Direct API endpoint unit tests."""

from app.api.endpoints import (
    get_health,
    get_patterns,
    get_sample_document,
    analyze_text,
    correct_text,
    scan_dfa,
    simulate_dfa,
    compare_regex_and_dfa,
    run_tests,
    AnalyzeRequest,
    TextPayload,
)
from app.models.schemas import CorrectionRequest, DFASimulateRequest, CompareRequest


SAMPLE_TEXT = """welcome to the the campus.  i am a a student.
this is  an example,with errors  in spacing .
the course is is useful.hello,world!
can you  fix this ? i i think so."""


def test_health_endpoint():
    data = get_health()
    assert data["status"] == "healthy"
    assert data["service"] == "TextSentry AI"


def test_patterns_endpoint():
    patterns = get_patterns()
    assert len(patterns) == 6
    ids = [p.id for p in patterns]
    assert "lowercase_sentence_start" in ids
    assert "multiple_spaces" in ids
    assert "repeated_words" in ids


def test_sample_endpoint():
    data = get_sample_document()
    assert "welcome to the the campus" in data["erroneous_text"]
    assert "Welcome to the campus" in data["expected_corrected_text"]


def test_analyze_endpoint():
    res = analyze_text(AnalyzeRequest(text=SAMPLE_TEXT))
    assert res.total_errors == 23
    assert res.category_counts["lowercase_sentence_start"] == 7
    assert res.category_counts["multiple_spaces"] == 4


def test_correct_endpoint():
    res = correct_text(CorrectionRequest(text=SAMPLE_TEXT))
    assert res.remaining_errors_count == 0
    assert "Welcome to the campus" in res.corrected_text


def test_dfa_scan_endpoint():
    res = scan_dfa(TextPayload(text=SAMPLE_TEXT))
    assert res.total_occurrences == 4
    assert len(res.matches) == 4


def test_dfa_simulate_endpoint():
    # Valid 2 spaces -> q2
    res_valid = simulate_dfa(DFASimulateRequest(input_string="  "))
    assert res_valid.accepted is True
    assert res_valid.final_state == "q2"
    assert len(res_valid.steps) == 2

    # Invalid -> qdead
    res_invalid = simulate_dfa(DFASimulateRequest(input_string="hello"))
    assert res_invalid.accepted is False
    assert res_invalid.final_state == "qdead"


def test_compare_endpoint():
    res = compare_regex_and_dfa(CompareRequest(text=SAMPLE_TEXT, include_benchmarks=False))
    assert res.exact_matches_agreement is True
    assert res.regex_occurrences == 4
    assert res.dfa_occurrences == 4


def test_test_suite_endpoint():
    report = run_tests()
    assert report.total_tests == 18
    assert report.passed_tests == 18
    assert report.failed_tests == 0
