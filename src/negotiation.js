// UI hints only. Authorization/state changes are independently enforced by PostgreSQL.
export function verifiedSessionWallet(user) {
  const identity = user?.identities?.find(item => item.provider === "web3" && item.identity_data?.custom_claims?.chain === "ethereum");
  const address = identity?.identity_data?.custom_claims?.address;
  return /^0x[0-9a-fA-F]{40}$/.test(address || "") ? address.toLowerCase() : "";
}
export function negotiationActions(job, role) {
  if (job.requestVersion !== 3 || job.workflowPhase === "cancelled" || job.paymentRecordTxHash) return [];
  if (job.cancellationRequest) return job.cancellationRequest.by === role.userId ? [] : ["approve_cancel", "reject_cancel"];
  const creator = role.kind === "creator";
  if (["negotiating", "proposed"].includes(job.workflowPhase)) {
    return creator ? [...(job.workflowPhase === "negotiating" ? ["accept"] : []), "propose", "decline"]
      : [...(job.workflowPhase === "proposed" ? ["approve_terms"] : []), "request_cancel"];
  }
  return job.workflowPhase === "agreed" ? ["request_cancel"] : [];
}
