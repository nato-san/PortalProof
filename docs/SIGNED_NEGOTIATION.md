# Signed intake and negotiation checkpoint — 2026-11-02

Human-approved rules supersede wallet-free submission: client signs in BEFORE sending (authentication signature, no payment/gas). Record initial request; creator may decline with reason during negotiation. Creator acceptance of unchanged original terms establishes agreement. Creator changes require client approval. After agreement, cancellation requires the other participant's approval. Archiving is not cancellation.

## Implemented locally, not publicly released or live-DB tested

- `20261102_signed_negotiation.sql` is an additive migration after `20261101_shared_requests.sql`; no request deletion/reset. Adds authenticated client ownership, immutable-to-users initial-request/action journal, version checks/row locks, counterproposals, acceptance and cancellation decisions.
- New requests derive both wallets from verified Supabase Web3 identities. Artist receiving wallet must match that verified identity; self-requests are refused so one account cannot supply both sides' consent. Existing email/test requests remain unchanged and are not automatically claimed by a wallet.
- RLS allows only the creator/client to read the job and history. No client direct table updates or history writes. Old owner patch/capability functions cannot bypass new signed records. New signed payment reporting stays blocked until payment integration exists.
- Frontend requires wallet auth for new submissions, supports client commission list and negotiation/cancellation controls for both participants. New submissions remain disabled until the version RPC confirms the migration exists. Current published frontend is not updated by these local changes.
- The original unsigned submission RPC still exists for rollout compatibility; before declaring production wallet-only intake complete, retire that endpoint in coordination with the public frontend release. Existing unsigned test requests must remain identifiable as legacy, not verified wallet submissions.

## Verification performed

- `npm test`, `npm run build`, `git diff --check`.
- SQL executed using isolated PGlite (actual PostgreSQL-compatible execution) with fixture auth schemas/identities, not the live Supabase service. Validated anonymous/third-party denial, initial journal, authenticated identity, retry idempotency, changed-terms consent, stale versions, creator decline before agreement, denial of unilateral cancellation afterwards, opposite-party cancellation approval/rejection, immutable journal, old-patch bypass refusal.
- Reproduce DB tests by installing `@electric-sql/pglite` in a temporary test folder, then `PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node test/workflow-db.test.mjs`. This does not add browser dependencies.

## Still required

1. User runs this migration in Supabase SQL Editor ONCE, confirms success. Do not rerun the old migration or reset data.
2. Live test with two distinct wallets, confirm Supabase identity claim format, RLS and error cases. Test returning to the client list on another device.
3. Connect the existing proven delivery/payment/certificate UI to authenticated shared records and the revised proof contract; no duplicate implementation or disabling legacy safety guards. No contract deployment is authorized/performed by this checkpoint.
4. Tie acceptance/cancellation journal to final proof traceability. The current journal is server-enforced but not independent on-chain proof of consent. It is not a general in-app chat.
5. Finish real-chain payment verification, two-device full flow and security/abuse checks before final release. No claim that the full workflow is complete.
