# Contributing

Use a short-lived branch and a PR. Run frontend lint, tests and build; run backend Ruff, Django checks and tests against a disposable PostGIS database. Never commit `.env`, dumps, evidence, user records or credentials. CI scans new history for secrets.

Changes to access control should add negative tests for the affected role and object. Changes to report status should preserve the transactional history. See [authorization](docs/authorization.md) before adding an endpoint.
