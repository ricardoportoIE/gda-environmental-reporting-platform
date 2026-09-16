# Deployment configuration

GDA has explicit Django settings for each runtime:

- `config.settings.development` enables local debugging and permits HTTP cookies.
- `config.settings.production` requires a strong secret and explicit allowed hosts, redirects HTTP to
  HTTPS, enables secure cookies and sends HSTS headers.

The container image defaults to production settings. Docker Compose overrides this with the development
module because the local stack is served over HTTP.

## Required production environment

```text
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=<unique random value of at least 50 characters>
DJANGO_ALLOWED_HOSTS=reports.example.org
DATABASE_URL=postgis://...
REDIS_URL=redis://...
CSRF_TRUSTED_ORIGINS=https://reports.example.org
FRONTEND_ORIGIN=https://reports.example.org
```

`DJANGO_SECURE_HSTS_SECONDS` defaults to one year in the production module. Deploy HTTPS across the
entire domain before using that setting. Subdomains are included by default; HSTS preloading remains
disabled unless `DJANGO_SECURE_HSTS_PRELOAD=1` is set explicitly.

Run these checks against the exact deployment environment before releasing:

```sh
python manage.py check --deploy --fail-level WARNING
python manage.py migrate --check
python manage.py spectacular --validate --fail-on-warn --file /tmp/openapi.yaml
```

## Operational endpoints and logs

- `/health/` is a liveness probe and only confirms that Django can answer HTTP requests.
- `/ready/` checks both PostgreSQL and the configured cache and returns HTTP 503 when either dependency
  is unavailable.
- Every response carries `X-Request-ID`. A safe incoming identifier is preserved; malformed or oversized
  values are replaced.
- Application request logs are emitted as one JSON object per line. They contain the request identifier,
  method, path, response status and duration, without request bodies or personal data.

The reverse proxy should preserve `X-Request-ID`, set `X-Forwarded-Proto`, terminate TLS and collect
standard output from the backend container.
