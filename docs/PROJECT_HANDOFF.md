# PortalProof Project Handoff / 引継ぎ資料

Last updated: 2026-11-05

2026-11-05 pre-deadline check-in: **PASSED**. The review confirmed byte-identical recompilation of the deployed contract artifacts, video ownership, accurate disclosure of the append-only three-event design, escrow as roadmap work rather than a live claim, and passing tests. Mentor feedback identified technical viability and per-transaction commission as a clear business-model path.

2026-11-05締切前チェックイン：**通過**。デプロイ済みコントラクト成果物のバイト単位再コンパイル一致、動画所有確認、追記専用3イベント設計の正確な説明、エスクローを未実装ロードマップとして扱っていること、テスト合格が確認されました。メンターからは技術的実現性と、取引ごとの手数料という明確なビジネスモデル候補が評価されました。

2026-11-03 routing/mobile addendum: the public root now enters the shared workspace, not the historical browser-local App. Read `docs/NAVIGATION_MOBILE.md` for current navigation, mobile transport, test limits and outstanding shared-workflow integration. The completed state below describes the October MVP, not completion of the current cross-device flow.

2026-11-03追記：公開ルートを共有画面へ統一。現在の導線・スマホ接続・未確認事項は`docs/NAVIGATION_MOBILE.md`を参照。以下は10月時点のMVP記録であり、現在の別端末フローの全機能完了を意味しません。

2026-11-05 shared-proof update: order, delivery URL/hash, independently verified native-payment evidence, and QR public proof are connected to signed shared jobs. Public workflow version 4 is active. A real two-wallet Portaldot V3 run completed through final QR proof transaction `0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa`. See `docs/SHARED_PROOF_WORKFLOW.md`. The QR certificate is not a minted SBT.

2026-11-05共有証明更新：署名付き共有案件に、発注証明、納品URL・ハッシュ、独立検証するネイティブ支払い証跡、QR公開証明を接続しました。公開ワークフローはバージョン4です。2つの実ウォレットによるPortaldot V3の一連の確認を、最終QR証明Tx`0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa`まで完了しました。詳細は`docs/SHARED_PROOF_WORKFLOW.md`を参照。QR証明書はミントされたSBTではありません。

This file is the starting point for continuing PortalProof in a new ChatGPT or Codex version.

このファイルは、新しいChatGPT／CodexバージョンでPortalProofの開発を継続する際の最初の参照先です。

## Canonical locations / 正式な保存場所

- Local repository: `/Users/nato-san/Documents/Codex/2026-10-15/work-portalproof-portaldot-hacker-house-2026`
- GitHub: https://github.com/nato-san/PortalProof
- Live DApp: https://nato-san.github.io/PortalProof/
- Demo video: https://www.youtube.com/watch?v=QlODCrM-_1M (`PortalProof DEMO`, externally playable, approximately 2:05 on YouTube; verified 2026-11-05)

The Git repository and GitHub `main` branch are the source of truth for code. Do not create a replacement project when continuing work.

コードの正本はこのGitリポジトリとGitHubの`main`ブランチです。引継ぎ時に別プロジェクトを新規作成しないでください。

## Current completed state / 現在の完成状態

- Public bilingual React/Vite DApp deployed on GitHub Pages.
- Local-demo and Portaldot V3 execution modes.
- Contractor offering setup, shareable client form, wallet-scoped request lists, independent archives, and per-request management workspace.
- Agreement, delivery, payment, and certificate stages.
- Shared `PortalProofOrder` Solidity contract deployed on Portaldot V3.
- Agreement terms hash and delivery URL hash recorded on-chain.
- Native tPOTv3 payment evidence accepted only after sender, recipient, amount, and receipt status verification.
- Duplicate order-proof UI guard.
- Completed end-to-end testnet flow and QR certificate.
- The corrected English demo video is uploaded to YouTube and externally playable in under three minutes.
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
| Native payment | `0x632700e4ca21e59e47b0f9fa60beefd460b1c176695ab33438548cdcc7d8a3a0` |
| PaymentRecorded | `0xed7830c50ad616b4fa9e1218f38f6604bb893f45691e13662f593ca8c1ec9a72` |

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
- The active shared workflow stores authenticated wallet-owned offerings and requests in Supabase for cross-device use. Historical browser-local links remain isolated for recovery only.
- Creators manually handle several steps and transaction hashes.
- Income reporting and escrow are not implemented. Contractor and client list archives are implemented as independent organization preferences and do not alter job state.

## Next priorities / 次の優先事項

1. Review and publish the prepared repository updates, verify the deployed DApp/PDF/video links, and complete the final DoraHacks submission before 2026-11-06 13:00 JST.
2. Keep the current MVP stable for judging; do not deploy the tested V2 contract without a separate explicit decision.
3. Design escrow as a separate reviewed milestone: client deposit after acceptance, release after approval, and explicit refund/timeout rules.
4. Add protected delivery links, revision handling, and income management; improve archive filtering without changing transaction state.
5. Before any real-value escrow deployment, add security protections, invariant tests, and an external review.

## Secrets and wallet recovery / 秘密情報とウォレット復元

- Never commit `.env`, wallet backup JSON, mnemonic/seed phrase, private key, or wallet password.
- Do not paste those values into a website, issue, chat, or documentation.
- The Portaldot extension backup and its password remain user-managed outside this repository.
- If the extension loses its local account list, restore the existing account from the user's own backup; do not create a replacement address for existing funds.

## Definition of a safe handoff / 安全な引継ぎ条件

A new assistant should be able to identify the correct repository, understand the deployed state, run tests/build, distinguish completed features from roadmap items, and continue without asking for secrets or redeploying the shared contract.
