import assert from "node:assert/strict";
import {
  PORTALDOT_V3,
  buildCreatorRequestUrl,
  buildWorkflowUrl,
  buildProofs,
  emptyDraft,
  readCreatorRequestUrl,
  readWorkflowUrl,
  validateTxEvidence
} from "../src/domain.js";

assert.equal(PORTALDOT_V3.chainId, "0x190f1ca9");
assert.equal(PORTALDOT_V3.nativeCurrency.decimals, 14);

const draft = {
  ...emptyDraft(),
  creatorWallet: "0x1111111111111111111111111111111111111111",
  clientWallet: "0x2222222222222222222222222222222222222222",
  paymentTxHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
};

const proofs = await buildProofs(draft);

const requestUrl = buildCreatorRequestUrl("https://portalproof.example/app?old=value#section", draft);
const requestData = readCreatorRequestUrl(requestUrl);

assert.equal(requestData.creatorName, draft.creatorName);
assert.equal(requestData.serviceName, draft.serviceName);
assert.equal(requestData.creatorWallet, draft.creatorWallet);
assert.equal(requestData.amount, draft.amount);
assert.equal(new URL(requestUrl).hash, "");
assert.equal(new URL(requestUrl).searchParams.has("clientWallet"), false);
assert.equal(readCreatorRequestUrl("https://portalproof.example/app"), null);

const workflowUrl = buildWorkflowUrl(requestUrl, draft);
const workflowData = readWorkflowUrl(workflowUrl);

assert.equal(workflowData.creatorName, draft.creatorName);
assert.equal(workflowData.clientName, draft.clientName);
assert.equal(workflowData.clientWallet, draft.clientWallet);
assert.equal(workflowData.requestBrief, draft.requestBrief);
assert.equal(new URL(workflowUrl).searchParams.get("mode"), "manage");
assert.equal(readWorkflowUrl(requestUrl), null);

const workflowPreview = readWorkflowUrl(buildWorkflowUrl(requestUrl, {
  ...draft,
  clientName: "",
  clientWallet: "",
  requestBrief: ""
}));
assert.equal(workflowPreview.serviceName, draft.serviceName);
assert.equal(workflowPreview.clientName, "");

assert.match(proofs.termsHash, /^0x[a-f0-9]{64}$/);
assert.match(proofs.deliveryHash, /^0x[a-f0-9]{64}$/);
assert.notEqual(proofs.termsHash, proofs.deliveryHash);

assert.equal(validateTxEvidence({
  paymentTxHash: draft.paymentTxHash,
  expectedFrom: draft.clientWallet,
  expectedTo: draft.creatorWallet,
  expectedAmount: draft.amount
}).ok, true);

assert.equal(validateTxEvidence({
  paymentTxHash: "0xfake",
  expectedFrom: draft.clientWallet,
  expectedTo: draft.creatorWallet,
  expectedAmount: draft.amount
}).ok, false);

assert.equal(validateTxEvidence({
  paymentTxHash: draft.paymentTxHash,
  expectedFrom: "",
  expectedTo: draft.creatorWallet,
  expectedAmount: draft.amount
}).ok, false);

console.log("PortalProof domain tests passed");
