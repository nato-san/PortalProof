import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, ExternalLink, FileCheck2, Link2 } from "lucide-react";
import { sharedRpc } from "./shared.js";
import { connectBrowserWallet } from "./walletConnection.js";
import {
  PORTALPROOF_CONTRACT_ADDRESS,
  creatorProofContract,
  emptySharedPaymentEvidence,
  explorerUrl,
  findDeliveryProof,
  findOrderProof,
  findPaymentProof,
  sharedDeliveryHash,
  sharedTermsHash,
  verifySharedPayment,
} from "./sharedProof.js";

const checkLabels = {
  hasHash: ["トランザクションハッシュの形式", "Transaction hash format"],
  transactionFound: ["Portaldot V3上の取引", "Transaction found on Portaldot V3"],
  hasExpectedFrom: ["依頼者ウォレットからの送金", "Sender is the client wallet"],
  hasExpectedTo: ["クリエイターの受取ウォレット", "Recipient is the creator wallet"],
  hasExpectedAmount: ["合意した金額", "Amount matches the agreement"],
  hasSuccess: ["取引の成功状態", "Transaction succeeded"],
};

export function SharedProofWorkflow({ job, kind, t, onChange, workflowVersion = 0 }) {
  const creator = kind === "creator";
  const [stage, setStage] = useState(job.paymentRecordTxHash ? "certificate" : job.deliveryTxHash ? "payment" : job.orderTxHash ? "delivery" : "agreement");
  const [deliveryUrl, setDeliveryUrl] = useState(job.deliveryUrl || "");
  const [paymentTxHash, setPaymentTxHash] = useState(job.paymentTxHash || "");
  const [termsHash, setTermsHash] = useState(job.termsHash || "");
  const [paymentEvidence, setPaymentEvidence] = useState(() => emptySharedPaymentEvidence(job));
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");

  useEffect(() => { if (!job.termsHash) sharedTermsHash(job).then(setTermsHash); else setTermsHash(job.termsHash); }, [job.id, job.version]);
  useEffect(() => { setDeliveryUrl(job.deliveryUrl || ""); setPaymentTxHash(job.paymentTxHash || ""); }, [job.deliveryUrl, job.paymentTxHash]);
  useEffect(() => {
    if (!job.paymentRecordTxHash) { setQr(""); return; }
    QRCode.toDataURL(explorerUrl(job.paymentRecordTxHash), { margin: 1, width: 220 }).then(setQr);
  }, [job.paymentRecordTxHash]);
  useEffect(() => {
    let cancelled = false;
    if (!job.paymentTxHash) { setPaymentEvidence(emptySharedPaymentEvidence(job)); return; }
    verifySharedPayment(job).then((value) => { if (!cancelled) setPaymentEvidence(value); }).catch(() => { if (!cancelled) setPaymentEvidence(emptySharedPaymentEvidence(job)); });
    return () => { cancelled = true; };
  }, [job.paymentTxHash, job.clientWallet, job.creatorWallet, job.amount]);

  async function perform(operation) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await operation(); } catch (error) { setMessage(error?.message || String(error)); }
    finally { setBusy(false); }
  }

  async function save(action, payload) {
    const value = await sharedRpc("pp_signed_proof_action", { p_id: job.id, p_version: job.version, p_action: action, p_payload: payload });
    onChange(value);
    return value;
  }

  async function creatorContract() {
    const wallet = await connectBrowserWallet(window.ethereum, location.href);
    return creatorProofContract(wallet, job.creatorWallet);
  }

  function confirmGas(text) {
    return window.confirm(`${text}\n\n${t("Portaldot V3へ取引を送信するため、少額のガス代が発生します。", "This sends a Portaldot V3 transaction and requires a small gas fee.")}`);
  }

  async function recordOrder() {
    if (!confirmGas(t("合意内容の発注証明をオンチェーンへ記録しますか？", "Record the agreed order proof on-chain?"))) return;
    await perform(async () => {
      const hash = termsHash || await sharedTermsHash(job);
      const { contract, provider } = await creatorContract();
      let txHash = await findOrderProof(contract, provider, hash, job.clientWallet, job.creatorWallet);
      if (!txHash) {
        const transaction = await contract.createOrder(job.clientWallet, job.creatorWallet, hash);
        setMessage(t("ウォレットで発注証明を確認しています…", "Waiting for the order-proof transaction…"));
        txHash = (await transaction.wait()).hash;
      }
      const value = await save("record_order", { proofId: hash, termsHash: hash, orderTxHash: txHash });
      setTermsHash(hash); setStage("delivery"); return value;
    });
  }

  async function recordDelivery() {
    if (!confirmGas(t("納品URLのハッシュをオンチェーンへ記録しますか？", "Record the delivery URL hash on-chain?"))) return;
    await perform(async () => {
      const hash = await sharedDeliveryHash(deliveryUrl);
      const { contract } = await creatorContract();
      let txHash = await findDeliveryProof(contract, job.orderId, hash, job.creatorWallet);
      if (!txHash) {
        const transaction = await contract.markDelivered(job.orderId, hash);
        setMessage(t("ウォレットで納品証明を確認しています…", "Waiting for the delivery-proof transaction…"));
        txHash = (await transaction.wait()).hash;
      }
      await save("record_delivery", { deliveryUrl: deliveryUrl.trim(), deliveryHash: hash, deliveryTxHash: txHash });
      setStage("payment");
    });
  }

  async function reportPayment() {
    await perform(async () => {
      const value = await save("report_payment", { paymentTxHash: paymentTxHash.trim() });
      setPaymentEvidence(await verifySharedPayment(value, paymentTxHash.trim()));
      setMessage(t("支払い情報をクリエイターへ送りました。これはまだ支払い確認完了ではありません。", "Payment information sent to the creator. This is not yet verified payment proof."));
    });
  }

  async function recordPayment() {
    if (!confirmGas(t("検証済みの支払い証跡をオンチェーンへ記録しますか？", "Record the verified payment evidence on-chain?"))) return;
    await perform(async () => {
      const evidence = await verifySharedPayment(job);
      setPaymentEvidence(evidence);
      if (!evidence.ok) throw new Error(t("送金元・送金先・金額・成功状態が一致しないため記録できません。", "Sender, recipient, amount, or receipt status does not match."));
      const { contract } = await creatorContract();
      let recordTxHash = await findPaymentProof(contract, job.orderId, evidence.normalized, job.creatorWallet);
      if (!recordTxHash) {
        const transaction = await contract.recordVerifiedPayment(job.orderId, evidence.normalized);
        setMessage(t("ウォレットで支払い証明を確認しています…", "Waiting for the payment-proof transaction…"));
        recordTxHash = (await transaction.wait()).hash;
      }
      await save("record_payment", { paymentTxHash: evidence.normalized, paymentRecordTxHash: recordTxHash });
      setStage("certificate");
    });
  }

  if (job.requestVersion !== 3 || job.workflowPhase !== "agreed") return null;
  if (workflowVersion < 3) return <section className="notice"><strong>{t("納品・証明機能のサーバー更新が必要です", "Delivery and proof server update required")}</strong><p>{t("案件データは保持されています。更新完了後にこの画面から続行できます。", "Job data is preserved. Continue here after the server update is applied.")}</p></section>;

  const stages = ["agreement", "delivery", "payment", "certificate"];
  const enabled = { agreement: true, delivery: Boolean(job.orderTxHash), payment: Boolean(job.deliveryTxHash), certificate: Boolean(job.paymentRecordTxHash) };
  return <section className="sharedProofWorkflow">
    <h3>{t("納品・支払い・オンチェーン証明", "Delivery, payment and on-chain proof")}</h3>
    {message && <p className="notice" role="status">{message}</p>}
    <nav className="stageTabs" aria-label={t("証明の段階", "Proof stages")}>{stages.map((name, index) => <button type="button" key={name} className={stage === name ? "active" : ""} disabled={!enabled[name]} onClick={() => setStage(name)}><span>{index + 1}</span>{({ agreement: t("発注証明", "Order"), delivery: t("納品", "Delivery"), payment: t("支払い", "Payment"), certificate: t("証明書", "Certificate") })[name]}</button>)}</nav>

    {stage === "agreement" && <div className="stagePanel"><h4>{t("合意内容の発注証明", "Proof of agreed order")}</h4><p>{t("合意した案件内容のハッシュをPortaldot V3へ記録します。", "Record a hash of the agreed commission on Portaldot V3.")}</p><div className="hashBox"><span>{t("合意条件ハッシュ", "Terms hash")}</span><code>{termsHash || "—"}</code></div>{job.orderTxHash ? <a href={explorerUrl(job.orderTxHash)} target="_blank" rel="noreferrer"><ExternalLink size={15} />{t("発注証明を確認", "View order proof")}</a> : creator && <button className="primary wide" disabled={busy || !termsHash} onClick={recordOrder}><FileCheck2 size={18} />{t("発注証明を記録", "Record order proof")}</button>}</div>}

    {stage === "delivery" && <div className="stagePanel"><h4>{t("納品証明", "Delivery proof")}</h4>{creator && !job.deliveryTxHash ? <><label>{t("納品URL", "Delivery URL")}<input value={deliveryUrl} onChange={(event) => setDeliveryUrl(event.target.value)} placeholder="https://... or ipfs://..." /></label><button className="primary wide" disabled={busy || !deliveryUrl.trim()} onClick={recordDelivery}><Link2 size={18} />{t("納品URLのハッシュを記録", "Record delivery URL hash")}</button></> : <><p><a href={job.deliveryUrl} target="_blank" rel="noreferrer">{t("納品URLを開く", "Open delivery URL")}</a></p><code>{job.deliveryHash}</code><p><a href={explorerUrl(job.deliveryTxHash)} target="_blank" rel="noreferrer">{t("納品証明を確認", "View delivery proof")}</a></p></>}</div>}

    {stage === "payment" && <div className="stagePanel"><h4>{t("支払い証明", "Payment proof")}</h4>{!creator && !job.paymentRecordTxHash && <><p>{t("合意額をクリエイターへ送金後、そのPortaldot V3トランザクションハッシュを入力してください。", "After transferring the agreed amount to the creator, enter the Portaldot V3 transaction hash.")}</p><label>{t("支払いトランザクションハッシュ", "Payment transaction hash")}<input value={paymentTxHash} onChange={(event) => setPaymentTxHash(event.target.value)} placeholder="0x..." /></label><button className="primary wide" disabled={busy || !/^0x[a-fA-F0-9]{64}$/.test(paymentTxHash.trim())} onClick={reportPayment}>{t("支払い情報を送信", "Submit payment information")}</button></>}
      {job.paymentTxHash && <><ul className="checks">{Object.entries(paymentEvidence.checks).map(([key, value]) => <li key={key} className={value ? "ok" : ""}><CheckCircle2 size={15} />{t(...checkLabels[key])}</li>)}</ul><a href={explorerUrl(job.paymentTxHash)} target="_blank" rel="noreferrer">{t("支払い取引を確認", "View payment transaction")}</a>{creator && !job.paymentRecordTxHash && <button className="primary wide" disabled={busy || !paymentEvidence.ok} onClick={recordPayment}>{t("検証済み支払い証跡を記録", "Record verified payment evidence")}</button>}</>}
      {job.paymentRecordTxHash && <p><a href={explorerUrl(job.paymentRecordTxHash)} target="_blank" rel="noreferrer">{t("オンチェーン支払い証明を確認", "View on-chain payment proof")}</a></p>}</div>}

    {stage === "certificate" && job.paymentRecordTxHash && <div className="stagePanel certificatePanel"><h4>{t("QR付き証明書", "QR proof certificate")}</h4><p>{t("QRコードはPortaldot V3上の最終支払い証明を開きます。", "The QR code opens the final payment-proof record on Portaldot V3.")}</p><div className="certificateBody"><dl><dt>{t("クリエイター", "Creator")}</dt><dd>{job.creatorName}</dd><dt>{t("依頼者", "Client")}</dt><dd>{job.clientName}</dd><dt>{t("コントラクト", "Contract")}</dt><dd>{PORTALPROOF_CONTRACT_ADDRESS}</dd><dt>{t("発注ID", "Order ID")}</dt><dd><code>{job.orderId}</code></dd><dt>{t("合意条件", "Terms")}</dt><dd><code>{job.termsHash}</code></dd><dt>{t("納品証明", "Delivery proof")}</dt><dd><code>{job.deliveryTxHash}</code></dd><dt>{t("支払い取引", "Payment")}</dt><dd><code>{job.paymentTxHash}</code></dd><dt>{t("支払い証明", "Payment proof")}</dt><dd><code>{job.paymentRecordTxHash}</code></dd></dl>{qr && <img src={qr} alt={t("支払い証明QRコード", "Payment proof QR code")} />}</div><p className="muted">{t("これは検証可能なQR証明書です。譲渡不能トークン（SBT）のミントではありません。", "This is a verifiable QR certificate, not a minted soulbound token (SBT).")}</p></div>}
  </section>;
}
