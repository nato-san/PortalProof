import React, { useEffect, useState } from "react";

async function api(path, options = {}) {
  const response = await fetch(`/api/payment-reports${path}`, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

export function ClientPaymentReport({ token }) {
  const [order, setOrder] = useState(null), [hash, setHash] = useState(""), [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { api(`/${token}`).then(setOrder).catch((error) => setStatus(error.message)); }, [token]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setStatus("");
    try { await api(`/${token}`, { method: "POST", body: JSON.stringify({ paymentTxHash: hash.trim() }) }); setOrder((item) => ({ ...item, reported: true })); }
    catch (error) { setStatus(error.message); } finally { setBusy(false); }
  }
  return <main className="shell"><section className="panel"><h1>支払いを報告 / Report payment</h1><p>Portaldot V3 testnet · tPOTv3</p>{status && <p role="status">{status}</p>}{order && <><p>注文 / Order: <code>{order.orderId}</code></p><p>送金先 / Recipient: <code>{order.creatorWallet}</code></p><p>送金元 / Sender: <code>{order.clientWallet}</code></p><h2>{order.amount} tPOTv3</h2>{order.reported ? <p role="status">支払い報告を受け付けました。クリエイターが確認・記録します。 / Report received. Awaiting creator confirmation.</p> : <form onSubmit={submit}><label>Payment transaction hash<input value={hash} onChange={(event) => setHash(event.target.value)} placeholder="0x…" required /></label><button className="primary" disabled={busy}>{busy ? "検証中 / Verifying…" : "支払いを報告 / Report payment"}</button></form>}</>}</section></main>;
}

export function CreatorPaymentReport({ job, language, onReceive }) {
  const key = `portalproof-report-link-${job.id}`;
  const [access, setAccess] = useState(() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } });
  const [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  const ja = language === "ja";
  useEffect(() => {
    if (!access || job.paymentRecordTxHash) return;
    let cancelled = false;
    const check = async () => {
      try {
        const result = await api(`/${access.clientToken}`, { headers: { Authorization: `Bearer ${access.creatorToken}` } });
        if (!cancelled && result.report) {
          if (job.paymentTxHash !== result.report.paymentTxHash) onReceive(result.report);
          setStatus(ja ? "支払い報告を受信しました。支払いタブで検証して記録してください。" : "Payment report received. Verify and record it in the Payment tab.");
        }
      } catch (error) { if (!cancelled) setStatus(error.message); }
    };
    check(); const timer = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [access, job.paymentTxHash, job.paymentRecordTxHash, ja]);
  async function create() {
    setBusy(true);
    try {
      const result = await api("", { method: "POST", body: JSON.stringify(job) });
      localStorage.setItem(key, JSON.stringify(result)); setAccess(result); setStatus("");
    } catch (error) { setStatus(error.message); } finally { setBusy(false); }
  }
  const link = access ? `${location.origin}${location.pathname}?paymentReport=${access.clientToken}` : "";
  return <section className="panel"><h2>{ja ? "依頼者用の支払い報告リンク" : "Client payment-report link"}</h2><p>{ja ? "依頼者は専用ページへ支払いTxHashを入力できます。この画面を開いている間、5秒ごとに受信を確認します。" : "Clients submit their payment hash through this link. This page checks for reports every five seconds."}</p>{!access ? <button className="secondary" onClick={create} disabled={busy || !job.orderId}>{ja ? "報告リンクを作成" : "Create report link"}</button> : <><input aria-label="Client payment-report URL" readOnly value={link} /><a className="buttonLink secondary" href={link} target="_blank" rel="noreferrer">{ja ? "依頼者ページを開く" : "Open client page"}</a></>}<p role="status">{status}</p><small>{ja ? "ローカル試作版：このMacのサーバーが必要です。127.0.0.1のリンクは別端末では開けません。" : "Local prototype: requires this Mac's server. A 127.0.0.1 link cannot be opened on another device."}</small></section>;
}
