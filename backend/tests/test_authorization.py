import uuid
from io import BytesIO

import pytest
from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import User
from reports.models import Category, Report
from reports.security import issue_anonymous_token


@pytest.fixture
def category(db):
    return Category.objects.create(name="Test category")


@pytest.fixture
def citizen(db):
    return User.objects.create_user(
        username="citizen@example.test",
        email="citizen@example.test",
        password="safe-test-password-123",
    )


@pytest.fixture
def outsider(db):
    return User.objects.create_user(
        username="outsider@example.test",
        email="outsider@example.test",
        password="safe-test-password-123",
    )


@pytest.fixture
def operator(db):
    return User.objects.create_user(
        username="operator@example.test",
        email="operator@example.test",
        password="safe-test-password-123",
        role=User.Role.OPERATOR,
    )


@pytest.fixture
def report(category, citizen):
    return Report.objects.create(
        title="Test environmental issue",
        description="Synthetic report",
        category=category,
        reporter=citizen,
        location=Point(0, 0, srid=4326),
    )


@pytest.mark.django_db
def test_public_registration_cannot_set_privileged_fields():
    client = APIClient()
    response = client.post(
        "/api/auth/register/",
        {
            "email": "new@example.test",
            "password": "safe-test-password-123",
            "is_staff": True,
            "is_superuser": True,
            "role": User.Role.ADMIN,
        },
        format="json",
    )

    assert response.status_code == 201
    user = User.objects.get(email="new@example.test")
    assert not user.is_staff and not user.is_superuser and user.role == User.Role.CITIZEN


@pytest.mark.django_db
def test_registration_requires_csrf():
    client = APIClient(enforce_csrf_checks=True)
    response = client.post(
        "/api/auth/register/",
        {
            "email": "csrf@example.test",
            "password": "safe-test-password-123",
        },
        format="json",
    )

    assert response.status_code == 403
    assert not User.objects.filter(email="csrf@example.test").exists()


@pytest.mark.django_db
def test_anonymous_report_requires_csrf(category):
    client = APIClient(enforce_csrf_checks=True)
    response = client.post(
        "/api/reports/",
        {"title": "Synthetic", "description": "Synthetic", "category": category.pk},
        format="json",
    )
    assert response.status_code == 403
    assert not Report.objects.filter(title="Synthetic").exists()


@pytest.mark.django_db
def test_citizen_cannot_modify_or_list_other_accounts(citizen, outsider):
    client = APIClient()
    client.force_login(citizen)

    assert (
        client.patch(
            f"/api/auth/users/{outsider.pk}/", {"role": "admin"}, format="json"
        ).status_code
        == 403
    )
    assert client.get("/api/auth/users/").status_code == 403
    outsider.refresh_from_db()
    assert outsider.role == User.Role.CITIZEN


@pytest.mark.django_db
def test_citizen_cannot_change_server_owned_report_fields(category, citizen, operator):
    client = APIClient()
    client.force_login(citizen)
    response = client.post(
        "/api/reports/",
        {
            "title": "Synthetic",
            "description": "Synthetic",
            "category": category.pk,
            "status": "completed",
            "priority": "urgent",
            "reporter": str(operator.pk),
        },
        format="json",
    )
    assert response.status_code == 201
    report = Report.objects.get(pk=response.data["id"])
    assert report.status == Report.Status.ANALYSIS
    assert report.priority == Report.Priority.MEDIUM
    assert report.reporter == citizen
    assert report.transitions.count() == 1


@pytest.mark.django_db
def test_citizen_cannot_read_or_change_another_report(report, outsider):
    client = APIClient()
    client.force_login(outsider)

    assert client.get(f"/api/reports/{report.pk}/").status_code == 403
    assert (
        client.patch(f"/api/reports/{report.pk}/", {"title": "Tampered"}, format="json").status_code
        == 403
    )
    image_bytes = BytesIO()
    Image.new("RGB", (1, 1), "green").save(image_bytes, format="PNG")
    file = SimpleUploadedFile("evidence.png", image_bytes.getvalue(), content_type="image/png")
    assert client.post(f"/api/reports/{report.pk}/attachments/", {"file": file}).status_code == 403
    report.refresh_from_db()
    assert report.title == "Test environmental issue"


@pytest.mark.django_db
def test_evidence_download_checks_report_owner(report, citizen, outsider, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    client = APIClient()
    client.force_login(citizen)
    image_bytes = BytesIO()
    Image.new("RGB", (1, 1), "green").save(image_bytes, format="PNG")
    file = SimpleUploadedFile("evidence.png", image_bytes.getvalue(), content_type="image/png")
    upload = client.post(f"/api/reports/{report.pk}/attachments/", {"file": file})
    assert upload.status_code == 201
    download_path = f"/api/reports/{report.pk}/attachments/{upload.data['id']}/"
    client.force_login(outsider)
    assert client.get(download_path).status_code == 403
    client.force_login(citizen)
    response = client.get(download_path)
    assert response.status_code == 200
    assert response["Cache-Control"] == "private, no-store"


@pytest.mark.django_db
def test_anonymous_report_requires_random_token(category):
    client = APIClient()
    response = client.post(
        "/api/reports/",
        {
            "title": "Anonymous issue",
            "description": "Synthetic report",
            "category": category.pk,
            "latitude": 0,
            "longitude": 0,
        },
        format="json",
    )
    assert response.status_code == 201
    report_id = response.data["id"]
    token = response.data["access_token"]
    assert token and response.data["latitude"] == 0 and response.data["longitude"] == 0
    assert client.get(f"/api/reports/{report_id}/").status_code == 403
    assert (
        client.get(f"/api/reports/{report_id}/", HTTP_X_REPORT_ACCESS_TOKEN="wrong").status_code
        == 403
    )
    assert (
        client.get(f"/api/reports/{report_id}/", HTTP_X_REPORT_ACCESS_TOKEN=token).status_code
        == 200
    )
    assert (
        client.get(f"/api/reports/{uuid.uuid4()}/", HTTP_X_REPORT_ACCESS_TOKEN=token).status_code
        == 404
    )


@pytest.mark.django_db
def test_administrator_cannot_deactivate_own_account(db):
    admin = User.objects.create_superuser(
        username="admin@example.test", email="admin@example.test", password="safe-test-password-123"
    )
    client = APIClient()
    client.force_login(admin)
    response = client.patch(
        f"/api/auth/users/{admin.pk}/",
        {"is_active": False},
        format="json",
    )
    assert response.status_code == 400
    admin.refresh_from_db()
    assert admin.is_active


@pytest.mark.django_db
def test_only_operator_can_transition_and_illegal_jump_is_rejected(report, citizen, operator):
    client = APIClient()
    client.force_login(citizen)
    path = f"/api/reports/{report.pk}/transition/"
    assert client.post(path, {"status": "completed"}, format="json").status_code == 403

    client.force_login(operator)
    assert client.post(path, {"status": "completed"}, format="json").status_code == 400
    assert client.post(path, {"status": "queued"}, format="json").status_code == 200
    report.refresh_from_db()
    assert report.status == Report.Status.QUEUED
    assert report.transitions.count() == 1


@pytest.mark.django_db
def test_token_hash_never_matches_reused_wrong_token(category):
    report = Report.objects.create(title="Private", description="Synthetic", category=category)
    token = issue_anonymous_token(report)
    report.save(update_fields=["anonymous_token_hash"])
    assert token not in report.anonymous_token_hash
    client = APIClient()
    assert (
        client.get(f"/api/reports/{report.pk}/", HTTP_X_REPORT_ACCESS_TOKEN=token).status_code
        == 200
    )
