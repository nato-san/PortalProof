import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle2, Copy, ExternalLink, FileCheck2, Link2, Wallet } from "lucide-react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import { PORTALPROOF_ABI } from "./contract.js";
import {
  PORTALDOT_V3,
  buildProofs,
  emptyDraft,
  validateTxEvidence
} from "./domain.js";
import "./styles.css";

const contractAddress = import.meta.env.VITE_PORTALPROOF_CONTRACT_ADDRESS || "";
const short = (value) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "not set";

function App() {
  const [draft, setDraft] = useState(emptyDraft());
  const [proofs, setProofs] = useState(null);
  const [wallet, setWallet] = useState("");
  const [orderId, setOrderId] = useState("");
  const [events, setEvents] = useState([]);
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState("Ready for Portaldot V3 testnet.");

  const paymentEvidence = useMemo(() => validateTxEvidence({
    paymentTxHash: draft.paymentTxHash,
    expectedFrom: draft.clientWallet,
    expectedTo: draft.creatorWallet,
    expectedAmount: draft.amount
  }), [draft]);

  useEffect(() => {
    buildProofs(draft).then(setProofs);
  }, [draft]);

  useEffect(() => {
    const value = draft.paymentTxHash
      ? `https://node-console.feso-apps.xyz/#/explorer/query/${draft.paymentTxHash}`
      : "PortalProof";
    QRCode.toDataURL(value, { margin: 1, width: 180 }).then(setQr);
  }, [draft.paymentTxHash]);

  const update = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("MetaMask or an EVM wallet is required.");
      return;
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [PORTALDOT_V3]
    });
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);
    setDraft((current) => ({
      ...current,
      clientWallet: current.clientWallet || accounts[0]
    }));
    setStatus(`Connected: ${accounts[0]}`);
  }

  async function getSignerContract() {
    if (!contractAddress) throw new Error("Set VITE_PORTALPROOF_CONTRACT_ADDRESS after deployment.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, PORTALPROOF_ABI, signer);
  }

  async function createOnChainOrder() {
    try {
      const contract = await getSignerContract();
      const amount = ethers.parseUnits(String(draft.amount), 14);
      const tx = await contract.createOrder(
        draft.clientWallet,
        draft.creatorWallet,
        amount,
        proofs.termsHash
      );
      setStatus(`Creating order proof: ${tx.hash}`);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((item) => item?.name === "OrderCreated");
      const newOrderId = event?.args?.orderId?.toString() || "";
      setOrderId(newOrderId);
      setEvents((items) => [{ label: "OrderCreated", txHash: receipt.hash }, ...items]);
      setStatus(`Order proof created. Order ID: ${newOrderId || "check explorer"}`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function markDelivered() {
    try {
      const contract = await getSignerContract();
      const certificateURI = `${location.origin}/certificate/${orderId || "pending"}`;
      const tx = await contract.markDelivered(orderId, proofs.deliveryHash, certificateURI);
      setStatus(`Recording delivery: ${tx.hash}`);
      const receipt = await tx.wait();
      setEvents((items) => [{ label: "DeliverySubmitted", txHash: receipt.hash }, ...items]);
      setStatus("Delivery proof recorded on Portaldot V3 testnet.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function recordPayment() {
    if (!paymentEvidence.ok) {
      setStatus("Payment evidence is incomplete. Do not record an arbitrary TxHash.");
      return;
    }
    try {
      const contract = await getSignerContract();
      const tx = await contract.recordVerifiedPayment(orderId, paymentEvidence.normalized);
      setStatus(`Recording verified payment evidence: ${tx.hash}`);
      const receipt = await tx.wait();
      setEvents((items) => [{ label: "PaymentRecorded", txHash: receipt.hash }, ...items]);
      setStatus("Payment evidence recorded. Reviewers should still verify the referenced transfer.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function copy(value) {
    navigator.clipboard?.writeText(value);
    setStatus("Copied.");
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Portaldot Hacker House 2026 / Ecosystem DApps</p>
          <h1>PortalProof</h1>
          <p>
            A creator request URL, order proof NFT, delivery record, and payment evidence certificate
            for Portaldot V3 testnet.
          </p>
        </div>
        <button className="primary" onClick={connectWallet}>
          <Wallet size={18} />
          {wallet ? short(wallet) : "Connect wallet"}
        </button>
      </header>

      <section className="notice">
        <strong>Status</strong>
        <span>{status}</span>
      </section>

      <section className="grid">
        <section className="panel">
          <h2>1. Creator request</h2>
          <label>Creator name<input value={draft.creatorName} onChange={update("creatorName")} /></label>
          <label>Service name<input value={draft.serviceName} onChange={update("serviceName")} /></label>
          <label>Creator wallet<input value={draft.creatorWallet} onChange={update("creatorWallet")} placeholder="0x..." /></label>
          <label>Client name<input value={draft.clientName} onChange={update("clientName")} /></label>
          <label>Client wallet<input value={draft.clientWallet} onChange={update("clientWallet")} placeholder="0x..." /></label>
          <label>Request brief<textarea value={draft.requestBrief} onChange={update("requestBrief")} /></label>
        </section>

        <section className="panel">
          <h2>2. Agreement hash</h2>
          <label>Amount tPOTv3<input value={draft.amount} onChange={update("amount")} /></label>
          <label>Deadline<input value={draft.deadline} onChange={update("deadline")} /></label>
          <div className="hashBox">
            <span>Terms hash</span>
            <code>{proofs?.termsHash}</code>
            <button className="icon" onClick={() => copy(proofs?.termsHash || "")}><Copy size={16} /></button>
          </div>
          <button className="primary wide" onClick={createOnChainOrder} disabled={!contractAddress}>
            <FileCheck2 size={18} />
            Mint order proof on Portaldot V3
          </button>
          {!contractAddress && <p className="muted">Deploy the contract and set VITE_PORTALPROOF_CONTRACT_ADDRESS first.</p>}
        </section>

        <section className="panel">
          <h2>3. Delivery</h2>
          <label>Order ID<input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Created after mint" /></label>
          <label>Delivery URL<input value={draft.deliveryUrl} onChange={update("deliveryUrl")} /></label>
          <div className="hashBox">
            <span>Delivery hash</span>
            <code>{proofs?.deliveryHash}</code>
          </div>
          <button className="secondary wide" onClick={markDelivered} disabled={!orderId || !contractAddress}>
            <Link2 size={18} />
            Record delivery
          </button>
        </section>

        <section className="panel">
          <h2>4. Payment evidence</h2>
          <label>Payment TxHash<input value={draft.paymentTxHash} onChange={update("paymentTxHash")} placeholder="0x..." /></label>
          <ul className="checks">
            {Object.entries(paymentEvidence.checks).map(([key, value]) => (
              <li key={key} className={value ? "ok" : ""}><CheckCircle2 size={15} />{key}</li>
            ))}
          </ul>
          <button className="secondary wide" onClick={recordPayment} disabled={!orderId || !contractAddress}>
            Record verified payment evidence
          </button>
          <p className="muted">
            A TxHash alone is not treated as proof. The reviewer or verifier must confirm sender,
            recipient, amount, and success on Portaldot V3.
          </p>
        </section>
      </section>

      <section className="certificate">
        <div>
          <p className="eyebrow">Certificate preview</p>
          <h2>{draft.serviceName}</h2>
          <dl>
            <dt>Creator</dt><dd>{draft.creatorName}</dd>
            <dt>Client</dt><dd>{draft.clientName}</dd>
            <dt>Contract</dt><dd>{contractAddress || "not deployed yet"}</dd>
            <dt>Order</dt><dd>{orderId || "not minted yet"}</dd>
            <dt>Terms</dt><dd><code>{proofs?.termsHash}</code></dd>
            <dt>Payment</dt><dd><code>{draft.paymentTxHash || "not recorded yet"}</code></dd>
          </dl>
        </div>
        {qr && <img src={qr} alt="Payment transaction QR code" />}
      </section>

      <section className="panel">
        <h2>On-chain activity log</h2>
        {events.length === 0 ? <p className="muted">No testnet transaction in this browser session yet.</p> : (
          <div className="events">
            {events.map((event) => (
              <a key={`${event.label}-${event.txHash}`} href={`https://node-console.feso-apps.xyz/#/explorer/query/${event.txHash}`}>
                <ExternalLink size={16} />
                {event.label}: {event.txHash}
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
