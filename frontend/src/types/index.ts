export interface PatternDefinition {
  id: string;
  name: string;
  regex: string;
  flags: string;
  description: string;
  limitation: string;
  incorrect_example: string;
  correct_example: string;
  category_color: string;
}

export interface DetectedError {
  id: string;
  category: string;
  pattern_name: string;
  regex: string;
  start: number;
  end: number;
  line: number;
  column: number;
  matched_text: string;
  context: string;
  suggested_correction: string;
  explanation: string;
  is_zero_width: boolean;
}

export interface AnalysisResult {
  text: string;
  char_count: number;
  word_count: number;
  line_count: number;
  errors: DetectedError[];
  total_errors: number;
  category_counts: Record<string, number>;
  error_density_per_100_words: number;
  regex_time_ms: number;
  dfa_time_ms: number;
  corrected_preview: string;
}

export interface CorrectionRequest {
  text: string;
  selected_error_ids?: string[];
  enabled_categories?: string[];
}

export interface CorrectionResult {
  original_text: string;
  corrected_text: string;
  corrections_applied: number;
  remaining_errors_count: number;
  summary: string[];
  remaining_errors: DetectedError[];
}

export interface DFAStep {
  step_index: number;
  current_state: string;
  symbol: string;
  char_display: string;
  char_code: number;
  next_state: string;
  is_accepting: boolean;
  action_description: string;
}

export interface DFASimulateResult {
  input_string: string;
  accepted: boolean;
  final_state: string;
  steps: DFAStep[];
}

export interface DFAMatch {
  start: number;
  end: number;
  length: number;
  matched_text: string;
  line: number;
  column: number;
}

export interface DFAScanResult {
  pattern_name: string;
  regex_equivalent: string;
  total_occurrences: number;
  matches: DFAMatch[];
  execution_time_ns: number;
  execution_time_ms: number;
}

export interface BenchmarkSizeResult {
  size_label: string;
  char_count: number;
  regex_median_ns: number;
  dfa_median_ns: number;
  regex_min_ns: number;
  dfa_min_ns: number;
  regex_std_ns: number;
  dfa_std_ns: number;
  regex_median_ms: number;
  dfa_median_ms: number;
  matches_found: number;
}

export interface CompareResult {
  text_tested_chars: number;
  regex_occurrences: number;
  dfa_occurrences: number;
  exact_matches_agreement: boolean;
  regex_spans: [number, number][];
  dfa_spans: [number, number][];
  benchmarks: BenchmarkSizeResult[];
  code_metrics: Record<string, any>;
  analysis_comparison: {
    pattern: string;
    theoretical_complexity: { regex: string; dfa: string };
    space_complexity: { regex: string; dfa: string };
    runtime_nature: { regex: string; dfa: string };
    academic_conclusion: string;
  };
}

export interface TestCaseResult {
  id: number;
  category: string;
  description: string;
  input_text: string;
  expected_result: string;
  actual_result: string;
  passed: boolean;
  details?: string;
}

export interface TestSuiteReport {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  duration_ms: number;
  tests: TestCaseResult[];
}

