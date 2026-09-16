from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse


def health(_request):
    """Liveness probe: the Django process can answer HTTP requests."""
    return JsonResponse({"status": "ok"})


def readiness(_request):
    """Readiness probe: required database and cache dependencies are available."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        cache.set("gda-readiness", "ok", timeout=10)
        if cache.get("gda-readiness") != "ok":
            raise RuntimeError("Cache readiness check failed")
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ready"})
