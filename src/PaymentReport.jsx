import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

async function api(path, options = {}) {
  const response = await fetch(`/api/payment-reports${path}`, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

export function ClientPaymentReport({ token, contractAddress }) {
  const [certificateQr, setCertificateQr] = useState("");
  const [language, setLanguage] = useState(() => localStorage.getItem("portalproof-language") || "ja");
  const ja = language === "ja";
  const text = (jp, en) => ja ? jp : en;
  const [order, setOrder] = useState(null), [hash, setHash] = useState(""), [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  const paymentHash = order?.report?.paymentTxHash;
  useEffect(() => {
    let cancelled = false;
    setCertificateQr("");
    if (order?.paymentRecordTxHash && /^0x[a-fA-F0-9]{64}$/.test(paymentHash || "")) {
      QRCode.toDataURL(`https://node-console.portaldot.dev/#/explorer/query/${paymentHash}`, { margin: 1, width: 180 })
        .then((value) => { if (!cancelled) setCertificateQr(value); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [order?.paymentRecordTxHash, paymentHash]);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => api(`/${token}`).then((value) => { if (!cancelled) setOrder(value); }).catch(() => { if (!cancelled) setStatus("接続できません。サーバーの起動とURLを確認してください。 / Cannot connect to the local server."); });
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [token]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setStatus("");
    try { await api(`/${token}`, { method: "POST", body: JSON.stringify({ paymentTxHash: hash.trim() }) }); setOrder((item) => ({ ...item, reported: true })); }
    catch (error) { setStatus(ja ? `報告できませんでした。送金元・送金先・金額・取引の成功状態を確認して再試行してください。詳細：${error.message}` : error.message); } finally { setBusy(false); }
  }
  return <main className="shell clientRequestPage"><nav className="topBar"><strong>PortalProof</strong><div className="languageToggle"><button onClick={() => setLanguage("ja")} className={ja ? "active" : ""}>日本語</button><button onClick={() => setLanguage("en")} className={!ja ? "active" : ""}>English</button></div></nav><section className="panel"><h1>{text("ご依頼の確認", "Your request")}</h1><p>{text("依頼の進み具合の確認と、支払いの報告をこのページで行えます。", "Track your request and report your payment here.")}</p><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setStatus(text("専用URLをコピーしました。ブックマークやメモに保存してください。", "Private URL copied. Save it to return later.")); } catch { setStatus(text("ブラウザのアドレス欄からURLをコピーしてください。", "Copy the URL from your address bar.")); } }}>{text("このページのURLを保存", "Save this page URL")}</button><p className="muted">Portaldot V3 Testnet · {text("テスト用トークン", "Test tokens")}</p>{status && <p className="notice" role="status">{status}</p>}{!order && <p>{text("依頼情報を読み込んでいます…", "Loading your request…")}</p>}{order && <>
    <section className="notice"><div><h2>{order.paymentRecordTxHash ? text("お取引が完了しました", "Your commission is complete") : order.reported ? text("支払い報告を受け付けました", "Payment reported") : text("お支払い済みですか？", "Already paid?")}</h2><p>{order.paymentRecordTxHash ? text("支払い証明が記録されました。下の取引記録から確認できます。", "Your payment evidence has been recorded below.") : order.reported ? text("クリエイターによる支払い証明の記録をお待ちください。追加の送金は不要です。", "Wait for the creator to record your payment. Do not pay again.") : text("ウォレットから送金しただけでは、このページへ自動反映されません。下の「支払いを報告」から、取引履歴のトランザクションハッシュを送ってください。", "A wallet transfer does not automatically update this page. Submit its transaction hash below.")}</p></div></section>
    {!order.reported && !order.paymentRecordTxHash && <section className="panel"><h2>{text("支払いを報告", "Report payment")}</h2><ol><li>{text("送金済みのウォレットで「取引履歴」を開く", "Open your paying wallet’s transaction history")}</li><li>{text("今回の送金の「トランザクションハッシュ」をコピー", "Copy the transaction hash of this payment")}</li><li>{text("下に貼り付けて「支払いを報告」を押す", "Paste it below and submit")}</li></ol><p>{text("支払い金額", "Payment amount")}: <strong>{order.amount} tPOTv3</strong></p>{!order.orderId && <p>{text("発注証明の登録待ちです。まだ送金せず、クリエイターの確認をお待ちください。", "Awaiting the order proof. Please wait before paying.")}</p>}<form onSubmit={submit}><label>{text("支払いトランザクションハッシュ", "Payment transaction hash")}<input value={hash} onChange={(event) => setHash(event.target.value)} placeholder="0x…" required pattern="0x[a-fA-F0-9]{64}" /></label><button className="primary wide" disabled={busy || !order.orderId}>{busy ? text("支払いを検証しています…", "Verifying payment…") : text("支払いを報告", "Report payment")}</button></form><p className="muted">{text("この操作で追加の送金や手数料は発生しません。", "Reporting does not send funds or charge a transaction fee.")}</p></section>}
    {order.paymentRecordTxHash && <section className="panel certificatePanel" aria-label={text("取引証明書", "Commission certificate")}><h2>{text("取引証明書が届きました", "Your commission certificate is ready")}</h2><p>{text("クリエイターが支払い証明を記録しました。このページは後から開き直しても確認できます。", "The creator has recorded your payment evidence. Return to this page to view your certificate anytime while the service is available.")}</p><div className="certificateBody"><dl><dt>{text("クリエイター", "Creator")}</dt><dd>{order.creatorName || "—"}</dd><dt>{text("依頼者", "Client")}</dt><dd>{order.clientName || "—"}</dd><dt>{text("金額", "Amount")}</dt><dd>{order.amount} tPOTv3</dd><dt>{text("コントラクト", "Contract")}</dt><dd><code>{contractAddress}</code></dd><dt>{text("注文・合意条件ハッシュ", "Order / terms hash")}</dt><dd><code>{order.orderId}</code></dd><dt>{text("支払いトランザクション", "Payment transaction")}</dt><dd><code>{paymentHash || text("報告情報なし", "No report available")}</code></dd><dt>{text("支払い証明の記録", "Payment evidence record")}</dt><dd><a href={`https://node-console.portaldot.dev/#/explorer/query/${order.paymentRecordTxHash}`} target="_blank" rel="noreferrer">{text("オンチェーン記録を確認", "View on-chain record")}</a></dd></dl>{certificateQr && <div><img src={certificateQr} alt={text("支払いトランザクションのQRコード", "Payment transaction QR code")} /><p className="muted">{text("QRコードから支払い取引を確認できます。", "Scan to view the payment transaction.")}</p></div>}</div></section>}
    <h2>{order.serviceName || text("依頼内容", "Request details")}</h2>{(order.creatorName || order.clientName) && <p>{order.creatorName} / {order.clientName}</p>}<p>{order.requestBrief}</p><p>{text("納期", "Deadline")}: {order.deadline || text("未登録", "Not provided")}</p>
    <h3>{text("制作状況", "Work status")}: {order.deliveryTxHash ? text("納品済み", "Delivered") : order.orderId ? text("制作中", "In progress") : text("受付済み", "Received")}</h3>
    {order.deliveryTxHash && /^https?:\/\//i.test(order.deliveryUrl || "") && <a className="buttonLink primary" href={order.deliveryUrl} target="_blank" rel="noreferrer">{text("納品物を確認", "View delivery")}</a>}
    <details><summary>{text("ウォレットと取引記録を確認", "Wallet and transaction details")}</summary><p>{text("注文", "Order")}: <code>{order.orderId || order.id}</code></p><p>{text("送金先", "Recipient")}: <code>{order.creatorWallet}</code></p><p>{text("送金元", "Sender")}: <code>{order.clientWallet}</code></p>
    {order.report && <p>{text("報告した支払い", "Reported payment")}: <code>{order.report.paymentTxHash}</code></p>}
    {order.paymentRecordTxHash && <p>{text("支払い証明", "Payment record")}: <code>{order.paymentRecordTxHash}</code></p>}</details>
    </>}</section></main>;
}

export function CreatorPaymentReport({ job, language, onReceive }) {
  const key = `portalproof-report-link-${job.id}`;
  const [access, setAccess] = useState(() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } });
  const [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const ja = language === "ja";
  useEffect(() => {
    if (!access) return;
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
  useEffect(() => {
    if (!access) return;
    let cancelled = false;
    const sync = async () => {
      try {
        await api(`/${access.clientToken}`, { method: "POST", headers: { Authorization: `Bearer ${access.creatorToken}` }, body: JSON.stringify({ ...job, action: "sync" }) });
        if (!cancelled) setSyncStatus(ja ? "依頼者ページへ最新の案件情報を同期しました。" : "Latest job details synced to the client page.");
      } catch (error) {
        if (!cancelled) setSyncStatus((ja ? "依頼者ページへの同期に失敗しました。再試行中です：" : "Client sync failed; retrying: ") + error.message);
      }
    };
    sync(); const timer = setInterval(sync, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [access, job.id, job.status, job.orderId, job.orderTxHash, job.deliveryUrl, job.deliveryTxHash, job.paymentRecordTxHash, ja]);
  async function create() {
    setBusy(true);
    try {
      const result = await api("", { method: "POST", body: JSON.stringify(job) });
      localStorage.setItem(key, JSON.stringify(result)); setAccess(result); setStatus("");
    } catch (error) { setStatus(error.message); } finally { setBusy(false); }
  }
  const link = access ? `${location.origin}${location.pathname}?paymentReport=${access.clientToken}` : "";
  const syncNotice = <p role="status">{syncStatus}</p>;
  return <section className="panel"><h2>{ja ? "依頼者用の支払い報告リンク" : "Client payment-report link"}</h2><p>{ja ? "依頼者は専用ページへ支払いTxHashを入力できます。この画面を開いている間、5秒ごとに受信を確認します。" : "Clients submit their payment hash through this link. This page checks for reports every five seconds."}</p>{!access ? <button className="secondary" onClick={create} disabled={busy || !job.orderId}>{ja ? "報告リンクを作成" : "Create report link"}</button> : <><input aria-label="Client payment-report URL" readOnly value={link} /><a className="buttonLink secondary" href={link} target="_blank" rel="noreferrer">{ja ? "依頼者ページを開く" : "Open client page"}</a></>}<p role="status">{status}</p>{syncNotice}<small>{ja ? "ローカル試作版：このMacのサーバーが必要です。127.0.0.1のリンクは別端末では開けません。" : "Local prototype: requires this Mac's server. A 127.0.0.1 link cannot be opened on another device."}</small></section>;
}
