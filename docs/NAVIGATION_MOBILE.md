# Navigation and mobile wallet rollout / 導線・スマホ接続（2026-11-03）

2026-11-04 addendum: public login is wallet-only; email forms and existing-account explanations are removed without deleting Auth users or records. The temporary operator SQL-copy page was removed after the user applied the migration; its former `?setup=job-stages` link now returns to the shared home. The canonical migration remains in the repository, not in the app bundle. The application rechecks capabilities on focus and every 15 seconds. Network failures are reported separately from a missing migration. Server configuration verification does not replace an authenticated archive/restore check.

2026-11-04追記：公開ログインをウォレットのみに整理。追加SQL適用後、ユーザーの指示で一時的な設定ページを削除しました。以前の `?setup=job-stages` は通常ホームへ戻ります。設定SQLは開発記録として保存し、アプリには取り込みません。タブ復帰時と15秒ごとにサーバー設定を再確認します。反映確認と本人によるアーカイブ・復元の動作確認は別の検証です。

## Scope / 今回の変更

- `/PortalProof/`, `?view=shared`, and installed-home-screen launches enter the same Supabase-backed workspace. Old setup/jobs aliases map to its creation/job pages.
- ルートURL・共有画面URL・ホーム画面起動先を共有ワークスペースへ統一。以前の設定・一覧URLも現在の対応画面へ誘導します。
- Creator tabs, job stages and job details use pushed history entries; `popstate` restores the visible route on browser Back/Forward. Language changes replace rather than add history entries.
- メニュー・案件段階・詳細は履歴を追加し、「戻る・進む」で画面も追従。言語変更だけでは履歴を増やしません。
- Guides default to the shared flow and have a same-origin, same-path validated return link. Client detail pages have an explicit My commissions link.
- ガイドは現在の共有フローが標準。戻り先を検証し、依頼詳細にも一覧への導線を設けました。
- Historical `mode=request/job` links display a compatibility notice, not a different app silently. Existing local records remain untouched. An explicit `workspace=local` recovery route retains the original app; it is not linked from normal shared navigation. Deployment and old payment-report links remain explicit special-purpose routes.
- 以前の端末保存リンクは確認画面で区別します。データを削除・自動移行せず、明示的な保存済みデータ確認経路に元の機能を保持します。通常導線からは遷移しません。

## Mobile wallet / スマホ接続

- Preserve injected EIP-1193 wallets on desktop and in wallet browsers. Without an injected provider, lazily load pinned `@metamask/connect-evm@2.1.1`, then use its relay/deeplink provider with existing Supabase SIWE authentication.
- PC拡張機能・ウォレット内ブラウザの接続は維持。Safari・Chrome等で接続先がなければMetaMask公式接続機能を遅延読み込みし、アプリ接続後も同じ署名認証を使用します。
- No WalletConnect project, Infura key, or secret is configured. Supply the already configured Portaldot RPC as a custom supported network; never switch chain or send a transaction as part of login.
- ログイン処理は接続・認証署名のみ。送金、チェーン切り替え、秘密鍵の取得は行いません。既存のPortaldot RPCを設定しています。
- Strip query tokens and hashes from SDK metadata; disable optional analytics and provider auto-announcement. Supabase URI allowlisting remains enforced; no domain-check bypass.
- 接続情報には依頼用トークンを含めず、任意の分析送信を無効化。SupabaseのURL検証は維持します。
- The MetaMask app must be installed. This is not a claim that every mobile wallet is supported. Desktop extension behavior is unchanged. Normal Safari/Chrome remain the app's browser; the wallet app approves connection/signatures.
- MetaMaskアプリが必要です。全ウォレット対応という意味ではありません。Safari・Chrome側に戻って利用します。

Official implementation references:
- https://docs.metamask.io/metamask-connect/evm/reference/methods/
- https://docs.metamask.io/metamask-connect/evm/quickstart/javascript/
- https://supabase.com/docs/guides/auth/auth-web3

## Verification / 検証

- `npm test`, production build, and navigation/provider unit tests pass. Unit tests mock the connection SDK; they do not verify native app handoff.
- The actual pinned MetaMask SDK also initializes successfully in a JSDOM-backed environment with the custom RPC and no API key, returning an EIP-1193 provider. No native connection, signature or transaction was requested by that probe.
- `test/ui-navigation.mjs` passes with JSDOM and mocked backend responses: canonical entry, creator home → jobs → details → browser Back/Forward, stage history, guide return, client list/detail, old aliases, saved-data isolation and preservation.
- Optional DOM check: `JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node test/ui-navigation.mjs` (esbuild is already available via Vite).
- `test/browser-navigation.mjs` provides real-browser checks with mocked auth/backend. `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/browser-navigation.mjs`; set `CHROME_PATH`, `PLAYWRIGHT_BROWSERS_PATH`, `PREVIEW_URL`, or `BROWSER_ENGINE` as needed.
- Automated Chromium and WebKit launch attempts abort under this host's restrictions. Those browser tests have NOT passed. No physical iPhone/Android or native MetaMask handoff has been performed by the agent.
- 自動Chrome/WebKit起動は実行環境の制限で失敗しています。DOMテスト成功を実機のSafari・Chrome検証済みとは扱いません。
- Release verification still requires **Safari and Chrome separately**: open public root → connect MetaMask → approve sign-in → return to original browser → create/view offering → reload → open client link with a separate wallet → verify Back/Forward and guide return. Never transfer funds for this test.

## Receiving-wallet consistency

- Offering creation no longer asks the creator to type a receiving wallet. The verified wallet from Web3 sign-in is displayed read-only and stored automatically.
- When a creator opens the shared creator workspace, offerings owned by that account with a blank or stale `creatorWallet` are updated to the same verified wallet. Other profile fields and existing requests are preserved.
- This keeps the server-side rule that a request can only be accepted for an offering whose receiving wallet belongs to the authenticated creator, while removing the error-prone duplicate manual entry.
- An already-open creator tab must be refreshed once after this release before retrying a request against an older offering.
- 公開後にSafariとChromeの両方で、MetaMask接続・署名・ブラウザ復帰・募集確認・再読み込み・別ウォレットの依頼確認を検証してください。送金は不要です。
- SDK adds a moderate upstream `uuid` bounds-check advisory through MetaMask utilities; no patched compatible release is offered by the audit. Do not force-upgrade transitive packages across major versions. Existing Ganache development-tree advisories remain separate. No new critical/high advisory is attributed to the added SDK in the audit performed for this rollout.

## Proof-workflow follow-up / 証明フローの後続対応

The signed shared workflow now has order proof, delivery URL/hash, independently checked native-payment evidence, a final on-chain payment record, and a QR certificate in code. `20261104_shared_proof_workflow.sql` must be applied to the public Supabase project, followed by a fresh two-wallet testnet run, before this release is described as end-to-end verified. It reuses the existing deployed event-log contract and does not deploy a replacement contract or migrate/delete historical local records.

署名付き共有フローに、発注証明、納品URL・ハッシュ、送金元・送金先・金額・成功状態を独立確認する支払い証跡、最終オンチェーン記録、QR証明書をコード上で接続しました。公開Supabaseへ `20261104_shared_proof_workflow.sql` を適用し、2つの実ウォレットでテストネット完走するまでは、一連の動作確認済みとは表現しません。既存のイベントログ用コントラクトを再利用し、置換デプロイや端末保存データの削除・移行は行いません。
