import React, { useEffect, useState } from "react";
import { shared, sharedRpc } from "./shared.js";
import { emptyDraft, walletFreeRequestReady } from "./domain.js";
import { WalletSignIn } from "./WalletSignIn.jsx";
import { CreatorDashboard } from "./CreatorDashboard.jsx";
import { creatorTab, sharedLanguage, sharedStatus } from "./sharedView.js";
import { verifiedSessionWallet } from "./negotiation.js";
import { RequestNegotiation } from "./RequestNegotiation.jsx";

export function SharedWorkspace() {
  const query = new URL(location.href).searchParams;
  const offeringId = query.get("offering"), requestId = query.get("clientRequest"), token = query.get("access");
  const clientRole = query.get("role") === "client";
  const [language, setLanguage] = useState(() => {
    try { return sharedLanguage(query.get("lang") || localStorage.getItem("portalproof-language")); }
    catch { return sharedLanguage(query.get("lang")); }
  });
  const t = (ja, en) => language === "en" ? en : ja;
  const [tab, setTab] = useState(() => creatorTab(query.get("creatorTab")));
  const [session, setSession] = useState(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [profile, setProfile] = useState({ ...emptyDraft(), creatorWallet: "" });
  const [offering, setOffering] = useState(null), [draft, setDraft] = useState({ clientName: "", requestBrief: "", amount: "10", deadline: "" });
  const [jobs, setJobs] = useState([]), [clientJob, setClientJob] = useState(null), [savedUrl, setSavedUrl] = useState(""), [hash, setHash] = useState("");
  const [offeringState, setOfferingState] = useState("loading");
  const [workflowReady, setWorkflowReady] = useState(false);
  const [requestNonce] = useState(() => crypto.randomUUID());
  const walletIdentity = verifiedSessionWallet(session?.user);
  const base = `${location.origin}${location.pathname}`;
  const run = async (operation) => { setBusy(true); setMessage(""); try { await operation(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const changeTab = (value) => {
    const next = creatorTab(value); setTab(next);
    const url = new URL(location.href); url.searchParams.set("creatorTab", next); history.replaceState(null, "", url);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem("portalproof-language", language); } catch { /* optional preference */ }
    const url = new URL(location.href); url.searchParams.set("lang", language); history.replaceState(null, "", url);
    setMessage("");
  }, [language]);
  useEffect(() => {
    if (!shared) return;
    shared.rpc("pp_signed_workflow_version").then(({ data, error }) => setWorkflowReady(!error && data === 1));
    shared.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = shared.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        if (offeringId) {
          const { data: value, error } = await shared.rpc("pp_get_offering", { p_id: offeringId });
          if (error) throw error;
          if (!cancelled) { setOffering(value); setOfferingState(value ? "available" : "unavailable"); }
        } else if (requestId && (token || session)) {
          const value = await sharedRpc("pp_get_client_request", { p_id: requestId, p_token: token || "" });
          if (!cancelled) setClientJob(value);
        } else if (session) {
          const { data, error } = await shared.from("pp_requests").select("id,data,version").eq(clientRole ? "client_user_id" : "owner_id", session.user.id).order("created_at", { ascending: false });
          if (error) throw error;
          if (!cancelled) setJobs(data.map((row) => ({ ...row.data, id: row.id, version: row.version })));
        }
      } catch (error) { if (!cancelled) { setMessage(error.message); if (offeringId) { setOffering(null); setOfferingState("error"); } } }
    };
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [offeringId, requestId, token, session?.user?.id, clientRole]);
  const jobChanged = (job) => {
    setJobs(current => current.map(item => item.id === job.id ? job : item));
    if (requestId === job.id) setClientJob(job);
  };
  const field = (key) => ({ value: draft[key], onChange: (event) => setDraft((old) => ({ ...old, [key]: event.target.value })) });
  const creator = !offeringId && !requestId;
  return <main className="shell">
    <nav className="topBar">
      <strong>PortalProof · {t("共有受付", "Shared workspace")}</strong>
      {creator && <a href={base}>{t("従来の管理画面", "Legacy workspace")}</a>}
      {session && <a href={`${base}?view=shared&role=${clientRole ? "creator" : "client"}&lang=${language}`}>{clientRole ? t("クリエイターの管理画面", "Creator workspace") : t("自分が依頼した仕事", "My commissions")}</a>}
      <div className="languageToggle" aria-label={t("言語", "Language")}>
        <button type="button" className={language === "ja" ? "active" : ""} aria-pressed={language === "ja"} onClick={() => setLanguage("ja")}>日本語</button>
        <button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
      </div>
      {session && shared && <button className="secondary" onClick={() => run(async () => { const { error } = await shared.auth.signOut(); if (error) throw error; setJobs([]); setClientJob(null); })}>{t("ログアウト", "Log out")}</button>}
    </nav>
    <p className="notice" role="status">{message || t("依頼情報は共有データベースに保存します。", "Request information is stored in the shared database.")}</p>
    {!shared ? <section className="panel"><h1>{t("共有受付の設定が必要です", "Shared workspace setup required")}</h1><p>{t("Supabaseの接続情報とデータベースを設定してください。", "Configure the Supabase connection and database first.")}</p></section>
      : offeringId && !requestId && !savedUrl && !offering ? <section className="panel" role="status">
        {offeringState === "unavailable" ? <><h1>{t("この募集は現在受け付けていません", "Not accepting requests")}</h1><p>{t("受付が停止されているか、募集が見つかりません。送信済みの依頼は、ご自身の依頼確認URLから確認できます。", "This offering is closed or unavailable. Existing requests remain accessible through their private URLs.")}</p></>
          : offeringState === "error" ? <><h1>{t("募集を読み込めませんでした", "Unable to load offering")}</h1><p>{t("接続を確認してください。自動で再確認します。", "Check your connection. We will retry automatically.")}</p></>
          : <p>{t("募集を確認中です", "Loading offering…")}</p>}
      </section>
      : requestId && !session && !token ? <WalletSignIn busy={busy} run={run} t={t} />
      : requestId ? <section className="panel">
        <h1>{t("ご依頼の確認", "Your request")}</h1><p>{t("このページのURLを保存してください。", "Save this page's private URL.")}</p>
        {clientJob && <><h2>{clientJob.serviceName}</h2><p>{clientJob.clientName} → {clientJob.creatorName}</p><p>{clientJob.requestBrief}</p>
          <p>{t("金額：", "Amount: ")}{clientJob.amount} tPOTv3 ／ {t("納期：", "Deadline: ")}{clientJob.deadline}</p>
          <p>{t("状態：", "Status: ")}{sharedStatus(clientJob.status, language)}</p>
          {clientJob.requestVersion === 3 && session && <RequestNegotiation key={`${clientJob.id}-${clientJob.version}`} job={clientJob} kind="client" userId={session.user.id} t={t} onChange={jobChanged} />}
          {clientJob.requestVersion === 3 ? <p>{clientJob.workflowPhase === "cancelled" ? t("この依頼はキャンセル済みです。送金しないでください。", "This request is cancelled. Do not pay.") : t("商談・受注の確認ができます。新方式の納品・オンチェーン証明との接続は準備中です。まだ送金しないでください。", "Review negotiation and agreement here. Delivery and on-chain proof integration are still pending. Do not pay yet.")}</p>
            : clientJob.reported ? <p>{t("支払い報告を受信しました。照合待ちです。再送金は不要です。", "Payment report received, awaiting verification. Do not pay again.")}<code>{clientJob.paymentTxHash}</code></p>
            : clientJob.orderId ? <form onSubmit={(event) => { event.preventDefault(); run(async () => setClientJob(await sharedRpc("pp_client_report", { p_id: requestId, p_token: token, p_hash: hash.trim() }))); }}>
              <label>{t("支払いトランザクションハッシュ", "Payment transaction hash")}<input value={hash} onChange={(event) => setHash(event.target.value)} pattern="0x[a-fA-F0-9]{64}" required /></label><button disabled={busy}>{t("支払いを報告", "Report payment")}</button>
            </form> : <p>{t("クリエイターの確認をお待ちください。まだ支払いをしないでください。", "Wait for the creator to review your request. Do not pay yet.")}</p>}
        </>}
      </section>
      : offeringId ? <section className="panel">
        <h1>{offering?.serviceName || t("依頼受付", "Request a commission")}</h1><p>{offering?.serviceDescription}</p><p>{t("送信前にウォレット署名でログインします。ログイン・依頼送信に送金やガス代は発生しません。", "Sign in with your wallet before sending. Signing in and submitting a request require no payment or gas fee.")}</p>
        {savedUrl ? <><h2>{t("依頼を受け付けました", "Request received")}</h2><input readOnly value={savedUrl} /><a className="buttonLink primary" href={savedUrl}>{t("自分の依頼を確認する", "View my request")}</a><p>{t("このURLは他の方に共有しないでください。", "Do not share this private URL.")}</p></>
          : !walletIdentity ? <WalletSignIn busy={busy} run={run} t={t} />
          : !workflowReady ? <p role="status">{t("新しい依頼ルールのサーバー設定待ちです。まだ依頼は送信できません。", "Awaiting server setup for the signed request workflow. Submission is not enabled yet.")}</p>
          : <form onSubmit={(event) => { event.preventDefault(); run(async () => {
            const job = await sharedRpc("pp_submit_signed_request", { p_offering: offeringId, p_nonce: requestNonce, p_payload: draft });
            setSavedUrl(`${base}?view=shared&role=client&clientRequest=${job.id}&lang=${language}`);
          }); }}>
            <label>{t("お名前", "Your name")}<input {...field("clientName")} required /></label><label>{t("依頼内容", "Request details")}<textarea {...field("requestBrief")} required maxLength={4000} /></label>
            <label>{t("希望金額（tPOTv3）", "Proposed amount (tPOTv3)")}<input {...field("amount")} required /></label><label>{t("希望納期", "Requested deadline")}<input type="date" {...field("deadline")} required /></label>
            <button className="primary" disabled={busy || !offering || !walletFreeRequestReady(draft)}>{t("依頼を送る", "Send request")}</button>
          </form>}
      </section>
      : !session ? <>
        <WalletSignIn busy={busy} run={run} t={t} />
        <section className="panel"><h2>{t("メールでログイン（既存アカウント用）", "Email login (existing accounts)")}</h2><p>{t("新しい依頼の送信にはウォレット署名ログインをご利用ください。", "Use wallet sign-in to submit new requests.")}</p>
          <form onSubmit={(event) => { event.preventDefault(); run(async () => { const { error } = await shared.auth.signInWithPassword({ email, password }); if (error) throw error; }); }}>
            <label>{t("メール", "Email")}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>{t("パスワード", "Password")}<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button className="primary" disabled={busy}>{t("ログイン", "Log in")}</button><button type="button" className="secondary" disabled={busy} onClick={() => run(async () => {
              const { error } = await shared.auth.signUp({ email, password, options: { emailRedirectTo: `${base}?view=shared` } }); if (error) throw error; setMessage(t("確認メールを開いてからログインしてください。", "Confirm your email, then log in."));
            })}>{t("新規登録", "Sign up")}</button>
          </form>
        </section>
      </> : clientRole ? <section><h1>{t("自分が依頼した仕事", "My commissions")}</h1><p>{t("このウォレットで送信した依頼です。", "Requests submitted with this wallet.")}</p>{!jobs.length && <p>{t("依頼はまだありません。", "No commissions yet.")}</p>}{jobs.map(job => <article className="panel" key={job.id}><h2>{job.serviceName}</h2><p>{job.creatorName}</p><p>{job.requestBrief}</p><p>{job.amount} tPOTv3 / {job.deadline}</p><RequestNegotiation key={`${job.id}-${job.version}`} job={job} kind="client" userId={session.user.id} t={t} onChange={jobChanged} /><a className="buttonLink secondary" href={`${base}?view=shared&role=client&clientRequest=${job.id}&lang=${language}`}>{t("依頼の詳細", "Request details")}</a></article>)}</section>
      : <CreatorDashboard tab={tab} onTabChange={changeTab} profile={profile} setProfile={setProfile} busy={busy} savedUrl={savedUrl} ownerId={session.user.id} base={base} jobs={jobs} language={language} t={t} onJobChange={jobChanged} createOffering={() => run(async () => {
        const { data, error } = await shared.from("pp_offerings").insert({ owner_id: session.user.id, profile }).select("id").single(); if (error) throw error;
        setSavedUrl(`${base}?view=shared&offering=${data.id}`); changeTab("open"); setMessage(t("募集を作成しました。一覧からURLをコピーできます。", "Offering created. Copy its URL from the list."));
      })} />}
  </main>;
}
