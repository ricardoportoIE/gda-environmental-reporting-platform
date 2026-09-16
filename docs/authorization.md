# Authorization matrix

| Operation | Anonymous | Citizen | Operator | Administrator |
| --- | --- | --- | --- | --- |
| Read categories and municipality search | Yes | Yes | Yes | Yes |
| Create report | Yes, rate-limited | Yes, rate-limited | Yes | Yes |
| List reports | No | Own only | All | All |
| Read report and private evidence | Own anonymous token only | Own only | All | All |
| Edit report in analysis | Own anonymous token only | Own only | Yes | Yes |
| Upload evidence in analysis | Own anonymous token only | Own only | Yes | Yes |
| Change status | No | No | Yes, allowed transition only | Yes, allowed transition only |
| Query nearby reports by radius | No | No | Yes | Yes |
| List or change user roles | No | No | No | Yes |

Anonymous access is the combination of an unguessable UUID report ID and a 32-byte random bearer token shown once. Only the SHA-256 digest is stored. The token must be supplied in `X-Report-Access-Token` for later reads or uploads; the frontend holds it in memory and lets the reporter copy it. Losing it means the reporter cannot independently regain anonymous access.

The API derives role from the authenticated server-side account, never from a client-supplied registration field. Public registration accepts only email, password and names. `/api/auth/me/` only updates the current account's names. Administrator routes use explicit serializers and a separate role permission. Status changes run inside a database transaction with a row lock.

All report IDs are UUIDs. Private evidence files are served by a permission-checked API endpoint with `Content-Disposition: attachment` and `Cache-Control: private, no-store`. Media files are not served through a public `/media` path.

The nearby-report endpoint returns a deliberately reduced projection without reporter or attachment data. It is restricted to operators and administrators, caps the radius at 50 km and limits each result set to 50 reports.
