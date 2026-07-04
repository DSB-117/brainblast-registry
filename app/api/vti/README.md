# POST /api/vti — git-less VTI ingest (R11)

Feed a Verified Trap Instance straight into the corpus, no PR. **Open + server-
validated** (like `/api/fleet-ledger`): the gates are the guard, not a token.

## Gates (server-side, at the edge — no ts-morph here)

1. **Shape** — required fields, a *vetted* `check.kind` (fail-closed), safe id, size caps.
2. **Secret scan** — the vendored Keyguard classifier (`lib/brainblast/detect.ts`); any key/keypair/mnemonic in the fixtures refuses the submission.
3. **Provenance / anti-fabrication** — `lib/brainblast/provenance.ts`. The submission must cite a **commit-pinned** source + a verbatim `evidence` snippet; the server fetches that exact file at that exact commit and confirms the vulnerable line is really there. This is the un-fakeable check that replaces human PR review.

The heavy **RED→GREEN reproduction** proof stays where ts-morph lives: the client `brainblast submit:vti` proves locally before POST, and a brainblast-side pass re-proves stored rows and flips `proof_verified`. Paid tiers gate on that flag; the open sample tier serves provenance-verified rows.

## Request

```
POST /api/vti
{ "finding": { …a candidate Finding, incl. provenance.sourceRef + provenance.evidence… },
  "consentScope": "opt-in:train+eval" }
```

`201 {accepted, trapId, provenanceUrl}` landed · `200 {duplicate}` idempotent ·
`422 {reasons}` failed a gate · `429` rate limited (per-IP hourly cap).

`GET /api/vti` → `{count, records:[teasers]}` (metadata + receipts, never fixtures).

Tables: `vtis`, `vti_ingest_audit` (see `supabase/migrations/0001_vtis.sql`).
