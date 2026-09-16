import os

from .base import *  # noqa: F403

if len(SECRET_KEY) < 50 or len(set(SECRET_KEY)) < 5 or SECRET_KEY.startswith("django-insecure-"):  # noqa: F405
    raise RuntimeError("DJANGO_SECRET_KEY must be a strong, unique production secret")
if not os.environ.get("DJANGO_ALLOWED_HOSTS"):
    raise RuntimeError("DJANGO_ALLOWED_HOSTS must be set in production")

DEBUG = False
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", "1") == "1"
SECURE_HSTS_PRELOAD = os.environ.get("DJANGO_SECURE_HSTS_PRELOAD", "0") == "1"
if not SECURE_HSTS_PRELOAD:
    # Preload enrolment is long-lived and must remain an explicit deployment decision.
    SILENCED_SYSTEM_CHECKS = ["security.W021"]
