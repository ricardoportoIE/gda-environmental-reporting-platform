import pytest
from django.core.management import call_command

from reports.management.commands.seed_demo_data import DEMO_REPORTS
from reports.models import Category, Report


@pytest.mark.django_db
def test_demo_seed_is_synthetic_idempotent_and_dry_run_is_read_only():
    Category.objects.create(name="Demo category")
    call_command("seed_demo_data", dry_run=True)
    assert Report.objects.count() == 0

    call_command("seed_demo_data")
    assert Report.objects.count() == len(DEMO_REPORTS)
    assert all(report.reporter_id is None for report in Report.objects.all())
    assert all(report.title.startswith("DEMO —") for report in Report.objects.all())
    assert all(report.transitions.count() == 1 for report in Report.objects.all())

    call_command("seed_demo_data")
    assert Report.objects.count() == len(DEMO_REPORTS)
