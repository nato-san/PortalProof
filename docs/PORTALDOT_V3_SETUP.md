# Portaldot V3 Setup / Portaldot V3設定

## MetaMask Network / MetaMaskネットワーク

Add a custom network:

日本語訳: カスタムネットワークを追加します。

| Field | Value |
| --- | --- |
| Network name | PortaldotV3 Testnet |
| RPC URL | https://testnetv3-eth-rpc.feso-apps.xyz |
| Chain ID | 420420777 |
| Currency symbol | tPOTv3 |
| Block explorer URL | Leave empty |

日本語訳:

| 項目 | 値 |
| --- | --- |
| ネットワーク名 | PortaldotV3 Testnet |
| RPC URL | https://testnetv3-eth-rpc.feso-apps.xyz |
| Chain ID | 420420777 |
| 通貨シンボル | tPOTv3 |
| ブロックエクスプローラーURL | 空欄 |

## Funding the Deployer / デプロイ用アカウントへの送金

The official guide notes that the EVM H160 address must be mapped to a Substrate-side account before funding gas.

日本語訳: 公式ガイドでは、ガス代を送る前にEVMのH160アドレスをSubstrate側アカウントに変換する必要があると説明されています。

Steps:

日本語訳: 手順:

1. Open MetaMask and copy the EVM deployer address.
2. 日本語訳: MetaMaskを開き、EVMデプロイ用アドレスをコピーします。

3. Open the Portaldot Node Explorer.
4. 日本語訳: Portaldot Node Explorerを開きます。

5. Go to `Developer -> Runtime calls -> reviveApi -> accountId`.
6. 日本語訳: `Developer -> Runtime calls -> reviveApi -> accountId`へ進みます。

7. Convert the EVM address to the mapped SS58 address.
8. 日本語訳: EVMアドレスを対応するSS58アドレスに変換します。

9. Send test `tPOTv3` to that mapped SS58 address.
10. 日本語訳: 変換後のSS58アドレスへテスト用`tPOTv3`を送ります。

## Deploy / デプロイ

```bash
cp .env.example .env
# Edit .env and set DEPLOYER_PRIVATE_KEY
npm run deploy:portaldot
```

日本語訳:

```bash
cp .env.example .env
# .envを編集してDEPLOYER_PRIVATE_KEYを設定
npm run deploy:portaldot
```

Never paste the private key into chat or commit it to GitHub.

日本語訳: 秘密鍵をチャットに貼ったり、GitHubにコミットしたりしないでください。
