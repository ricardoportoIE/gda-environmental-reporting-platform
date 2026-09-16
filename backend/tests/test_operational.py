import re

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_liveness_and_readiness_probes_include_request_ids():
    client = APIClient()

    health = client.get("/health/", HTTP_X_REQUEST_ID="synthetic-request-123")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert health["X-Request-ID"] == "synthetic-request-123"

    readiness = client.get("/ready/")
    assert readiness.status_code == 200
    assert readiness.json() == {"status": "ready"}
    assert re.fullmatch(r"[0-9a-f]{32}", readiness["X-Request-ID"])


def test_untrusted_request_id_is_replaced():
    response = APIClient().get("/health/", HTTP_X_REQUEST_ID="invalid request id\n")
    assert response.status_code == 200
    assert response["X-Request-ID"] != "invalid request id\n"
    assert re.fullmatch(r"[0-9a-f]{32}", response["X-Request-ID"])
