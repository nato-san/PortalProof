# PortalProof Final Submission Audit / 最終提出監査

Audit date / 監査日: **2026-11-05 JST**
Deadline / 締切: **2026-11-06 13:00 JST**

Pre-deadline check-in / 締切前チェックイン: **PASSED / 通過**

## 1. Executive result / 結論

PortalProof has a public repository, a working GitHub Pages DApp, a deployed Portaldot V3 V1 proof contract, a verified current two-wallet proof chain, passing automated tests/build, a final English pitch PDF, and ready-to-paste DoraHacks copy.

日本語訳: PortalProofには、公開リポジトリ、稼働中のGitHub Pages DApp、Portaldot V3へデプロイ済みのV1証明コントラクト、検証済みの現行2ウォレット証明チェーン、合格済みテスト／ビルド、最終英語ピッチPDF、貼り付け可能なDoraHacks文案があります。

The pre-deadline review confirmed that the contract artifacts recompile byte-identically against the deployed chain, video ownership is verified, escrow is presented honestly as roadmap work, the append-only three-event design matches its description, and the tests pass. Mentor feedback described the project as technically viable and identified per-transaction commission as a clear business-model path.

日本語訳: 締切前レビューでは、コントラクト成果物がデプロイ済みチェーンとバイト単位で一致して再コンパイルできること、動画の所有確認、エスクローをロードマップとして正直に記載していること、追記専用3イベント設計と説明の一致、テスト合格が確認されました。メンターからは技術的に実現可能であり、取引ごとの手数料が明確なビジネスモデル候補になるとの評価を受けました。

The shortest safe route is to avoid a contract migration before the deadline. The corrected video is now uploaded and linked. The remaining route is to approve the prepared documentation/PDF push, verify GitHub Pages, and submit the prepared DoraHacks copy.

日本語訳: 最短で安全なルートは、締切前のコントラクト移行を避けることです。修正版動画のアップロードとURL反映は完了しました。残る作業は、準備済み文書・PDFのpushを承認し、GitHub Pagesを確認して、準備済みDoraHacks文案を提出することです。

## 2. Implementation audit / 実装監査

| Requirement / 確認項目 | Result / 結果 | Evidence and boundary / 証拠と境界 |
| --- | --- | --- |
| Order ID and `termsHash` separation / 注文IDと条件ハッシュ分離 | **Not live / 公開版は未対応** | Deployed V1 uses `proofId == termsHash`. V2 separates them and passes local EVM tests, but is not deployed. / デプロイ済みV1は同一。V2は分離・テスト済みだが未デプロイ。 |
| Participant authorization / 当事者権限 | **Partial, enforced workflow / ワークフローで実装** | Supabase RPC, wallet identity and DApp enforce creator/client roles. V1 later-event functions do not store actor authorization. V2 adds contract-level creator checks. / DB・DAppで強制。V1コントラクト単体の後続イベント権限は不足。V2で追加済み。 |
| State transitions / 状態遷移 | **Implemented in shared workflow / 共有フローで実装** | Negotiating, approved, agreed, cancelled, delivered and paid transitions are server controlled and versioned. V2 also enforces Recorded→Delivered→Completed locally. / サーバー制御・バージョン管理。V2でもローカル検証。 |
| Duplicate/replay prevention / 重複・再利用防止 | **Implemented in workflow; V2 tested / ワークフロー実装・V2テスト済み** | DB action journal and version conflicts reject repeats; DApp finds existing chain events. V2 adds nonce and payment-hash replay guards. V1 alone does not. / DB履歴・競合・既存イベント検索で拒否。V2はnonce・支払いハッシュ再利用防止。V1単体には不足。 |
| Third-party verification / 第三者検証 | **Working with V1 disclosure / V1境界明示で動作** | Public QR page re-reads contract events and payment receipt without login. V1 does not encode the off-chain agreed amount, so the page cannot reconstruct that agreement from chain data alone. / ログイン不要でイベント・支払いを再取得。V1チェーン情報だけではオフチェーン合意額を再構成不可。 |
| Reproducibility / 再現テスト | **Pass / 合格** | Unit/integration tests, V2 local EVM tests, isolated PostgreSQL-compatible authorization test, production build, and live RPC proof re-read all pass. / 自動テスト、V2 EVM、分離DB権限テスト、本番ビルド、公開RPC再検証が合格。 |

## 3. Verified live evidence / 検証済み公開証跡

- Contract / コントラクト: `0xBaE8933886e1520e5FCa3eDed119c08b29022D79`
- Deployment / デプロイ: `0x29b2c7b2b91bf6cc6804040fb0590c020a3b0a4bdae1f81864f1f9f227035365`
- Current order / 現行発注記録: `0x228e78e4878540a08c9234d0565351423cddac4233780275814cca06cbcdc775`
- Current delivery / 現行納品記録: `0xf440c8d852e6bc9e069d96ebabc076c8611f1c5bded46ff0f4c1d56c636cb8b0`
- Current payment, 10 tPOTv3 / 現行支払い: `0xdcd5fe65db4b0d037c0c9d7e39ac18a3509a4b0f284c4e231535565e726190b5`
- Final proof / 最終証明: `0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa`
- Public page / 公開ページ: https://nato-san.github.io/PortalProof/?proofTx=0xea5f29c9f221539c811176990658885b293d572ae682f768cd746e0a1e5707fa&lang=en

The RPC re-check confirmed the proof contract, successful final receipt, order/delivery/payment events, creator submission, referenced payment receipt, client sender, contractor recipient, and 10 tPOTv3 transferred value.

日本語訳: RPC再確認により、証明コントラクト、最終取引成功、発注・納品・支払いイベント、受注者による記録、参照支払いの成功、発注者の送金元、受注者の送金先、10 tPOTv3の送金額を確認しました。

## 4. Test results / テスト結果

- `npm test`: **PASS / 合格**
- `node test/workflow-db.test.mjs`: **PASS / 合格**
- `npm run build`: **PASS / 合格**
- `git diff --check`: **PASS / 合格**
- GitHub Pages action at `ca55c52`: **PASS / 合格**
- Live DApp HTTP response: **200 / 正常**
- Final pitch PDF: **9 pages / 9ページ**
- Corrected demo video: **externally playable on YouTube in approximately 2:05 / YouTubeで外部再生可能・約2分05秒**
- Demo slide package and layout validation: **PASS / 合格**

The production build reports a bundle-size warning (approximately 620 kB before gzip), not a build failure. Dependency audit output is dominated by the Ganache test toolchain; the runtime MetaMask tree also includes an advisory for a transitive `uuid` version with no available fix. A forced dependency upgrade immediately before submission is higher risk than documenting and addressing it after the deadline.

日本語訳: 本番ビルドにはgzip前約620 kBのサイズ警告がありますが、ビルド失敗ではありません。依存関係監査の大部分はテスト用Ganache由来で、実行時MetaMask依存にも修正版のない間接`uuid`警告があります。締切直前の強制アップグレードは危険なため、記録して締切後に対応します。

## 5. Completed submission materials / 完成した提出資料

- `README.md`: current workflow, setup, deployment, evidence, AI disclosure and V1/V2 boundary / 現行仕様・起動・デプロイ・証跡・AI開示・V1/V2境界
- `docs/DORAHACKS_SUBMISSION_DRAFT.md`: final English copy with Japanese translations / 英語最終文案と日本語訳
- `docs/SUBMISSION_CHECKLIST.md`: accurate completion and manual-action checklist / 正確な完了・手動作業一覧
- `public/PortalProof-Pitch-Deck.pdf`: replaced locally with the final nine-page English deck / 最終9ページ英語版へローカル差し替え済み
- YouTube demo: https://www.youtube.com/watch?v=QlODCrM-_1M (`PortalProof DEMO`, under three minutes) / YouTube公開済みデモ（3分未満）
- `PortalProof-3min-demo-English-fixed.mp4`: corrected local source video / 修正版ローカル元動画
- `PortalProof-3min-demo-FINAL.pptx`: corrected editable video slide source / 修正済み動画スライド元データ

## 6. Video versus implementation / 動画と実装の整合性

The previous narration and slide said that “the contract” rejects duplicates and out-of-order actions. That was not accurate for deployed V1. The corrected video says the authenticated/signed workflow blocks invalid actors, duplicates and out-of-order records before recording. “Provider” was also changed to the formal product term “Contractor.”

日本語訳: 以前の音声・スライドには「コントラクトが重複・順序違反を拒否する」とあり、デプロイ済みV1には正確ではありませんでした。修正版では、認証済み／署名付きワークフローが、不正な当事者、重複、順序違反を記録前に拒否すると説明しています。Providerも正式な役割名Contractorへ変更しました。

## 7. Remaining blockers / 残るブロッカー

1. Authenticated DoraHacks form contents cannot be inspected from the public web; manually compare them with the prepared draft. / 認証済みDoraHacks入力内容は公開Webから確認できないため手動比較が必要。
2. Prepared repository changes are not committed or pushed because approval is required. / 承認待ちのため準備済み差分は未コミット・未push。
3. GitHub Pages must be re-verified after the approved push. / 承認済みpush後にGitHub Pagesの再確認が必要。
4. DoraHacks is not submitted by this audit. / この監査ではDoraHacks提出を実行していない。

## 8. Manual actions in order / 手動作業の順序

1. Review the prepared Git diff, then explicitly approve commit and push.
   日本語訳: 準備済みGit差分を確認し、コミット・pushを明示承認。
2. After the GitHub Pages action succeeds, open the DApp, public proof page, hosted pitch PDF, and YouTube demo in a private browser.
   日本語訳: GitHub Pages成功後、DApp、公開証明、公開ピッチPDFをプライベートブラウザで確認。
3. Paste `DORAHACKS_SUBMISSION_DRAFT.md` into the authenticated DoraHacks form, confirm team name and links, then submit before 13:00 JST.
   日本語訳: 提出文案を認証済みDoraHacksへ貼り付け、チーム名・リンクを確認し、13:00 JST前に提出。
4. Save the submission confirmation screen and URL.
   日本語訳: 提出完了画面とURLを保存。

## 9. Actions deliberately not performed / 意図的に実行していない操作

- No V2 contract deployment / V2コントラクト未デプロイ
- No Git commit or push / Gitコミット・push未実行
- No GitHub Pages redeployment / GitHub Pages再デプロイ未実行
- No DoraHacks final submission / DoraHacks最終提出未実行
- No secret/private-key handling / 秘密鍵・秘密情報を未使用
