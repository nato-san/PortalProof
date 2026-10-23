# Local payment-report prototype

Run `npm run build` followed by `npm run preview -- --port 4175 --configLoader runner`.
Open `http://127.0.0.1:4175/?view=jobs`.

After issuing an order proof, open its creator workspace and create a client payment-report link. Open that link in another browser profile to simulate a client. Submit the native Portaldot V3 payment transaction hash. The local relay checks sender, recipient, agreed amount and successful receipt against the RPC before accepting it. The creator workspace checks every five seconds while open and fills in the payment hash. The creator still verifies and approves the existing on-chain payment-record operation. The certificate is enabled only after that operation finishes.

The relay stores order snapshots and reports under ignored `cache/payment-reports/`. Client links contain a random access token. Creator retrieval uses a separate random token stored in the creator browser. Treat the links as private; anyone with the client link can view payment details and submit a matching payment. This prototype is not a production authentication system.

The server runs on this Mac. `127.0.0.1` links work only on this Mac. They can demonstrate separate browser storage but not remote client delivery. GitHub Pages cannot run the relay. Public release needs separately hosted storage/API, authenticated order ownership, link lifecycle controls, rate limits and cross-order transaction-reuse rules. Request intake is still browser-local; this change only relays payment reports for an existing order.

日本語：発注証明発行後、クリエイターの案件画面で支払い報告リンクを作成します。依頼者は専用ページへTxHashを入力します。サーバーが支払いを検証し、開いている管理画面が5秒ごとに受信して入力欄へ反映します。既存の支払い証明記録とウォレット承認は引き続き必要です。

別のブラウザプロフィールで依頼者とクリエイターを分けて確認できますが、別端末から利用する公開基盤はまだありません。受付自体も現時点ではブラウザ内保存です。プッシュ・公開・コントラクト再デプロイは行っていません。
