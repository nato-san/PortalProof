import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardList, Copy,
  ExternalLink, FileCheck2, Home, Inbox, Link2, Send, Settings2, Wallet
} from "lucide-react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import { PORTALPROOF_ABI } from "./contract.js";
import {
  PORTALDOT_V3,
  buildCreatorRequestUrl,
  buildJobUrl,
  buildProofs,
  createRequestRecord,
  emptyDraft,
  readCreatorRequestUrl,
  readJobId,
  validateTxEvidence
} from "./domain.js";
import "./styles.css";

const contractAddress = import.meta.env.VITE_PORTALPROOF_CONTRACT_ADDRESS || "";
const REQUESTS_KEY = "portalproof-requests-v1";
const PROFILE_KEY = "portalproof-creator-profile-v1";
const short = (value) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "";

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function makeRequestId() {
  const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10);
  return `PP-${Date.now().toString(36).toUpperCase()}-${suffix.toUpperCase()}`;
}

const messages = {
  en: {
    eyebrow: "Portaldot Hacker House 2026 / Ecosystem DApps",
    creatorTop: "Creator home",
    creatorTopHelp: "Choose what you want to do as the creator.",
    creatorOnly: "Creator-only area",
    creatorOnlyHelp: "Clients do not receive a link back to this page from the public request page.",
    topCreateTitle: "Create a request offering",
    topCreateHelp: "Set the service, price, creator wallet, and public request link.",
    topManageTitle: "Manage your jobs",
    topManageHelp: "Review incoming requests and open each job workspace.",
    topRequestTitle: "View request page",
    topRequestHelp: "Preview the standalone page that clients open from your public link.",
    openPage: "Open page",
    backToTop: "Back to creator home",
    creatorDashboard: "Creator dashboard",
    creatorDashboardHelp: "Set up your request page and manage every client request in one place.",
    setupNav: "Request settings",
    setupNavHelp: "Create the public page",
    inboxNav: "Manage jobs",
    inboxNavHelp: "Review client briefs",
    connectWallet: "Connect wallet",
    status: "Status",
    ready: "Ready for the Portaldot V3 testnet.",
    walletRequired: "MetaMask or another EVM wallet is required.",
    connected: "Connected: {address}",
    copied: "Copied.",
    requestLinkCopied: "Public request link copied.",
    requestSaved: "Request received in the creator inbox.",
    error: "Error",
    creatorSetup: "Create your public request page",
    creatorSetupHelp: "Describe one service and publish a dedicated link for clients.",
    creatorName: "Creator name",
    serviceName: "Service name",
    serviceDescription: "Service description",
    creatorWallet: "Creator wallet",
    referenceAmount: "Reference price in tPOTv3",
    requestLink: "Public request link",
    requestLinkHelp: "Share this link on your website, portfolio, or social profile.",
    requestLinkRequirements: "A valid creator wallet is required before the link can be copied.",
    copyRequestLink: "Copy public link",
    previewRequestPage: "Preview request page",
    localStorageNote: "Prototype storage: requests submitted on this device are saved in this browser. Portaldot storage will replace this after testnet deployment.",
    incomingTitle: "Incoming requests",
    incomingHelp: "Each submission becomes a separate job. Open any request to manage its agreement, delivery, payment, and certificate.",
    emptyInbox: "No requests have arrived in this browser yet.",
    emptyInboxHelp: "Open the public request page, submit a test request, then return here.",
    openPublicPage: "Open public request page",
    newRequest: "New",
    activeRequest: "In progress",
    deliveredRequest: "Delivered",
    paidRequest: "Completed",
    openJob: "Open job",
    requestId: "Request ID",
    receivedAt: "Received",
    publicRequestLabel: "Creator request page",
    requestFrom: "Request {service} from {creator}",
    publicRequestHelp: "This page is for clients. Review the service and send one request to the creator.",
    clientRequest: "Send your request",
    clientRequestHelp: "The creator will receive this as a new item in their request inbox.",
    clientName: "Your name",
    clientWallet: "Your wallet",
    requestBrief: "What would you like the creator to make?",
    amount: "Proposed amount in tPOTv3",
    deadline: "Requested deadline",
    submitRequest: "Send request",
    requestRequirements: "Enter your name, a valid wallet, and request details to send.",
    submissionComplete: "Request sent",
    submissionCompleteHelp: "The request has been added to the creator inbox for this prototype.",
    keepRequestId: "Keep this request ID for reference.",
    sendAnother: "Send another request",
    jobNotFound: "Request not found",
    jobNotFoundHelp: "This request is not stored in this browser. Return to the inbox and select another request.",
    backToInbox: "Back to incoming requests",
    manageTitle: "Manage request",
    manageHelp: "This workspace belongs to one request. Other requests have their own separate workspace.",
    summary: "Request summary",
    agreementTab: "Agreement",
    deliveryTab: "Delivery",
    paymentTab: "Payment",
    certificateTab: "Certificate",
    agreementHash: "Agreement proof",
    agreementHelp: "Confirm the client brief before creating its on-chain order proof.",
    termsHash: "Terms hash",
    copyTermsHash: "Copy terms hash",
    mintOrder: "Mint order proof on Portaldot V3",
    deployFirst: "Deploy the contract and set VITE_PORTALPROOF_CONTRACT_ADDRESS first.",
    agreementRequirements: "Complete both wallet addresses and the request details before minting.",
    contractNotConfigured: "Set VITE_PORTALPROOF_CONTRACT_ADDRESS after deployment.",
    creatingOrder: "Creating order proof: {hash}",
    orderCreated: "Order proof created. Order ID: {orderId}",
    checkExplorer: "check the explorer",
    delivery: "Record delivery",
    deliveryHelp: "Add the delivery URL. PortalProof records its hash, not the file itself.",
    orderId: "Order ID",
    createdAfterMint: "Created after minting",
    deliveryUrl: "Delivery URL",
    deliveryHash: "Delivery hash",
    recordDelivery: "Record delivery",
    recordingDelivery: "Recording delivery: {hash}",
    deliveryRecorded: "Delivery proof recorded on the Portaldot V3 testnet.",
    paymentEvidence: "Record payment evidence",
    paymentHelp: "Reference the real transfer made by the client after checking its details.",
    paymentTxHash: "Payment transaction hash",
    hasHash: "Valid transaction hash format",
    hasExpectedFrom: "Expected sender is present",
    hasExpectedTo: "Expected recipient is present",
    hasExpectedAmount: "Expected amount is present",
    recordPayment: "Record verified payment evidence",
    paymentWarning: "A transaction hash alone is not proof. Verify the sender, recipient, amount, and success status on Portaldot V3.",
    paymentIncomplete: "Payment evidence is incomplete. Do not record an arbitrary transaction hash.",
    recordingPayment: "Recording verified payment evidence: {hash}",
    paymentRecorded: "Payment evidence recorded. Reviewers should still verify the referenced transfer.",
    certificatePreview: "Proof certificate",
    certificateHelp: "A compact evidence view for this creator request.",
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
    activityLog: "On-chain activity",
    noActivity: "No testnet transaction in this browser session yet."
  },
  ja: {
    eyebrow: "Portaldot Hacker House 2026／エコシステムDApps部門",
    creatorTop: "クリエイターTOP",
    creatorTopHelp: "クリエイターとして行う操作を選んでください。",
    creatorOnly: "クリエイター専用ページ",
    creatorOnlyHelp: "依頼者用の公開ページには、このTOPへ戻るリンクを表示しません。",
    topCreateTitle: "仕事の受付を作成",
    topCreateHelp: "サービス、価格、ウォレット、公開用の依頼受付リンクを設定します。",
    topManageTitle: "作成した仕事を管理",
    topManageHelp: "届いた依頼を確認し、依頼ごとの案件管理画面を開きます。",
    topRequestTitle: "依頼ページ",
    topRequestHelp: "依頼者が公開リンクから開く、独立した送信ページを確認します。",
    openPage: "ページを開く",
    backToTop: "クリエイターTOPへ戻る",
    creatorDashboard: "クリエイター管理画面",
    creatorDashboardHelp: "依頼受付ページの設定と、届いたすべての依頼を管理します。",
    setupNav: "受付設定",
    setupNavHelp: "公開ページを作成",
    inboxNav: "仕事を管理",
    inboxNavHelp: "依頼内容を確認",
    connectWallet: "ウォレットを接続",
    status: "状態",
    ready: "Portaldot V3テストネットを利用する準備ができています。",
    walletRequired: "MetaMaskまたはEVM対応ウォレットが必要です。",
    connected: "接続済み: {address}",
    copied: "コピーしました。",
    requestLinkCopied: "公開用の依頼受付リンクをコピーしました。",
    requestSaved: "クリエイターの依頼一覧に追加しました。",
    error: "エラー",
    creatorSetup: "公開用の依頼受付ページを作成",
    creatorSetupHelp: "受け付けるサービスを設定し、依頼者専用のリンクを発行します。",
    creatorName: "クリエイター名",
    serviceName: "サービス名",
    serviceDescription: "サービス説明",
    creatorWallet: "クリエイターのウォレット",
    referenceAmount: "参考価格（tPOTv3）",
    requestLink: "公開用の依頼受付リンク",
    requestLinkHelp: "Webサイト、ポートフォリオ、SNSへこのリンクを掲載します。",
    requestLinkRequirements: "リンクをコピーするには、有効なクリエイターウォレットが必要です。",
    copyRequestLink: "公開リンクをコピー",
    previewRequestPage: "依頼ページを確認",
    localStorageNote: "試作版の保存方式：この端末から送信した依頼は、このブラウザ内に保存されます。テストネットへのデプロイ後にPortaldot上の保存へ置き換えます。",
    incomingTitle: "届いた依頼",
    incomingHelp: "送信された依頼を別々の案件として表示します。依頼を選ぶと、合意・納品・支払い・証明書を個別に管理できます。",
    emptyInbox: "このブラウザには、まだ依頼が届いていません。",
    emptyInboxHelp: "依頼者用ページを開いて試しに依頼を送信し、ここへ戻ってください。",
    openPublicPage: "依頼者用ページを開く",
    newRequest: "新着",
    activeRequest: "進行中",
    deliveredRequest: "納品済み",
    paidRequest: "完了",
    openJob: "案件を開く",
    requestId: "依頼番号",
    receivedAt: "受付日時",
    publicRequestLabel: "クリエイターへの依頼受付",
    requestFrom: "{creator}へ「{service}」を依頼",
    publicRequestHelp: "ここは依頼者専用ページです。サービス内容を確認し、クリエイターへ依頼を送ってください。",
    clientRequest: "依頼を送信",
    clientRequestHelp: "送信すると、クリエイター側の「届いた依頼」へ新しい案件として追加されます。",
    clientName: "依頼者名",
    clientWallet: "依頼者のウォレット",
    requestBrief: "何を作ってほしいですか？",
    amount: "希望金額（tPOTv3）",
    deadline: "希望納期",
    submitRequest: "依頼を送信",
    requestRequirements: "名前、有効なウォレット、依頼内容を入力すると送信できます。",
    submissionComplete: "依頼を送信しました",
    submissionCompleteHelp: "試作版のクリエイター側依頼一覧へ追加しました。",
    keepRequestId: "確認用に依頼番号を控えてください。",
    sendAnother: "別の依頼を送る",
    jobNotFound: "依頼が見つかりません",
    jobNotFoundHelp: "このブラウザに保存されていない依頼です。依頼一覧へ戻り、別の依頼を選んでください。",
    backToInbox: "届いた依頼へ戻る",
    manageTitle: "案件を管理",
    manageHelp: "この画面は1件の依頼専用です。ほかの依頼には、それぞれ別の案件画面があります。",
    summary: "依頼概要",
    agreementTab: "合意",
    deliveryTab: "納品",
    paymentTab: "支払い",
    certificateTab: "証明書",
    agreementHash: "合意内容の証明",
    agreementHelp: "依頼内容を確認してから、オンチェーンの発注証明を作成します。",
    termsHash: "合意条件ハッシュ",
    copyTermsHash: "合意条件ハッシュをコピー",
    mintOrder: "Portaldot V3上で発注証明を発行",
    deployFirst: "先にコントラクトをデプロイし、VITE_PORTALPROOF_CONTRACT_ADDRESSを設定してください。",
    agreementRequirements: "発行前に、双方のウォレットと依頼内容を入力してください。",
    contractNotConfigured: "デプロイ後にVITE_PORTALPROOF_CONTRACT_ADDRESSを設定してください。",
    creatingOrder: "発注証明を作成中: {hash}",
    orderCreated: "発注証明を作成しました。注文ID: {orderId}",
    checkExplorer: "エクスプローラーで確認",
    delivery: "納品を記録",
    deliveryHelp: "納品先URLを入力します。ファイル自体ではなく、そのハッシュを記録します。",
    orderId: "注文ID",
    createdAfterMint: "発行後に作成されます",
    deliveryUrl: "納品URL",
    deliveryHash: "納品ハッシュ",
    recordDelivery: "納品を記録",
    recordingDelivery: "納品を記録中: {hash}",
    deliveryRecorded: "Portaldot V3テストネットに納品証明を記録しました。",
    paymentEvidence: "支払い証跡を記録",
    paymentHelp: "依頼者から実際に行われた送金の内容を確認して記録します。",
    paymentTxHash: "支払いトランザクションハッシュ",
    hasHash: "トランザクションハッシュの形式",
    hasExpectedFrom: "想定する送金元",
    hasExpectedTo: "想定する送金先",
    hasExpectedAmount: "想定する金額",
    recordPayment: "検証済みの支払い証跡を記録",
    paymentWarning: "ハッシュだけでは支払い証明になりません。Portaldot V3上の送金元、送金先、金額、成功状態を確認してください。",
    paymentIncomplete: "支払い証跡が不足しています。任意のトランザクションハッシュは記録できません。",
    recordingPayment: "検証済み支払い証跡を記録中: {hash}",
    paymentRecorded: "支払い証跡を記録しました。参照先の送金内容は審査員も確認する必要があります。",
    certificatePreview: "証明書",
    certificateHelp: "この依頼の証跡をまとめて確認する画面です。",
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
    activityLog: "オンチェーン活動",
    noActivity: "このブラウザセッションにはテストネットの取引がまだありません。"
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
  const baseUrl = `${location.origin}${location.pathname}`;
  const currentUrl = new URL(location.href);
  const publicProfile = readCreatorRequestUrl(location.href);
  const jobId = readJobId(location.href);
  const page = publicProfile ? "request" : jobId ? "job" : "dashboard";
  const view = currentUrl.searchParams.get("view");
  const dashboardTab = view === "setup"
    ? "setup"
    : view === "jobs" || currentUrl.searchParams.get("tab") === "inbox"
      ? "inbox"
      : "top";
  const setupUrl = `${baseUrl}?view=setup`;
  const inboxUrl = `${baseUrl}?view=jobs`;

  const [language, setLanguage] = useState(() => localStorage.getItem("portalproof-language") || "en");
  const [profile, setProfile] = useState(() => ({ ...emptyDraft(), ...loadJson(PROFILE_KEY, {}) }));
  const [requests, setRequests] = useState(() => loadJson(REQUESTS_KEY, []));
  const storedJob = requests.find((item) => item.id === jobId) || null;
  const [requestDraft, setRequestDraft] = useState(() => ({
    ...emptyDraft(),
    ...(publicProfile || {}),
    clientName: "",
    clientWallet: "",
    requestBrief: ""
  }));
  const [jobDraft, setJobDraft] = useState(() => storedJob || null);
  const [submitted, setSubmitted] = useState(null);
  const [proofs, setProofs] = useState(null);
  const [wallet, setWallet] = useState("");
  const [events, setEvents] = useState([]);
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState({ key: "ready" });
  const [manageStage, setManageStage] = useState(() => {
    if (storedJob?.status === "paid") return "certificate";
    if (storedJob?.status === "delivered") return "payment";
    if (storedJob?.status === "active") return "delivery";
    return "agreement";
  });
  const t = (key, values) => translate(language, key, values);
  const activeDraft = page === "request" ? requestDraft : page === "job" ? jobDraft : profile;
  const requestUrl = useMemo(() => buildCreatorRequestUrl(baseUrl, profile), [baseUrl, profile]);
  const requestLinkReady = Boolean(profile.creatorName && profile.serviceName && ethers.isAddress(profile.creatorWallet));
  const requestReady = Boolean(
    requestDraft.clientName && requestDraft.requestBrief && ethers.isAddress(requestDraft.clientWallet)
  );
  const agreementReady = Boolean(
    jobDraft?.clientName && jobDraft?.requestBrief &&
    ethers.isAddress(jobDraft?.clientWallet || "") && ethers.isAddress(jobDraft?.creatorWallet || "")
  );
  const paymentEvidence = useMemo(() => validateTxEvidence({
    paymentTxHash: jobDraft?.paymentTxHash,
    expectedFrom: jobDraft?.clientWallet,
    expectedTo: jobDraft?.creatorWallet,
    expectedAmount: jobDraft?.amount
  }), [jobDraft]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("portalproof-language", language);
  }, [language]);

  useEffect(() => {
    if (page === "dashboard") localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [page, profile]);

  useEffect(() => {
    if (page !== "dashboard") return undefined;
    const refreshRequests = () => setRequests(loadJson(REQUESTS_KEY, []));
    window.addEventListener("storage", refreshRequests);
    window.addEventListener("focus", refreshRequests);
    return () => {
      window.removeEventListener("storage", refreshRequests);
      window.removeEventListener("focus", refreshRequests);
    };
  }, [page]);

  useEffect(() => {
    if (!jobDraft?.id) return;
    setRequests((current) => {
      const updated = current.map((item) => item.id === jobDraft.id ? jobDraft : item);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [jobDraft]);

  useEffect(() => {
    if (!activeDraft) return;
    buildProofs(activeDraft).then(setProofs);
  }, [activeDraft]);

  useEffect(() => {
    const value = jobDraft?.paymentTxHash
      ? `https://node-console.feso-apps.xyz/#/explorer/query/${jobDraft.paymentTxHash}`
      : "PortalProof";
    QRCode.toDataURL(value, { margin: 1, width: 180 }).then(setQr);
  }, [jobDraft?.paymentTxHash]);

  const updateProfile = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const updateRequest = (field) => (event) => setRequestDraft((current) => ({ ...current, [field]: event.target.value }));
  const updateJob = (field) => (event) => setJobDraft((current) => ({ ...current, [field]: event.target.value }));

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus({ key: "walletRequired" });
      return;
    }
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [PORTALDOT_V3] });
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);
    if (page === "request") {
      setRequestDraft((current) => ({ ...current, clientWallet: current.clientWallet || accounts[0] }));
    } else if (page === "dashboard") {
      setProfile((current) => ({ ...current, creatorWallet: current.creatorWallet || accounts[0] }));
    }
    setStatus({ key: "connected", values: { address: accounts[0] } });
  }

  async function getSignerContract() {
    if (!contractAddress) throw new Error(t("contractNotConfigured"));
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(contractAddress, PORTALPROOF_ABI, await provider.getSigner());
  }

  async function createOnChainOrder() {
    if (!jobDraft) return;
    try {
      const contract = await getSignerContract();
      const tx = await contract.createOrder(
        jobDraft.clientWallet,
        jobDraft.creatorWallet,
        ethers.parseUnits(String(jobDraft.amount), 14),
        proofs.termsHash
      );
      setStatus({ key: "creatingOrder", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((item) => item?.name === "OrderCreated");
      const orderId = event?.args?.orderId?.toString() || "";
      setJobDraft((current) => ({ ...current, orderId, status: "active" }));
      setEvents((items) => [{ label: "OrderCreated", txHash: receipt.hash }, ...items]);
      setStatus({ key: "orderCreated", values: { orderId: orderId || t("checkExplorer") } });
      setManageStage("delivery");
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  async function markDelivered() {
    if (!jobDraft) return;
    try {
      const contract = await getSignerContract();
      const certificateURI = `${location.origin}/certificate/${jobDraft.orderId || "pending"}`;
      const tx = await contract.markDelivered(jobDraft.orderId, proofs.deliveryHash, certificateURI);
      setStatus({ key: "recordingDelivery", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      setJobDraft((current) => ({ ...current, status: "delivered" }));
      setEvents((items) => [{ label: "DeliverySubmitted", txHash: receipt.hash }, ...items]);
      setStatus({ key: "deliveryRecorded" });
      setManageStage("payment");
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  async function recordPayment() {
    if (!jobDraft || !paymentEvidence.ok) {
      setStatus({ key: "paymentIncomplete" });
      return;
    }
    try {
      const contract = await getSignerContract();
      const tx = await contract.recordVerifiedPayment(jobDraft.orderId, paymentEvidence.normalized);
      setStatus({ key: "recordingPayment", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      setJobDraft((current) => ({ ...current, status: "paid" }));
      setEvents((items) => [{ label: "PaymentRecorded", txHash: receipt.hash }, ...items]);
      setStatus({ key: "paymentRecorded" });
      setManageStage("certificate");
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  function submitRequest(event) {
    event.preventDefault();
    if (!requestReady) return;
    const record = createRequestRecord(requestDraft, {
      id: makeRequestId(),
      createdAt: new Date().toISOString()
    });
    const updated = [record, ...loadJson(REQUESTS_KEY, [])];
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
    setRequests(updated);
    setSubmitted(record);
    setStatus({ key: "requestSaved" });
  }

  function copy(value, statusKey = "copied") {
    navigator.clipboard?.writeText(value);
    setStatus({ key: statusKey });
  }

  const statusText = `${t(status.key, status.values)}${status.detail ? `: ${status.detail}` : ""}`;
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "";
  const statusLabel = (value) => t(`${value || "new"}Request`);

  const topBar = (
    <nav className="topBar">
      {page === "request" ? <span className="brand">PortalProof</span> : <a className="brand" href={baseUrl}>PortalProof</a>}
      <div className="topActions">
        <div className="languageToggle">
          <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button>
          <button className={language === "ja" ? "active" : ""} onClick={() => setLanguage("ja")}>日本語</button>
        </div>
        <button className="primary" onClick={connectWallet}><Wallet size={17} />{wallet ? short(wallet) : t("connectWallet")}</button>
      </div>
    </nav>
  );

  if (page === "request") {
    return <main className="shell publicShell">
      {topBar}
      <header className="hero compactHero publicHero">
        <div><p className="eyebrow">{t("publicRequestLabel")}</p><h1>{t("requestFrom", { creator: requestDraft.creatorName, service: requestDraft.serviceName })}</h1><p>{t("publicRequestHelp")}</p></div>
      </header>
      <section className="notice" role="status"><strong>{t("status")}</strong><span>{statusText}</span></section>
      {submitted ? <section className="panel submittedCard">
        <CheckCircle2 size={46} />
        <h2>{t("submissionComplete")}</h2>
        <p>{t("submissionCompleteHelp")}</p>
        <div className="requestIdBox"><span>{t("requestId")}</span><code>{submitted.id}</code><button className="icon" onClick={() => copy(submitted.id)}><Copy size={16} /></button></div>
        <p className="muted">{t("keepRequestId")}</p>
        <button className="secondary" onClick={() => setSubmitted(null)}>{t("sendAnother")}</button>
      </section> : <section className="pageGrid requestLayout">
        <section className="panel serviceCard">
          <p className="eyebrow">{t("publicRequestLabel")}</p>
          <h2>{requestDraft.serviceName}</h2>
          <p>{requestDraft.serviceDescription}</p>
          <dl><dt>{t("creator")}</dt><dd>{requestDraft.creatorName}</dd><dt>{t("referenceAmount")}</dt><dd>{requestDraft.amount} tPOTv3</dd><dt>{t("creatorWallet")}</dt><dd><code>{requestDraft.creatorWallet || "—"}</code></dd></dl>
        </section>
        <form className="panel formPanel" onSubmit={submitRequest}>
          <h2>{t("clientRequest")}</h2><p className="muted">{t("clientRequestHelp")}</p>
          <label>{t("clientName")}<input value={requestDraft.clientName} onChange={updateRequest("clientName")} /></label>
          <label>{t("clientWallet")}<input value={requestDraft.clientWallet} onChange={updateRequest("clientWallet")} placeholder="0x..." /></label>
          <label>{t("requestBrief")}<textarea value={requestDraft.requestBrief} onChange={updateRequest("requestBrief")} /></label>
          <div className="fieldRow"><label>{t("amount")}<input value={requestDraft.amount} onChange={updateRequest("amount")} /></label><label>{t("deadline")}<input type="date" value={requestDraft.deadline} onChange={updateRequest("deadline")} /></label></div>
          <button className="primary wide" type="submit" disabled={!requestReady}><Send size={17} />{t("submitRequest")}</button>
          {!requestReady && <p className="formHint">{t("requestRequirements")}</p>}
        </form>
      </section>}
    </main>;
  }

  if (page === "job") {
    if (!jobDraft) return <main className="shell">{topBar}<section className="panel notFound"><h1>{t("jobNotFound")}</h1><p>{t("jobNotFoundHelp")}</p><a className="buttonLink primary" href={inboxUrl}><ArrowLeft size={17} />{t("backToInbox")}</a></section></main>;
    return <main className="shell">
      {topBar}
      <a className="backLink" href={inboxUrl}><ArrowLeft size={16} />{t("backToInbox")}</a>
      <header className="hero compactHero"><div><p className="eyebrow">{t("requestId")}: {jobDraft.id}</p><h1>{t("manageTitle")}</h1><p>{t("manageHelp")}</p></div></header>
      <section className="notice" role="status"><strong>{t("status")}</strong><span>{statusText}</span></section>
      <section className="manageLayout">
        <aside className="panel requestSidebar">
          <div className={`statusBadge ${jobDraft.status}`}>{statusLabel(jobDraft.status)}</div>
          <p className="eyebrow">{t("summary")}</p><h2>{jobDraft.serviceName}</h2>
          <dl><dt>{t("creator")}</dt><dd>{jobDraft.creatorName}</dd><dt>{t("client")}</dt><dd>{jobDraft.clientName}</dd><dt>{t("amount")}</dt><dd>{jobDraft.amount} tPOTv3</dd><dt>{t("deadline")}</dt><dd>{jobDraft.deadline}</dd></dl>
          <p className="briefText">{jobDraft.requestBrief}</p>
          <div className="activityCompact"><strong>{t("activityLog")}</strong>{events.length === 0 ? <small>{t("noActivity")}</small> : events.map((event) => <a key={event.txHash} href={`https://node-console.feso-apps.xyz/#/explorer/query/${event.txHash}`} target="_blank" rel="noreferrer"><ExternalLink size={14} />{event.label}</a>)}</div>
        </aside>
        <div className="workflowArea">
          <nav className="stageTabs">{["agreement", "delivery", "payment", "certificate"].map((stage, index) => <button key={stage} className={manageStage === stage ? "active" : ""} onClick={() => setManageStage(stage)}><span>{index + 1}</span>{t(`${stage}Tab`)}</button>)}</nav>
          {manageStage === "agreement" && <section className="panel stagePanel"><p className="eyebrow">1 / 4</p><h2>{t("agreementHash")}</h2><p className="muted">{t("agreementHelp")}</p><div className="hashBox"><span>{t("termsHash")}</span><code>{proofs?.termsHash}</code><button className="icon" aria-label={t("copyTermsHash")} onClick={() => copy(proofs?.termsHash || "")}><Copy size={16} /></button></div><button className="primary wide" onClick={createOnChainOrder} disabled={!contractAddress || !agreementReady}><FileCheck2 size={18} />{t("mintOrder")}</button>{!contractAddress ? <p className="formHint">{t("deployFirst")}</p> : !agreementReady && <p className="formHint">{t("agreementRequirements")}</p>}</section>}
          {manageStage === "delivery" && <section className="panel stagePanel"><p className="eyebrow">2 / 4</p><h2>{t("delivery")}</h2><p className="muted">{t("deliveryHelp")}</p><label>{t("orderId")}<input value={jobDraft.orderId} onChange={updateJob("orderId")} placeholder={t("createdAfterMint")} /></label><label>{t("deliveryUrl")}<input value={jobDraft.deliveryUrl} onChange={updateJob("deliveryUrl")} /></label><div className="hashBox"><span>{t("deliveryHash")}</span><code>{proofs?.deliveryHash}</code></div><button className="secondary wide" onClick={markDelivered} disabled={!jobDraft.orderId || !contractAddress}><Link2 size={18} />{t("recordDelivery")}</button></section>}
          {manageStage === "payment" && <section className="panel stagePanel"><p className="eyebrow">3 / 4</p><h2>{t("paymentEvidence")}</h2><p className="muted">{t("paymentHelp")}</p><label>{t("orderId")}<input value={jobDraft.orderId} onChange={updateJob("orderId")} placeholder={t("createdAfterMint")} /></label><label>{t("paymentTxHash")}<input value={jobDraft.paymentTxHash} onChange={updateJob("paymentTxHash")} placeholder="0x..." /></label><ul className="checks">{Object.entries(paymentEvidence.checks).map(([key, value]) => <li key={key} className={value ? "ok" : ""}><CheckCircle2 size={15} />{t(checkMessageKeys[key])}</li>)}</ul><button className="secondary wide" onClick={recordPayment} disabled={!jobDraft.orderId || !contractAddress}>{t("recordPayment")}</button><p className="formHint">{t("paymentWarning")}</p></section>}
          {manageStage === "certificate" && <section className="panel stagePanel certificatePanel"><p className="eyebrow">4 / 4</p><h2>{t("certificatePreview")}</h2><p className="muted">{t("certificateHelp")}</p><div className="certificateBody"><dl><dt>{t("creator")}</dt><dd>{jobDraft.creatorName}</dd><dt>{t("client")}</dt><dd>{jobDraft.clientName}</dd><dt>{t("contract")}</dt><dd>{contractAddress || t("notDeployed")}</dd><dt>{t("order")}</dt><dd>{jobDraft.orderId || t("notMinted")}</dd><dt>{t("terms")}</dt><dd><code>{proofs?.termsHash}</code></dd><dt>{t("payment")}</dt><dd><code>{jobDraft.paymentTxHash || t("notRecorded")}</code></dd></dl>{qr && <img src={qr} alt={t("qrAlt")} />}</div></section>}
        </div>
      </section>
    </main>;
  }

  return <main className="shell">
    {topBar}
    {dashboardTab !== "top" && <a className="backLink" href={baseUrl}><ArrowLeft size={16} />{t("backToTop")}</a>}
    <header className="hero compactHero"><div><p className="eyebrow">{t("eyebrow")}</p><h1>{dashboardTab === "top" ? t("creatorTop") : t("creatorDashboard")}</h1><p>{dashboardTab === "top" ? t("creatorTopHelp") : t("creatorDashboardHelp")}</p></div></header>
    <section className="notice" role="status"><strong>{t("status")}</strong><span>{statusText}</span></section>
    {dashboardTab === "top" ? <section className="creatorHome">
      <div className="creatorOnlyNote"><Home size={18} /><div><strong>{t("creatorOnly")}</strong><span>{t("creatorOnlyHelp")}</span></div></div>
      <div className="homeCards">
        <a className="homeCard" href={setupUrl}><span className="homeCardIcon"><Settings2 size={26} /></span><div><strong>{t("topCreateTitle")}</strong><p>{t("topCreateHelp")}</p></div><span className="homeCardAction">{t("openPage")}<ArrowRight size={17} /></span></a>
        <a className="homeCard" href={inboxUrl}><span className="homeCardIcon"><BriefcaseBusiness size={26} /></span><div><strong>{t("topManageTitle")}</strong><p>{t("topManageHelp")}</p></div><span className="homeCardCount">{requests.length}</span><span className="homeCardAction">{t("openPage")}<ArrowRight size={17} /></span></a>
        <a className="homeCard publicEntry" href={requestUrl}><span className="homeCardIcon"><ExternalLink size={26} /></span><div><strong>{t("topRequestTitle")}</strong><p>{t("topRequestHelp")}</p></div><span className="homeCardAction">{t("openPage")}<ArrowRight size={17} /></span></a>
      </div>
    </section> : <>
    <nav className="creatorNav">
      <a href={setupUrl} className={dashboardTab === "setup" ? "active" : ""}><span>1</span><Settings2 size={18} /><strong>{t("setupNav")}</strong><small>{t("setupNavHelp")}</small></a>
      <a href={inboxUrl} className={dashboardTab === "inbox" ? "active" : ""}><span>2</span><Inbox size={18} /><strong>{t("inboxNav")}</strong><small>{t("inboxNavHelp")}</small><em>{requests.length}</em></a>
    </nav>
    {dashboardTab === "setup" ? <section className="pageGrid setupLayout">
      <section className="panel formPanel"><h2>{t("creatorSetup")}</h2><p className="muted">{t("creatorSetupHelp")}</p><label>{t("creatorName")}<input value={profile.creatorName} onChange={updateProfile("creatorName")} /></label><label>{t("serviceName")}<input value={profile.serviceName} onChange={updateProfile("serviceName")} /></label><label>{t("serviceDescription")}<textarea value={profile.serviceDescription} onChange={updateProfile("serviceDescription")} /></label><div className="fieldRow"><label>{t("creatorWallet")}<input value={profile.creatorWallet} onChange={updateProfile("creatorWallet")} placeholder="0x..." /></label><label>{t("referenceAmount")}<input value={profile.amount} onChange={updateProfile("amount")} /></label></div></section>
      <aside className="panel actionPanel"><h2>{t("requestLink")}</h2><p className="muted">{t("requestLinkHelp")}</p><div className="requestLinkBox"><input readOnly value={requestLinkReady ? requestUrl : ""} placeholder={t("requestLinkRequirements")} /><button className="primary wide" onClick={() => copy(requestUrl, "requestLinkCopied")} disabled={!requestLinkReady}><Copy size={16} />{t("copyRequestLink")}</button><a className="buttonLink secondary" href={requestUrl}><ExternalLink size={16} />{t("previewRequestPage")}</a></div></aside>
    </section> : <section className="inboxSection">
      <div className="sectionHeading"><div><h2>{t("incomingTitle")}</h2><p className="muted">{t("incomingHelp")}</p></div><a className="buttonLink secondary" href={requestUrl}><ExternalLink size={16} />{t("openPublicPage")}</a></div>
      <div className="localNote"><ClipboardList size={18} /><span>{t("localStorageNote")}</span></div>
      {requests.length === 0 ? <div className="panel emptyState"><Inbox size={42} /><h3>{t("emptyInbox")}</h3><p>{t("emptyInboxHelp")}</p><a className="buttonLink primary" href={requestUrl}>{t("openPublicPage")}<ArrowRight size={17} /></a></div> : <div className="requestCards">{requests.map((request) => <article className="panel requestCard" key={request.id}><div className="requestCardTop"><div><span className={`statusBadge ${request.status}`}>{statusLabel(request.status)}</span><h3>{request.clientName}</h3></div><time>{formatDate(request.createdAt)}</time></div><p className="requestService">{request.serviceName}</p><p className="requestBrief">{request.requestBrief}</p><dl><dt>{t("amount")}</dt><dd>{request.amount} tPOTv3</dd><dt>{t("deadline")}</dt><dd>{request.deadline}</dd><dt>{t("requestId")}</dt><dd><code>{request.id}</code></dd></dl><a className="buttonLink primary wide" href={buildJobUrl(baseUrl, request.id)}>{t("openJob")}<ArrowRight size={17} /></a></article>)}</div>}
    </section>}</>}
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
