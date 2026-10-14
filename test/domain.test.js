import assert from "node:assert/strict";
import { buildProofs, emptyDraft, validateTxEvidence } from "../src/domain.js";

const draft = {
  ...emptyDraft(),
  creatorWallet: "0x1111111111111111111111111111111111111111",
  clientWallet: "0x2222222222222222222222222222222222222222",
  paymentTxHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
};

const proofs = await buildProofs(draft);

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
