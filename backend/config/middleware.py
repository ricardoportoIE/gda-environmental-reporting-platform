import logging
import re
import time
import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger("gda.request")
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


class RequestIDMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        supplied_id = request.headers.get("X-Request-ID", "")
        request_id = supplied_id if REQUEST_ID_PATTERN.fullmatch(supplied_id) else uuid.uuid4().hex
        request.META["gda.request_id"] = request_id
        started = time.perf_counter()
        response = self.get_response(request)
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        response["X-Request-ID"] = request_id
        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
