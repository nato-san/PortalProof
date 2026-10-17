# Technical Notes / 技術メモ

## Portaldot V3 References / Portaldot V3参照情報

The official Portaldot V3 guide lists:

日本語訳: 公式Portaldot V3ガイドには以下が記載されています。

- Native RPC: `wss://test-node-v3.portaldot.dev`
- 日本語訳: ネイティブRPC: `wss://test-node-v3.portaldot.dev`
- EVM RPC: `https://test-evm-rpc-v3.portaldot.dev`
- 日本語訳: EVM RPC: `https://test-evm-rpc-v3.portaldot.dev`
- Node Explorer: `https://node-console.portaldot.dev/`
- 日本語訳: ノードエクスプローラー: `https://node-console.portaldot.dev/`
- Chain ID: `420420777`
- Token: `tPOTv3`
- Solidity contracts can be deployed using regular EVM tooling.
- 日本語訳: Solidityコントラクトは通常のEVMツールでデプロイできます。

## Contract Design / コントラクト設計

`PortalProofOrder` is intentionally minimal. It behaves like a small order-proof NFT:

日本語訳: `PortalProofOrder`は意図的に最小構成です。小さな発注証明NFTのように動作します。

- `createOrder`: records client, creator, amount, and terms hash.
- 日本語訳: 依頼者、クリエイター、金額、条件Hashを記録します。

- `markDelivered`: records delivery hash and certificate URI.
- 日本語訳: 納品Hashと証明書URIを記録します。

- `recordVerifiedPayment`: records payment TxHash after verification.
- 日本語訳: 検証後の支払いTxHashを記録します。

## Payment Safety / 支払い安全性

The contract stores payment evidence, but the app and reviewer must verify the referenced transaction.

日本語訳: コントラクトは支払い証跡を保存しますが、参照されたトランザクションの検証はアプリとレビュー担当者が行う必要があります。

Minimum checks:

日本語訳: 最低限の確認:

- Sender is the client wallet / 送金元が依頼者ウォレット
- Recipient is the creator wallet / 送金先がクリエイターウォレット
- Amount matches agreed amount / 金額が合意額と一致
- Transaction succeeded / トランザクションが成功
- Order terms hash matches / 発注条件Hashが一致
