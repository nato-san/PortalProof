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
  validateDeliveryUrl,
  validateTxEvidence
} from "./domain.js";
import "./styles.css";

const DEPLOYED_CONTRACT_ADDRESS = "0xBaE8933886e1520e5FCa3eDed119c08b29022D79";
const DEPLOYMENT_TRANSACTION_HASH = "0x29b2c7b2b91bf6cc6804040fb0590c020a3b0a4bdae1f81864f1f9f227035365";
const CONTRACT_DEPLOYMENT_BLOCK = 119719;
const contractAddress = import.meta.env.VITE_PORTALPROOF_CONTRACT_ADDRESS || DEPLOYED_CONTRACT_ADDRESS;
const DEPLOYMENT_COST_LIMIT = ethers.parseUnits("160", 18);
const REQUESTS_KEY = "portalproof-requests-v1";
const PROFILE_KEY = "portalproof-creator-profile-v1";
const MODE_KEY = "portalproof-execution-mode-v1";
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

function emptyPaymentEvidence(draft) {
  let expectedAmountWei = "0";
  try {
    expectedAmountWei = ethers.parseUnits(String(draft?.amount || "0"), 18).toString();
  } catch {
    // Invalid amounts remain unverified.
  }
  return validateTxEvidence({
    paymentTxHash: draft?.paymentTxHash,
    expectedFrom: draft?.clientWallet,
    expectedTo: draft?.creatorWallet,
    expectedAmountWei,
    transaction: null,
    receipt: null
  });
}

async function readPaymentEvidence(draft) {
  const initial = emptyPaymentEvidence(draft);
  if (!initial.checks.hasHash) return initial;
  const provider = new ethers.JsonRpcProvider(
    PORTALDOT_V3.rpcUrls[0],
    Number(BigInt(PORTALDOT_V3.chainId)),
    { staticNetwork: true }
  );
  const [transaction, receipt] = await Promise.all([
    provider.getTransaction(initial.normalized),
    provider.getTransactionReceipt(initial.normalized)
  ]);
  let expectedAmountWei = "0";
  try {
    expectedAmountWei = ethers.parseUnits(String(draft?.amount || "0"), 18).toString();
  } catch {
    // Invalid amounts remain unverified.
  }
  return validateTxEvidence({
    paymentTxHash: initial.normalized,
    expectedFrom: draft?.clientWallet,
    expectedTo: draft?.creatorWallet,
    expectedAmountWei,
    transaction,
    receipt
  });
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
    connectingWallet: "Connecting wallet...",
    walletRejected: "Wallet connection was cancelled. Open your wallet and try again.",
    walletRequestPending: "A wallet request is already waiting. Open your wallet extension or app and finish or cancel it, then try again.",
    walletConnectionFailed: "Wallet connection failed",
    modeLabel: "Execution mode",
    localMode: "Local demo",
    testnetMode: "Portaldot V3",
    localModeStatus: "Local demo mode. Requests stay in this browser and no blockchain transaction is sent.",
    testnetModeWaiting: "Portaldot V3 mode selected. On-chain actions unlock after the contract is deployed.",
    testnetModeReady: "Portaldot V3 mode selected. On-chain actions are enabled.",
    switchToTestnet: "Switch to Portaldot V3 mode to use on-chain actions.",
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
    localStorageNote: "Prototype inbox: requests submitted on this device stay in this browser. Accepted work proofs are recorded separately on Portaldot V3.",
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
    orderAlreadyCreated: "This order proof is already on-chain. No duplicate transaction was sent.",
    orderIssued: "Order proof issued",
    checkExplorer: "check the explorer",
    delivery: "Record delivery",
    deliveryHelp: "Add the delivery URL. PortalProof records its hash, not the file itself.",
    deliveryUrlRequired: "Enter a valid delivery URL before recording the proof.",
    orderId: "Order ID",
    createdAfterMint: "Created after minting",
    deliveryUrl: "Delivery URL",
    deliveryHash: "Delivery hash",
    recordDelivery: "Record delivery",
    recordingDelivery: "Recording delivery: {hash}",
    deliveryRecorded: "Delivery proof recorded on the Portaldot V3 testnet.",
    deliveryAlreadyRecorded: "Delivery proof is already recorded. No duplicate transaction was sent.",
    paymentEvidence: "Record payment evidence",
    paymentHelp: "Reference the real transfer made by the client after checking its details.",
    paymentTxHash: "Payment transaction hash",
    hasHash: "Valid transaction hash format",
    transactionFound: "Transaction found on Portaldot V3",
    hasExpectedFrom: "Sender matches the client wallet",
    hasExpectedTo: "Recipient matches the creator wallet",
    hasExpectedAmount: "Transferred amount matches the agreed amount",
    hasSuccess: "Transaction succeeded",
    paymentChecking: "Checking the transaction on Portaldot V3...",
    recordPayment: "Record verified payment evidence",
    paymentWarning: "A transaction hash alone is not proof. Verify the sender, recipient, amount, and success status on Portaldot V3.",
    paymentIncomplete: "Payment evidence is incomplete. Do not record an arbitrary transaction hash.",
    recordingPayment: "Recording verified payment evidence: {hash}",
    paymentRecorded: "Payment evidence recorded. Reviewers should still verify the referenced transfer.",
    paymentAlreadyRecorded: "Payment evidence is already recorded. No duplicate transaction was sent.",
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
    noActivity: "No testnet transaction in this browser session yet.",
    deployTitle: "Deploy PortalProof proof contract",
    deployHelp: "This operator-only tool deploys the tested lightweight proof contract with MetaMask. No private key is entered into this site.",
    deployRisk: "This sends a real Portaldot V3 testnet transaction. Review the network, account, and maximum fee in MetaMask before approving.",
    deployBalance: "Wallet balance",
    deployMaximumCost: "Estimated maximum cost",
    deploySafetyLimit: "Hard safety limit",
    deployCheck: "Run final check",
    deployNow: "Deploy with MetaMask",
    deployChecking: "Checking the latest balance and fees...",
    deployReady: "Final check passed. Review the figures, then deploy.",
    deployWaitingWallet: "Waiting for MetaMask approval...",
    deploySubmitted: "Deployment submitted: {hash}",
    deploymentComplete: "PortalProof already uses this deployed contract. No additional deployment is needed.",
    deployedAddress: "Deployed contract address",
    deployTransaction: "Deployment transaction",
    deployFailed: "Deployment failed",
    deployNotChecked: "Run the final check before deploying."
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
    connectingWallet: "ウォレットに接続中...",
    walletRejected: "ウォレット接続がキャンセルされました。ウォレットを開いて、もう一度お試しください。",
    walletRequestPending: "ウォレット側に未処理の確認があります。拡張機能またはアプリを開いて、承認かキャンセルをしてから再度お試しください。",
    walletConnectionFailed: "ウォレット接続に失敗しました",
    modeLabel: "実行モード",
    localMode: "ローカル実演",
    testnetMode: "Portaldot V3",
    localModeStatus: "ローカル実演モードです。依頼はこのブラウザ内に保存され、ブロックチェーン取引は送信しません。",
    testnetModeWaiting: "Portaldot V3モードです。コントラクトのデプロイ後にオンチェーン操作を利用できます。",
    testnetModeReady: "Portaldot V3モードです。オンチェーン操作を利用できます。",
    switchToTestnet: "オンチェーン操作を行うには、Portaldot V3モードへ切り替えてください。",
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
    localStorageNote: "試作版の依頼一覧：この端末から送信した依頼は、このブラウザ内に保存されます。受付後の仕事証明は別途Portaldot V3へ記録します。",
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
    orderAlreadyCreated: "この発注証明はオンチェーンに記録済みです。重複取引は送信していません。",
    orderIssued: "発注証明を発行済み",
    checkExplorer: "エクスプローラーで確認",
    delivery: "納品を記録",
    deliveryHelp: "納品先URLを入力します。ファイル自体ではなく、そのハッシュを記録します。",
    deliveryUrlRequired: "記録前に有効な納品URLを入力してください。",
    orderId: "注文ID",
    createdAfterMint: "発行後に作成されます",
    deliveryUrl: "納品URL",
    deliveryHash: "納品ハッシュ",
    recordDelivery: "納品を記録",
    recordingDelivery: "納品を記録中: {hash}",
    deliveryRecorded: "Portaldot V3テストネットに納品証明を記録しました。",
    deliveryAlreadyRecorded: "納品証明は記録済みです。重複取引は送信していません。",
    paymentEvidence: "支払い証跡を記録",
    paymentHelp: "依頼者から実際に行われた送金の内容を確認して記録します。",
    paymentTxHash: "支払いトランザクションハッシュ",
    hasHash: "トランザクションハッシュの形式",
    transactionFound: "Portaldot V3上に取引が存在",
    hasExpectedFrom: "送金元が依頼者ウォレットと一致",
    hasExpectedTo: "送金先がクリエイターウォレットと一致",
    hasExpectedAmount: "送金額が合意金額と一致",
    hasSuccess: "取引が成功済み",
    paymentChecking: "Portaldot V3上の取引内容を確認中...",
    recordPayment: "検証済みの支払い証跡を記録",
    paymentWarning: "ハッシュだけでは支払い証明になりません。Portaldot V3上の送金元、送金先、金額、成功状態を確認してください。",
    paymentIncomplete: "支払い証跡が不足しています。任意のトランザクションハッシュは記録できません。",
    recordingPayment: "検証済み支払い証跡を記録中: {hash}",
    paymentRecorded: "支払い証跡を記録しました。参照先の送金内容は審査員も確認する必要があります。",
    paymentAlreadyRecorded: "支払い証跡は記録済みです。重複取引は送信していません。",
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
    noActivity: "このブラウザセッションにはテストネットの取引がまだありません。",
    deployTitle: "PortalProof証明コントラクトをデプロイ",
    deployHelp: "テスト済みの軽量証明コントラクトをMetaMaskでデプロイする、PortalProof運営者専用画面です。このサイトへ秘密鍵を入力する必要はありません。",
    deployRisk: "Portaldot V3テストネットへ実際の取引を送信します。MetaMaskでネットワーク、アカウント、最大手数料を確認してから承認してください。",
    deployBalance: "ウォレット残高",
    deployMaximumCost: "推定最大費用",
    deploySafetyLimit: "安全上限",
    deployCheck: "最終チェック",
    deployNow: "MetaMaskでデプロイ",
    deployChecking: "最新の残高と手数料を確認中...",
    deployReady: "最終チェックに成功しました。数値を確認してからデプロイしてください。",
    deployWaitingWallet: "MetaMaskの承認を待っています...",
    deploySubmitted: "デプロイを送信しました: {hash}",
    deploymentComplete: "PortalProofはこのデプロイ済みコントラクトを使用しています。追加のデプロイは不要です。",
    deployedAddress: "デプロイ済みコントラクトアドレス",
    deployTransaction: "デプロイトランザクション",
    deployFailed: "デプロイに失敗しました",
    deployNotChecked: "デプロイ前に最終チェックを実行してください。"
  }
};

const checkMessageKeys = {
  hasHash: "hasHash",
  transactionFound: "transactionFound",
  hasExpectedFrom: "hasExpectedFrom",
  hasExpectedTo: "hasExpectedTo",
  hasExpectedAmount: "hasExpectedAmount",
  hasSuccess: "hasSuccess"
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
  const [executionMode, setExecutionMode] = useState(() => localStorage.getItem(MODE_KEY) === "testnet" ? "testnet" : "local");
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
  const [events, setEvents] = useState(() => [
    storedJob?.paymentRecordTxHash && { label: "PaymentRecorded", txHash: storedJob.paymentRecordTxHash },
    storedJob?.deliveryTxHash && { label: "DeliverySubmitted", txHash: storedJob.deliveryTxHash },
    storedJob?.orderTxHash && { label: "OrderCreated", txHash: storedJob.orderTxHash }
  ].filter(Boolean));
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState({ key: "ready" });
  const [paymentEvidence, setPaymentEvidence] = useState(() => emptyPaymentEvidence(storedJob));
  const [paymentCheckBusy, setPaymentCheckBusy] = useState(false);
  const [deploymentCheck, setDeploymentCheck] = useState(null);
  const [deploymentResult, setDeploymentResult] = useState(() => contractAddress === DEPLOYED_CONTRACT_ADDRESS
    ? { address: DEPLOYED_CONTRACT_ADDRESS, txHash: DEPLOYMENT_TRANSACTION_HASH }
    : null);
  const [deploymentStatus, setDeploymentStatus] = useState({ key: "ready" });
  const [deploymentBusy, setDeploymentBusy] = useState(false);
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
  const onChainReady = executionMode === "testnet" && Boolean(contractAddress);
  const orderComplete = Boolean(jobDraft?.orderId);
  const deliveryComplete = Boolean(jobDraft?.deliveryTxHash) || ["delivered", "paid"].includes(jobDraft?.status);
  const deliveryReady = validateDeliveryUrl(jobDraft?.deliveryUrl);
  const paymentComplete = Boolean(jobDraft?.paymentRecordTxHash) || jobDraft?.status === "paid";
  const stageAvailable = {
    agreement: true,
    delivery: orderComplete,
    payment: deliveryComplete,
    certificate: paymentComplete
  };

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("portalproof-language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, executionMode);
  }, [executionMode]);

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
    if (page !== "job" || !jobDraft?.orderId || jobDraft.orderTxHash) return undefined;
    let cancelled = false;
    const recoverOrderTransaction = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(
          PORTALDOT_V3.rpcUrls[0],
          Number(BigInt(PORTALDOT_V3.chainId)),
          { staticNetwork: true }
        );
        const contract = new ethers.Contract(contractAddress, PORTALPROOF_ABI, provider);
        const logs = await contract.queryFilter(
          contract.filters.OrderCreated(jobDraft.orderId),
          CONTRACT_DEPLOYMENT_BLOCK,
          "latest"
        );
        const client = String(jobDraft.clientWallet || "").toLowerCase();
        const creator = String(jobDraft.creatorWallet || "").toLowerCase();
        const matching = logs.find((item) =>
          item.args.client.toLowerCase() === client && item.args.creator.toLowerCase() === creator
        );
        if (!matching || cancelled) return;
        setJobDraft((current) => ({ ...current, orderTxHash: matching.transactionHash, status: "active" }));
        setEvents((items) => items.some((item) => item.txHash === matching.transactionHash)
          ? items
          : [{ label: "OrderCreated", txHash: matching.transactionHash }, ...items]);
      } catch {
        // The proof remains usable if history recovery is temporarily unavailable.
      }
    };
    recoverOrderTransaction();
    return () => { cancelled = true; };
  }, [page, jobDraft?.id, jobDraft?.orderId, jobDraft?.orderTxHash]);

  useEffect(() => {
    if (!activeDraft) return;
    buildProofs(activeDraft).then(setProofs);
  }, [activeDraft]);

  useEffect(() => {
    const value = jobDraft?.paymentTxHash
      ? `https://node-console.portaldot.dev/#/explorer/query/${jobDraft.paymentTxHash}`
      : "PortalProof";
    QRCode.toDataURL(value, { margin: 1, width: 180 }).then(setQr);
  }, [jobDraft?.paymentTxHash]);

  useEffect(() => {
    let cancelled = false;
    const initial = emptyPaymentEvidence(jobDraft);
    setPaymentEvidence(initial);
    if (!initial.checks.hasHash) {
      setPaymentCheckBusy(false);
      return undefined;
    }
    setPaymentCheckBusy(true);
    readPaymentEvidence(jobDraft)
      .then((result) => { if (!cancelled) setPaymentEvidence(result); })
      .catch(() => { if (!cancelled) setPaymentEvidence(initial); })
      .finally(() => { if (!cancelled) setPaymentCheckBusy(false); });
    return () => { cancelled = true; };
  }, [jobDraft?.paymentTxHash, jobDraft?.clientWallet, jobDraft?.creatorWallet, jobDraft?.amount]);

  const updateProfile = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const updateRequest = (field) => (event) => setRequestDraft((current) => ({ ...current, [field]: event.target.value }));
  const updateJob = (field) => (event) => setJobDraft((current) => ({ ...current, [field]: event.target.value }));

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus({ key: "walletRequired" });
      return;
    }
    setStatus({ key: "connectingWallet" });
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0];
      if (!address) throw new Error("No wallet account was returned.");

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: PORTALDOT_V3.chainId }]
        });
      } catch (switchError) {
        const switchCode = switchError?.code ?? switchError?.data?.originalError?.code;
        if (switchCode !== 4902) throw switchError;
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [PORTALDOT_V3] });
      }

      setWallet(address);
      if (page === "request") {
        setRequestDraft((current) => ({ ...current, clientWallet: current.clientWallet || address }));
      } else if (page === "dashboard") {
        setProfile((current) => ({ ...current, creatorWallet: current.creatorWallet || address }));
      }
      setStatus({ key: "connected", values: { address } });
    } catch (error) {
      if (error?.code === 4001) {
        setStatus({ key: "walletRejected" });
      } else if (error?.code === -32002) {
        setStatus({ key: "walletRequestPending" });
      } else {
        setStatus({ key: "walletConnectionFailed", detail: error?.message || String(error) });
      }
    }
  }

  async function getSignerContract() {
    if (!contractAddress) throw new Error(t("contractNotConfigured"));
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(contractAddress, PORTALPROOF_ABI, await provider.getSigner());
  }

  async function createOnChainOrder() {
    if (!jobDraft) return;
    if (jobDraft.orderId) {
      setStatus({ key: "orderAlreadyCreated" });
      return;
    }
    try {
      const contract = await getSignerContract();
      const existing = await contract.queryFilter(
        contract.filters.OrderCreated(proofs.termsHash),
        CONTRACT_DEPLOYMENT_BLOCK,
        "latest"
      );
      const client = jobDraft.clientWallet.toLowerCase();
      const creator = jobDraft.creatorWallet.toLowerCase();
      const matching = existing.find((item) =>
        item.args.client.toLowerCase() === client && item.args.creator.toLowerCase() === creator
      );
      if (matching) {
        setJobDraft((current) => ({
          ...current,
          orderId: matching.args.proofId.toString(),
          orderTxHash: matching.transactionHash,
          status: "active"
        }));
        setEvents((items) => items.some((item) => item.txHash === matching.transactionHash)
          ? items
          : [{ label: "OrderCreated", txHash: matching.transactionHash }, ...items]);
        setStatus({ key: "orderAlreadyCreated" });
        setManageStage("delivery");
        return;
      }
      const tx = await contract.createOrder(
        jobDraft.clientWallet,
        jobDraft.creatorWallet,
        proofs.termsHash
      );
      setStatus({ key: "creatingOrder", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((item) => item?.name === "OrderCreated");
      const orderId = event?.args?.proofId?.toString() || "";
      setJobDraft((current) => ({ ...current, orderId, orderTxHash: receipt.hash, status: "active" }));
      setEvents((items) => [{ label: "OrderCreated", txHash: receipt.hash }, ...items]);
      setStatus({ key: "orderCreated", values: { orderId: orderId || t("checkExplorer") } });
      setManageStage("delivery");
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  async function markDelivered() {
    if (!jobDraft) return;
    if (!validateDeliveryUrl(jobDraft.deliveryUrl)) {
      setStatus({ key: "deliveryUrlRequired" });
      return;
    }
    if (jobDraft.deliveryTxHash || ["delivered", "paid"].includes(jobDraft.status)) {
      setStatus({ key: "deliveryAlreadyRecorded" });
      return;
    }
    try {
      const contract = await getSignerContract();
      const tx = await contract.markDelivered(jobDraft.orderId, proofs.deliveryHash);
      setStatus({ key: "recordingDelivery", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      setJobDraft((current) => ({ ...current, deliveryTxHash: receipt.hash, status: "delivered" }));
      setEvents((items) => [{ label: "DeliverySubmitted", txHash: receipt.hash }, ...items]);
      setStatus({ key: "deliveryRecorded" });
      setManageStage("payment");
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    }
  }

  async function recordPayment() {
    if (!jobDraft) return;
    if (jobDraft.paymentRecordTxHash || jobDraft.status === "paid") {
      setStatus({ key: "paymentAlreadyRecorded" });
      return;
    }
    setPaymentCheckBusy(true);
    try {
      const verifiedEvidence = await readPaymentEvidence(jobDraft);
      setPaymentEvidence(verifiedEvidence);
      if (!verifiedEvidence.ok) {
        setStatus({ key: "paymentIncomplete" });
        return;
      }
      const contract = await getSignerContract();
      const tx = await contract.recordVerifiedPayment(jobDraft.orderId, verifiedEvidence.normalized);
      setStatus({ key: "recordingPayment", values: { hash: tx.hash } });
      const receipt = await tx.wait();
      setJobDraft((current) => ({ ...current, paymentRecordTxHash: receipt.hash, status: "paid" }));
      setEvents((items) => [{ label: "PaymentRecorded", txHash: receipt.hash }, ...items]);
      setStatus({ key: "paymentRecorded" });
      setManageStage("certificate");
    } catch (error) {
      setStatus({ key: "error", detail: error.message });
    } finally {
      setPaymentCheckBusy(false);
    }
  }

  async function buildDeploymentPlan() {
    if (!window.ethereum) throw new Error(t("walletRequired"));
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts?.[0];
    if (!address) throw new Error(t("walletRequired"));

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: PORTALDOT_V3.chainId }]
      });
    } catch (switchError) {
      const switchCode = switchError?.code ?? switchError?.data?.originalError?.code;
      if (switchCode !== 4902) throw switchError;
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [PORTALDOT_V3] });
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(PORTALDOT_V3.chainId)) {
      throw new Error(`Unexpected chain ID: ${network.chainId}`);
    }

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const balance = await provider.getBalance(signerAddress);
    const { getDeploymentBytecode } = await import("./deployment.js");
    const bytecode = getDeploymentBytecode();
    const request = { data: bytecode };
    const estimatedGas = await provider.estimateGas({ ...request, from: signerAddress });
    const gasLimit = estimatedGas * 105n / 100n;
    // MetaMask may synthesize an excessively high EIP-1559 maxFeePerGas for
    // this custom chain. Read the chain's current gas price directly and add
    // a small buffer instead, while retaining the hard total-cost limit.
    const currentGasPrice = BigInt(await provider.send("eth_gasPrice", []));
    const gasPrice = currentGasPrice * 110n / 100n;
    const maximumCost = gasLimit * gasPrice;

    if (maximumCost > DEPLOYMENT_COST_LIMIT) {
      const formattedCost = ethers.formatUnits(maximumCost, 18);
      throw new Error(`The maximum cost is ${formattedCost} tPOTv3 and exceeds the 160 tPOTv3 limit. No transaction was sent. / 最大費用は${formattedCost} tPOTv3で、安全上限160 tPOTv3を超えたため送信していません。`);
    }
    if (maximumCost > balance) {
      throw new Error("The wallet balance is too low. No transaction was sent. / ウォレット残高が不足しているため送信していません。");
    }

    const overrides = { gasLimit, gasPrice };

    setWallet(signerAddress);
    return { signer, bytecode, overrides, signerAddress, balance, gasLimit, maximumCost };
  }

  async function checkDeployment() {
    setDeploymentBusy(true);
    setDeploymentResult(null);
    setDeploymentStatus({ key: "deployChecking" });
    try {
      const plan = await buildDeploymentPlan();
      setDeploymentCheck({
        address: plan.signerAddress,
        balance: ethers.formatUnits(plan.balance, 18),
        maximumCost: ethers.formatUnits(plan.maximumCost, 18),
        gasLimit: plan.gasLimit.toString()
      });
      setDeploymentStatus({ key: "deployReady" });
    } catch (error) {
      setDeploymentCheck(null);
      setDeploymentStatus({ key: "deployFailed", detail: error?.message || String(error) });
    } finally {
      setDeploymentBusy(false);
    }
  }

  async function deployProofContract() {
    if (!deploymentCheck) {
      setDeploymentStatus({ key: "deployNotChecked" });
      return;
    }
    setDeploymentBusy(true);
    setDeploymentStatus({ key: "deployWaitingWallet" });
    try {
      const plan = await buildDeploymentPlan();
      const transaction = await plan.signer.sendTransaction({
        data: plan.bytecode,
        ...plan.overrides
      });
      setDeploymentStatus({ key: "deploySubmitted", values: { hash: transaction.hash } });
      const receipt = await transaction.wait();
      const address = receipt.contractAddress;
      if (!address) throw new Error("Contract address was not returned. / コントラクトアドレスを取得できませんでした。");
      setDeploymentResult({ address, txHash: receipt.hash });
      setDeploymentStatus({ key: "ready" });
    } catch (error) {
      setDeploymentStatus({ key: "deployFailed", detail: error?.message || String(error) });
    } finally {
      setDeploymentBusy(false);
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

  function selectExecutionMode(mode) {
    setExecutionMode(mode);
    setStatus({ key: "ready" });
  }

  const readyStatusKey = executionMode === "local"
    ? "localModeStatus"
    : contractAddress
      ? "testnetModeReady"
      : "testnetModeWaiting";
  const statusKey = status.key === "ready" ? readyStatusKey : status.key;
  const statusText = `${t(statusKey, status.values)}${status.detail ? `: ${status.detail}` : ""}`;
  const deploymentStatusText = `${t(deploymentStatus.key, deploymentStatus.values)}${deploymentStatus.detail ? `: ${deploymentStatus.detail}` : ""}`;
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "";
  const statusLabel = (value) => t(`${value || "new"}Request`);

  const topBar = (
    <nav className="topBar">
      {page === "request" ? <span className="brand">PortalProof</span> : <a className="brand" href={baseUrl}>PortalProof</a>}
      <div className="topActions">
        {page !== "request" && <div className="modeControl" aria-label={t("modeLabel")}>
          <span>{t("modeLabel")}</span>
          <div className="modeToggle">
            <button className={executionMode === "local" ? "active" : ""} onClick={() => selectExecutionMode("local")}>{t("localMode")}</button>
            <button className={executionMode === "testnet" ? "active" : ""} onClick={() => selectExecutionMode("testnet")}>{t("testnetMode")}</button>
          </div>
        </div>}
        <div className="languageToggle">
          <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button>
          <button className={language === "ja" ? "active" : ""} onClick={() => setLanguage("ja")}>日本語</button>
        </div>
        <button className="primary" onClick={connectWallet} disabled={status.key === "connectingWallet"}><Wallet size={17} />{wallet ? short(wallet) : status.key === "connectingWallet" ? t("connectingWallet") : t("connectWallet")}</button>
      </div>
    </nav>
  );

  if (view === "deploy") {
    return <main className="shell deployShell">
      {topBar}
      <header className="hero compactHero"><div><p className="eyebrow">PortalProof / Portaldot V3</p><h1>{t("deployTitle")}</h1><p>{t("deployHelp")}</p></div></header>
      <section className="notice" role="status"><strong>{t("status")}</strong><span>{deploymentStatusText}</span></section>
      <section className="panel deployPanel">
        <p className="deployWarning">{t("deployRisk")}</p>
        <dl className="deployFacts">
          <dt>{t("deploySafetyLimit")}</dt><dd>160 tPOTv3</dd>
          {deploymentCheck && <><dt>{t("deployBalance")}</dt><dd>{deploymentCheck.balance} tPOTv3</dd><dt>{t("deployMaximumCost")}</dt><dd>{deploymentCheck.maximumCost} tPOTv3</dd><dt>Gas limit / ガス上限</dt><dd>{deploymentCheck.gasLimit}</dd></>}
        </dl>
        {deploymentResult
          ? <p className="formHint"><CheckCircle2 size={17} />{t("deploymentComplete")}</p>
          : <div className="deployActions">
              <button className="secondary" onClick={checkDeployment} disabled={deploymentBusy}>{t("deployCheck")}</button>
              <button className="primary" onClick={deployProofContract} disabled={deploymentBusy || !deploymentCheck}>{t("deployNow")}</button>
            </div>}
        {deploymentResult && <div className="deploymentResult"><h2>{t("deployedAddress")}</h2><code>{deploymentResult.address}</code><button className="icon" onClick={() => copy(deploymentResult.address)}><Copy size={16} /></button><h2>{t("deployTransaction")}</h2><code>{deploymentResult.txHash}</code><button className="icon" onClick={() => copy(deploymentResult.txHash)}><Copy size={16} /></button></div>}
      </section>
      <a className="textLink" href={baseUrl}><ArrowLeft size={16} />{t("backToTop")}</a>
    </main>;
  }

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
          <div className="activityCompact"><strong>{t("activityLog")}</strong>{events.length === 0 ? <small>{t("noActivity")}</small> : events.map((event) => <a key={event.txHash} href={`https://node-console.portaldot.dev/#/explorer/query/${event.txHash}`} target="_blank" rel="noreferrer"><ExternalLink size={14} />{event.label}</a>)}</div>
        </aside>
        <div className="workflowArea">
          <nav className="stageTabs">{["agreement", "delivery", "payment", "certificate"].map((stage, index) => <button key={stage} className={manageStage === stage ? "active" : ""} disabled={!stageAvailable[stage]} onClick={() => setManageStage(stage)}><span>{index + 1}</span>{t(`${stage}Tab`)}</button>)}</nav>
          {manageStage === "agreement" && <section className="panel stagePanel"><p className="eyebrow">1 / 4</p><h2>{t("agreementHash")}</h2><p className="muted">{t("agreementHelp")}</p><div className="hashBox"><span>{t("termsHash")}</span><code>{proofs?.termsHash}</code><button className="icon" aria-label={t("copyTermsHash")} onClick={() => copy(proofs?.termsHash || "")}><Copy size={16} /></button></div><button className="primary wide" onClick={createOnChainOrder} disabled={!onChainReady || !agreementReady || !proofs?.termsHash || orderComplete}><FileCheck2 size={18} />{orderComplete ? t("orderIssued") : t("mintOrder")}</button>{executionMode === "local" ? <p className="formHint">{t("switchToTestnet")}</p> : !contractAddress ? <p className="formHint">{t("deployFirst")}</p> : !agreementReady && <p className="formHint">{t("agreementRequirements")}</p>}</section>}
          {manageStage === "delivery" && <section className="panel stagePanel"><p className="eyebrow">2 / 4</p><h2>{t("delivery")}</h2><p className="muted">{t("deliveryHelp")}</p><label>{t("orderId")}<input value={jobDraft.orderId} readOnly placeholder={t("createdAfterMint")} /></label><label>{t("deliveryUrl")}<input value={jobDraft.deliveryUrl} onChange={updateJob("deliveryUrl")} disabled={deliveryComplete} placeholder="https://..." /></label><div className="hashBox"><span>{t("deliveryHash")}</span><code>{deliveryReady ? proofs?.deliveryHash : "—"}</code></div><button className="secondary wide" onClick={markDelivered} disabled={!jobDraft.orderId || !onChainReady || !deliveryReady || deliveryComplete}><Link2 size={18} />{t("recordDelivery")}</button>{executionMode === "local" ? <p className="formHint">{t("switchToTestnet")}</p> : !deliveryReady && <p className="formHint">{t("deliveryUrlRequired")}</p>}</section>}
          {manageStage === "payment" && <section className="panel stagePanel"><p className="eyebrow">3 / 4</p><h2>{t("paymentEvidence")}</h2><p className="muted">{t("paymentHelp")}</p><label>{t("orderId")}<input value={jobDraft.orderId} readOnly placeholder={t("createdAfterMint")} /></label><label>{t("paymentTxHash")}<input value={jobDraft.paymentTxHash} onChange={updateJob("paymentTxHash")} disabled={paymentComplete} placeholder="0x..." /></label><ul className="checks">{Object.entries(paymentEvidence.checks).map(([key, value]) => <li key={key} className={value ? "ok" : ""}><CheckCircle2 size={15} />{t(checkMessageKeys[key])}</li>)}</ul><button className="secondary wide" onClick={recordPayment} disabled={!jobDraft.orderId || !onChainReady || !paymentEvidence.ok || paymentCheckBusy || paymentComplete}>{paymentCheckBusy ? t("paymentChecking") : t("recordPayment")}</button><p className="formHint">{executionMode === "local" ? t("switchToTestnet") : t("paymentWarning")}</p></section>}
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
