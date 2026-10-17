import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { ethers } from "ethers";

function fail(error) {
  console.error(`Portaldot operation failed / Portaldot操作に失敗しました: ${error.message}`);
  process.exit(1);
}

process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);

try {
  loadEnvFile(new URL("../.env", import.meta.url));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const EXPECTED_CHAIN_ID = 420420777n;
const rpcUrl = process.env.VITE_PORTALDOT_RPC_URL || "https://test-evm-rpc-v3.portaldot.dev";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const checkOnly = process.argv.includes("--check-only");

const artifact = JSON.parse(
  await readFile(new URL("../artifacts/PortalProofOrder.json", import.meta.url), "utf8")
);

if (!Array.isArray(artifact.abi) || !artifact.bytecode?.startsWith("0x")) {
  throw new Error("Invalid contract artifact. / コントラクトのコンパイル済みファイルが不正です。");
}

console.log(`Checking Portaldot V3 RPC / Portaldot V3 RPCを確認中: ${rpcUrl}`);

const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
  staticNetwork: true
});
const network = await provider.getNetwork();
const blockNumber = await provider.getBlockNumber();

if (network.chainId !== EXPECTED_CHAIN_ID) {
  throw new Error(
    `Unexpected chain ID ${network.chainId}. Expected ${EXPECTED_CHAIN_ID}. / ` +
    `チェーンIDが一致しません。期待値: ${EXPECTED_CHAIN_ID}`
  );
}

console.log(`RPC ready / RPC接続成功: chainId=${network.chainId}, block=${blockNumber}`);

if (!privateKey) {
  if (checkOnly) {
    console.log("Network check completed. / ネットワーク確認が完了しました。");
    process.exit(0);
  }
  throw new Error(
    "DEPLOYER_PRIVATE_KEY is required in .env. Never commit it. / " +
    ".envにDEPLOYER_PRIVATE_KEYが必要です。絶対にコミットしないでください。"
  );
}

const wallet = new ethers.Wallet(privateKey, provider);
const balance = await provider.getBalance(wallet.address);

console.log(`Deployer / デプロイ用アドレス: ${wallet.address}`);
console.log(`Balance / 残高: ${ethers.formatUnits(balance, 14)} tPOTv3`);

if (checkOnly) {
  console.log("Deployment preflight completed without sending a transaction. / トランザクションを送信せず事前確認を完了しました。");
  process.exit(0);
}

if (balance === 0n) {
  throw new Error(
    "The deployer has no tPOTv3 for gas. / デプロイ用アドレスにガス代のtPOTv3がありません。"
  );
}

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
const deployRequest = await factory.getDeployTransaction();
const estimatedGas = await provider.estimateGas({ ...deployRequest, from: wallet.address });

console.log(`Estimated deployment gas / 推定デプロイガス: ${estimatedGas}`);
console.log("Sending deployment transaction. / デプロイトランザクションを送信します。");

const contract = await factory.deploy();
const deploymentTransaction = contract.deploymentTransaction();

console.log(`Submitted / 送信済み: ${deploymentTransaction.hash}`);

const receipt = await deploymentTransaction.wait();
const contractAddress = await contract.getAddress();

if (!receipt || receipt.status !== 1) {
  throw new Error("Deployment transaction failed. / デプロイトランザクションが失敗しました。");
}

console.log(JSON.stringify({
  contractAddress,
  deployTxHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  network: "PortaldotV3 Testnet",
  chainId: Number(EXPECTED_CHAIN_ID)
}, null, 2));
