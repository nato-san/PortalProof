import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Check, CheckCircle2, Copy, ExternalLink, FileCheck2, Link2, Wallet } from "lucide-react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import { PORTALPROOF_ABI } from "./contract.js";
import {
  PORTALDOT_V3, buildCreatorRequestUrl, buildProofs, buildWorkflowUrl, emptyDraft,
  readCreatorRequestUrl, readWorkflowUrl, validateTxEvidence
} from "./domain.js";
import "./styles.css";

const contractAddress = import.meta.env.VITE_PORTALPROOF_CONTRACT_ADDRESS || "";
const short = (value) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "";

const messages = {
  en: {
    eyebrow: "Portaldot Hacker House 2026 / Ecosystem DApps", connectWallet: "Connect wallet", status: "Status",
    ready: "Ready for the Portaldot V3 testnet.", walletRequired: "MetaMask or another EVM wallet is required.", connected: "Connected: {address}",
    contractNotConfigured: "Set VITE_PORTALPROOF_CONTRACT_ADDRESS after deployment.", creatingOrder: "Creating order proof: {hash}",
    orderCreated: "Order proof created. Order ID: {orderId}", checkExplorer: "check the explorer", recordingDelivery: "Recording delivery: {hash}",
    deliveryRecorded: "Delivery proof recorded on the Portaldot V3 testnet.", paymentIncomplete: "Payment evidence is incomplete. Do not record an arbitrary transaction hash.",
    recordingPayment: "Recording verified payment evidence: {hash}", paymentRecorded: "Payment evidence recorded. Reviewers should still verify the referenced transfer.",
    copied: "Copied.", requestLinkCopied: "Creator request link copied.", error: "Error",
    stepSetup: "Create page", stepRequest: "Send request", stepManage: "Manage job", stepSetupHelp: "Create your service page",
    stepRequestHelp: "Client sends a brief", stepManageHelp: "Record proof and delivery",
    creatorSetup: "Create your request page", creatorSetupHelp: "Enter one service offering. PortalProof turns it into a dedicated page you can share with clients.",
    setupTip: "Copy this link to your website, portfolio, or social profile. Clients will only see the request form.",
    requestLabel: "PortalProof request", requestFrom: "Request {service} from {creator}", requestFromHelp: "Review the service, then tell the creator what you need.",
    createYourOwn: "Create your own request page", creatorName: "Creator name", serviceName: "Service name", serviceDescription: "Service description",
    creatorWallet: "Creator wallet", referenceAmount: "Reference price in tPOTv3", requestLink: "Your client-facing request link",
    copyRequestLink: "Copy request link", openRequestLink: "Preview client page", requestLinkRequirements: "Enter a creator name, service name, and valid creator wallet to activate the link.",
    clientRequest: "Send a request", clientRequestHelp: "Your details are carried into the agreement review page.", clientName: "Client name", clientWallet: "Client wallet",
    requestBrief: "What would you like the creator to make?", amount: "Agreed amount in tPOTv3", deadline: "Requested deadline",
    continueToAgreement: "Review agreement", requestRequirements: "Enter your name, a valid wallet, and request details to continue.",
    manageTitle: "Manage this request", manageHelp: "Work through one stage at a time. Only the current task is shown below.", summary: "Request summary",
    agreementTab: "Agreement", deliveryTab: "Delivery", paymentTab: "Payment", certificateTab: "Certificate",
    agreementHash: "Agreement proof", agreementHelp: "Confirm the request summary before creating its on-chain order proof.", termsHash: "Terms hash",
    copyTermsHash: "Copy terms hash", mintOrder: "Mint order proof on Portaldot V3", deployFirst: "Deploy the contract and set VITE_PORTALPROOF_CONTRACT_ADDRESS first.",
    agreementRequirements: "Complete both wallet addresses and the request details before minting.",
    delivery: "Record delivery", deliveryHelp: "Add the delivery URL. PortalProof records its hash, not the file itself.", orderId: "Order ID",
    createdAfterMint: "Created after minting", deliveryUrl: "Delivery URL", deliveryHash: "Delivery hash", recordDelivery: "Record delivery",
    paymentEvidence: "Record payment evidence", paymentHelp: "Reference the real transfer made by the client after checking its details.",
    paymentTxHash: "Payment transaction hash", hasHash: "Valid transaction hash format", hasExpectedFrom: "Expected sender is present",
    hasExpectedTo: "Expected recipient is present", hasExpectedAmount: "Expected amount is present", recordPayment: "Record verified payment evidence",
    paymentWarning: "A transaction hash alone is not proof. Verify the sender, recipient, amount, and success status on Portaldot V3.",
    certificatePreview: "Proof certificate", certificateHelp: "This is the compact evidence view for the completed creator request.", creator: "Creator", client: "Client",
    contract: "Contract", order: "Order", terms: "Terms", payment: "Payment", notDeployed: "not deployed yet", notMinted: "not minted yet",
    notRecorded: "not recorded yet", qrAlt: "Payment transaction QR code", activityLog: "On-chain activity", noActivity: "No testnet transaction in this browser session yet."
  },
  ja: {
    eyebrow: "Portaldot Hacker House 2026／エコシステムDApps部門", connectWallet: "ウォレットを接続", status: "状態",
    ready: "Portaldot V3テストネットを利用する準備ができています。", walletRequired: "MetaMaskまたはEVM対応ウォレットが必要です。", connected: "接続済み: {address}",
    contractNotConfigured: "デプロイ後にVITE_PORTALPROOF_CONTRACT_ADDRESSを設定してください。", creatingOrder: "発注証明を作成中: {hash}",
    orderCreated: "発注証明を作成しました。注文ID: {orderId}", checkExplorer: "エクスプローラーで確認", recordingDelivery: "納品を記録中: {hash}",
    deliveryRecorded: "Portaldot V3テストネットに納品証明を記録しました。", paymentIncomplete: "支払い証跡が不足しています。任意のトランザクションハッシュは記録できません。",
    recordingPayment: "検証済み支払い証跡を記録中: {hash}", paymentRecorded: "支払い証跡を記録しました。参照先の送金内容は審査員も確認する必要があります。",
    copied: "コピーしました。", requestLinkCopied: "クリエイターの依頼受付リンクをコピーしました。", error: "エラー",
    stepSetup: "受付を作る", stepRequest: "依頼を送る", stepManage: "案件を管理", stepSetupHelp: "サービスページを作成",
    stepRequestHelp: "依頼者が内容を送信", stepManageHelp: "発注・納品・支払いを記録",
    creatorSetup: "依頼受付ページを作成", creatorSetupHelp: "受け付けるサービスを1つ入力します。依頼者へ共有できる専用ページをPortalProofが作成します。",
    setupTip: "このリンクをWebサイト、ポートフォリオ、SNSに掲載します。依頼者には依頼フォームだけが表示されます。",
    requestLabel: "PortalProofへの依頼", requestFrom: "{creator}へ「{service}」を依頼", requestFromHelp: "サービス内容を確認して、希望する制作内容を送ってください。",
    createYourOwn: "自分の依頼受付ページを作る", creatorName: "クリエイター名", serviceName: "サービス名", serviceDescription: "サービス説明",
    creatorWallet: "クリエイターのウォレット", referenceAmount: "参考価格（tPOTv3）", requestLink: "依頼者に見せる受付リンク",
    copyRequestLink: "受付リンクをコピー", openRequestLink: "依頼者ページを確認", requestLinkRequirements: "クリエイター名、サービス名、有効なウォレットを入力するとリンクを利用できます。",
    clientRequest: "依頼を送る", clientRequestHelp: "入力内容は、次の合意内容確認ページへ引き継がれます。", clientName: "依頼者名", clientWallet: "依頼者のウォレット",
    requestBrief: "何を作ってほしいですか？", amount: "合意金額（tPOTv3）", deadline: "希望納期", continueToAgreement: "合意内容を確認",
    requestRequirements: "名前、有効なウォレット、依頼内容を入力すると次へ進めます。", manageTitle: "この依頼を管理",
    manageHelp: "現在の作業を1つずつ進めます。選択中の工程だけを下に表示します。", summary: "依頼概要",
    agreementTab: "合意", deliveryTab: "納品", paymentTab: "支払い", certificateTab: "証明書", agreementHash: "合意内容の証明",
    agreementHelp: "依頼概要を確認してから、オンチェーンの発注証明を作成します。", termsHash: "合意条件ハッシュ", copyTermsHash: "合意条件ハッシュをコピー",
    mintOrder: "Portaldot V3上で発注証明を発行", deployFirst: "先にコントラクトをデプロイし、VITE_PORTALPROOF_CONTRACT_ADDRESSを設定してください。",
    agreementRequirements: "発行前に、双方のウォレットと依頼内容を入力してください。",
    delivery: "納品を記録", deliveryHelp: "納品先URLを入力します。ファイル自体ではなく、そのハッシュを記録します。", orderId: "注文ID",
    createdAfterMint: "発行後に作成されます", deliveryUrl: "納品URL", deliveryHash: "納品ハッシュ", recordDelivery: "納品を記録",
    paymentEvidence: "支払い証跡を記録", paymentHelp: "依頼者から実際に行われた送金の内容を確認して記録します。", paymentTxHash: "支払いトランザクションハッシュ",
    hasHash: "トランザクションハッシュの形式", hasExpectedFrom: "想定する送金元", hasExpectedTo: "想定する送金先", hasExpectedAmount: "想定する金額",
    recordPayment: "検証済みの支払い証跡を記録", paymentWarning: "ハッシュだけでは支払い証明になりません。Portaldot V3上の送金元、送金先、金額、成功状態を確認してください。",
    certificatePreview: "証明書", certificateHelp: "完了した依頼の証跡をまとめて確認する画面です。", creator: "クリエイター", client: "依頼者",
    contract: "コントラクト", order: "注文", terms: "合意条件", payment: "支払い", notDeployed: "未デプロイ", notMinted: "未発行", notRecorded: "未記録",
    qrAlt: "支払いトランザクションのQRコード", activityLog: "オンチェーン活動", noActivity: "このブラウザセッションにはテストネットの取引がまだありません。"
  }
};

const checkMessageKeys = { hasHash: "hasHash", hasExpectedFrom: "hasExpectedFrom", hasExpectedTo: "hasExpectedTo", hasExpectedAmount: "hasExpectedAmount" };
function translate(language, key, values = {}) {
  const template = messages[language][key] || messages.en[key] || key;
  return Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), template);
}

function App() {
  const creatorRequest = readCreatorRequestUrl(location.href);
  const workflowRequest = readWorkflowUrl(location.href);
  const page = workflowRequest ? "manage" : creatorRequest ? "request" : "setup";
  const [language, setLanguage] = useState(() => localStorage.getItem("portalproof-language") || "en");
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(), ...(creatorRequest || workflowRequest || {}), ...(creatorRequest ? { clientName: "", clientWallet: "", requestBrief: "" } : {}) }));
  const [proofs, setProofs] = useState(null);
  const [wallet, setWallet] = useState("");
  const [orderId, setOrderId] = useState("");
  const [events, setEvents] = useState([]);
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState({ key: "ready" });
  const [manageStage, setManageStage] = useState("agreement");
  const t = (key, values) => translate(language, key, values);
  const baseUrl = `${location.origin}${location.pathname}`;
  const requestLinkReady = Boolean(draft.creatorName && draft.serviceName && ethers.isAddress(draft.creatorWallet));
  const requestReady = Boolean(draft.clientName && draft.requestBrief && ethers.isAddress(draft.clientWallet));
  const agreementReady = Boolean(requestReady && ethers.isAddress(draft.creatorWallet));
  const requestUrl = useMemo(() => buildCreatorRequestUrl(baseUrl, draft), [draft.creatorName, draft.serviceName, draft.serviceDescription, draft.creatorWallet, draft.amount]);
  const workflowUrl = useMemo(() => buildWorkflowUrl(baseUrl, draft), [draft.creatorName, draft.serviceName, draft.serviceDescription, draft.creatorWallet, draft.clientName, draft.clientWallet, draft.requestBrief, draft.amount, draft.deadline]);
  const paymentEvidence = useMemo(() => validateTxEvidence({ paymentTxHash: draft.paymentTxHash, expectedFrom: draft.clientWallet, expectedTo: draft.creatorWallet, expectedAmount: draft.amount }), [draft]);

  useEffect(() => { document.documentElement.lang = language; localStorage.setItem("portalproof-language", language); }, [language]);
  useEffect(() => { buildProofs(draft).then(setProofs); }, [draft]);
  useEffect(() => {
    const value = draft.paymentTxHash ? `https://node-console.feso-apps.xyz/#/explorer/query/${draft.paymentTxHash}` : "PortalProof";
    QRCode.toDataURL(value, { margin: 1, width: 180 }).then(setQr);
  }, [draft.paymentTxHash]);

  const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  async function connectWallet() {
    if (!window.ethereum) return setStatus({ key: "walletRequired" });
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [PORTALDOT_V3] });
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);
    setDraft((current) => ({ ...current, ...(page === "setup" ? { creatorWallet: current.creatorWallet || accounts[0] } : { clientWallet: current.clientWallet || accounts[0] }) }));
    setStatus({ key: "connected", values: { address: accounts[0] } });
  }
  async function getSignerContract() {
    if (!contractAddress) throw new Error(t("contractNotConfigured"));
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(contractAddress, PORTALPROOF_ABI, await provider.getSigner());
  }
  async function createOnChainOrder() {
    try {
      const contract = await getSignerContract();
      const tx = await contract.createOrder(draft.clientWallet, draft.creatorWallet, ethers.parseUnits(String(draft.amount), 14), proofs.termsHash);
      setStatus({ key: "creatingOrder", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      const event = receipt.logs.map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } }).find((item) => item?.name === "OrderCreated");
      const newOrderId = event?.args?.orderId?.toString() || "";
      setOrderId(newOrderId); setEvents((items) => [{ label: "OrderCreated", txHash: receipt.hash }, ...items]);
      setStatus({ key: "orderCreated", values: { orderId: newOrderId || t("checkExplorer") } }); setManageStage("delivery");
    } catch (error) { setStatus({ key: "error", detail: error.message }); }
  }
  async function markDelivered() {
    try {
      const contract = await getSignerContract();
      const tx = await contract.markDelivered(orderId, proofs.deliveryHash, `${location.origin}/certificate/${orderId || "pending"}`);
      setStatus({ key: "recordingDelivery", values: { hash: tx.hash } }); const receipt = await tx.wait();
      setEvents((items) => [{ label: "DeliverySubmitted", txHash: receipt.hash }, ...items]); setStatus({ key: "deliveryRecorded" }); setManageStage("payment");
    } catch (error) { setStatus({ key: "error", detail: error.message }); }
  }
  async function recordPayment() {
    if (!paymentEvidence.ok) return setStatus({ key: "paymentIncomplete" });
    try {
      const contract = await getSignerContract(); const tx = await contract.recordVerifiedPayment(orderId, paymentEvidence.normalized);
      setStatus({ key: "recordingPayment", values: { hash: tx.hash } }); const receipt = await tx.wait();
      setEvents((items) => [{ label: "PaymentRecorded", txHash: receipt.hash }, ...items]); setStatus({ key: "paymentRecorded" }); setManageStage("certificate");
    } catch (error) { setStatus({ key: "error", detail: error.message }); }
  }
  const copy = (value) => { navigator.clipboard?.writeText(value); setStatus({ key: "copied" }); };
  const copyRequestUrl = () => { navigator.clipboard?.writeText(requestUrl); setStatus({ key: "requestLinkCopied" }); };
  const statusText = `${t(status.key, status.values)}${status.detail ? `: ${status.detail}` : ""}`;
  const steps = [
    { id: "setup", label: t("stepSetup"), help: t("stepSetupHelp"), href: baseUrl },
    { id: "request", label: t("stepRequest"), help: t("stepRequestHelp"), href: requestUrl },
    { id: "manage", label: t("stepManage"), help: t("stepManageHelp"), href: workflowUrl }
  ];

  return <main className="shell">
    <nav className="topBar"><a className="brand" href={baseUrl}>PortalProof</a><div className="topActions"><div className="languageToggle"><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button><button className={language === "ja" ? "active" : ""} onClick={() => setLanguage("ja")}>日本語</button></div><button className="primary" onClick={connectWallet}><Wallet size={17}/>{wallet ? short(wallet) : t("connectWallet")}</button></div></nav>
    <header className="hero compactHero"><div><p className="eyebrow">{t("eyebrow")}</p><h1>{page === "setup" ? t("creatorSetup") : page === "request" ? t("clientRequest") : t("manageTitle")}</h1><p>{page === "setup" ? t("creatorSetupHelp") : page === "request" ? t("requestFromHelp") : t("manageHelp")}</p></div></header>
    <nav className="journey">{steps.map((step, index) => {
      const done = page === "manage" || (page === "request" && index === 0);
      const content = <><span className="stepNumber">{done && page !== step.id ? <Check size={16}/> : index + 1}</span><span><strong>{step.label}</strong><small>{step.help}</small></span></>;
      return step.href && step.id !== page ? <a key={step.id} href={step.href} className="journeyStep complete">{content}</a> : <div key={step.id} className={`journeyStep ${page === step.id ? "current" : "locked"}`}>{content}</div>;
    })}</nav>
    <section className="notice" role="status"><strong>{t("status")}</strong><span>{statusText}</span></section>

    {page === "setup" && <section className="pageGrid setupLayout">
      <section className="panel formPanel"><label>{t("creatorName")}<input value={draft.creatorName} onChange={update("creatorName")}/></label><label>{t("serviceName")}<input value={draft.serviceName} onChange={update("serviceName")}/></label><label>{t("serviceDescription")}<textarea value={draft.serviceDescription} onChange={update("serviceDescription")}/></label><div className="fieldRow"><label>{t("creatorWallet")}<input value={draft.creatorWallet} onChange={update("creatorWallet")} placeholder="0x..."/></label><label>{t("referenceAmount")}<input value={draft.amount} onChange={update("amount")}/></label></div></section>
      <aside className="panel actionPanel"><h2>{t("requestLink")}</h2><p className="muted">{requestLinkReady ? t("setupTip") : t("requestLinkRequirements")}</p><div className="requestLinkBox"><input readOnly value={requestLinkReady ? requestUrl : ""} placeholder={t("requestLinkRequirements")}/><button className="primary wide" onClick={copyRequestUrl} disabled={!requestLinkReady}><Copy size={16}/>{t("copyRequestLink")}</button><a className={`buttonLink secondary${requestLinkReady ? "" : " disabled"}`} href={requestLinkReady ? requestUrl : undefined}><ExternalLink size={16}/>{t("openRequestLink")}</a></div></aside>
    </section>}

    {page === "request" && <section className="pageGrid requestLayout">
      <section className="panel serviceCard"><p className="eyebrow">{t("requestLabel")}</p><h2>{t("requestFrom", { creator: draft.creatorName, service: draft.serviceName })}</h2><p>{draft.serviceDescription}</p><dl><dt>{t("creator")}</dt><dd>{draft.creatorName}</dd><dt>{t("referenceAmount")}</dt><dd>{draft.amount} tPOTv3</dd><dt>{t("creatorWallet")}</dt><dd><code>{draft.creatorWallet}</code></dd></dl><a className="textLink" href={baseUrl}>{t("createYourOwn")}</a></section>
      <section className="panel formPanel"><h2>{t("clientRequest")}</h2><p className="muted">{t("clientRequestHelp")}</p><label>{t("clientName")}<input value={draft.clientName} onChange={update("clientName")}/></label><label>{t("clientWallet")}<input value={draft.clientWallet} onChange={update("clientWallet")} placeholder="0x..."/></label><label>{t("requestBrief")}<textarea value={draft.requestBrief} onChange={update("requestBrief")}/></label><div className="fieldRow"><label>{t("amount")}<input value={draft.amount} onChange={update("amount")}/></label><label>{t("deadline")}<input type="date" value={draft.deadline} onChange={update("deadline")}/></label></div><a className={`buttonLink primary wide${requestReady ? "" : " disabled"}`} href={requestReady ? workflowUrl : undefined}>{t("continueToAgreement")}<ArrowRight size={17}/></a>{!requestReady && <p className="formHint">{t("requestRequirements")}</p>}</section>
    </section>}

    {page === "manage" && <section className="manageLayout">
      <aside className="panel requestSidebar"><p className="eyebrow">{t("summary")}</p><h2>{draft.serviceName}</h2><dl><dt>{t("creator")}</dt><dd>{draft.creatorName}</dd><dt>{t("client")}</dt><dd>{draft.clientName}</dd><dt>{t("amount")}</dt><dd>{draft.amount} tPOTv3</dd><dt>{t("deadline")}</dt><dd>{draft.deadline}</dd></dl><p className="briefText">{draft.requestBrief}</p><div className="activityCompact"><strong>{t("activityLog")}</strong>{events.length === 0 ? <small>{t("noActivity")}</small> : events.map((event) => <a key={event.txHash} href={`https://node-console.feso-apps.xyz/#/explorer/query/${event.txHash}`} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{event.label}</a>)}</div></aside>
      <div className="workflowArea"><nav className="stageTabs">{["agreement", "delivery", "payment", "certificate"].map((stage, index) => <button key={stage} className={manageStage === stage ? "active" : ""} onClick={() => setManageStage(stage)}><span>{index + 1}</span>{t(`${stage}Tab`)}</button>)}</nav>
        {manageStage === "agreement" && <section className="panel stagePanel"><p className="eyebrow">1 / 4</p><h2>{t("agreementHash")}</h2><p className="muted">{t("agreementHelp")}</p><div className="hashBox"><span>{t("termsHash")}</span><code>{proofs?.termsHash}</code><button className="icon" aria-label={t("copyTermsHash")} onClick={() => copy(proofs?.termsHash || "")}><Copy size={16}/></button></div><button className="primary wide" onClick={createOnChainOrder} disabled={!contractAddress || !agreementReady}><FileCheck2 size={18}/>{t("mintOrder")}</button>{!contractAddress ? <p className="formHint">{t("deployFirst")}</p> : !agreementReady && <p className="formHint">{t("agreementRequirements")}</p>}</section>}
        {manageStage === "delivery" && <section className="panel stagePanel"><p className="eyebrow">2 / 4</p><h2>{t("delivery")}</h2><p className="muted">{t("deliveryHelp")}</p><label>{t("orderId")}<input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder={t("createdAfterMint")}/></label><label>{t("deliveryUrl")}<input value={draft.deliveryUrl} onChange={update("deliveryUrl")}/></label><div className="hashBox"><span>{t("deliveryHash")}</span><code>{proofs?.deliveryHash}</code></div><button className="secondary wide" onClick={markDelivered} disabled={!orderId || !contractAddress}><Link2 size={18}/>{t("recordDelivery")}</button></section>}
        {manageStage === "payment" && <section className="panel stagePanel"><p className="eyebrow">3 / 4</p><h2>{t("paymentEvidence")}</h2><p className="muted">{t("paymentHelp")}</p><label>{t("orderId")}<input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder={t("createdAfterMint")}/></label><label>{t("paymentTxHash")}<input value={draft.paymentTxHash} onChange={update("paymentTxHash")} placeholder="0x..."/></label><ul className="checks">{Object.entries(paymentEvidence.checks).map(([key, value]) => <li key={key} className={value ? "ok" : ""}><CheckCircle2 size={15}/>{t(checkMessageKeys[key])}</li>)}</ul><button className="secondary wide" onClick={recordPayment} disabled={!orderId || !contractAddress}>{t("recordPayment")}</button><p className="formHint">{t("paymentWarning")}</p></section>}
        {manageStage === "certificate" && <section className="panel stagePanel certificatePanel"><p className="eyebrow">4 / 4</p><h2>{t("certificatePreview")}</h2><p className="muted">{t("certificateHelp")}</p><div className="certificateBody"><dl><dt>{t("creator")}</dt><dd>{draft.creatorName}</dd><dt>{t("client")}</dt><dd>{draft.clientName}</dd><dt>{t("contract")}</dt><dd>{contractAddress || t("notDeployed")}</dd><dt>{t("order")}</dt><dd>{orderId || t("notMinted")}</dd><dt>{t("terms")}</dt><dd><code>{proofs?.termsHash}</code></dd><dt>{t("payment")}</dt><dd><code>{draft.paymentTxHash || t("notRecorded")}</code></dd></dl>{qr && <img src={qr} alt={t("qrAlt")}/>}</div></section>}
      </div>
    </section>}
  </main>;
}

createRoot(document.getElementById("root")).render(<App/>);
