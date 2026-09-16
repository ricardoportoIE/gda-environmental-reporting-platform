# Contributing

Use a short-lived branch and a PR. Run frontend lint, coverage, E2E tests and build; run backend Ruff, Django checks and coverage against a disposable PostGIS database. Never commit `.env`, dumps, evidence, user records or credentials. CI scans the complete history for secrets.

Changes to access control should add negative tests for the affected role and object. Changes to report status should preserve the transactional history. See [authorization](docs/authorization.md) before adding an endpoint.

Demo fixtures must be unmistakably synthetic, deterministic and safe to run more than once. Do not add real people, addresses, evidence or incident records.

Before opening a pull request, run `mypy accounts reports config`, validate the OpenAPI schema with
`python manage.py spectacular --validate --fail-on-warn --file openapi.yaml`, and run the existing Ruff,
Pytest, frontend coverage, build and Playwright commands. The E2E suite includes automated WCAG checks.
Production configuration must pass `python manage.py check --deploy --fail-level WARNING` with
`config.settings.production` selected.
