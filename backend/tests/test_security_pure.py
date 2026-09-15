from types import SimpleNamespace

from django.contrib.auth.models import AnonymousUser

from reports.models import Report
from reports.security import can_access_report, issue_anonymous_token
from reports.services import ALLOWED_TRANSITIONS


def test_anonymous_token_is_random_and_only_digest_is_stored():
    report = SimpleNamespace(reporter_id=None, anonymous_token_hash="")
    token = issue_anonymous_token(report)
    request = SimpleNamespace(
        user=AnonymousUser(),
        headers={"X-Report-Access-Token": token},
    )

    assert len(token) > 32
    assert token not in report.anonymous_token_hash
    assert can_access_report(request, report)
    request.headers["X-Report-Access-Token"] = "wrong"
    assert not can_access_report(request, report)


def test_terminal_statuses_cannot_be_reopened():
    assert ALLOWED_TRANSITIONS[Report.Status.COMPLETED] == set()
    assert ALLOWED_TRANSITIONS[Report.Status.REJECTED] == set()
