import { parseUnits, formatUnits } from "ethers";

export function completedJob(job) {
  return !job.cancelledAt && job.status === "paid" && Boolean(job.paymentRecordTxHash && job.paymentTxHash);
}

export function archiveJob(job, reason = "", now = new Date().toISOString()) {
  if (job.archivedAt) return job;
  if (completedJob(job)) return { ...job, archivedAt: now };
  if (!reason.trim()) throw new Error("Cancellation reason is required");
  return { ...job, archivedAt: now, cancelledAt: now, cancellationReason: reason.trim(), statusBeforeCancellation: job.status, status: "cancelled" };
}

export function restoreJob(job) {
  return { ...job, archivedAt: null, ...(job.cancelledAt ? { status: job.statusBeforeCancellation || "new", cancelledAt: null } : {}) };
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
