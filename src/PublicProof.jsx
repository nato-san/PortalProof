import React, { useEffect, useState } from "react";
import { CheckCircle2, CircleX, ExternalLink } from "lucide-react";
import { ethers } from "ethers";
import { PORTALPROOF_CONTRACT_ADDRESS, explorerUrl, loadPublicProof } from "./sharedProof.js";

const labels = {
  recordSucceeded: ["証明記録が成功", "Proof-record transaction succeeded"],
  recordUsesContract: ["PortalProofコントラクトへの記録", "Recorded by the PortalProof contract"],
  paymentEventFound: ["支払い証明イベント", "Payment-proof event found"],
  orderEventFound: ["同じ発注IDの発注証明", "Order proof with the same ID"],
  deliveryEventFound: ["同じ発注IDの納品証明", "Delivery proof with the same ID"],
  creatorRecordedProof: ["クリエイターによる最終記録", "Final record submitted by the creator"],
  paymentFound: ["参照された支払い取引", "Referenced payment transaction found"],
  paymentSucceeded: ["支払い取引が成功", "Payment transaction succeeded"],
  paymentSenderMatchesClient: ["送金元が依頼者ウォレット", "Payment sender matches the client"],
  paymentRecipientMatchesCreator: ["送金先がクリエイターウォレット", "Payment recipient matches the creator"],
};

const short = (value) => value ? `${value.slice(0, 10)}…${value.slice(-8)}` : "—";

export function PublicProof({ hash }) {
  const ja = new URL(location.href).searchParams.get("lang") !== "en";
  const text = (jp, en) => ja ? jp : en;
  const [proof, setProof] = useState(null), [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setProof(null); setError("");
    loadPublicProof(hash).then((value) => { if (!cancelled) setProof(value); }).catch((reason) => { if (!cancelled) setError(reason?.message || String(reason)); });
    return () => { cancelled = true; };
  }, [hash]);
  const home = `${location.pathname}?view=shared&lang=${ja ? "ja" : "en"}`;
  const visibleChecks = proof?.isFinalProof ? proof.checks : proof ? {
    recordSucceeded: proof.checks.recordSucceeded,
    ...(proof.parsed.length ? { recordUsesContract: proof.checks.recordUsesContract } : {}),
  } : {};
  return <main className="shell clientRequestPage">
    <nav className="topBar"><a className="brand" href={home}>PortalProof</a><div className="languageToggle"><a className={ja ? "active" : ""} href={`${location.pathname}?proofTx=${encodeURIComponent(hash)}&lang=ja`}>日本語</a><a className={!ja ? "active" : ""} href={`${location.pathname}?proofTx=${encodeURIComponent(hash)}&lang=en`}>English</a></div></nav>
    <header className="hero compactHero"><p className="eyebrow">PORTALDOT V3 / PUBLIC PROOF</p><h1>{text("オンチェーン取引証明", "On-chain transaction proof")}</h1><p>{text("QRコードに記録された証跡を、Portaldot V3の公開RPCから直接確認します。ログインは不要です。", "Verify the QR evidence directly through the public Portaldot V3 RPC. No sign-in is required.")}</p></header>
    {!proof && !error && <section className="notice">{text("オンチェーン記録を確認しています…", "Checking the on-chain record…")}</section>}
    {error && <section className="notice error"><h2>{text("証明を確認できませんでした", "Proof could not be verified")}</h2><p>{error}</p><code>{hash}</code></section>}
    {proof && <>
      <section className={`notice ${proof.verified ? "success" : "error"}`}><h2>{proof.verified ? (proof.isFinalProof ? text("証明のつながりを確認できました", "Proof chain verified") : text("取引を確認できました", "Transaction confirmed")) : text("一部の証跡を確認できません", "Some proof checks failed")}</h2><p>{text("下の各項目は画面保存値ではなく、公開チェーンから取得した結果です。", "Each result below comes from the public chain, not from saved screen data.")}</p></section>
      <section className="panel stagePanel"><h2>{text("検証結果", "Verification results")}</h2><ul className="checks">{Object.entries(visibleChecks).map(([key, ok]) => <li key={key} className={ok ? "ok" : ""}>{ok ? <CheckCircle2 size={18} /> : <CircleX size={18} />}{text(...labels[key])}</li>)}</ul></section>
      <section className="panel certificatePanel"><h2>{text("記録内容", "Proof details")}</h2><div className="certificateBody"><dl>
        <dt>{text("コントラクト", "Contract")}</dt><dd><code>{PORTALPROOF_CONTRACT_ADDRESS}</code></dd>
        <dt>{text("最終証明Tx", "Final proof transaction")}</dt><dd><code>{proof.hash}</code></dd>
        <dt>{text("ブロック番号", "Block number")}</dt><dd>{proof.receipt.blockNumber}</dd>
        <dt>{text("送信元", "From")}</dt><dd><code>{proof.transaction.from}</code></dd>
        <dt>{text("送信先", "To")}</dt><dd><code>{proof.transaction.to || "—"}</code></dd>
        <dt>{text("発注ID・条件ハッシュ", "Order ID / terms hash")}</dt><dd><code>{proof.paymentEvent?.args.proofId || "—"}</code></dd>
        <dt>{text("依頼者ウォレット", "Client wallet")}</dt><dd><code>{proof.orderEvent?.args.client || "—"}</code></dd>
        <dt>{text("クリエイターウォレット", "Creator wallet")}</dt><dd><code>{proof.orderEvent?.args.creator || "—"}</code></dd>
        <dt>{text("納品ハッシュ", "Delivery hash")}</dt><dd><code>{proof.deliveryEvent?.args.deliveryHash || "—"}</code></dd>
        <dt>{text("支払いTx", "Payment transaction")}</dt><dd><code>{proof.paymentEvent?.args.paymentTxHash || "—"}</code></dd>
        <dt>{text("支払い額", "Payment amount")}</dt><dd>{proof.paymentTransaction ? `${ethers.formatEther(proof.paymentTransaction.value)} tPOTv3` : `${ethers.formatEther(proof.transaction.value)} tPOTv3`}</dd>
      </dl></div>
      {proof.paymentEvent && <a className="buttonLink secondary" href={explorerUrl(proof.paymentEvent.args.paymentTxHash)}><ExternalLink size={16} />{text("支払い取引を個別確認", "Inspect payment transaction")}</a>}
      <p className="muted">{text(`表示用短縮値: ${short(hash)}。QR証明書はSBTのミントではありません。`, `Short reference: ${short(hash)}. The QR certificate is not a minted SBT.`)}</p></section>
    </>}
  </main>;
}
