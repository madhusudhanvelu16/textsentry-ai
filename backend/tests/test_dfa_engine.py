"""Pytest suite for DFA formal verification."""

import inspect
import pytest
from app.services import dfa_engine
from app.services.dfa_engine import (
    STATES,
    START_STATE,
    ACCEPTING_STATES,
    TRANSITIONS,
    simulate_formal_dfa,
    scan_document_dfa,
)


def test_dfa_formal_states_and_alphabet():
    """Verify formal states Q={q0, q1, q2, qdead}, start state q0, and accepting states F={q2}."""
    assert set(STATES) == {"q0", "q1", "q2", "qdead"}
    assert START_STATE == "q0"
    assert ACCEPTING_STATES == {"q2"}


def test_dfa_transition_matrix():
    """Verify all formal transition mappings."""
    # From q0
    assert TRANSITIONS["q0"]["SPACE"] == "q1"
    assert TRANSITIONS["q0"]["OTHER"] == "qdead"

    # From q1
    assert TRANSITIONS["q1"]["SPACE"] == "q2"
    assert TRANSITIONS["q1"]["OTHER"] == "qdead"

    # From q2
    assert TRANSITIONS["q2"]["SPACE"] == "q2"
    assert TRANSITIONS["q2"]["OTHER"] == "qdead"

    # From qdead
    assert TRANSITIONS["qdead"]["SPACE"] == "qdead"
    assert TRANSITIONS["qdead"]["OTHER"] == "qdead"


def test_dfa_scanner_does_not_import_regex():
    """Verify that dfa_engine does NOT import or use re or regex module."""
    source = inspect.getsource(dfa_engine)
    # Check no 'import re' or 'from re '
    assert "import re\n" not in source
    assert "import re " not in source
    assert "from re import" not in source
    assert "import regex" not in source


def test_dfa_formal_simulator_acceptance():
    """Verify formal DFA string acceptance and rejection."""
    # Reject: empty string stays in q0 (not accepting)
    assert simulate_formal_dfa("").accepted is False
    assert simulate_formal_dfa("").final_state == "q0"

    # Reject: 1 space ends in q1 (not accepting)
    assert simulate_formal_dfa(" ").accepted is False
    assert simulate_formal_dfa(" ").final_state == "q1"

    # Accept: 2 spaces ends in q2 (accepting)
    assert simulate_formal_dfa("  ").accepted is True
    assert simulate_formal_dfa("  ").final_state == "q2"

    # Accept: 5 spaces ends in q2 (accepting)
    assert simulate_formal_dfa("     ").accepted is True
    assert simulate_formal_dfa("     ").final_state == "q2"

    # Reject: non-space character enters qdead
    assert simulate_formal_dfa(" a").accepted is False
    assert simulate_formal_dfa(" a").final_state == "qdead"

    assert simulate_formal_dfa("  a").accepted is False
    assert simulate_formal_dfa("  a").final_state == "qdead"

