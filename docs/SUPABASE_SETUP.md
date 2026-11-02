# Supabase shared intake — setup and release gate

Status (2026-11-02): Supabase project created and connected. User executed migration successfully; wallet-free submission and creator receipt were demonstrated on the same Mac. Anonymous table reads/creator updates and wrong-token reads/payment reports were rejected in live API checks. Shared intake is being released as a test version; two-device and second-creator isolation tests remain pending. V2 lifecycle integration remains incomplete. Do not describe this as a complete deployed commission workflow.

## User setup

1. Open https://supabase.com/dashboard and create a project in a Free organization. Keep the generated DB password in your own password manager; do not share it in chat or commit it.
2. In SQL Editor, run `supabase/migrations/20261101_shared_requests.sql` once in that new project. This creates new `pp_` tables, functions and RLS policies; it does not migrate existing browser data.
3. From the project Connect/API settings, obtain the project URL and publishable key. These are browser-public configuration. Never use `service_role`, a secret API key, database password or connection string in a `VITE_` setting.
4. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in ignored `.env.local`. Rebuild with `npm run build`. For GitHub Pages these variables must also be provided to the build workflow before a separately authorized release.
5. Auth settings: enable Email login, keep email verification on, configure the site URL and allowed redirect URL for the exact local/hosted path. Creators register/login; clients do not sign in. This authenticates the creator's email account, not ownership of the receiving wallet.
6. Open `?view=shared`, register the creator and verify the email. Create an offering and open its generated link on another device after the frontend has a public URL. localhost is still not a remote URL.

## Implemented preparation

- Supabase SDK with optional configuration; legacy screens remain available when unset.
- Creator Auth UI and owner-only offering/request policies.
- Server-selected creator identity and offering fields; client input does not create creator authority.
- Private client token hashed in DB; raw token is returned only to the submitting client.
- Retry idempotency for the same offering/token and versioned creator updates.
- Client payment report is explicitly unverified; it does not complete a job or certify payment.

## Mandatory remaining release checks

- Execute migration and test with two distinct creator accounts: B cannot read/update A's jobs, anonymous callers cannot select request tables, tokens cannot access other jobs.
- Verify creator registration, email redirects, logout, reload, repeated/parallel submission, version conflicts, missing token and DB outage behavior.
- Add abuse controls before opening anonymous intake broadly: rate limiting/CAPTCHA appropriate to the chosen public API. Database access controls do not prevent spam alone.
- Set private-page Referrer-Policy at hosting and omit third-party tracking. Treat token links as private access, not proof of real-world identity.
- Integrate terms proposal/consent and V2 lifecycle. The current shared creator inbox only receives/displays requests; it is not yet a full contract-management UI. No unaudited browser-provided hash should be treated as verified chain evidence.
- Test the full pipeline on two physical devices and publish only after these gates. Legacy browser jobs are not auto-uploaded or converted.

The project is Free-tier oriented, but check the Supabase dashboard for the chosen organization's billing and quotas before creating resources. No paid subscription was enabled by this work.
