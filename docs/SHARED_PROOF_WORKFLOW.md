# Shared proof workflow / 共有案件の証明フロー

Status: implemented and tested locally on 2026-11-04. The public Supabase proof migration and the later client-archive migration are applied; the public workflow reports version 4. On 2026-11-05, a real two-wallet Portaldot V3 run completed order, delivery, 10 tPOTv3 native payment, final payment record, and QR public verification. The final proof transaction is `0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa`.

状態：2026年11月4日に実装し、ローカル・分離環境でテスト済みです。公開Supabaseには証明マイグレーションと発注者アーカイブ用マイグレーションを適用し、公開ワークフローはバージョン4です。2026年11月5日、2つの実ウォレットで発注、納品、10 tPOTv3ネイティブ支払い、最終支払い記録、QR公開検証まで完了しました。最終証明Txは`0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa`です。

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

## V1 boundary and tested V2 / V1の境界とテスト済みV2

The deployed V1 contract uses the terms hash itself as the proof ID and acts as an append-only event log. The authenticated DApp and database enforce participant roles, stage order, versions, duplicate guards, and exact-payment matching before recording. `PortalProofOrderV2.sol` separates the order ID and terms hash and adds contract-level authorization, state, nonce uniqueness, and payment-hash replay prevention. V2 passes local EVM tests but is not deployed or used by the public DApp.

デプロイ済みV1は条件ハッシュ自体を証明IDとして使う追記専用イベントログです。当事者権限、段階順序、バージョン、重複防止、正確な支払い一致は、記録前に認証済みDAppとDBが強制します。`PortalProofOrderV2.sol`では注文IDと条件ハッシュを分離し、コントラクト側の権限・状態・nonce一意性・支払いハッシュ再利用防止を追加しています。V2はローカルEVMテストに合格していますが、未デプロイで公開DAppには使用していません。
