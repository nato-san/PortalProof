# DoraHacks Final Submission Copy / DoraHacks最終提出文案

Last verified / 最終確認: 2026-11-05 JST

## Project Name / プロジェクト名

PortalProof

## Team / チーム

**nato-san — Solo builder**
日本語訳: **nato-san — 個人開発**

## Track / 部門

**Ecosystem DApps**
日本語訳: **エコシステムDApps**

## One-sentence Overview / 1文概要

**PortalProof is a non-custodial work-order proof DApp where contractors publish request links, clients manage commissioned work with their own wallets, and both parties can verify agreed terms, delivery, and payment evidence on Portaldot V3.**

日本語訳: **PortalProofは、受注者が依頼受付リンクを公開し、発注者が自分のウォレットで依頼を管理し、双方が合意条件・納品・支払いの証跡をPortaldot V3上で確認できる、非カストディ型の仕事証明DAppです。**

## Short Description Field / 短い紹介文欄

**PortalProof helps contractors and clients manage commissioned work with verifiable agreement, delivery, and payment evidence on Portaldot V3.**

日本語訳: **PortalProofは、受注者と発注者が仕事を管理し、合意・納品・支払いの証跡をPortaldot V3上で検証できるようにするDAppです。**

## Problem / 解決する課題

**Commissioned work often begins in social media or direct messages. The request, negotiated terms, delivery link, and payment receipt then remain scattered across different services. This creates avoidable disputes and makes it difficult for a client, contractor, or third party to verify what actually happened.**

日本語訳: **受発注の仕事はSNSやDMから始まることが多く、依頼内容、交渉後の条件、納品リンク、支払い記録が複数サービスに分散します。そのため不要なトラブルが起きやすく、発注者・受注者・第三者が実際の経緯を確認しにくくなります。**

## Solution / 解決策

**PortalProof provides a wallet-based flow from public intake to negotiation, mutual agreement, delivery, payment verification, and a QR-linked public proof page. Request submission and negotiation stay off-chain for usability. The agreed terms hash, delivery hash, and verified payment reference are recorded through a shared Solidity proof contract on Portaldot V3. PortalProof never holds user funds.**

日本語訳: **PortalProofは、公開受付、商談、双方合意、納品、支払い検証、QRから開く公開証明までをウォレットに紐づけて管理します。使いやすさのため依頼送信と商談はオフチェーンで行い、合意条件ハッシュ、納品ハッシュ、検証済み支払い参照をPortaldot V3上の共有Solidity証明コントラクトへ記録します。PortalProofは利用者の資金を預かりません。**

## Why Portaldot Is Essential / Portaldotが不可欠な理由

**A normal database can coordinate the workflow, but it cannot provide neutral, independently retrievable evidence after the platform or either participant changes their records. Portaldot V3 gives PortalProof an EVM-compatible public execution layer where Solidity events and transaction receipts can anchor the final evidence. Its low-friction testnet lets the product combine familiar EVM wallets with public verification while keeping ordinary negotiation off-chain.**

日本語訳: **通常のデータベースは業務フローを調整できますが、運営者や当事者が記録を変更した後にも残る、中立で独立取得可能な証拠にはなりません。Portaldot V3はEVM互換の公開実行基盤を提供し、Solidityイベントと取引レシートを最終証跡の固定点にできます。通常の商談はオフチェーンに保ちながら、使い慣れたEVMウォレットと公開検証を組み合わせられることが重要です。**

## Working Product / 実装済み製品

- **Wallet-signature login without email registration**
  日本語訳: メール登録不要のウォレット署名ログイン
- **Multiple offering links, intake close/reopen, and cross-device request submission**
  日本語訳: 複数募集リンク、受付停止・再開、別端末からの依頼送信
- **Wallet-scoped contractor and client lists with independent archives**
  日本語訳: ウォレットに紐づく受注者・発注者一覧と、それぞれ独立したアーカイブ
- **Negotiation, changed-term approval, pre-agreement decline, and mutual post-agreement cancellation**
  日本語訳: 商談、変更条件の承認、合意前辞退、合意後の双方承認キャンセル
- **Order, delivery, native-payment verification, and QR-linked public proof**
  日本語訳: 発注・納品・ネイティブ支払い検証・QR公開証明
- **Japanese and English UI and guides**
  日本語訳: 日本語・英語UIと使い方ガイド

## Proof of Functionality / 動作証拠

**The current two-wallet shared workflow completed a real Portaldot V3 testnet sequence on November 5, 2026. The public verifier re-reads the Portaldot RPC and confirms the proof contract, event sequence, submitting wallet, referenced payment sender and recipient, receipt success, and transferred amount.**

日本語訳: **現在の2ウォレット共有フローは、2026年11月5日にPortaldot V3テストネット上で一連の実取引を完了しました。公開検証ページはPortaldot RPCから再取得し、証明コントラクト、イベント順序、記録ウォレット、参照支払いの送金元・送金先、成功状態、送金額を確認します。**

| Evidence / 証跡 | Value / 値 |
| --- | --- |
| Contract / コントラクト | `0xBaE8933886e1520e5FCa3eDed119c08b29022D79` |
| Deployment / デプロイ | `0x29b2c7b2b91bf6cc6804040fb0590c020a3b0a4bdae1f81864f1f9f227035365` |
| Shared OrderCreated / 共有発注記録 | `0x228e78e4878540a08c9234d0565351423cddac4233780275814cca06cbcdc775` |
| Shared DeliverySubmitted / 共有納品記録 | `0xf440c8d852e6bc9e069d96ebabc076c8611f1c5bded46ff0f4c1d56c636cb8b0` |
| Native payment, 10 tPOTv3 / ネイティブ支払い | `0xdcd5fe65db4b0d037c0c9d7e39ac18a3509a4b0f284c4e231535565e726190b5` |
| PaymentRecorded and QR proof / 支払い記録・QR証明 | `0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa` |

## Why Continued Support Matters / 継続支援の価値

**PortalProof turns Portaldot transactions into a consumer-facing trust product rather than exposing raw hashes alone. Continued support would fund the next safety milestone: deploy the already tested V2 proof model after review, separate order IDs from terms hashes on-chain, add contract-level state and replay protection, harden mobile wallet compatibility, and design audited escrow and protected delivery without weakening the current non-custodial MVP. The same workflow can serve design, software, video, translation, consulting, handmade goods, and other commissioned services.**

日本語訳: **PortalProofは生のTxHashだけを見せるのではなく、Portaldot取引を一般利用者向けの信頼製品へ変換します。継続支援があれば、レビュー後のV2証明モデルのデプロイ、オンチェーンでの注文IDと条件ハッシュの分離、コントラクト側の状態・再利用防止、モバイルウォレット互換性強化、監査済みエスクローと保護納品の設計を進められます。デザイン、開発、動画、翻訳、相談、ハンドメイドなど幅広い受発注に利用できます。**

## Links / リンク

- **Live DApp:** https://nato-san.github.io/PortalProof/
  日本語訳: 公開DApp
- **GitHub:** https://github.com/nato-san/PortalProof
  日本語訳: 公開GitHubリポジトリ
- **Public QR proof:** https://nato-san.github.io/PortalProof/?proofTx=0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa&lang=en
  日本語訳: 公開QR証明ページ
- **Pitch PDF:** https://nato-san.github.io/PortalProof/PortalProof-Pitch-Deck.pdf
  日本語訳: 英語版ピッチPDF
- **Demo video:** https://www.youtube.com/watch?v=QlODCrM-_1M
  日本語訳: 3分以内の英語デモ動画（YouTube）

## Reproducibility / 再現方法

```bash
npm install
npm test
npm run build
npm run dev
```

**The test suite covers domain rules, deployed-contract encoding, wallet wrappers, navigation, offerings, stage separation, negotiation UI rules, shared-proof helpers, V2 contract authorization/state/replay protection, and an isolated PostgreSQL-compatible workflow authorization test.**

日本語訳: **テストは、ドメイン規則、デプロイ済みコントラクトのエンコード、ウォレットラッパー、導線、募集、段階分離、商談UI規則、共有証明ヘルパー、V2コントラクトの権限・状態・再利用防止、分離PostgreSQL互換環境でのワークフロー権限を確認します。**

## Transparent Limitations / 制限事項の明示

**The deployed V1 contract is an append-only evidence log. Its proof ID equals the terms hash, while participant authorization, stage order, exact-payment matching, optimistic versions, and duplicate guards are enforced by the authenticated DApp and shared database before recording. `PortalProofOrderV2.sol` separates the order ID and terms hash and adds contract-level authorization, state transitions, nonce uniqueness, and payment-hash replay protection; it is locally tested but deliberately not presented as deployed. The MVP verifies and records native-payment evidence but does not escrow funds. The QR certificate is not a minted SBT.**

日本語訳: **デプロイ済みV1は追記専用証跡ログで、証明IDと条件ハッシュが同一です。当事者権限、段階順序、正確な支払い一致、楽観的バージョン、重複防止は記録前に認証済みDAppと共有DBで強制します。`PortalProofOrderV2.sol`は注文IDと条件ハッシュを分離し、コントラクト側の権限・状態遷移・nonce一意性・支払いハッシュ再利用防止を追加していますが、ローカルテスト済み・未デプロイとして正直に扱います。MVPは支払い証跡を検証・記録しますが、資金を預かりません。QR証明書はミント済みSBTではありません。**

## AI and Open-source Disclosure / AI・OSS開示

**OpenAI ChatGPT and Codex were used as development assistants for implementation support, debugging, tests, UI copy, translation, documentation, and pitch/demo preparation. The participant defined requirements, approved architecture and blockchain actions, protected credentials, performed physical-device tests, reviewed generated work, and remains responsible for the submission. Open-source dependencies and versions are listed in `package.json`.**

日本語訳: **OpenAI ChatGPTとCodexを、実装補助、デバッグ、テスト、UI文章、翻訳、文書、ピッチ・デモ準備の開発支援に使用しました。参加者本人が要件を定義し、設計とブロックチェーン操作を承認し、認証情報を保護し、実機テストと生成物の確認を行い、提出内容に責任を持ちます。OSS依存関係とバージョンは`package.json`に記載しています。**
