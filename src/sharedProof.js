import { ethers } from "ethers";
import { PORTALPROOF_ABI } from "./contract.js";
import { PORTALDOT_V3, sha256Hex, validateDeliveryUrl, validateTxEvidence } from "./domain.js";

export const PORTALPROOF_CONTRACT_ADDRESS = "0xBaE8933886e1520e5FCa3eDed119c08b29022D79";
export const PORTALPROOF_DEPLOYMENT_BLOCK = 119719;

export function sharedTermsPayload(job) {
  return {
    requestId: job.id,
    creatorName: job.creatorName,
    creatorWallet: String(job.creatorWallet || "").toLowerCase(),
    clientName: job.clientName,
    clientWallet: String(job.clientWallet || "").toLowerCase(),
    serviceName: job.serviceName,
    serviceDescription: job.serviceDescription || "",
    requestBrief: job.requestBrief,
    amount: String(job.amount),
    deadline: job.deadline,
  };
}

export async function sharedTermsHash(job) {
  return sha256Hex(JSON.stringify(sharedTermsPayload(job)));
}

export async function sharedDeliveryHash(deliveryUrl) {
  if (!validateDeliveryUrl(deliveryUrl)) throw new Error("有効な納品URLを入力してください / Enter a valid delivery URL");
  return sha256Hex(String(deliveryUrl).trim());
}

export async function ensurePortaldotV3(wallet) {
  const current = await wallet.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === PORTALDOT_V3.chainId.toLowerCase()) return;
  try {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: PORTALDOT_V3.chainId }] });
  } catch (error) {
    const code = error?.code ?? error?.data?.originalError?.code;
    if (code !== 4902) throw error;
    await wallet.request({ method: "wallet_addEthereumChain", params: [{
      chainId: PORTALDOT_V3.chainId,
      chainName: PORTALDOT_V3.chainName,
      rpcUrls: PORTALDOT_V3.rpcUrls,
      nativeCurrency: PORTALDOT_V3.nativeCurrency,
    }] });
  }
}

export async function creatorProofContract(wallet, expectedCreator) {
  await ensurePortaldotV3(wallet);
  const provider = new ethers.BrowserProvider(wallet);
  const signer = await provider.getSigner();
  const address = (await signer.getAddress()).toLowerCase();
  if (address !== String(expectedCreator || "").toLowerCase()) {
    throw new Error("受注者としてログインしたウォレットを選択してください / Select the provider wallet used for this job");
  }
  return { provider, signer, contract: new ethers.Contract(PORTALPROOF_CONTRACT_ADDRESS, PORTALPROOF_ABI, signer), address };
}

export async function findOrderProof(contract, provider, proofId, clientWallet, creatorWallet) {
  const events = await contract.queryFilter(contract.filters.OrderCreated(proofId), PORTALPROOF_DEPLOYMENT_BLOCK, "latest");
  for (const event of events) {
    if (event.args.client.toLowerCase() !== clientWallet.toLowerCase() || event.args.creator.toLowerCase() !== creatorWallet.toLowerCase()) continue;
    const transaction = await provider.getTransaction(event.transactionHash);
    if (transaction?.from?.toLowerCase() === creatorWallet.toLowerCase()) return event.transactionHash;
  }
  return "";
}

export async function findDeliveryProof(contract, proofId, deliveryHash, creatorWallet) {
  const events = await contract.queryFilter(contract.filters.DeliverySubmitted(proofId), PORTALPROOF_DEPLOYMENT_BLOCK, "latest");
  const event = events.find((item) => item.args.deliveryHash.toLowerCase() === deliveryHash.toLowerCase()
    && item.args.submitter.toLowerCase() === creatorWallet.toLowerCase());
  return event?.transactionHash || "";
}

export async function findPaymentProof(contract, proofId, paymentTxHash, creatorWallet) {
  const events = await contract.queryFilter(contract.filters.PaymentRecorded(proofId), PORTALPROOF_DEPLOYMENT_BLOCK, "latest");
  const event = events.find((item) => item.args.paymentTxHash.toLowerCase() === paymentTxHash.toLowerCase()
    && item.args.submitter.toLowerCase() === creatorWallet.toLowerCase());
  return event?.transactionHash || "";
}

export function emptySharedPaymentEvidence(job, paymentTxHash = job.paymentTxHash) {
  let amount = "0";
  try { amount = ethers.parseUnits(String(job.amount || "0"), 18).toString(); } catch { /* invalid stays unverified */ }
  return validateTxEvidence({ paymentTxHash, expectedFrom: job.clientWallet, expectedTo: job.creatorWallet, expectedAmountWei: amount, transaction: null, receipt: null });
}

export async function verifySharedPayment(job, paymentTxHash = job.paymentTxHash) {
  const initial = emptySharedPaymentEvidence(job, paymentTxHash);
  if (!initial.checks.hasHash) return initial;
  const provider = new ethers.JsonRpcProvider(PORTALDOT_V3.rpcUrls[0], Number(BigInt(PORTALDOT_V3.chainId)), { staticNetwork: true });
  const [transaction, receipt] = await Promise.all([provider.getTransaction(initial.normalized), provider.getTransactionReceipt(initial.normalized)]);
  let amount = "0";
  try { amount = ethers.parseUnits(String(job.amount || "0"), 18).toString(); } catch { /* invalid stays unverified */ }
  return validateTxEvidence({ paymentTxHash: initial.normalized, expectedFrom: job.clientWallet, expectedTo: job.creatorWallet, expectedAmountWei: amount, transaction, receipt });
}

export function explorerUrl(hash) {
  if (typeof location === "undefined") return `?proofTx=${encodeURIComponent(hash)}`;
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set("proofTx", hash);
  url.searchParams.set("lang", new URL(location.href).searchParams.get("lang") === "en" ? "en" : "ja");
  return url.href;
}

export async function loadPublicProof(hash) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(hash || ""))) throw new Error("Invalid transaction hash");
  const normalized = hash.toLowerCase();
  const provider = new ethers.JsonRpcProvider(PORTALDOT_V3.rpcUrls[0], Number(BigInt(PORTALDOT_V3.chainId)), { staticNetwork: true });
  const [transaction, receipt] = await Promise.all([provider.getTransaction(normalized), provider.getTransactionReceipt(normalized)]);
  if (!transaction || !receipt) throw new Error("Transaction was not found on Portaldot V3");
  const contract = new ethers.Contract(PORTALPROOF_CONTRACT_ADDRESS, PORTALPROOF_ABI, provider);
  const parsed = receipt.logs
    .filter((log) => log.address.toLowerCase() === PORTALPROOF_CONTRACT_ADDRESS.toLowerCase())
    .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
    .filter(Boolean);
  const paymentEvent = parsed.find((event) => event.name === "PaymentRecorded");
  let orderEvent = null, deliveryEvent = null, paymentTransaction = null, paymentReceipt = null;
  if (paymentEvent) {
    const proofId = paymentEvent.args.proofId;
    const [orders, deliveries, paidTx, paidReceipt] = await Promise.all([
      contract.queryFilter(contract.filters.OrderCreated(proofId), PORTALPROOF_DEPLOYMENT_BLOCK, "latest"),
      contract.queryFilter(contract.filters.DeliverySubmitted(proofId), PORTALPROOF_DEPLOYMENT_BLOCK, "latest"),
      provider.getTransaction(paymentEvent.args.paymentTxHash),
      provider.getTransactionReceipt(paymentEvent.args.paymentTxHash),
    ]);
    orderEvent = orders.find((event) => event.args.creator.toLowerCase() === paymentEvent.args.submitter.toLowerCase()) || null;
    deliveryEvent = deliveries.find((event) => event.args.submitter.toLowerCase() === paymentEvent.args.submitter.toLowerCase()) || null;
    paymentTransaction = paidTx;
    paymentReceipt = paidReceipt;
  }
  const checks = {
    recordSucceeded: Number(receipt.status) === 1,
    recordUsesContract: transaction.to?.toLowerCase() === PORTALPROOF_CONTRACT_ADDRESS.toLowerCase(),
    paymentEventFound: Boolean(paymentEvent),
    orderEventFound: Boolean(orderEvent),
    deliveryEventFound: Boolean(deliveryEvent),
    creatorRecordedProof: Boolean(paymentEvent && transaction.from?.toLowerCase() === paymentEvent.args.submitter.toLowerCase()),
    paymentFound: Boolean(paymentTransaction && paymentReceipt),
    paymentSucceeded: Number(paymentReceipt?.status) === 1,
    paymentSenderMatchesClient: Boolean(orderEvent && paymentTransaction?.from?.toLowerCase() === orderEvent.args.client.toLowerCase()),
    paymentRecipientMatchesCreator: Boolean(orderEvent && paymentTransaction?.to?.toLowerCase() === orderEvent.args.creator.toLowerCase()),
  };
  const isFinalProof = Boolean(paymentEvent);
  const verified = isFinalProof
    ? Object.values(checks).every(Boolean)
    : checks.recordSucceeded && (!parsed.length || checks.recordUsesContract);
  return {
    hash: normalized,
    transaction,
    receipt,
    parsed,
    paymentEvent,
    orderEvent,
    deliveryEvent,
    paymentTransaction,
    paymentReceipt,
    checks,
    isFinalProof,
    verified,
  };
}
