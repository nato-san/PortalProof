import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle2, Copy, ExternalLink, FileCheck2, Link2, Wallet } from "lucide-react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import { PORTALPROOF_ABI } from "./contract.js";
import {
  PORTALDOT_V3,
  buildProofs,
  emptyDraft,
  validateTxEvidence
} from "./domain.js";
import "./styles.css";

const contractAddress = import.meta.env.VITE_PORTALPROOF_CONTRACT_ADDRESS || "";
const short = (value) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "";

const messages = {
  en: {
    languageSwitcher: "Language",
    eyebrow: "Portaldot Hacker House 2026 / Ecosystem DApps",
    tagline: "A creator request URL, order proof NFT, delivery record, and payment evidence certificate for the Portaldot V3 testnet.",
    connectWallet: "Connect wallet",
    status: "Status",
    ready: "Ready for the Portaldot V3 testnet.",
    walletRequired: "MetaMask or another EVM wallet is required.",
    connected: "Connected: {address}",
    contractNotConfigured: "Set VITE_PORTALPROOF_CONTRACT_ADDRESS after deployment.",
    creatingOrder: "Creating order proof: {hash}",
    orderCreated: "Order proof created. Order ID: {orderId}",
    checkExplorer: "check the explorer",
    recordingDelivery: "Recording delivery: {hash}",
    deliveryRecorded: "Delivery proof recorded on the Portaldot V3 testnet.",
    paymentIncomplete: "Payment evidence is incomplete. Do not record an arbitrary transaction hash.",
    recordingPayment: "Recording verified payment evidence: {hash}",
    paymentRecorded: "Payment evidence recorded. Reviewers should still verify the referenced transfer.",
    copied: "Copied.",
    error: "Error",
    creatorRequest: "1. Creator request",
    creatorName: "Creator name",
    serviceName: "Service name",
    creatorWallet: "Creator wallet",
    clientName: "Client name",
    clientWallet: "Client wallet",
    requestBrief: "Request brief",
    agreementHash: "2. Agreement hash",
    amount: "Amount in tPOTv3",
    deadline: "Deadline",
    termsHash: "Terms hash",
    copyTermsHash: "Copy terms hash",
    mintOrder: "Mint order proof on Portaldot V3",
    deployFirst: "Deploy the contract and set VITE_PORTALPROOF_CONTRACT_ADDRESS first.",
    delivery: "3. Delivery",
    orderId: "Order ID",
    createdAfterMint: "Created after minting",
    deliveryUrl: "Delivery URL",
    deliveryHash: "Delivery hash",
    recordDelivery: "Record delivery",
    paymentEvidence: "4. Payment evidence",
    paymentTxHash: "Payment transaction hash",
    hasHash: "Valid transaction hash format",
    hasExpectedFrom: "Expected sender is present",
    hasExpectedTo: "Expected recipient is present",
    hasExpectedAmount: "Expected amount is present",
    recordPayment: "Record verified payment evidence",
    paymentWarning: "A transaction hash alone is not treated as proof. The reviewer or verifier must confirm the sender, recipient, amount, and success status on Portaldot V3.",
    certificatePreview: "Certificate preview",
    creator: "Creator",
    client: "Client",
    contract: "Contract",
    order: "Order",
    terms: "Terms",
    payment: "Payment",
    notDeployed: "not deployed yet",
    notMinted: "not minted yet",
    notRecorded: "not recorded yet",
    qrAlt: "Payment transaction QR code",
    activityLog: "On-chain activity log",
    noActivity: "No testnet transaction in this browser session yet."
  },
  ja: {
    languageSwitcher: "言語",
    eyebrow: "Portaldot Hacker House 2026／エコシステムDApps部門",
    tagline: "Portaldot V3テストネット上で、クリエイターへの依頼受付、発注証明NFT、納品記録、支払い証跡付き証明書を提供します。",
    connectWallet: "ウォレットを接続",
    status: "状態",
    ready: "Portaldot V3テストネットを利用する準備ができています。",
    walletRequired: "MetaMaskまたはEVM対応ウォレットが必要です。",
    connected: "接続済み: {address}",
    contractNotConfigured: "デプロイ後にVITE_PORTALPROOF_CONTRACT_ADDRESSを設定してください。",
    creatingOrder: "発注証明を作成中: {hash}",
    orderCreated: "発注証明を作成しました。注文ID: {orderId}",
    checkExplorer: "エクスプローラーで確認",
    recordingDelivery: "納品を記録中: {hash}",
    deliveryRecorded: "Portaldot V3テストネットに納品証明を記録しました。",
    paymentIncomplete: "支払い証跡が不足しています。任意のトランザクションハッシュを記録することはできません。",
    recordingPayment: "検証済み支払い証跡を記録中: {hash}",
    paymentRecorded: "支払い証跡を記録しました。参照先の送金内容は審査員も確認する必要があります。",
    copied: "コピーしました。",
    error: "エラー",
    creatorRequest: "1. クリエイターへの依頼",
    creatorName: "クリエイター名",
    serviceName: "サービス名",
    creatorWallet: "クリエイターのウォレット",
    clientName: "依頼者名",
    clientWallet: "依頼者のウォレット",
    requestBrief: "依頼内容",
    agreementHash: "2. 合意条件のハッシュ",
    amount: "金額（tPOTv3）",
    deadline: "納期",
    termsHash: "合意条件ハッシュ",
    copyTermsHash: "合意条件ハッシュをコピー",
    mintOrder: "Portaldot V3上で発注証明を発行",
    deployFirst: "先にコントラクトをデプロイし、VITE_PORTALPROOF_CONTRACT_ADDRESSを設定してください。",
    delivery: "3. 納品",
    orderId: "注文ID",
    createdAfterMint: "発行後に作成されます",
    deliveryUrl: "納品URL",
    deliveryHash: "納品ハッシュ",
    recordDelivery: "納品を記録",
    paymentEvidence: "4. 支払い証跡",
    paymentTxHash: "支払いトランザクションハッシュ",
    hasHash: "トランザクションハッシュの形式",
    hasExpectedFrom: "想定する送金元",
    hasExpectedTo: "想定する送金先",
    hasExpectedAmount: "想定する金額",
    recordPayment: "検証済みの支払い証跡を記録",
    paymentWarning: "トランザクションハッシュだけでは支払い証明として扱いません。審査員または検証者が、Portaldot V3上の送金元、送金先、金額、成功状態を確認する必要があります。",
    certificatePreview: "証明書プレビュー",
    creator: "クリエイター",
    client: "依頼者",
    contract: "コントラクト",
    order: "注文",
    terms: "合意条件",
    payment: "支払い",
    notDeployed: "未デプロイ",
    notMinted: "未発行",
    notRecorded: "未記録",
    qrAlt: "支払いトランザクションのQRコード",
    activityLog: "オンチェーン活動ログ",
    noActivity: "このブラウザセッションにはテストネットのトランザクションがまだありません。"
  }
};

const checkMessageKeys = {
  hasHash: "hasHash",
  hasExpectedFrom: "hasExpectedFrom",
  hasExpectedTo: "hasExpectedTo",
  hasExpectedAmount: "hasExpectedAmount"
};

function translate(language, key, values = {}) {
  const template = messages[language][key] || messages.en[key] || key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    template
  );
}

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem("portalproof-language") || "en");
  const [draft, setDraft] = useState(emptyDraft());
  const [proofs, setProofs] = useState(null);
  const [wallet, setWallet] = useState("");
  const [orderId, setOrderId] = useState("");
  const [events, setEvents] = useState([]);
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState({ key: "ready" });
  const t = (key, values) => translate(language, key, values);

  const paymentEvidence = useMemo(() => validateTxEvidence({
    paymentTxHash: draft.paymentTxHash,
    expectedFrom: draft.clientWallet,
    expectedTo: draft.creatorWallet,
    expectedAmount: draft.amount
  }), [draft]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("portalproof-language", language);
  }, [language]);

  useEffect(() => {
    buildProofs(draft).then(setProofs);
  }, [draft]);

  useEffect(() => {
    const value = draft.paymentTxHash
      ? `https://node-console.feso-apps.xyz/#/explorer/query/${draft.paymentTxHash}`
      : "PortalProof";
    QRCode.toDataURL(value, { margin: 1, width: 180 }).then(setQr);
  }, [draft.paymentTxHash]);

  const update = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus({ key: "walletRequired" });
      return;
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [PORTALDOT_V3]
    });
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);
    setDraft((current) => ({
      ...current,
      clientWallet: current.clientWallet || accounts[0]
    }));
    setStatus({ key: "connected", values: { address: accounts[0] } });
  }

  async function getSignerContract() {
    if (!contractAddress) throw new Error(t("contractNotConfigured"));
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, PORTALPROOF_ABI, signer);
  }

  async function createOnChainOrder() {
    try {
      const contract = await getSignerContract();
      const amount = ethers.parseUnits(String(draft.amount), 14);
      const tx = await contract.createOrder(
        draft.clientWallet,
        draft.creatorWallet,
        amount,
        proofs.termsHash
      );
      setStatus({ key: "creatingOrder", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((item) => item?.name === "OrderCreated");
      const newOrderId = event?.args?.orderId?.toString() || "";
      setOrderId(newOrderId);
      setEvents((items) => [{ label: "OrderCreated", txHash: receipt.hash }, ...items]);
      setStatus({
        key: "orderCreated",
        values: { orderId: newOrderId || t("checkExplorer") }
      });
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  async function markDelivered() {
    try {
      const contract = await getSignerContract();
      const certificateURI = `${location.origin}/certificate/${orderId || "pending"}`;
      const tx = await contract.markDelivered(orderId, proofs.deliveryHash, certificateURI);
      setStatus({ key: "recordingDelivery", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      setEvents((items) => [{ label: "DeliverySubmitted", txHash: receipt.hash }, ...items]);
      setStatus({ key: "deliveryRecorded" });
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  async function recordPayment() {
    if (!paymentEvidence.ok) {
      setStatus({ key: "paymentIncomplete" });
      return;
    }
    try {
      const contract = await getSignerContract();
      const tx = await contract.recordVerifiedPayment(orderId, paymentEvidence.normalized);
      setStatus({ key: "recordingPayment", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      setEvents((items) => [{ label: "PaymentRecorded", txHash: receipt.hash }, ...items]);
      setStatus({ key: "paymentRecorded" });
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  function copy(value) {
    navigator.clipboard?.writeText(value);
    setStatus({ key: "copied" });
  }

  const statusText = `${t(status.key, status.values)}${status.detail ? `: ${status.detail}` : ""}`;

  return (
    <main className="shell">
      <nav className="languageBar" aria-label={t("languageSwitcher")}>
        <span>{t("languageSwitcher")}</span>
        <div className="languageToggle">
          <button
            className={language === "en" ? "active" : ""}
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
          <button
            className={language === "ja" ? "active" : ""}
            aria-pressed={language === "ja"}
            onClick={() => setLanguage("ja")}
          >
            日本語
          </button>
        </div>
      </nav>

      <header className="hero">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>PortalProof</h1>
          <p>{t("tagline")}</p>
        </div>
        <button className="primary" onClick={connectWallet}>
          <Wallet size={18} />
          {wallet ? short(wallet) : t("connectWallet")}
        </button>
      </header>

      <section className="notice" role="status" aria-live="polite">
        <strong>{t("status")}</strong>
        <span>{statusText}</span>
      </section>

      <section className="grid">
        <section className="panel">
          <h2>{t("creatorRequest")}</h2>
          <label>{t("creatorName")}<input value={draft.creatorName} onChange={update("creatorName")} /></label>
          <label>{t("serviceName")}<input value={draft.serviceName} onChange={update("serviceName")} /></label>
          <label>{t("creatorWallet")}<input value={draft.creatorWallet} onChange={update("creatorWallet")} placeholder="0x..." /></label>
          <label>{t("clientName")}<input value={draft.clientName} onChange={update("clientName")} /></label>
          <label>{t("clientWallet")}<input value={draft.clientWallet} onChange={update("clientWallet")} placeholder="0x..." /></label>
          <label>{t("requestBrief")}<textarea value={draft.requestBrief} onChange={update("requestBrief")} /></label>
        </section>

        <section className="panel">
          <h2>{t("agreementHash")}</h2>
          <label>{t("amount")}<input value={draft.amount} onChange={update("amount")} /></label>
          <label>{t("deadline")}<input value={draft.deadline} onChange={update("deadline")} /></label>
          <div className="hashBox">
            <span>{t("termsHash")}</span>
            <code>{proofs?.termsHash}</code>
            <button className="icon" aria-label={t("copyTermsHash")} title={t("copyTermsHash")} onClick={() => copy(proofs?.termsHash || "")}><Copy size={16} /></button>
          </div>
          <button className="primary wide" onClick={createOnChainOrder} disabled={!contractAddress}>
            <FileCheck2 size={18} />
            {t("mintOrder")}
          </button>
          {!contractAddress && <p className="muted">{t("deployFirst")}</p>}
        </section>

        <section className="panel">
          <h2>{t("delivery")}</h2>
          <label>{t("orderId")}<input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder={t("createdAfterMint")} /></label>
          <label>{t("deliveryUrl")}<input value={draft.deliveryUrl} onChange={update("deliveryUrl")} /></label>
          <div className="hashBox">
            <span>{t("deliveryHash")}</span>
            <code>{proofs?.deliveryHash}</code>
          </div>
          <button className="secondary wide" onClick={markDelivered} disabled={!orderId || !contractAddress}>
            <Link2 size={18} />
            {t("recordDelivery")}
          </button>
        </section>

        <section className="panel">
          <h2>{t("paymentEvidence")}</h2>
          <label>{t("paymentTxHash")}<input value={draft.paymentTxHash} onChange={update("paymentTxHash")} placeholder="0x..." /></label>
          <ul className="checks">
            {Object.entries(paymentEvidence.checks).map(([key, value]) => (
              <li key={key} className={value ? "ok" : ""}><CheckCircle2 size={15} />{t(checkMessageKeys[key])}</li>
            ))}
          </ul>
          <button className="secondary wide" onClick={recordPayment} disabled={!orderId || !contractAddress}>
            {t("recordPayment")}
          </button>
          <p className="muted">{t("paymentWarning")}</p>
        </section>
      </section>

      <section className="certificate">
        <div>
          <p className="eyebrow">{t("certificatePreview")}</p>
          <h2>{draft.serviceName}</h2>
          <dl>
            <dt>{t("creator")}</dt><dd>{draft.creatorName}</dd>
            <dt>{t("client")}</dt><dd>{draft.clientName}</dd>
            <dt>{t("contract")}</dt><dd>{contractAddress || t("notDeployed")}</dd>
            <dt>{t("order")}</dt><dd>{orderId || t("notMinted")}</dd>
            <dt>{t("terms")}</dt><dd><code>{proofs?.termsHash}</code></dd>
            <dt>{t("payment")}</dt><dd><code>{draft.paymentTxHash || t("notRecorded")}</code></dd>
          </dl>
        </div>
        {qr && <img src={qr} alt={t("qrAlt")} />}
      </section>

      <section className="panel">
        <h2>{t("activityLog")}</h2>
        {events.length === 0 ? <p className="muted">{t("noActivity")}</p> : (
          <div className="events">
            {events.map((event) => (
              <a key={`${event.label}-${event.txHash}`} href={`https://node-console.feso-apps.xyz/#/explorer/query/${event.txHash}`}>
                <ExternalLink size={16} />
                {event.label}: {event.txHash}
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
