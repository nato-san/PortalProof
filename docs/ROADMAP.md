# Roadmap / 開発ロードマップ

## Active Work / 現在の作業

- [x] Confirm the hackathon test-token distribution and fund the mapped EVM account.
- 日本語訳: ハッカソン用テストトークンの配布を確認し、対応するEVM口座へ入金する。

- [x] Add a visible local-demo / Portaldot V3 execution-mode switch.
- 日本語訳: ローカル実演／Portaldot V3の実行モード切り替えを追加する。

- [x] Publish the local-demo build with GitHub Pages.
- 日本語訳: ローカル実演版をGitHub Pagesで公開する。
- Live demo: https://nato-san.github.io/PortalProof/
- 日本語訳: 公開デモ: https://nato-san.github.io/PortalProof/

- [x] Deploy the shared `PortalProofOrder` contract to Portaldot V3 testnet.
- 日本語訳: 共有の`PortalProofOrder`コントラクトをPortaldot V3テストネットへデプロイする。

- [x] Run one end-to-end order, delivery, verified native-payment evidence, and certificate flow on the testnet.
- 日本語訳: テストネットで発注・納品・支払い証跡・証明書までを一通り実行する。

- [x] Prevent duplicate proof transactions and reject arbitrary payment transaction hashes.
- 日本語訳: 証明トランザクションの重複を防ぎ、任意の支払いTxHashを受け付けないようにする。

- [ ] Update the check-in material with the completed testnet evidence.
- 日本語訳: 完了したテストネット証跡を中間報告資料へ反映する。

- [ ] Record a short demo video under 3 minutes.
- 日本語訳: 3分以内の短いデモ動画を録画する。

## Completed Testnet Evidence / 完了したテストネット証跡

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

## Check-in Target / 中間提出目標

- [x] Deploy `PortalProofOrder` to Portaldot V3 testnet.
- 日本語訳: `PortalProofOrder`をPortaldot V3テストネットへデプロイする。

- [x] Create one real `OrderCreated` transaction.
- 日本語訳: 実際の`OrderCreated`トランザクションを1つ作る。

- [x] Record one real `DeliverySubmitted` transaction.
- 日本語訳: 実際の`DeliverySubmitted`トランザクションを1つ記録する。

- [x] Verify a native payment and record one real `PaymentRecorded` transaction.
- 日本語訳: ネイティブ支払いを検証し、実際の`PaymentRecorded`トランザクションを1つ記録する。

- [x] Generate a certificate that references the completed on-chain flow.
- 日本語訳: 完了したオンチェーンフローを参照する証明書を生成する。

- [x] Publish the repository and README.
- 日本語訳: リポジトリとREADMEを公開する。

- [ ] Record a short demo video under 3 minutes.
- 日本語訳: 3分以内の短いデモ動画を録画する。

## Final Target / 最終提出目標

- [x] Use real Portaldot V3 transaction evidence in the certificate.
- 日本語訳: 証明書に実際のPortaldot V3トランザクション証跡を使う。

- [x] Verify the payment sender, recipient, amount, and receipt status before recording it.
- 日本語訳: 支払いを記録する前に、送金元、送金先、金額、成功状態を検証する。

- [ ] Improve reviewer instructions and prepare the final submission narrative.
- 日本語訳: 審査員向け手順を改善し、最終提出文を準備する。

- [x] Publish a live DApp link.
- 日本語訳: 公開DAppリンクを用意する。

- Add a small pitch deck.
- 日本語訳: 簡単なピッチ資料を追加する。

## Deferred / 後回し

- Escrow deposit and release after client approval
- 日本語訳: デポジット型エスクローと依頼者承認後の支払い

- Protected delivery using encrypted or signed, time-limited links
- 日本語訳: 暗号化または署名付き・期限付きURLによる納品物保護

- Creator dashboard for income totals and payment history
- 日本語訳: 売上合計と入金履歴を確認できるクリエイターダッシュボード

- Completed-job archive and status filters
- 日本語訳: 完了案件のアーカイブと状態別フィルター

- Closed chat
- 日本語訳: クローズドチャット

- Creator search
- 日本語訳: クリエイター検索

- Rich profile pages
- 日本語訳: 詳細プロフィール

- Fully automated payment verification
- 日本語訳: 完全自動の支払い検証
