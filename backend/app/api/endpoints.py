"""FastAPI API Endpoints for TextSentry AI."""

from __future__ import annotations
import time
from typing import Dict, Any, List
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from ..models.schemas import (
    AnalysisResult,
    CorrectionRequest,
    CorrectionResult,
    DFAScanResult,
    DFASimulateRequest,
    DFASimulateResult,
    CompareRequest,
    CompareResult,
    PatternDefinition,
    TestSuiteReport,
)
from ..services.regex_engine import (
    PATTERN_DEFINITIONS,
    detect_all_errors,
)
from ..services.dfa_engine import (
    scan_document_dfa,
    simulate_formal_dfa,
)
from ..services.correction_engine import correct_document
from ..services.benchmark import execute_comparison
from ..services.test_runner import execute_test_suite
from ..services.document_parser import extract_text_from_upload


router = APIRouter(prefix="/api", tags=["TextSentry"])


class AnalyzeRequest(BaseModel):
    text: str


class TextPayload(BaseModel):
    text: str


SAMPLE_ERRONEOUS_TEXT = (
    "welcome to the the campus.  i am a a student.\n"
    "this is  an example,with errors  in spacing .\n"
    "the course is is useful.hello,world!\n"
    "can you  fix this ? i i think so."
)

SAMPLE_CORRECTED_TEXT = (
    "Welcome to the campus. I am a student.\n"
    "This is an example, with errors in spacing.\n"
    "The course is useful. Hello, world!\n"
    "Can you fix this? I think so."
)


@router.get("/health")
def get_health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "TextSentry AI",
        "version": "1.0.0",
        "timestamp": time.time(),
    }


@router.get("/patterns", response_model=List[PatternDefinition])
def get_patterns() -> List[PatternDefinition]:
    """Return formal definitions and specifications for all six error patterns."""
    return PATTERN_DEFINITIONS


@router.get("/sample")
def get_sample_document() -> Dict[str, str]:
    """Return the predefined academic case study sample document and expected output."""
    return {
        "erroneous_text": SAMPLE_ERRONEOUS_TEXT,
        "expected_corrected_text": SAMPLE_CORRECTED_TEXT,
    }


@router.post("/analyze", response_model=AnalysisResult)
def analyze_text(payload: AnalyzeRequest) -> AnalysisResult:
    """Analyze input text across all six regex patterns and DFA multiple-space pattern."""
    text = payload.text

    # Calculate basic textual metrics
    char_count = len(text)
    words = text.split()
    word_count = len(words)
    line_count = text.count("\n") + 1 if text else 0

    # Measure Regex detection time
    t0 = time.perf_counter_ns()
    errors, category_counts = detect_all_errors(text)
    t1 = time.perf_counter_ns()
    regex_time_ms = (t1 - t0) / 1_000_000.0

    # Measure DFA execution time for the selected pattern
    t2 = time.perf_counter_ns()
    dfa_scan = scan_document_dfa(text)
    t3 = time.perf_counter_ns()
    dfa_time_ms = (t3 - t2) / 1_000_000.0

    # Compute error density per 100 words
    density = (len(errors) / word_count * 100.0) if word_count > 0 else 0.0

    # Generate quick corrected preview
    corr_res = correct_document(text)
    preview = corr_res.corrected_text

    return AnalysisResult(
        text=text,
        char_count=char_count,
        word_count=word_count,
        line_count=line_count,
        errors=errors,
        total_errors=len(errors),
        category_counts=category_counts,
        error_density_per_100_words=round(density, 2),
        regex_time_ms=round(regex_time_ms, 3),
        dfa_time_ms=round(dfa_time_ms, 3),
        corrected_preview=preview,
    )


@router.post("/correct", response_model=CorrectionResult)
def correct_text(payload: CorrectionRequest) -> CorrectionResult:
    """Execute text corrections either selectively or for all detected errors."""
    return correct_document(
        text=payload.text,
        selected_error_ids=payload.selected_error_ids,
        enabled_categories=payload.enabled_categories,
    )


@router.post("/dfa/scan", response_model=DFAScanResult)
def scan_dfa(payload: TextPayload) -> DFAScanResult:
    """Scan a document using the pure DFA engine without regular expression libraries."""
    return scan_document_dfa(payload.text)


@router.post("/dfa/simulate", response_model=DFASimulateResult)
def simulate_dfa(payload: DFASimulateRequest) -> DFASimulateResult:
    """Execute the formal DFA string recognizer with step-by-step state transitions."""
    return simulate_formal_dfa(payload.input_string)


@router.post("/compare", response_model=CompareResult)
def compare_regex_and_dfa(payload: CompareRequest) -> CompareResult:
    """Perform exact agreement check and nanosecond performance benchmark."""
    sample_to_use = payload.text if (payload.text and payload.text.strip()) else SAMPLE_ERRONEOUS_TEXT
    return execute_comparison(sample_to_use, include_benchmarks=payload.include_benchmarks)


@router.get("/tests/run", response_model=TestSuiteReport)
def run_tests() -> TestSuiteReport:
    """Execute the 18 verification test cases and return the verified report."""
    return execute_test_suite()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Upload TXT or DOCX document (up to 5 MB) and extract text."""
    extracted_text = await extract_text_from_upload(file)
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "char_count": len(extracted_text),
        "text": extracted_text,
    }

