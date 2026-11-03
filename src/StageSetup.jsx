import React, { useRef, useState } from "react";
import stageSql from "../supabase/migrations/20261103_job_stages_archives.sql?raw";
import { useWorkflowStatus } from "./useWorkflowStatus.js";

// Operator instructions only. This page cannot execute administrative SQL and
// never requests admin keys or credentials. No link from normal app navigation.
export default function StageSetup() {
  const { version, error, refresh } = useWorkflowStatus();
  const [message, setMessage] = useState("");
  const sqlField = useRef(null);
  const ja = new URL(location.href).searchParams.get("lang") !== "en";
  const t = (jaText, enText) => ja ? jaText : enText;
  const applied = version !== null && version >= 2;
  async function copy() {
    try { await navigator.clipboard.writeText(stageSql); setMessage(t("SQL全文をコピーしました。Supabaseの新しいクエリへ貼り付けてください。", "SQL copied. Paste it into a new Supabase query.")); }
    catch { sqlField.current?.focus(); sqlField.current?.select(); setMessage(t("SQL全文を選択しました。コピー操作を行ってください。", "SQL selected. Use your browser's Copy action.")); }
  }
  return <main className="shell clientRequestPage">
    <nav className="topBar"><a className="brand" href={`${location.pathname}?view=shared&lang=${ja ? "ja" : "en"}`}>PortalProof</a></nav>
    <header className="hero compactHero"><h1>{t("運営者向け：段階管理・アーカイブの設定", "Operator: stages and archive setup")}</h1><p>{t("このページは運営者の設定用です。依頼者・審査員の操作は不要です。", "Operator setup only. Clients and judges do not need to use this page.")}</p></header>
    <section className="panel">
      <p role="status">{error ? t("設定を確認できません。接続を確認して再確認してください。", "Unable to check setup. Check your connection and retry.") : applied ? t("追加設定は反映済みです。SQLを再実行せず、アプリでアーカイブ・復元を確認してください。", "Setup applied. Do not rerun the SQL. Verify archiving and restoring in the app.") : version === 1 ? t("追加設定は未適用です。下の手順で一度だけ実行してください。", "Setup is pending. Apply once using the steps below.") : version === null ? t("設定を確認しています。", "Checking setup…") : t("事前設定を確認する必要があります。このSQLはまだ実行しないでください。", "Check prerequisite setup first. Do not run this SQL yet.")}</p>
      <button type="button" className="secondary" onClick={refresh}>{t("適用状況を再確認", "Refresh setup status")}</button>
      <ol>
        <li>{t("「SQL全文をコピー」を押します。", "Select Copy entire SQL.")}</li>
        <li>{t("「SupabaseのSQL Editorを開く」から、PortalProofプロジェクトの新しいクエリ（＋ / New query）を開きます。以前のクエリへ追記しないでください。", "Open the project's SQL Editor and create a new query (+ / New query). Do not append to an earlier query.")}</li>
        <li>{t("全文を貼り付け、Runを一度押します。Success. No rows returned と表示されたら、このページへ戻り、適用状況を再確認してください。", "Paste everything and select Run once. After Success. No rows returned, return here and refresh the setup status.")}</li>
      </ol>
      <p>{t("これは用意済みの追加設定です。募集・案件を削除せず、アーカイブの保存先と段階管理の処理を追加します。パスワード・秘密鍵・service_roleキーの共有は不要です。", "This is the existing stage/archive migration. It adds archive storage and workflow rules without deleting offerings or requests. Do not share passwords, private keys or service_role keys.")}</p>
      <button type="button" className="primary" disabled={version !== 1 || Boolean(error)} onClick={copy}>{t("SQL全文をコピー", "Copy entire SQL")}</button>
      <a className="buttonLink secondary" href="https://supabase.com/dashboard/project/jpagtalwwdykopwqhbgp/sql/new" target="_blank" rel="noopener noreferrer">{t("SupabaseのSQL Editorを開く", "Open Supabase SQL Editor")} ↗</a>
      {message && <p role="status">{message}</p>}
      <label>{t("コピーするSQL（確認用・編集不可）", "SQL to copy (read-only)")}<textarea ref={sqlField} readOnly value={stageSql} rows={12} spellCheck={false} /></label>
      <a className="buttonLink primary" href={`${location.pathname}?view=shared&creatorTab=requests&lang=${ja ? "ja" : "en"}`}>{t("アプリの案件管理へ戻る", "Return to job management")}</a>
    </section>
  </main>;
}
