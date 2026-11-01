import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import solc from "solc";
import ganache from "ganache";
import { ethers } from "ethers";

const source = await readFile(new URL("../contracts/PortalProofOrderV2.sol", import.meta.url), "utf8");
const output = JSON.parse(solc.compile(JSON.stringify({ language: "Solidity", sources: { "V2.sol": { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } })));
assert.deepEqual((output.errors || []).filter((item) => item.severity === "error"), []);
const artifact = output.contracts["V2.sol"].PortalProofOrderV2;
const rpc = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 3 }, chain: { chainId: 1337 } });
const provider = new ethers.BrowserProvider(rpc);
provider.pollingInterval = 10;
try {
  const creator = await provider.getSigner(0), outsider = await provider.getSigner(1);
  const contract = await new ethers.ContractFactory(artifact.abi, artifact.evm.bytecode.object, creator).deploy();
  await contract.waitForDeployment();
  const hash = (value) => ethers.id(value), zero = ethers.ZeroHash;
  const reject = async (operation, name) => {
    await assert.rejects(operation, (error) => {
      const decoded = contract.interface.parseError(error.data || error.info?.error?.data);
      return decoded?.name === name;
    });
  };
  const create = async (nonce, signer = creator) => {
    const c = contract.connect(signer);
    const id = await c.createOrder.staticCall(hash(nonce), hash("same terms"), 10n);
    const receipt = await (await c.createOrder(hash(nonce), hash("same terms"), 10n)).wait();
    const event = receipt.logs.map((log) => contract.interface.parseLog(log)).find((item) => item?.name === "OrderRecorded");
    assert.equal(event.args.orderId, id);
    return id;
  };
  await reject(() => contract.createOrder.staticCall(zero, hash("terms"), 10n), "InvalidInput");
  await reject(() => contract.createOrder.staticCall(hash("n"), zero, 10n), "InvalidInput");
  await reject(() => contract.createOrder.staticCall(hash("n"), hash("terms"), 0n), "InvalidInput");
  const id = await create("first");
  assert.equal((await contract.orders(id)).state, 1n);
  await reject(() => contract.createOrder.staticCall(hash("first"), hash("changed terms"), 20n), "DuplicateNonce");
  const otherId = await create("second");
  assert.notEqual(id, otherId);
  const outsiderId = await create("first", outsider);
  assert.notEqual(id, outsiderId);
  await reject(() => contract.recordDelivery.staticCall(hash("missing"), hash("file")), "InvalidState");
  await reject(() => contract.acknowledgePayment.staticCall(id, hash("payment")), "InvalidState");
  await reject(() => contract.connect(outsider).recordDelivery.staticCall(id, hash("file")), "NotCreator");
  await reject(() => contract.recordDelivery.staticCall(id, zero), "InvalidInput");
  await (await contract.recordDelivery(id, hash("file"))).wait();
  assert.equal((await contract.orders(id)).state, 2n);
  await reject(() => contract.recordDelivery.staticCall(id, hash("replacement")), "InvalidState");
  await reject(() => contract.connect(outsider).acknowledgePayment.staticCall(id, hash("payment")), "NotCreator");
  await reject(() => contract.acknowledgePayment.staticCall(id, zero), "InvalidInput");
  await (await contract.acknowledgePayment(id, hash("payment"))).wait();
  assert.equal((await contract.orders(id)).state, 3n);
  assert.equal((await contract.orders(id)).paymentTxHash, hash("payment"));
  await reject(() => contract.acknowledgePayment.staticCall(id, hash("payment2")), "InvalidState");
  await reject(() => contract.recordDelivery.staticCall(id, hash("replacement")), "InvalidState");
  await (await contract.recordDelivery(otherId, hash("file2"))).wait();
  await reject(() => contract.acknowledgePayment.staticCall(otherId, hash("payment")), "PaymentAlreadyUsed");
  assert.equal(await contract.paymentOrders(hash("payment")), id);
  await assert.rejects(() => creator.sendTransaction({ to: contract.target, value: 1n }));
  console.log("V2 local EVM tests passed: authorization, ordering, uniqueness, replay and non-custody. No live payment validity claimed.");
} finally {
  provider.destroy();
  await rpc.disconnect();
}
