import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const rpcUrl = process.env.VITE_PORTALDOT_RPC_URL || "https://testnetv3-eth-rpc.feso-apps.xyz";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

if (!privateKey) {
  console.error("DEPLOYER_PRIVATE_KEY is required. Do not commit it.");
  process.exit(1);
}

const artifact = JSON.parse(
  await readFile(new URL("../artifacts/PortalProofOrder.json", import.meta.url), "utf8")
);

const provider = new ethers.JsonRpcProvider(rpcUrl, 420420777);
const wallet = new ethers.Wallet(privateKey, provider);
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

console.log(`Deploying from ${wallet.address} to ${rpcUrl}`);
const contract = await factory.deploy();
const receipt = await contract.deploymentTransaction().wait();

console.log(JSON.stringify({
  contractAddress: await contract.getAddress(),
  deployTxHash: receipt.hash,
  network: "PortaldotV3 Testnet",
  chainId: 420420777
}, null, 2));
