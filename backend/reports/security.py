import hashlib
import hmac
import secrets

from rest_framework.exceptions import PermissionDenied

from accounts.models import User


def issue_anonymous_token(report):
    token = secrets.token_urlsafe(32)
    report.anonymous_token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token


def can_access_report(request, report):
    user = request.user
    if user.is_authenticated:
        if user.role in (User.Role.OPERATOR, User.Role.ADMIN) or report.reporter_id == user.pk:
            return True
    if report.reporter_id is None and report.anonymous_token_hash:
        token = request.headers.get("X-Report-Access-Token", "")
        if token and len(token) <= 100:
            digest = hashlib.sha256(token.encode()).hexdigest()
            return hmac.compare_digest(report.anonymous_token_hash, digest)
    return False


def require_report_access(request, report):
    if not can_access_report(request, report):
        raise PermissionDenied("You cannot access this report.")
