from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import Report, StatusTransition

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    Report.Status.ANALYSIS: {Report.Status.QUEUED, Report.Status.REJECTED},
    Report.Status.QUEUED: {Report.Status.IN_PROGRESS, Report.Status.REJECTED},
    Report.Status.IN_PROGRESS: {Report.Status.COMPLETED, Report.Status.REJECTED},
    Report.Status.COMPLETED: set(),
    Report.Status.REJECTED: set(),
}


@transaction.atomic
def transition_report(report_id, *, to_status, actor, reason):
    report = get_object_or_404(Report.objects.select_for_update(), pk=report_id)
    if to_status not in ALLOWED_TRANSITIONS[report.status]:
        raise ValidationError({"status": "This transition is not allowed."})
    previous = report.status
    report.status = to_status
    report.save(update_fields=["status", "updated_at"])
    StatusTransition.objects.create(
        report=report,
        from_status=previous,
        to_status=to_status,
        actor=actor,
        reason=reason,
    )
    return report
