from typing import List, Dict, Optional, Tuple, Any
from pydantic import BaseModel, Field


class PatternDefinition(BaseModel):
    id: str
    name: str
    regex: str
    flags: str
    description: str
    limitation: str
    incorrect_example: str
    correct_example: str
    category_color: str


class DetectedError(BaseModel):
    id: str
    category: str
    pattern_name: str
    regex: str
    start: int
    end: int
    line: int
    column: int
    matched_text: str
    context: str
    suggested_correction: str
    explanation: str
    is_zero_width: bool = False


class AnalysisResult(BaseModel):
    text: str
    char_count: int
    word_count: int
    line_count: int
    errors: List[DetectedError]
    total_errors: int
    category_counts: Dict[str, int]
    error_density_per_100_words: float
    regex_time_ms: float
    dfa_time_ms: float
    corrected_preview: str


class CorrectionRequest(BaseModel):
    text: str
    selected_error_ids: Optional[List[str]] = None
    enabled_categories: Optional[List[str]] = None


class CorrectionResult(BaseModel):
    original_text: str
    corrected_text: str
    corrections_applied: int
    remaining_errors_count: int
    summary: List[str]
    remaining_errors: List[DetectedError] = []


class DFAStep(BaseModel):
    step_index: int
    current_state: str
    symbol: str
    char_display: str
    char_code: int
    next_state: str
    is_accepting: bool
    action_description: str


class DFASimulateRequest(BaseModel):
    input_string: str


class DFASimulateResult(BaseModel):
    input_string: str
    accepted: bool
    final_state: str
    steps: List[DFAStep]


class DFAMatch(BaseModel):
    start: int
    end: int
    length: int
    matched_text: str
    line: int
    column: int


class DFAScanResult(BaseModel):
    pattern_name: str = "Multiple Consecutive Spaces"
    regex_equivalent: str = " {2,}"
    total_occurrences: int
    matches: List[DFAMatch]
    execution_time_ns: int
    execution_time_ms: float


class BenchmarkSizeResult(BaseModel):
    size_label: str
    char_count: int
    regex_median_ns: float
    dfa_median_ns: float
    regex_min_ns: float
    dfa_min_ns: float
    regex_std_ns: float
    dfa_std_ns: float
    regex_median_ms: float
    dfa_median_ms: float
    matches_found: int


class CompareRequest(BaseModel):
    text: Optional[str] = None
    include_benchmarks: bool = True
    iterations: int = 50


class CompareResult(BaseModel):
    text_tested_chars: int
    regex_occurrences: int
    dfa_occurrences: int
    exact_matches_agreement: bool
    regex_spans: List[Tuple[int, int]]
    dfa_spans: List[Tuple[int, int]]
    benchmarks: List[BenchmarkSizeResult]
    code_metrics: Dict[str, Any]
    analysis_comparison: Dict[str, Any]


class TestCaseResult(BaseModel):
    id: int
    category: str
    description: str
    input_text: str
    expected_result: str
    actual_result: str
    passed: bool
    details: Optional[str] = None


class TestSuiteReport(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    duration_ms: float
    tests: List[TestCaseResult]

