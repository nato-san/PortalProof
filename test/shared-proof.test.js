import assert from "node:assert/strict";
import {
  emptySharedPaymentEvidence,
  ensurePortaldotV3,
  sharedDeliveryHash,
  sharedTermsHash,
  sharedTermsPayload,
} from "../src/sharedProof.js";

const job = {
  id: "request-one", creatorName: "Artist", creatorWallet: `0x${"1".repeat(40)}`,
  clientName: "Client", clientWallet: `0x${"2".repeat(40)}`,
  serviceName: "Icon", serviceDescription: "Custom icon", requestBrief: "Cat icon",
  amount: "10", deadline: "2026-11-07",
};
assert.equal(sharedTermsPayload(job).requestId, "request-one");
assert.match(await sharedTermsHash(job), /^0x[0-9a-f]{64}$/);
assert.notEqual(await sharedTermsHash(job), await sharedTermsHash({ ...job, id: "request-two" }));
assert.match(await sharedDeliveryHash("https://example.com/delivery.png"), /^0x[0-9a-f]{64}$/);
await assert.rejects(sharedDeliveryHash("delivery.png"), /納品URL/);
assert.equal(emptySharedPaymentEvidence(job, `0x${"a".repeat(64)}`).checks.hasHash, true);

{
  const calls = [];
  const wallet = { async request(input) { calls.push(input); return input.method === "eth_chainId" ? "0x1" : null; } };
  await ensurePortaldotV3(wallet);
  assert.equal(calls[1].method, "wallet_switchEthereumChain");
}
{
  const calls = [];
  const wallet = { async request(input) {
    calls.push(input);
    if (input.method === "eth_chainId") return "0x1";
    if (input.method === "wallet_switchEthereumChain") { const error = new Error("missing"); error.code = 4902; throw error; }
    return null;
  } };
  await ensurePortaldotV3(wallet);
  assert.equal(calls[2].method, "wallet_addEthereumChain");
}
console.log("Shared proof tests passed: unique terms, delivery hash, payment format and Portaldot V3 switching");
