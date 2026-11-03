# Shared proof workflow / 共有案件の証明フロー

Status: implemented and tested locally on 2026-11-04. The public Supabase migration `20261104_shared_proof_workflow.sql` was applied and its workflow-version-3 RPC was confirmed on 2026-11-04. A real two-wallet Portaldot V3 end-to-end run is still required; local and isolated tests do not create testnet evidence.

状態：2026年11月4日に実装し、ローカル・分離環境でテスト済みです。同日、公開Supabaseへ`20261104_shared_proof_workflow.sql`を適用し、RPCがワークフローバージョン3を返すことを確認しました。ローカルテストはテストネット証跡を作らないため、2つの実ウォレットを使ったPortaldot V3での一連の確認は別途必要です。

## Sequence / 手順

1. After both participants agree, the creator records the unique request/terms hash through the deployed `PortalProofOrder` contract.
2. The creator submits a delivery URL. The shared database stores the URL for the participants, while Portaldot V3 stores its hash and transaction evidence.
3. After reviewing delivery, the client transfers the exact agreed native tPOTv3 amount directly to the creator and reports the payment transaction hash.
4. PortalProof independently reads the Portaldot V3 transaction and receipt. It requires the client sender, creator recipient, exact amount, and successful receipt to match.
5. Only then can the creator record the verified payment reference on-chain.
6. Both participants can view a QR certificate containing the order, delivery, payment, and proof references. The QR opens the final Portaldot V3 proof transaction.

1. 双方の条件合意後、クリエイターが案件IDを含む固有の条件ハッシュを、デプロイ済み`PortalProofOrder`コントラクトへ記録します。
2. クリエイターが納品URLを送信します。参加者向けには共有DBへURLを保存し、Portaldot V3にはURLのハッシュとトランザクション証跡を記録します。
3. 依頼者は納品確認後、合意したネイティブtPOTv3をクリエイターへ直接送金し、支払いトランザクションハッシュを報告します。
4. PortalProofがPortaldot V3の取引とレシートを独立して取得し、送金元が依頼者、送金先がクリエイター、金額が合意額、取引が成功済みであることを確認します。
5. 全項目が一致した場合だけ、クリエイターが検証済み支払い参照をオンチェーンへ記録できます。
6. 双方が、発注・納品・支払い・記録トランザクションをまとめたQR証明書を確認できます。QRはPortaldot V3の最終証明取引を開きます。

## Authorization / 権限

- Order, delivery, and final payment-proof records require the authenticated creator wallet.
- Payment reporting requires the authenticated client wallet.
- The database uses optimistic versions and append-only history for every proof action.
- An arbitrary payment hash is never treated as completed payment.
- The deployed contract is an append-only event log. The public app therefore checks the signer, participants, hashes, transaction sequence stored in the authorized workflow, and native payment receipt before showing the certificate.

## QR certificate versus SBT / QR証明書とSBTの違い

The current and historical PortalProof certificate is a QR-based evidence view. It is not an ERC-721/1155 soulbound token and does not mint a token into a wallet. A true SBT would require a separately reviewed contract and an explicit replacement deployment; the UI must not call the current certificate an SBT.

現在および過去のPortalProof証明書は、QRコード付きの証跡表示です。ERC-721/1155形式の譲渡不能トークンをウォレットへミントするものではありません。実SBT化には、別途レビューしたコントラクトと明示的な追加デプロイが必要です。現在の証明書をSBTと表現してはいけません。
