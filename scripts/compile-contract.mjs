import { readFile, writeFile } from "node:fs/promises";
import solc from "solc";

const expectedCompilerVersion = "0.8.24";
const compilerVersion = solc.version();

if (!compilerVersion.startsWith(`${expectedCompilerVersion}+`)) {
  throw new Error(
    `Unexpected Solidity compiler ${compilerVersion}. Expected ${expectedCompilerVersion}. / ` +
    `Solidityコンパイラが一致しません。期待値: ${expectedCompilerVersion}`
  );
}

const sourceName = "PortalProofOrder.sol";
const contractName = "PortalProofOrder";
const source = await readFile(new URL(`../contracts/${sourceName}`, import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: {
    [sourceName]: { content: source }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((entry) => entry.severity === "error");

if (errors.length > 0) {
  throw new Error(errors.map((entry) => entry.formattedMessage).join("\n"));
}

const compiled = output.contracts?.[sourceName]?.[contractName];

if (!compiled?.abi || !compiled?.evm?.bytecode?.object) {
  throw new Error("Compiled contract output is missing. / コンパイル結果が見つかりません。");
}

const artifact = {
  abi: compiled.abi,
  bytecode: `0x${compiled.evm.bytecode.object}`
};

await writeFile(
  new URL(`../artifacts/${contractName}.json`, import.meta.url),
  `${JSON.stringify(artifact, null, 2)}\n`,
  "utf8"
);

console.log(
  `Compiled ${contractName} with Solidity ${compilerVersion}. / ` +
  `${contractName}をSolidity ${compilerVersion}でコンパイルしました。`
);
