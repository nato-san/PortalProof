import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Interface } from "ethers";
import { PORTALPROOF_ABI } from "../src/contract.js";

const artifact = JSON.parse(
  await readFile(new URL("../artifacts/PortalProofOrder.json", import.meta.url), "utf8")
);
const appInterface = new Interface(PORTALPROOF_ABI);
const contractInterface = new Interface(artifact.abi);

for (const fragment of appInterface.fragments) {
  if (fragment.type === "function") {
    const signature = fragment.format("sighash");
    assert.equal(contractInterface.getFunction(signature)?.selector, fragment.selector);
  }
  if (fragment.type === "event") {
    const signature = fragment.format("sighash");
    assert.equal(contractInterface.getEvent(signature)?.topicHash, fragment.topicHash);
  }
}

const bytecodeBytes = (artifact.bytecode.length - 2) / 2;
assert.ok(bytecodeBytes > 0);
assert.ok(bytecodeBytes < 1_000, `Contract bytecode is too large: ${bytecodeBytes} bytes`);

console.log(`PortalProof contract tests passed (${bytecodeBytes} byte deployment code)`);
