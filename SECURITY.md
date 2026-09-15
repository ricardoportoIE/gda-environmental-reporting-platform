# Security and privacy

Please report security issues privately to the repository owner through GitHub's private vulnerability reporting when this repository is published. Do not include personal records, tokens or credentials in public issues.

The initial implementation uses cookie-based sessions, CSRF protection, explicit role/object permissions, hashed anonymous access tokens, rate limits with a shared Redis cache in Compose, UUID identifiers and permission-checked evidence downloads. Uploads are capped at 5 MB and four files, allow PNG/JPEG/PDF only, check magic bytes and verify images with Pillow. PDFs do not yet have malware scanning; this and CAPTCHA or equivalent bot controls are required before a public anonymous endpoint is exposed.

The legacy repositories remain an unresolved exposure: historical credentials and a database dump were reported in the supplied audit, and the dump's authenticity is unknown. No old credentials are used here. [Migration and incident status](docs/legacy-migration.md) lists the owner-led steps required before any rewrite.

The local environment is for synthetic data only. Do not enter real CPF, contact details, evidence or sensitive locations into a portfolio demo. Production needs a documented retention/deletion policy, backups, private object storage, HTTPS and operational alerting. Redis-backed throttling limits abuse but does not replace bot controls or budget limits for future paid integrations.
