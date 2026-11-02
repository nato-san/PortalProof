import React, { useState } from "react";
import { sharedRpc } from "./shared.js";
import { negotiationActions } from "./negotiation.js";

export function RequestNegotiation({ job, kind, userId, t, onChange }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [terms, setTerms] = useState({ amount: job.amount, deadline: job.deadline, requestBrief: job.requestBrief });
  const actions = negotiationActions(job, { kind, userId });
  async function act(action, payload = {}) {
    if (busy) return;
    const confirmations = {
      accept: t("この依頼の金額・納期・内容を承諾して受注を成立させますか？以後のキャンセルには双方の合意が必要です。", "Accept the original amount, deadline and brief? Cancellation will require both parties' agreement."),
      approve_terms: t("提示された変更条件を承認しますか？以後のキャンセルには双方の合意が必要です。", "Approve these changed terms? Cancellation will require both parties' agreement."),
      decline: t("理由を相手に送信し、商談中の依頼をキャンセルしますか？", "Send this reason to the client and decline the request?"),
      approve_cancel: t("キャンセルに同意して取引を終了しますか？", "Agree to cancellation and close this commission?"),
    };
    if (confirmations[action] && !window.confirm(confirmations[action])) return;
    setBusy(true); setMessage("");
    try { onChange(await sharedRpc("pp_signed_request_action", { p_id: job.id, p_version: job.version, p_action: action, p_payload: payload })); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const label = {
    accept: t("この条件で受注する", "Accept original terms"), approve_terms: t("変更条件を承認", "Approve changed terms"),
    approve_cancel: t("キャンセルに同意", "Agree to cancellation"), reject_cancel: t("キャンセルに同意しない", "Decline cancellation"),
  };
  return <section>
    <h3>{t("受注・商談状況", "Agreement status")}</h3>
    <p>{({ negotiating: t("商談中：まだ受注は成立していません。", "Negotiating: not yet accepted."), proposed: t("変更条件への依頼者の承認待ちです。", "Awaiting client approval of changed terms."), agreed: t("受注成立：キャンセルには双方の合意が必要です。", "Agreed: cancellation requires both parties."), cancelled: t("キャンセル済み：依頼と理由の記録は残ります。", "Cancelled: the request and reason remain recorded.") })[job.workflowPhase]}</p>
    {job.termsProposal && <div className="notice"><strong>{t("アーティストの変更提案", "Artist's proposed terms")}</strong><p>{job.termsProposal.amount} tPOTv3 / {job.termsProposal.deadline}</p><p>{job.termsProposal.requestBrief}</p></div>}
    {job.cancellationReason && <p>{t("キャンセル理由：", "Cancellation reason: ")}{job.cancellationReason}</p>}
    {job.cancellationRequest && <div className="notice"><p>{t("キャンセル申請：", "Cancellation requested: ")}{job.cancellationRequest.reason}</p><p>{job.cancellationRequest.by === userId ? t("相手の回答を待っています。", "Waiting for the other participant's response.") : t("同意するか選んでください。", "Choose whether you agree.")}</p></div>}
    {message && <p role="alert">{message}</p>}
    {Object.keys(label).filter(action => actions.includes(action)).map(action => <button key={action} className="secondary" disabled={busy} onClick={() => act(action)}>{label[action]}</button>)}
    {actions.includes("propose") && <details><summary>{t("金額・納期・内容の変更を提案", "Propose changed terms")}</summary><form onSubmit={event => { event.preventDefault(); act("propose", terms); }}>
      <label>{t("金額（tPOTv3）", "Amount (tPOTv3)")}<input required value={terms.amount} onChange={e => setTerms({ ...terms, amount: e.target.value })} /></label>
      <label>{t("納期", "Deadline")}<input type="date" required value={terms.deadline} onChange={e => setTerms({ ...terms, deadline: e.target.value })} /></label>
      <label>{t("仕事内容", "Work brief")}<textarea required maxLength={4000} value={terms.requestBrief} onChange={e => setTerms({ ...terms, requestBrief: e.target.value })} /></label>
      <button disabled={busy}>{t("変更条件を送信（相手の承認が必要）", "Send proposal (requires client approval)")}</button>
    </form></details>}
    {(actions.includes("decline") || actions.includes("request_cancel")) && <form onSubmit={event => { event.preventDefault(); act(actions.includes("decline") ? "decline" : "request_cancel", { reason }); }}>
      <label>{t("キャンセル理由（相手に表示されます）", "Cancellation reason (shown to the other participant)")}<textarea value={reason} onChange={e => setReason(e.target.value)} required maxLength={1000} /></label>
      <button className="secondary" disabled={busy || !reason.trim()}>{actions.includes("decline") ? t("理由を送って商談をキャンセル", "Decline with reason") : t("キャンセルを申請", "Request cancellation")}</button>
    </form>}
    <details><summary>{t("依頼番号・本人確認ウォレット", "Request ID and authenticated wallets")}</summary><p>{job.id}</p><p>{t("アーティスト：", "Artist: ")}{job.creatorWallet}</p><p>{t("依頼者：", "Client: ")}{job.clientWallet}</p></details>
  </section>;
}
