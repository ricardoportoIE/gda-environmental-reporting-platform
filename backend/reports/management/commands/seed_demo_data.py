import uuid

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from reports.models import Category, Report, StatusTransition

DEMO_REPORTS = (
    ("DEMO — Synthetic waste report", 51.505, -0.09),
    ("DEMO — Synthetic water report", 51.515, -0.105),
    ("DEMO — Synthetic air report", 51.497, -0.075),
    ("DEMO — Synthetic habitat report", 51.53, -0.12),
)


class Command(BaseCommand):
    help = "Create clearly labelled, idempotent synthetic reports for a local demonstration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Show how many reports are missing."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        category = Category.objects.filter(active=True).order_by("id").first()
        if category is None:
            raise CommandError("Apply migrations and create an active category first.")
        created = 0
        for title, latitude, longitude in DEMO_REPORTS:
            report_id = uuid.uuid5(uuid.NAMESPACE_URL, f"gda-synthetic-demo-v2/{title}")
            if options["dry_run"]:
                created += not Report.objects.filter(pk=report_id).exists()
                continue
            report, was_created = Report.objects.get_or_create(
                id=report_id,
                defaults={
                    "title": title,
                    "description": "Fictitious demonstration; no real incident.",
                    "category": category,
                    "location": Point(longitude, latitude, srid=4326),
                },
            )
            if was_created:
                StatusTransition.objects.create(report=report, to_status=Report.Status.ANALYSIS)
                created += 1
        if options["dry_run"]:
            self.stdout.write(f"{created} synthetic reports would be created; no data changed.")
        else:
            self.stdout.write(
                f"Created {created} synthetic reports; existing demo reports unchanged."
            )
