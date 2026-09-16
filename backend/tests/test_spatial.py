import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from accounts.models import User
from reports.models import Category, Report


@pytest.mark.django_db
def test_nearby_query_uses_metres_and_keeps_reports_private():
    category = Category.objects.create(name="Spatial test")
    operator = User.objects.create_user(
        username="spatial-operator@example.test",
        email="spatial-operator@example.test",
        password="synthetic-test-only",
        role=User.Role.OPERATOR,
    )
    citizen = User.objects.create_user(
        username="spatial-citizen@example.test",
        email="spatial-citizen@example.test",
        password="synthetic-test-only",
    )
    centre = Report.objects.create(
        title="Centre",
        description="Synthetic",
        category=category,
        location=Point(-0.1, 51.5, srid=4326),
    )
    close = Report.objects.create(
        title="Close",
        description="Synthetic",
        category=category,
        location=Point(-0.1, 51.51, srid=4326),
    )
    Report.objects.create(
        title="Far",
        description="Synthetic",
        category=category,
        location=Point(-0.1, 51.8, srid=4326),
    )
    Report.objects.create(title="Unlocated", description="Synthetic", category=category)
    path = "/api/reports/nearby/?latitude=51.5&longitude=-0.1&radius_km=5"

    client = APIClient()
    assert client.get(path).status_code == 403
    client.force_login(citizen)
    assert client.get(path).status_code == 403
    client.force_login(operator)
    response = client.get(path)
    assert response.status_code == 200
    assert [item["id"] for item in response.data] == [str(centre.pk), str(close.pk)]
    assert response.data[0]["distance_km"] == 0
    assert 1 < response.data[1]["distance_km"] < 1.2
    assert all("reporter" not in item and "attachments" not in item for item in response.data)

    excluded = client.get(f"{path}&exclude_id={centre.pk}")
    assert [item["id"] for item in excluded.data] == [str(close.pk)]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "query",
    [
        "latitude=91&longitude=0",
        "latitude=0&longitude=181",
        "latitude=0&longitude=0&radius_km=51",
        "latitude=nan&longitude=0",
    ],
)
def test_nearby_query_rejects_invalid_coordinates_and_radius(query):
    operator = User.objects.create_user(
        username="query-operator@example.test",
        email="query-operator@example.test",
        password="synthetic-test-only",
        role=User.Role.OPERATOR,
    )
    client = APIClient()
    client.force_login(operator)
    assert client.get(f"/api/reports/nearby/?{query}").status_code == 400
