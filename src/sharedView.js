export const creatorTabs = ["home", "create", "open", "closed", "requests"];
export function creatorTab(value) { return creatorTabs.includes(value) ? value : "home"; }
export const jobStages = ["unprocessed", "approved", "agreed", "delivered", "cancelled", "archive"];
export function jobStage(job) {
  if (job.cancelledAt || job.workflowPhase === "cancelled" || job.status === "cancelled") return "cancelled";
  if (job.deliveryTxHash || ["delivered", "paid", "completed"].includes(job.status)) return "delivered";
  if (job.workflowPhase === "agreed" || job.orderId || job.status === "active") return "agreed";
  if (["approved", "proposed"].includes(job.workflowPhase)) return "approved";
  return "unprocessed";
}
export function jobMatches(job, stage) {
  return stage === "archive" ? Boolean(job.archivedAt) : !job.archivedAt && jobStage(job) === stage;
}
export function jobStageLabel(stage, language) {
  const labels = { unprocessed: ["未処理", "Unprocessed"], approved: ["承認済", "Approved"], agreed: ["交渉済", "Terms agreed"], delivered: ["納品済", "Delivered"], cancelled: ["キャンセル済", "Cancelled"], archive: ["アーカイブ", "Archive"] };
  return labels[stage]?.[language === "en" ? 1 : 0] || stage;
}
export function sharedLanguage(value) { return value === "en" ? "en" : "ja"; }
export function offeringMatches(row, filter) {
  return filter === "open" ? row.active === true : filter === "closed" ? row.active === false : true;
}
export function sharedStatus(value, language) {
  const labels = {
    negotiating: ["未処理", "Unprocessed"], approved: ["承認済（商談中）", "Approved (negotiating)"], proposed: ["変更条件の承認待ち", "Awaiting terms approval"], agreed: ["交渉済（受注成立）", "Terms agreed"],
    new: ["新着", "New"], recorded: ["発注記録済み", "Order recorded"],
    delivered: ["納品済み", "Delivered"], completed: ["完了", "Completed"],
    cancelled: ["キャンセル", "Cancelled"], "in-progress": ["制作中", "In progress"],
  };
  return labels[value]?.[language === "en" ? 1 : 0] || value;
}
