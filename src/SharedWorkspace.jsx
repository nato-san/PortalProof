import React, { useEffect, useState } from "react";
import { shared, sharedRpc } from "./shared.js";
import { emptyDraft, walletFreeRequestReady } from "./domain.js";
import { WalletSignIn } from "./WalletSignIn.jsx";
import { CreatorDashboard } from "./CreatorDashboard.jsx";
import { creatorTab, sharedLanguage, sharedStatus } from "./sharedView.js";
import { verifiedSessionWallet } from "./negotiation.js";
import { RequestNegotiation } from "./RequestNegotiation.jsx";
import { GuideLink } from "./UsageGuide.jsx";
import { usePageUrl } from "./usePageUrl.js";
import { navigate, sharedUrl } from "./navigation.js";
import { useWorkflowStatus } from "./useWorkflowStatus.js";

export function SharedWorkspace() {
  const query = usePageUrl().searchParams;
  const offeringId = query.get("offering"), requestId = query.get("clientRequest"), token = query.get("access");
  const clientRole = query.get("role") === "client";
  const clientContext = clientRole || Boolean(offeringId || requestId);
  const language = (() => {
    try { return sharedLanguage(query.get("lang") || localStorage.getItem("portalproof-language")); }
    catch { return sharedLanguage(query.get("lang")); }
  })();
  const setLanguage = value => navigate(sharedUrl(location.href, { lang: value }), { replace: true });
  const t = (ja, en) => language === "en" ? en : ja;
  const tab = creatorTab(query.get("creatorTab"));
  const [session, setSession] = useState(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({ ...emptyDraft(), creatorWallet: "" });
  const [offering, setOffering] = useState(null), [draft, setDraft] = useState({ clientName: "", requestBrief: "", amount: "10", deadline: "" });
  const [jobs, setJobs] = useState([]), [clientJob, setClientJob] = useState(null), [savedUrl, setSavedUrl] = useState(""), [hash, setHash] = useState("");
  const [offeringState, setOfferingState] = useState("loading");
  const { version: workflowVersion, error: workflowError } = useWorkflowStatus();
  const workflowReady = workflowVersion >= 1;
  const [requestNonce] = useState(() => crypto.randomUUID());
  const walletIdentity = verifiedSessionWallet(session?.user);
  const base = `${location.origin}${location.pathname}`;
  const run = async (operation) => { setBusy(true); setMessage(""); try { await operation(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const changeTab = (value) => {
    navigate(sharedUrl(location.href, { creatorTab: creatorTab(value), sharedJob: null }));
  };
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem("portalproof-language", language); } catch { /* optional preference */ }
    setMessage("");
  }, [language]);
  useEffect(() => {
    if (!shared) return;
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
          let archives = [];
          if (!clientRole && workflowVersion >= 2) {
            const result = await shared.from("pp_request_archives").select("request_id,archived_at").eq("user_id", session.user.id);
            if (result.error) throw result.error;
            archives = result.data;
          }
          if (!cancelled) setJobs(data.map(row => ({ ...row.data, id: row.id, version: row.version, archivedAt: archives.find(item => item.request_id === row.id)?.archived_at || null })));
        }
      } catch (error) { if (!cancelled) { setMessage(error.message); if (offeringId) { setOffering(null); setOfferingState("error"); } } }
    };
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [offeringId, requestId, token, session?.user?.id, clientRole, workflowVersion]);
  const jobChanged = (job) => {
    setJobs(current => current.map(item => item.id === job.id ? { ...item, ...job } : item));
    if (requestId === job.id) setClientJob(job);
  };
  const field = (key) => ({ value: draft[key], onChange: (event) => setDraft((old) => ({ ...old, [key]: event.target.value })) });
  return <main className="shell">
    <nav className="topBar">
      <a className="brand" href={`${base}?view=shared&role=${clientContext ? "client" : "creator"}&lang=${language}`}><img className="brandLogo" src="./portalproof-icon-192.png" alt="" />PortalProof</a>
      <div className="topActions">
      <GuideLink role={clientContext ? "client" : "creator"} language={language} flow="shared" />
      {session && <a className="buttonLink secondary" href={`${base}?view=shared&role=${clientContext ? "creator" : "client"}&lang=${language}`}>{clientContext ? t("クリエイターの管理画面", "Creator workspace") : t("自分が依頼した仕事", "My commissions")}</a>}
      <div className="languageToggle" aria-label={t("言語", "Language")}>
        <button type="button" className={language === "ja" ? "active" : ""} aria-pressed={language === "ja"} onClick={() => setLanguage("ja")}>日本語</button>
        <button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
      </div>
      {session && shared && <button className="secondary" onClick={() => run(async () => { const { error } = await shared.auth.signOut(); if (error) throw error; setJobs([]); setClientJob(null); })}>{t("ログアウト", "Log out")}</button>}
      </div>
    </nav>
    {message && <p className="notice" role="status">{message}</p>}
    {session && workflowError && <p className="notice" role="alert">{t("利用設定を確認できません。接続を確認してください。自動で再確認します。", "Unable to check server setup. Check your connection; we will retry automatically.")}</p>}
    {session && !workflowError && workflowVersion === null && <p className="notice" role="status">{t("利用設定を確認しています。", "Checking server setup…")}</p>}
    {session && workflowVersion !== null && workflowVersion < 2 && <p className="notice">{t("段階別管理・アーカイブの追加設定待ちです。募集一覧と案件の閲覧は引き続き利用できます。", "The stage/archive server update is pending. Offerings and existing requests remain viewable.")}</p>}
    {!shared ? <section className="panel"><h1>{t("共有受付の設定が必要です", "Shared workspace setup required")}</h1><p>{t("Supabaseの接続情報とデータベースを設定してください。", "Configure the Supabase connection and database first.")}</p></section>
      : offeringId && !requestId && !savedUrl && !offering ? <section className="panel" role="status">
        {offeringState === "unavailable" ? <><h1>{t("この募集は現在受け付けていません", "Not accepting requests")}</h1><p>{t("受付が停止されているか、募集が見つかりません。送信済みの依頼は、ご自身の依頼確認URLから確認できます。", "This offering is closed or unavailable. Existing requests remain accessible through their private URLs.")}</p></>
          : offeringState === "error" ? <><h1>{t("募集を読み込めませんでした", "Unable to load offering")}</h1><p>{t("接続を確認してください。自動で再確認します。", "Check your connection. We will retry automatically.")}</p></>
          : <p>{t("募集を確認中です", "Loading offering…")}</p>}
      </section>
      : requestId && !session && !token ? <WalletSignIn busy={busy} run={run} t={t} />
      : requestId ? <section className="panel">
        <a className="backLink" href={`${base}?view=shared&role=client&lang=${language}`}>{t("← 自分が依頼した仕事へ", "← My commissions")}</a>
        <h1>{t("ご依頼の確認", "Your request")}</h1><p>{t("このページのURLを保存してください。", "Save this page's private URL.")}</p>
        {clientJob && <><h2>{clientJob.serviceName}</h2><p>{clientJob.clientName} → {clientJob.creatorName}</p><p>{clientJob.requestBrief}</p>
          <p>{t("金額：", "Amount: ")}{clientJob.amount} tPOTv3 ／ {t("納期：", "Deadline: ")}{clientJob.deadline}</p>
          <p>{t("状態：", "Status: ")}{sharedStatus(clientJob.status, language)}</p>
          {clientJob.requestVersion === 3 && session && <RequestNegotiation key={`${clientJob.id}-${clientJob.version}`} job={clientJob} kind="client" userId={session.user.id} t={t} onChange={jobChanged} workflowVersion={workflowVersion} />}
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
      : !session ? <WalletSignIn busy={busy} run={run} t={t} />
      : clientRole ? <section><header className="hero compactHero"><div><h1>{t("自分が依頼した仕事", "My commissions")}</h1><p>{t("このウォレットで送信した依頼です。", "Requests submitted with this wallet.")}</p></div></header>{!jobs.length && <p>{t("依頼はまだありません。", "No commissions yet.")}</p>}<div className="requestCards">{jobs.map(job => <article className="panel requestCard" key={job.id}><span className={`statusBadge ${job.status}`}>{sharedStatus(job.status, language)}</span><h2>{job.serviceName}</h2><p>{job.creatorName}</p><p className="sharedBriefPreview">{job.requestBrief}</p><p>{job.amount} tPOTv3 / {job.deadline}</p><a className="buttonLink primary wide" href={`${base}?view=shared&role=client&clientRequest=${job.id}&lang=${language}`}>{t("依頼の詳細", "Request details")}</a></article>)}</div></section>
      : <CreatorDashboard tab={tab} onTabChange={changeTab} profile={profile} setProfile={setProfile} busy={busy} savedUrl={savedUrl} ownerId={session.user.id} base={base} jobs={jobs} language={language} t={t} onJobChange={jobChanged} workflowVersion={workflowVersion} onArchiveChange={(id, archivedAt) => setJobs(current => current.map(job => job.id === id ? { ...job, archivedAt } : job))} createOffering={() => run(async () => {
        const { data, error } = await shared.from("pp_offerings").insert({ owner_id: session.user.id, profile }).select("id").single(); if (error) throw error;
        setSavedUrl(`${base}?view=shared&offering=${data.id}`); changeTab("open"); setMessage(t("募集を作成しました。一覧からURLをコピーできます。", "Offering created. Copy its URL from the list."));
      })} />}
  </main>;
}
