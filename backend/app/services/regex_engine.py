"""Regular Expression Error Detection Engine for TextSentry AI.

Implements the six mandatory error detection patterns specified for the
Theory of Computation case study on Text Error Identification and Correction.
"""

from __future__ import annotations
import re
from typing import List, Dict, Any, Tuple
from ..models.schemas import DetectedError, PatternDefinition


PATTERN_DEFINITIONS: List[PatternDefinition] = [
    PatternDefinition(
        id="lowercase_sentence_start",
        name="Sentence Starting with Lowercase Letter",
        regex=r"(?m)(?:^|(?<=[.!?]))[ \t]*([a-z])",
        flags="re.MULTILINE",
        description=(
            "Detects lowercase English letters at the beginning of a line or "
            "immediately following sentence-ending punctuation ('.', '!', '?') "
            "and optional horizontal whitespace."
        ),
        limitation=(
            "Does not account for honorifics, abbreviations (e.g., 'e.g.', 'Dr.'), "
            "or non-terminal decimal points in floating-point numbers."
        ),
        incorrect_example="welcome to college. this is great.",
        correct_example="Welcome to college. This is great.",
        category_color="#ef4444",  # Red
    ),
    PatternDefinition(
        id="lowercase_pronoun_i",
        name="Lowercase Pronoun 'i' Instead of 'I'",
        regex=r"(?<![A-Za-z])i(?![A-Za-z])",
        flags="None",
        description=(
            "Detects standalone lowercase 'i' characters isolated from surrounding "
            "alphabetic characters using lookbehind and lookahead assertions."
        ),
        limitation=(
            "Operates strictly under ASCII English word boundary conventions. Does not "
            "modify words containing 'i' like 'inside', 'item', or Roman numerals."
        ),
        incorrect_example="yesterday i went to the lab.",
        correct_example="yesterday I went to the lab.",
        category_color="#f59e0b",  # Amber
    ),
    PatternDefinition(
        id="multiple_spaces",
        name="Multiple Consecutive Spaces",
        regex=r" {2,}",
        flags="None",
        description=(
            "Detects every maximal run of two or more ASCII space characters. "
            "This pattern serves as the primary benchmark for DFA equivalence."
        ),
        limitation=(
            "Restricted to ASCII space (0x20). Does not collapse tabs, newlines, "
            "or non-breaking Unicode whitespace into single spaces."
        ),
        incorrect_example="Hello     World",
        correct_example="Hello World",
        category_color="#3b82f6",  # Blue
    ),
    PatternDefinition(
        id="repeated_words",
        name="Repeated Consecutive Words",
        regex=r"\b([A-Za-z]+)[ \t]+\1\b",
        flags="re.IGNORECASE",
        description=(
            "Detects repeated adjacent words separated by horizontal whitespace "
            "using a case-insensitive backreference."
        ),
        limitation=(
            "May flag legitimate syntactic repetitions such as 'that that' or "
            "'had had' in complex English sentences."
        ),
        incorrect_example="This is is a book.",
        correct_example="This is a book.",
        category_color="#8b5cf6",  # Violet
    ),
    PatternDefinition(
        id="missing_space_after_punct",
        name="Missing Space After Punctuation",
        regex=r"(?<=[,.;:!?])(?=[A-Za-z])",
        flags="None",
        description=(
            "Detects zero-width positions where punctuation (',', '.', ';', ':', '!', '?') "
            "is immediately followed by an alphabetic letter without a space."
        ),
        limitation=(
            "Flags periods in URLs (e.g., 'example.com'), email addresses, and acronyms "
            "if not excluded by domain-specific tokenization."
        ),
        incorrect_example="Hello,World.How are you?",
        correct_example="Hello, World. How are you?",
        category_color="#10b981",  # Emerald
    ),
    PatternDefinition(
        id="space_before_punct",
        name="Unnecessary Space Before Punctuation",
        regex=r" +(?=[,.;:!?])",
        flags="None",
        description=(
            "Detects one or more ASCII spaces immediately preceding sentence or "
            "clause punctuation marks."
        ),
        limitation=(
            "Will flag formatting spaces deliberately placed before punctuation in "
            "certain mathematical or poetic notations."
        ),
        incorrect_example="How are you ? Fine ,thanks.",
        correct_example="How are you? Fine, thanks.",
        category_color="#ec4899",  # Pink
    ),
]

PATTERN_MAP = {p.id: p for p in PATTERN_DEFINITIONS}

# Precompile patterns with strict flags
RE_LOWER_SENTENCE = re.compile(r"(?m)(?:^|(?<=[.!?]))[ \t]*([a-z])")
RE_PRONOUN_I = re.compile(r"(?<![A-Za-z])i(?![A-Za-z])")
RE_MULTIPLE_SPACES = re.compile(r" {2,}")
RE_REPEATED_WORDS = re.compile(r"\b([A-Za-z]+)[ \t]+\1\b", re.IGNORECASE)
RE_MISSING_SPACE_PUNCT = re.compile(r"(?<=[,.;:!?])(?=[A-Za-z])")
RE_SPACE_BEFORE_PUNCT = re.compile(r" +(?=[,.;:!?])")


def get_line_column(text: str, index: int) -> Tuple[int, int]:
    """Calculate 1-based line and column numbers for a 0-based character index."""
    if index < 0:
        return (1, 1)
    if index > len(text):
        index = len(text)
    line = text.count("\n", 0, index) + 1
    last_nl = text.rfind("\n", 0, index)
    col = index + 1 if last_nl == -1 else (index - last_nl)
    return (line, col)


def get_surrounding_context(text: str, start: int, end: int, window: int = 25) -> str:
    """Return a short excerpt surrounding the error for readable context."""
    left = max(0, start - window)
    right = min(len(text), end + window)
    prefix = "..." if left > 0 else ""
    suffix = "..." if right < len(text) else ""
    return f"{prefix}{text[left:start]}[{text[start:end]}]{text[end:right]}{suffix}"


def detect_sentence_lowercase(text: str) -> List[DetectedError]:
    """Detect sentences starting with a lowercase letter."""
    errors = []
    pdef = PATTERN_MAP["lowercase_sentence_start"]
    for idx, match in enumerate(RE_LOWER_SENTENCE.finditer(text)):
        # We capture group 1: the lowercase letter itself
        char_start = match.start(1)
        char_end = match.end(1)
        char_val = match.group(1)
        line, col = get_line_column(text, char_start)
        errors.append(
            DetectedError(
                id=f"err_lower_sentence_{idx + 1}",
                category=pdef.id,
                pattern_name=pdef.name,
                regex=pdef.regex,
                start=char_start,
                end=char_end,
                line=line,
                column=col,
                matched_text=char_val,
                context=get_surrounding_context(text, char_start, char_end),
                suggested_correction=char_val.upper(),
                explanation=f"Sentence starts with lowercase '{char_val}'. Sentences should begin with an uppercase letter.",
                is_zero_width=False,
            )
        )
    return errors


def detect_pronoun_i(text: str) -> List[DetectedError]:
    """Detect lowercase standalone pronoun 'i'."""
    errors = []
    pdef = PATTERN_MAP["lowercase_pronoun_i"]
    for idx, match in enumerate(RE_PRONOUN_I.finditer(text)):
        start, end = match.start(), match.end()
        line, col = get_line_column(text, start)
        errors.append(
            DetectedError(
                id=f"err_pronoun_i_{idx + 1}",
                category=pdef.id,
                pattern_name=pdef.name,
                regex=pdef.regex,
                start=start,
                end=end,
                line=line,
                column=col,
                matched_text=match.group(),
                context=get_surrounding_context(text, start, end),
                suggested_correction="I",
                explanation="Standalone pronoun 'i' must always be capitalized to 'I'.",
                is_zero_width=False,
            )
        )
    return errors


def detect_multiple_spaces(text: str) -> List[DetectedError]:
    """Detect runs of two or more consecutive spaces."""
    errors = []
    pdef = PATTERN_MAP["multiple_spaces"]
    for idx, match in enumerate(RE_MULTIPLE_SPACES.finditer(text)):
        start, end = match.start(), match.end()
        line, col = get_line_column(text, start)
        space_count = end - start
        errors.append(
            DetectedError(
                id=f"err_multispace_{idx + 1}",
                category=pdef.id,
                pattern_name=pdef.name,
                regex=pdef.regex,
                start=start,
                end=end,
                line=line,
                column=col,
                matched_text=match.group(),
                context=get_surrounding_context(text, start, end),
                suggested_correction=" ",
                explanation=f"Found run of {space_count} consecutive spaces. Standard typography uses a single space.",
                is_zero_width=False,
            )
        )
    return errors


def detect_repeated_words(text: str) -> List[DetectedError]:
    """Detect duplicate consecutive words."""
    errors = []
    pdef = PATTERN_MAP["repeated_words"]
    for idx, match in enumerate(RE_REPEATED_WORDS.finditer(text)):
        start, end = match.start(), match.end()
        line, col = get_line_column(text, start)
        first_word = match.group(1)
        errors.append(
            DetectedError(
                id=f"err_repeated_{idx + 1}",
                category=pdef.id,
                pattern_name=pdef.name,
                regex=pdef.regex,
                start=start,
                end=end,
                line=line,
                column=col,
                matched_text=match.group(),
                context=get_surrounding_context(text, start, end),
                suggested_correction=first_word,
                explanation=f"Word '{first_word}' is repeated consecutively. One instance should be removed.",
                is_zero_width=False,
            )
        )
    return errors


def detect_missing_space_after_punct(text: str) -> List[DetectedError]:
    """Detect zero-width boundaries where punctuation is directly followed by a letter."""
    errors = []
    pdef = PATTERN_MAP["missing_space_after_punct"]
    for idx, match in enumerate(RE_MISSING_SPACE_PUNCT.finditer(text)):
        pos = match.start()
        line, col = get_line_column(text, pos)
        prev_char = text[pos - 1] if pos > 0 else ""
        next_char = text[pos] if pos < len(text) else ""
        errors.append(
            DetectedError(
                id=f"err_missing_space_{idx + 1}",
                category=pdef.id,
                pattern_name=pdef.name,
                regex=pdef.regex,
                start=pos,
                end=pos,
                line=line,
                column=col,
                matched_text=f"{prev_char}{next_char}",
                context=get_surrounding_context(text, pos, pos),
                suggested_correction=" ",
                explanation=f"Missing space after punctuation '{prev_char}' before letter '{next_char}'.",
                is_zero_width=True,
            )
        )
    return errors


def detect_space_before_punct(text: str) -> List[DetectedError]:
    """Detect runs of space directly preceding punctuation."""
    errors = []
    pdef = PATTERN_MAP["space_before_punct"]
    for idx, match in enumerate(RE_SPACE_BEFORE_PUNCT.finditer(text)):
        start, end = match.start(), match.end()
        line, col = get_line_column(text, start)
        punct = text[end] if end < len(text) else ""
        errors.append(
            DetectedError(
                id=f"err_space_before_{idx + 1}",
                category=pdef.id,
                pattern_name=pdef.name,
                regex=pdef.regex,
                start=start,
                end=end,
                line=line,
                column=col,
                matched_text=match.group(),
                context=get_surrounding_context(text, start, end),
                suggested_correction="",
                explanation=f"Unnecessary space(s) directly before punctuation '{punct}'. Punctuation should cling to the preceding word.",
                is_zero_width=False,
            )
        )
    return errors


def detect_all_errors(text: str) -> Tuple[List[DetectedError], Dict[str, int]]:
    """Execute all six regex patterns and return unified error list and category counts."""
    all_errors: List[DetectedError] = []

    # Run all detectors
    lower_errors = detect_sentence_lowercase(text)
    pronoun_errors = detect_pronoun_i(text)
    multispace_errors = detect_multiple_spaces(text)
    repeated_errors = detect_repeated_words(text)
    missing_space_errors = detect_missing_space_after_punct(text)
    space_before_errors = detect_space_before_punct(text)

    all_errors.extend(lower_errors)
    all_errors.extend(pronoun_errors)
    all_errors.extend(multispace_errors)
    all_errors.extend(repeated_errors)
    all_errors.extend(missing_space_errors)
    all_errors.extend(space_before_errors)

    # Sort deterministically by start position, then zero-width preference, then category
    all_errors.sort(key=lambda e: (e.start, e.end, e.category))

    counts = {
        "lowercase_sentence_start": len(lower_errors),
        "lowercase_pronoun_i": len(pronoun_errors),
        "multiple_spaces": len(multispace_errors),
        "repeated_words": len(repeated_errors),
        "missing_space_after_punct": len(missing_space_errors),
        "space_before_punct": len(space_before_errors),
    }

    return all_errors, counts

