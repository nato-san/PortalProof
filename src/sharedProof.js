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
    throw new Error("クリエイターとしてログインしたウォレットを選択してください / Select the creator wallet used for this job");
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
  return `https://node-console.portaldot.dev/#/explorer/query/${hash}`;
}
