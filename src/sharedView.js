export const creatorTabs = ["create", "open", "closed", "requests"];
export function creatorTab(value) { return creatorTabs.includes(value) ? value : "create"; }
export function sharedLanguage(value) { return value === "en" ? "en" : "ja"; }
export function offeringMatches(row, filter) {
  return filter === "open" ? row.active === true : filter === "closed" ? row.active === false : true;
}
export function sharedStatus(value, language) {
  const labels = {
    new: ["新着", "New"], recorded: ["発注記録済み", "Order recorded"],
    delivered: ["納品済み", "Delivered"], completed: ["完了", "Completed"],
    cancelled: ["キャンセル", "Cancelled"], "in-progress": ["制作中", "In progress"],
  };
  return labels[value]?.[language === "en" ? 1 : 0] || value;
}
