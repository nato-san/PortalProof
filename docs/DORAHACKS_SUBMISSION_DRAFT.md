# DoraHacks Submission Draft / DoraHacks提出下書き

## Project Name / プロジェクト名

PortalProof

## One-sentence Overview / 1文概要

PortalProof records creator work agreements, delivery proof, and payment evidence on Portaldot V3 testnet.

日本語訳: PortalProofは、クリエイターの仕事合意、納品証明、支払い証跡をPortaldot V3テストネットに記録します。

## Track / トラック

Ecosystem DApps

日本語訳: エコシステムDApps

## Problem / 課題

Creators often receive work through social media or DMs, but agreed terms, delivery, and payment proof are scattered and hard to verify later.

日本語訳: クリエイターはSNSやDMで仕事を受けることが多いですが、合意条件、納品、支払い証明が散らばり、後から検証しにくいという課題があります。

## Solution / 解決策

PortalProof lets creators create a request flow, hash the agreed terms, record an order proof on Portaldot V3, and generate a certificate with delivery and payment evidence.

日本語訳: PortalProofは、クリエイターが依頼受付フローを作り、合意条件をHash化し、Portaldot V3上に発注証明を記録し、納品・支払い証跡つき証明書を生成できるようにします。

## Portaldot Usage / Portaldotの利用

- Solidity contract on Portaldot V3 EVM testnet
- 日本語訳: Portaldot V3 EVMテストネット上のSolidityコントラクト

- Order proof NFT-style records
- 日本語訳: NFT風の発注証明記録

- Transaction hashes as objective evidence
- 日本語訳: 客観証拠としてのTxHash

## Current Progress / 現在の進捗

- Public bilingual web DApp deployed with local-demo and Portaldot V3 modes
- 日本語訳: ローカル実演モードとPortaldot V3モードを備えた日英対応Web DAppを公開済み

- Shared `PortalProofOrder` Solidity contract deployed to Portaldot V3 testnet
- 日本語訳: 共有の`PortalProofOrder` SolidityコントラクトをPortaldot V3テストネットへデプロイ済み

- README, architecture diagram, setup docs, and demo script prepared
- 日本語訳: README、構成図、設定手順、デモ台本を準備済み

- Local tests and production build pass
- 日本語訳: ローカルテストと本番ビルドが通過済み

- One complete order, delivery, verified native-payment, and certificate flow completed on testnet
- 日本語訳: テストネット上で発注・納品・検証済みネイティブ支払い・証明書までの一連の動作を完了

- Payment evidence is accepted only after checking the sender, recipient, amount, and successful receipt status
- 日本語訳: 送金元、送金先、金額、成功状態を確認した場合だけ支払い証跡として記録

## Check-in Update / 中間報告文案

PortalProof has progressed from a local prototype to a working Portaldot V3 testnet DApp. The shared proof contract is deployed, and a complete creator commission flow has been executed: an order was recorded, a delivery URL hash was submitted, a real native tPOTv3 payment was verified, and the final certificate was generated from the resulting on-chain evidence. The public demo, repository, technical documentation, and transaction evidence are available for review.

日本語訳: PortalProofは、ローカル試作版から実際に動作するPortaldot V3テストネットDAppへ進みました。共有の証明コントラクトをデプロイし、発注記録、納品URLのハッシュ登録、実際のネイティブtPOTv3支払いの検証、オンチェーン証跡を参照する最終証明書の生成まで、クリエイター依頼の一連の流れを完了しています。公開デモ、GitHubリポジトリ、技術資料、各トランザクション証跡を確認できます。

## Testnet Evidence / テストネット証跡

- Contract: `0xBaE8933886e1520e5FCa3eDed119c08b29022D79`
- 日本語訳: コントラクト: `0xBaE8933886e1520e5FCa3eDed119c08b29022D79`

- Deployment: `0x29b2c7b2b91bf6cc6804040fb0590c020a3b0a4bdae1f81864f1f9f227035365`
- 日本語訳: デプロイ: `0x29b2c7b2b91bf6cc6804040fb0590c020a3b0a4bdae1f81864f1f9f227035365`

- OrderCreated: `0x2bcc608ac64194dbd08f8c0239bf12ce1ae4c7870f7ef9f59265a775bbb16815`
- 日本語訳: 発注記録: `0x2bcc608ac64194dbd08f8c0239bf12ce1ae4c7870f7ef9f59265a775bbb16815`

- DeliverySubmitted: `0x9f8e365d727c2c4cd5cbabd323f505313ea8d6fabcf25c1986d2acf801b76db9`
- 日本語訳: 納品記録: `0x9f8e365d727c2c4cd5cbabd323f505313ea8d6fabcf25c1986d2acf801b76db9`

- PaymentRecorded: `0x632700e4ca21e59e47b0f9fa60beefd460b1c176695ab33438548cdcc7d8a3a0`
- 日本語訳: 支払い記録: `0x632700e4ca21e59e47b0f9fa60beefd460b1c176695ab33438548cdcc7d8a3a0`

## Links / リンク

- Live demo: https://nato-san.github.io/PortalProof/
- 日本語訳: 公開デモ: https://nato-san.github.io/PortalProof/

- GitHub: https://github.com/nato-san/PortalProof
- 日本語訳: GitHub: https://github.com/nato-san/PortalProof

- Node Explorer: https://node-console.portaldot.dev/?rpc=wss%3A%2F%2Ftest-node-v3.portaldot.dev
- 日本語訳: ノードエクスプローラー: https://node-console.portaldot.dev/?rpc=wss%3A%2F%2Ftest-node-v3.portaldot.dev

## Findings and Next Steps / 操作テストで分かった課題と次の開発

The end-to-end test confirmed the technical flow, but also showed that direct wallet payment, manual transaction-hash handling, creator workload, income tracking, and completed-job organization need a simpler experience. The next major milestone is an escrow deposit flow that releases payment after client approval. Later milestones include protected delivery links, an income dashboard, and completed-job archives. These are intentionally deferred until after the check-in so the working MVP remains stable.

日本語訳: 一連の動作テストにより技術的な流れを確認できましたが、ウォレットからの直接支払い、TxHashの手作業、クリエイターの操作負担、収入管理、完了案件の整理には、より簡単な体験が必要だと分かりました。次の主要開発は、依頼者の承認後に支払われるデポジット型エスクローです。その後、保護された納品リンク、収入ダッシュボード、完了案件アーカイブを予定しています。動作済みMVPを安定させるため、これらは中間報告後に実装します。

## Outstanding Items / 残作業

- Record demo video under 3 minutes
- 日本語訳: 3分以内のデモ動画を録画

- Review the wording and submit the check-in report
- 日本語訳: 文面を最終確認して中間報告を提出
