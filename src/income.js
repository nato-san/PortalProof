import { parseUnits, formatUnits } from "ethers";

export function completedJob(job) {
  return job.status === "paid" && Boolean(job.paymentRecordTxHash && job.paymentTxHash);
}

export function monthlyIncome(jobs, month) {
  let total = 0n;
  const entries = [], undated = [], seen = new Set();
  for (const job of jobs) {
    if (!completedJob(job)) continue;
    const hash = job.paymentTxHash.toLowerCase();
    if (seen.has(hash)) continue;
    seen.add(hash);
    let amount;
    try { amount = parseUnits(String(job.paidAmount || job.amount), 18); } catch { continue; }
    if (amount <= 0n) continue;
    const date = new Date(job.paidAt || "");
    if (!Number.isFinite(date.getTime())) { undated.push(job); continue; }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (key === month) { total += amount; entries.push(job); }
  }
  return { total: formatUnits(total, 18), entries, undated };
}
