"""Pytest suite executing the 18 formal test cases."""

from app.services.test_runner import execute_test_suite


def test_all_18_verification_cases():
    report = execute_test_suite()
    assert report.total_tests == 18
    assert report.passed_tests == 18, f"Failed tests: {[t.description for t in report.tests if not t.passed]}"
    assert report.failed_tests == 0

