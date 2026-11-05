# PortalProof Final Submission Checklist / 最終提出チェックリスト

Deadline / 締切: **2026-11-06 13:00 JST**

Verified / 確認日: **2026-11-05 JST**

## Ready / 完了

- [x] **Pre-deadline check-in passed. Review confirmed byte-identical contract recompilation, verified video ownership, accurate append-only design disclosure, honest escrow roadmap positioning, and passing tests.**
  日本語訳: 締切前チェックイン通過。コントラクトのバイト単位再現、動画所有確認、追記専用設計の正確な説明、エスクローをロードマップとして扱う誠実な記載、テスト合格を確認済み。
- [x] **Project name and solo-builder identity are prepared.**
  日本語訳: プロジェクト名と個人開発者情報を準備済み。
- [x] **Public GitHub repository is accessible.**
  日本語訳: 公開GitHubリポジトリへアクセス可能。
- [x] **More than three valid commits exist during the event period, with preserved history.**
  日本語訳: 期間中の有効コミットが3件以上あり、履歴を保持。
- [x] **GitHub Pages deployment for commit `ca55c52` completed successfully.**
  日本語訳: コミット`ca55c52`のGitHub Pagesデプロイ成功を確認。
- [x] **Live DApp returns HTTP 200.**
  日本語訳: 公開DAppがHTTP 200で応答。
- [x] **README contains setup, build, deployment, architecture, testnet, AI-use, and limitation disclosures.**
  日本語訳: READMEに起動・ビルド・デプロイ・構成・テストネット・AI利用・制限事項を記載。
- [x] **Automated unit/integration tests pass.**
  日本語訳: 自動ユニット／統合テスト合格。
- [x] **Production build passes.**
  日本語訳: 本番ビルド成功。
- [x] **Isolated PostgreSQL-compatible authorization/state/archive/proof test passes.**
  日本語訳: 分離PostgreSQL互換環境の権限・状態・アーカイブ・証明テスト合格。
- [x] **The current shared two-wallet proof chain was re-read from Portaldot V3 and verified.**
  日本語訳: 現在の2ウォレット共有証明をPortaldot V3から再取得して検証済み。
- [x] **Contract address, deployment transaction, current order/delivery/payment/final-proof transactions are documented.**
  日本語訳: コントラクト、デプロイ、現行発注・納品・支払い・最終証明Txを文書化。
- [x] **English nine-page pitch PDF exists and covers problem, Portaldot necessity, product proof, and continued-support value.**
  日本語訳: 課題、Portaldotの必然性、製品証拠、継続支援価値を含む英語9ページPDFを作成済み。
- [x] **DoraHacks final submission copy is prepared in English with Japanese translations.**
  日本語訳: DoraHacks最終提出文を英語・日本語訳付きで準備済み。
- [x] **The corrected English demo video is uploaded to YouTube and externally playable in approximately 2:05.**
  日本語訳: 修正版の英語デモ動画をYouTubeへアップロードし、外部から約2分05秒で再生できることを確認済み。
- [x] **The new video URL is inserted into README and the DoraHacks submission copy.**
  日本語訳: 新しい動画URLをREADMEとDoraHacks提出文案へ反映済み。

## Must be completed manually before submission / 提出前に手動で必ず行うこと

- [ ] **Confirm the final team-member display name on DoraHacks.**
  日本語訳: DoraHacksで表示するチームメンバー名を最終確認。
- [ ] **Compare the authenticated DoraHacks form with `DORAHACKS_SUBMISSION_DRAFT.md`; its current private contents could not be read from the public web.**
  日本語訳: 認証済みDoraHacks画面を提出文案と比較。現在の非公開入力内容は公開Webから取得できないため手動確認が必要。
- [ ] **Submit on DoraHacks before 13:00 JST and save a screenshot/confirmation URL.**
  日本語訳: 13:00 JSTより前にDoraHacksで提出し、完了画面または確認URLを保存。

## Engineering finding that must not be overstated / 過大表現してはいけない技術事項

- [x] **The authenticated DApp/database enforce participant roles, state transitions, versions, duplicate guards, and exact native-payment matching.**
  日本語訳: 認証済みDApp／DBで当事者権限、状態遷移、バージョン、重複防止、正確な支払い一致を強制。
- [x] **`PortalProofOrderV2.sol` locally passes authorization, ordering, uniqueness, and replay-protection tests.**
  日本語訳: `PortalProofOrderV2.sol`は権限・順序・一意性・再利用防止のローカルテスト合格。
- [ ] **V2 is not deployed and must not be described as live. The deployed V1 uses `proofId == termsHash` and does not itself store the full state/authorization/replay rules.**
  日本語訳: V2は未デプロイで、稼働中と記載してはいけない。デプロイ済みV1は`proofId == termsHash`で、完全な状態・権限・再利用防止をコントラクト単体では保持しない。

## Approval gates / 実行前確認が必要な操作

- [ ] **Git commit and push: wait for user approval after reviewing the prepared diff.**
  日本語訳: Gitコミット・pushは、準備した差分を確認後、利用者の承認を待つ。
- [ ] **GitHub Pages deployment: occurs after approved push; do not trigger before approval.**
  日本語訳: GitHub Pagesデプロイは承認済みpush後に実行。承認前に開始しない。
- [ ] **Contract deployment: do not deploy V2 before the deadline without a separate explicit decision.**
  日本語訳: 締切前のV2デプロイは、別途明示判断なしに行わない。
- [ ] **DoraHacks final submission: user performs or explicitly approves the final external submission.**
  日本語訳: DoraHacks最終提出は利用者本人が実行するか、外部提出の明示承認を得る。
