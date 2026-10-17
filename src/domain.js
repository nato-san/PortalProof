export const PORTALDOT_V3 = {
  chainId: "0x190f1ca9",
  chainName: "PortaldotV3 Testnet",
  rpcUrls: ["https://test-evm-rpc-v3.portaldot.dev"],
  nativeCurrency: {
    name: "tPOTv3",
    symbol: "tPOTv3",
    decimals: 14
  }
};

export const emptyDraft = () => ({
  creatorName: "Nato Illustration",
  serviceName: "SNS icon illustration",
  serviceDescription: "Custom illustrated icons for social profiles and creator brands.",
  creatorWallet: "",
  clientName: "Aki Client",
  clientWallet: "",
  requestBrief: "Create a cat-themed SNS icon for commercial use.",
  amount: "10",
  deadline: "2026-10-24",
  deliveryUrl: "https://example.com/portalproof-delivery.png",
  paymentTxHash: ""
});

export async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return `0x${[...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

export function buildTermsPayload(draft) {
  return {
    creatorName: draft.creatorName,
    serviceName: draft.serviceName,
    serviceDescription: draft.serviceDescription,
    creatorWallet: draft.creatorWallet,
    clientName: draft.clientName,
    clientWallet: draft.clientWallet,
    requestBrief: draft.requestBrief,
    amount: draft.amount,
    deadline: draft.deadline
  };
}

const creatorRequestFields = [
  "creatorName",
  "serviceName",
  "serviceDescription",
  "creatorWallet",
  "amount"
];

export function buildCreatorRequestUrl(baseUrl, draft) {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("mode", "request");
  url.searchParams.set("v", "1");
  for (const field of creatorRequestFields) {
    url.searchParams.set(field, String(draft[field] || ""));
  }
  return url.toString();
}

export function readCreatorRequestUrl(value) {
  const url = new URL(value);
  if (url.searchParams.get("mode") !== "request" || url.searchParams.get("v") !== "1") {
    return null;
  }

  const request = Object.fromEntries(
    creatorRequestFields.map((field) => [field, url.searchParams.get(field) || ""])
  );

  if (!request.creatorName || !request.serviceName) return null;
  return request;
}

export function buildJobUrl(baseUrl, requestId) {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("mode", "job");
  url.searchParams.set("v", "1");
  url.searchParams.set("id", String(requestId || ""));
  return url.toString();
}

export function readJobId(value) {
  const url = new URL(value);
  if (url.searchParams.get("mode") !== "job" || url.searchParams.get("v") !== "1") {
    return null;
  }
  return url.searchParams.get("id") || null;
}

export function createRequestRecord(draft, { id, createdAt }) {
  return {
    id,
    createdAt,
    status: "new",
    creatorName: draft.creatorName,
    serviceName: draft.serviceName,
    serviceDescription: draft.serviceDescription,
    creatorWallet: draft.creatorWallet,
    clientName: draft.clientName,
    clientWallet: draft.clientWallet,
    requestBrief: draft.requestBrief,
    amount: draft.amount,
    deadline: draft.deadline,
    deliveryUrl: "",
    paymentTxHash: "",
    orderId: ""
  };
}

export async function buildProofs(draft) {
  const termsPayload = buildTermsPayload(draft);
  const termsHash = await sha256Hex(JSON.stringify(termsPayload));
  const deliveryHash = await sha256Hex(draft.deliveryUrl || "");
  return { termsPayload, termsHash, deliveryHash };
}

export function validateTxEvidence({ paymentTxHash, expectedFrom, expectedTo, expectedAmount }) {
  const normalized = String(paymentTxHash || "").trim();
  const checks = {
    hasHash: /^0x[a-fA-F0-9]{64}$/.test(normalized),
    hasExpectedFrom: Boolean(expectedFrom),
    hasExpectedTo: Boolean(expectedTo),
    hasExpectedAmount: Number(expectedAmount) > 0
  };
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    normalized
  };
}
