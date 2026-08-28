# CFO Edge Worker

## Required secrets

Configure production secrets through Wrangler:

- `AXIM_CORE_SECRET`
- `AXIM_CORE_API_TOKEN`
- `EMAILIT_API_KEY`
- `RESEND_API_KEY`
- `NEXUS_CRM_TOKEN`
- `SUITEDASH_API_TOKEN`

Configure the corresponding service URLs as Wrangler environment variables.

## Signature format

Webhook callers must send the raw request body with:

`X-AXiM-Signature: sha256=<hex-hmac-sha256>`

The HMAC must be generated from the exact raw request body using
`AXIM_CORE_SECRET`.

## Routes

- `POST /api/v1/core-webhook`
- `POST /api/v1/selldone-ingest`
- `GET|POST /api/v1/hitl-resolve`
- `GET /api/v1/stream/metrics`
- `GET /api/v1/health`

## Verification

Run `npm run build` from this directory for a Cloudflare deployment dry run.