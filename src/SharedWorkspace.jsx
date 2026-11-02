import React, { useEffect, useState } from "react";
import { shared, sharedRpc, privateToken } from "./shared.js";
import { emptyDraft, walletFreeRequestReady } from "./domain.js";
import { WalletSignIn } from "./WalletSignIn.jsx";

export function SharedWorkspace() {
  const query = new URL(location.href).searchParams;
  const offeringId = query.get("offering"), requestId = query.get("clientRequest"), token = query.get("access");
  const [session, setSession] = useState(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [profile, setProfile] = useState({ ...emptyDraft(), creatorWallet: "" });
  const [offering, setOffering] = useState(null), [draft, setDraft] = useState({ clientName: "", requestBrief: "", amount: "10", deadline: "" });
  const [jobs, setJobs] = useState([]), [clientJob, setClientJob] = useState(null), [savedUrl, setSavedUrl] = useState(""), [hash, setHash] = useState("");
  const [submissionToken] = useState(privateToken);
  const base = `${location.origin}${location.pathname}`;
  const run = async (operation) => { setBusy(true); setMessage(""); try { await operation(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
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
          const value = await sharedRpc("pp_get_offering", { p_id: offeringId });
          if (!cancelled) setOffering(value);
        } else if (requestId && token) {
          const value = await sharedRpc("pp_get_client_request", { p_id: requestId, p_token: token });
          if (!cancelled) setClientJob(value);
        } else if (session) {
          const { data, error } = await shared.from("pp_requests").select("id,data,version").order("created_at", { ascending: false });
          if (error) throw error;
          if (!cancelled) setJobs(data.map((row) => ({ ...row.data, id: row.id, version: row.version })));
        }
      } catch (error) { if (!cancelled) setMessage(error.message); }
    };
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [offeringId, requestId, token, session?.user?.id]);
  const field = (key) => ({ value: draft[key], onChange: (event) => setDraft((old) => ({ ...old, [key]: event.target.value })) });
  if (!shared) return <main className="shell"><section className="panel"><h1>共有受付の設定が必要です</h1><p>SupabaseのプロジェクトURL・公開キーとデータベース定義を設定後に利用できます。まだ別端末接続は有効になっていません。</p><a href={base}>従来の画面に戻る</a></section></main>;
  return <main className="shell"><nav className="topBar"><strong>PortalProof · 共有受付</strong><a href={base}>従来の管理画面</a>{session && !offeringId && !requestId && <button className="secondary" onClick={() => run(async () => { const { error } = await shared.auth.signOut(); if (error) throw error; setJobs([]); })}>ログアウト</button>}</nav><p className="notice" role="status">{message || "依頼情報は共有データベースに保存します。"}</p>
    {requestId ? <section className="panel"><h1>ご依頼の確認</h1><p>このページのURLを保存してください。</p>{clientJob && <><h2>{clientJob.serviceName}</h2><p>{clientJob.clientName} → {clientJob.creatorName}</p><p>{clientJob.requestBrief}</p><p>金額：{clientJob.amount} tPOTv3 ／ 納期：{clientJob.deadline}</p><p>状態：{clientJob.status}</p>{clientJob.reported ? <p>支払い報告を受信しました。照合待ちです。再送金は不要です。<code>{clientJob.paymentTxHash}</code></p> : clientJob.orderId ? <form onSubmit={(event) => { event.preventDefault(); run(async () => setClientJob(await sharedRpc("pp_client_report", { p_id: requestId, p_token: token, p_hash: hash.trim() }))); }}><label>支払いトランザクションハッシュ<input value={hash} onChange={(event) => setHash(event.target.value)} pattern="0x[a-fA-F0-9]{64}" required /></label><button disabled={busy}>支払いを報告</button></form> : <p>クリエイターの確認をお待ちください。まだ支払いをしないでください。</p>}</>}</section>
    : offeringId ? <section className="panel"><h1>{offering?.serviceName || "依頼受付"}</h1><p>{offering?.serviceDescription}</p><p>依頼送信にウォレット・署名・ガス代は不要です。</p>{savedUrl ? <><h2>依頼を受け付けました</h2><input readOnly value={savedUrl} /><a className="buttonLink primary" href={savedUrl}>自分の依頼を確認する</a><p>このURLは他の方に共有しないでください。</p></> : <form onSubmit={(event) => { event.preventDefault(); run(async () => { const job = await sharedRpc("pp_submit_request", { p_offering: offeringId, p_payload: draft, p_token: submissionToken }); setSavedUrl(`${base}?view=shared&clientRequest=${job.id}&access=${submissionToken}`); }); }}><label>お名前<input {...field("clientName")} required /></label><label>依頼内容<textarea {...field("requestBrief")} required maxLength={4000} /></label><label>希望金額（tPOTv3）<input {...field("amount")} required /></label><label>希望納期<input type="date" {...field("deadline")} required /></label><button className="primary" disabled={busy || !offering || !walletFreeRequestReady(draft)}>依頼を送る</button></form>}</section>
    : !session ? <section className="panel"><h1>クリエイターのログイン</h1><p>依頼者はこのログインを使いません。受付リンクから送信できます。</p><form onSubmit={(event) => { event.preventDefault(); run(async () => { const { error } = await shared.auth.signInWithPassword({ email, password }); if (error) throw error; }); }}><label>メール<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>パスワード<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="primary" disabled={busy}>ログイン</button><button type="button" className="secondary" disabled={busy} onClick={() => run(async () => { const { error } = await shared.auth.signUp({ email, password, options: { emailRedirectTo: `${base}?view=shared` } }); if (error) throw error; setMessage("確認メールを開いてからログインしてください。"); })}>新規登録</button></form></section>
    : <><section className="panel"><h1>共有する受付ページを作成</h1>{["creatorName","creatorWallet","serviceName","serviceDescription"].map((key) => <label key={key}>{({creatorName:"クリエイター名",creatorWallet:"受取ウォレット",serviceName:"サービス名",serviceDescription:"仕事内容"})[key]}<input value={profile[key]} onChange={(event) => setProfile((old) => ({ ...old, [key]: event.target.value }))} /></label>)}<button className="primary" disabled={busy} onClick={() => run(async () => { const { data, error } = await shared.from("pp_offerings").insert({ owner_id: session.user.id, profile }).select("id").single(); if (error) throw error; setSavedUrl(`${base}?view=shared&offering=${data.id}`); })}>受付リンクを作成</button>{savedUrl && <><input readOnly value={savedUrl} /><a href={savedUrl} target="_blank" rel="noreferrer">依頼者ページを開く</a></>}</section><section><h2>届いた依頼（自分の案件のみ）</h2>{jobs.map((job) => <article className="panel" key={job.id}><h3>{job.clientName} ／ {job.serviceName}</h3><p>{job.requestBrief}</p><p>{job.amount} tPOTv3 ／ {job.deadline}</p><p>状態：{job.status}</p>{job.paymentTxHash && <p>支払い報告（未照合）：<code>{job.paymentTxHash}</code></p>}<p>新方式のオンチェーン記録は改訂版コントラクトとの接続後に利用できます。</p></article>)}</section></>}
    {!session && !offeringId && !requestId && <WalletSignIn busy={busy} run={run} />}
  </main>;
}
