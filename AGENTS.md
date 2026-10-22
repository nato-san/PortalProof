# PortalProof continuation instructions

This repository is the canonical PortalProof implementation. When continuing the project in a new Codex or ChatGPT version, read these files first:

1. `docs/PROJECT_HANDOFF.md`
2. `README.md`
3. `docs/ROADMAP.md`
4. `docs/SUBMISSION_CHECKLIST.md`

## Safety and continuity rules

- Preserve existing work. Do not delete, reset, reinitialize, or replace the repository.
- Inspect `git status` and recent history before editing.
- The deployed `PortalProofOrder` contract is shared by the application. Do not redeploy it unless the user explicitly requests a replacement deployment.
- Never request, read, store, print, or commit seed phrases, private keys, wallet-backup JSON files, or wallet passwords.
- Do not change the Portaldot V3 network constants or deployed contract address without verifying current official network information and confirming the change with the user.
- Keep local-demo behavior and real Portaldot V3 behavior clearly separated.
- Preserve the English/Japanese interface and documentation.
- Run `npm test` and `npm run build` after implementation changes.
- Do not mark an item complete based only on UI text; verify the corresponding code, build, or on-chain evidence.

## Product direction

PortalProof is a creator commission workflow DApp. The current MVP records agreement, delivery, and verified native-payment evidence on Portaldot V3 and produces a certificate. The next major feature is an escrow deposit/release flow, but it must not be rushed into the stable interim-report build. See `docs/PROJECT_HANDOFF.md` and `docs/ROADMAP.md` for scope and priorities.
