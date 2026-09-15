import uuid

from django.contrib.gis.db import models as gis_models
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Municipality(models.Model):
    ibge_code = models.CharField(max_length=7, primary_key=True)
    name = models.CharField(max_length=120)
    state = models.CharField(max_length=2)

    class Meta:
        ordering = ["state", "name"]
        constraints = [
            models.UniqueConstraint(fields=["state", "name"], name="municipality_state_name")
        ]

    def __str__(self):
        return f"{self.name}, {self.state}"


class Report(models.Model):
    class Status(models.TextChoices):
        ANALYSIS = "analysis", "In analysis"
        QUEUED = "queued", "Queued"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=180)
    description = models.TextField(max_length=5000)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    municipality = models.ForeignKey(Municipality, on_delete=models.PROTECT, null=True, blank=True)
    address = models.CharField(max_length=250, blank=True)
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    reporter = models.ForeignKey("accounts.User", on_delete=models.PROTECT, null=True, blank=True)
    anonymous_token_hash = models.CharField(max_length=64, blank=True, editable=False)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ANALYSIS)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.MEDIUM)
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_reports",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]


class StatusTransition(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="transitions")
    from_status = models.CharField(max_length=16, blank=True)
    to_status = models.CharField(max_length=16)
    actor = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True)
    reason = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="evidence/%Y/%m/")
    original_name = models.CharField(max_length=200)
    content_type = models.CharField(max_length=40)
    size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
