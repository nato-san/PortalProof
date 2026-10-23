import React, { useState } from "react";
import { completedJob } from "./income.js";

export function ArchiveControls({ job, language, onArchive, onRestore }) {
  const [editing, setEditing] = useState(false), [reason, setReason] = useState("");
  const text = (jp, en) => language === "ja" ? jp : en;
  if (job.archivedAt) return <div className="archiveActions">{job.cancelledAt && <p><strong>{text("キャンセル理由", "Cancellation reason")}</strong>: {job.cancellationReason}</p>}<button className="secondary wide" onClick={() => onRestore(job.id)}>{text("アーカイブから元に戻す", "Restore from archive")}</button><small>{job.cancelledAt ? text("キャンセル前の進行状況に戻します。", "Restores the previous work status.") : text("完了状態と売上を維持して一覧へ戻します。", "Returns to the list, keeping completed status and income.")}</small></div>;
  if (completedJob(job)) return <button className="secondary wide archiveActions" onClick={() => onArchive(job.id)}>{text("アーカイブ化する", "Archive job")}</button>;
  return <div className="archiveActions">{editing ? <form onSubmit={(event) => { event.preventDefault(); if (reason.trim()) onArchive(job.id, reason); }}><label>{text("キャンセル理由（必須）", "Cancellation reason (required)")}<textarea value={reason} maxLength={1000} required onChange={(event) => setReason(event.target.value)} /></label><p>{text("この案件をキャンセルしてアーカイブします。売上には含めません。", "Cancels and archives this job. It will not count toward income.")}</p><button className="secondary wide" disabled={!reason.trim()}>{text("理由を保存してアーカイブ", "Save reason and archive")}</button><button type="button" className="secondary" onClick={() => setEditing(false)}>{text("やめる", "Back")}</button></form> : <button className="secondary wide" onClick={() => setEditing(true)}>{text("キャンセルしてアーカイブ", "Cancel and archive")}</button>}</div>;
}
