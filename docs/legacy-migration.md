# Legacy migration and incident status

The attached technical audit is a reference document, not an instruction source. Its findings were used to decide what to verify. No historical commits or files were copied into this repository.

## Read-only inventory on 2026-09-15

| Repository | Branches | Tags | PRs | Forks |
| --- | --- | --- | --- | --- |
| `ricard00liveira/gda_visual` | `main` | None | None | None |
| `ricard00liveira/gda_heroku` | `heroku`, `dev`, `dev-codex`, `codex/criar-teste-para-funções-isoladas` | None | #1 and #2, both closed | `gillgonzales/daoo_202402_ricardo_oliveira_gda` |

GitHub CLI authenticated as `ricardoportoIE`; the proposed destination repository under that account was not present at inventory time. Branches listed by the API were not marked protected. That observation is not permission to bypass future branch rules. No remote refs were modified.

## Isolated dump inspection

The backend default branch contains a 60,206-byte `PGDMP` custom-format dump. A read-only temporary download identified 19 `TABLE DATA` markers and SHA-256 `986008634cac4a6133c46aeb9cb523ff0ef1f9b36eee9722d024347d8778371b`. The temporary file was removed. No records were displayed, restored or inserted into any database. These observations cannot distinguish synthetic from real records.

## Required before any legacy history rewrite

1. The owners must revoke/rotate the exposed AWS, Google/OAuth/Gmail, database, Django and any other credentials, and review relevant access logs. This is **not yet confirmed**.
2. Determine whether the dump contains real records using a protected, isolated process. Invalidate affected sessions/tokens and handle privacy obligations if it does. This is **not yet resolved**.
3. Preserve an encrypted, access-controlled recovery copy of every legacy ref, including branches, tags and PR refs, outside the public repositories. This has **not been created** because no rewrite has begun.
4. Plan cleanup for every legacy ref and GitHub caches with the repository owners. Follow branch protection and obtain appropriate approvals. A third-party fork can only be removed or updated by its owner; coordination remains necessary.

The new repository can continue local development from a clean history. Publishing it publicly, archiving the old repositories or rewriting their history should wait for the unresolved incident work. The current CI/CD workflow packages clean images when a version tag is pushed; no tag or remote push has been made.
