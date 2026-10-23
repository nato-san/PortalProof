import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import { validateTxEvidence, PORTALDOT_V3 } from "../src/domain.js";

const directory = fileURLToPath(new URL("../cache/payment-reports/", import.meta.url));
const token = () => randomBytes(32).toString("hex");
const validToken = (value) => /^[a-f0-9]{64}$/.test(value || "");
const snapshot = (body) => Object.fromEntries(["id", "serviceName", "creatorName", "clientName", "requestBrief", "deadline", "status", "orderId", "orderTxHash", "deliveryUrl", "deliveryTxHash", "paymentRecordTxHash"].map((key) => [key, String(body[key] || "").slice(0, 4000)]));
export function paymentRelay() {
  const install = (server) => { server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/payment-reports")) return next();
    const send = (status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
    try {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: "Origin rejected" });
      if (req.method === "POST" && req.headers["content-type"] !== "application/json") return send(415, { error: "JSON required" });
      let body = {};
      if (req.method === "POST") {
        let raw = "";
        for await (const chunk of req) { raw += chunk; if (raw.length > 16000) return send(413, { error: "Request too large" }); }
        body = JSON.parse(raw);
      }
      await mkdir(directory, { recursive: true });
      if (url.pathname === "/api/payment-reports" && req.method === "POST") {
        if (!ethers.isAddress(body.clientWallet) || !ethers.isAddress(body.creatorWallet) || (body.orderId && !/^0x[a-fA-F0-9]{64}$/.test(body.orderId)) || ethers.parseUnits(String(body.amount), 18) <= 0n) return send(400, { error: "Invalid order" });
        const clientToken = token(), creatorToken = token();
        const record = { ...snapshot(body), clientToken, creatorToken, clientWallet: body.clientWallet, creatorWallet: body.creatorWallet, amount: String(body.amount), report: null };
        await writeFile(`${directory}${clientToken}.json`, JSON.stringify(record), { mode: 0o600 });
        return send(201, { clientToken, creatorToken });
      }
      const id = url.pathname.split("/").pop();
      if (!validToken(id)) return send(404, { error: "Not found" });
      let record;
      try { record = JSON.parse(await readFile(`${directory}${id}.json`, "utf8")); } catch { return send(404, { error: "Link not found" }); }
      if (req.method === "GET") {
        const creator = req.headers.authorization === `Bearer ${record.creatorToken}`;
        return send(200, { ...snapshot(record), clientWallet: record.clientWallet, creatorWallet: record.creatorWallet, amount: record.amount, report: record.report, reported: Boolean(record.report) });
      }
      if (req.method !== "POST") return send(405, { error: "Method not allowed" });
      if (body.action === "sync") {
        if (req.headers.authorization !== `Bearer ${record.creatorToken}`) return send(403, { error: "Creator authorization required" });
        record = { ...record, ...snapshot(body) };
        const temporary = `${directory}${id}.${token()}.tmp`;
        await writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
        await rename(temporary, `${directory}${id}.json`);
        return send(200, { synced: true });
      }
      if (!record.orderId || !record.deliveryTxHash) return send(409, { error: "Awaiting order and delivery" });
      if (record.report) return send(409, { error: "Payment already reported" });
      if (!/^0x[a-fA-F0-9]{64}$/.test(body.paymentTxHash || "")) return send(400, { error: "Invalid transaction hash" });
      const provider = new ethers.JsonRpcProvider(PORTALDOT_V3.rpcUrls[0]);
      try {
        const [transaction, receipt] = await Promise.all([provider.getTransaction(body.paymentTxHash), provider.getTransactionReceipt(body.paymentTxHash)]);
        const evidence = validateTxEvidence({ paymentTxHash: body.paymentTxHash, expectedFrom: record.clientWallet, expectedTo: record.creatorWallet, expectedAmountWei: ethers.parseUnits(record.amount, 18).toString(), transaction, receipt });
        if (!evidence.ok) return send(422, { error: "Payment sender, recipient, amount or successful receipt does not match" });
        const block = await provider.getBlock(receipt.blockNumber);
        record.report = { paymentTxHash: evidence.normalized, paidAt: new Date(block.timestamp * 1000).toISOString(), amount: record.amount };
        const temporary = `${directory}${id}.${token()}.tmp`;
        await writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
        await rename(temporary, `${directory}${id}.json`);
        return send(200, { reported: true });
      } finally { provider.destroy(); }
    } catch { return send(503, { error: "Unable to process report. Check the network and try again." }); }
  }); };
  return { name: "local-payment-relay", configureServer: install, configurePreviewServer: install };
}
