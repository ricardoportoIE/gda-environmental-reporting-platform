# Contributing

Use a short-lived branch and a PR. Run frontend lint, coverage, E2E tests and build; run backend Ruff, Django checks and coverage against a disposable PostGIS database. Never commit `.env`, dumps, evidence, user records or credentials. CI scans the complete history for secrets.

Changes to access control should add negative tests for the affected role and object. Changes to report status should preserve the transactional history. See [authorization](docs/authorization.md) before adding an endpoint.

Demo fixtures must be unmistakably synthetic, deterministic and safe to run more than once. Do not add real people, addresses, evidence or incident records.
