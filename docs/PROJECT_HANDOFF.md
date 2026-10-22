# PortalProof Project Handoff / 引継ぎ資料

Last updated: 2026-10-22

This file is the starting point for continuing PortalProof in a new ChatGPT or Codex version.

このファイルは、新しいChatGPT／CodexバージョンでPortalProofの開発を継続する際の最初の参照先です。

## Canonical locations / 正式な保存場所

- Local repository: `/Users/nato-san/Documents/Codex/2026-10-14/referenced-chatgpt-conversation-this-is-an/outputs/portalproof-v3`
- GitHub: https://github.com/nato-san/PortalProof
- Live DApp: https://nato-san.github.io/PortalProof/
- Demo video: https://youtube.com/watch?v=5DtARDfIMM0

The Git repository and GitHub `main` branch are the source of truth for code. Do not create a replacement project when continuing work.

コードの正本はこのGitリポジトリとGitHubの`main`ブランチです。引継ぎ時に別プロジェクトを新規作成しないでください。

## Current completed state / 現在の完成状態

- Public bilingual React/Vite DApp deployed on GitHub Pages.
- Local-demo and Portaldot V3 execution modes.
- Creator request-page setup, shareable client form, request inbox, and per-request management workspace.
- Agreement, delivery, payment, and certificate stages.
- Shared `PortalProofOrder` Solidity contract deployed on Portaldot V3.
- Agreement terms hash and delivery URL hash recorded on-chain.
- Native tPOTv3 payment evidence accepted only after sender, recipient, amount, and receipt status verification.
- Duplicate order-proof UI guard.
- Completed end-to-end testnet flow and QR certificate.
- English demo video under three minutes.
- English and Japanese pitch decks.
- README, network setup, technical notes, roadmap, submission checklist, and DoraHacks submission draft.

## Verified Portaldot V3 configuration / 確認済み設定

| Item | Value |
| --- | --- |
| Native RPC | `wss://test-node-v3.portaldot.dev` |
| EVM RPC | `https://test-evm-rpc-v3.portaldot.dev` |
| Chain ID | `420420777` |
| Currency symbol | `tPOTv3` |
| Native token decimals | `14` |
| EVM / MetaMask decimals | `18` |
| Shared contract | `0xBaE8933886e1520e5FCa3eDed119c08b29022D79` |
| Contract deployment block | `119719` |

Do not confuse the native Substrate-style address with the mapped EVM address. The browser-extension account and MetaMask account may represent the same underlying user through different address formats.

ネイティブ形式のアドレスとEVM形式のアドレスを混同しないでください。同じ利用者でも表示形式が異なります。

## Testnet evidence / テストネット証跡

| Evidence | Transaction hash |
| --- | --- |
| Contract deployment | `0x29b2c7b2b91bf6cc6804040fb0590c020a3b0a4bdae1f81864f1f9f227035365` |
| OrderCreated | `0x2bcc608ac64194dbd08f8c0239bf12ce1ae4c7870f7ef9f59265a775bbb16815` |
| Duplicate test order | `0x6fd2728858d5278e43c0cec6618427a8505e048c87362f9dd43a2e7f023f6be7` |
| DeliverySubmitted | `0x9f8e365d727c2c4cd5cbabd323f505313ea8d6fabcf25c1986d2acf801b76db9` |
| PaymentRecorded | `0x632700e4ca21e59e47b0f9fa60beefd460b1c176695ab33438548cdcc7d8a3a0` |

The duplicate test transaction is historical evidence. A UI guard was added afterward. Do not remove it from documentation or treat it as the canonical order transaction.

## Important implementation files / 重要ファイル

- `src/main.jsx`: UI, bilingual copy, routing/view state, wallet connection, contract calls, payment verification.
- `src/domain.js`: network configuration and domain helpers.
- `src/contract.js`: contract interaction definitions.
- `src/deployment.js`: deployment bytecode helper.
- `contracts/PortalProofOrder.sol`: deployed lightweight proof contract source.
- `artifacts/PortalProofOrder.json`: compiled artifact used by deployment tooling.
- `test/domain.test.js` and `test/contract.test.js`: current automated tests.
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment.

## How to verify before changing anything / 作業前の確認

```bash
git status --short --branch
git log -5 --oneline --decorate
npm install
npm test
npm run build
```

The published site is built from the repository through GitHub Pages. After a deliberate code change, commit and push only after tests and the production build pass.

## Current product limitations / 現在の制限

- Payment happens outside the contract; PortalProof verifies and records evidence afterward.
- There is no escrow, so payment is not guaranteed.
- Public delivery URLs can be copied.
- The request inbox is browser-local and does not sync across devices.
- Creators manually handle several steps and transaction hashes.
- Income management and completed-job archives are not implemented.

## Next priorities / 次の優先事項

1. Complete and safely submit the interim/check-in report if it is not yet submitted.
2. Keep the current MVP stable for judging.
3. Design escrow as a separate reviewed milestone: client deposit after acceptance, release after approval, and explicit refund/timeout rules.
4. Add protected delivery links, revision handling, income management, and completed-job archives.
5. Before any real-value escrow deployment, add security protections, invariant tests, and an external review.

## Secrets and wallet recovery / 秘密情報とウォレット復元

- Never commit `.env`, wallet backup JSON, mnemonic/seed phrase, private key, or wallet password.
- Do not paste those values into a website, issue, chat, or documentation.
- The Portaldot extension backup and its password remain user-managed outside this repository.
- If the extension loses its local account list, restore the existing account from the user's own backup; do not create a replacement address for existing funds.

## Definition of a safe handoff / 安全な引継ぎ条件

A new assistant should be able to identify the correct repository, understand the deployed state, run tests/build, distinguish completed features from roadmap items, and continue without asking for secrets or redeploying the shared contract.
