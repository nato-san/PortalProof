import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Archive, RotateCcw } from "lucide-react";
import { sharedRpc } from "./shared.js";
import { RequestNegotiation } from "./RequestNegotiation.jsx";
import { SharedProofWorkflow } from "./SharedProofWorkflow.jsx";
import { jobStages, jobMatches, jobStage, jobStageLabel } from "./sharedView.js";
import { usePageUrl } from "./usePageUrl.js";
import { navigate as navigatePage, sharedUrl } from "./navigation.js";

export function JobStageNavigation({ stage, jobs, language, onChange }) {
  return <nav className="jobFilters" aria-label={language === "ja" ? "案件の段階" : "Job stages"}>
    {jobStages.map(key => <button key={key} type="button" className={key === stage ? "active" : ""} aria-current={key === stage ? "page" : undefined} onClick={() => onChange(key)}>
      {jobStageLabel(key, language)}<span>{jobs.filter(job => jobMatches(job, key)).length}</span>
    </button>)}
  </nav>;
}

export function CreatorJobs({ jobs, ownerId, language, t, onJobChange, onArchiveChange, workflowVersion }) {
  const query = usePageUrl().searchParams;
  const stage = jobStages.includes(query.get("jobStage")) ? query.get("jobStage") : "unprocessed";
  const selectedId = query.get("sharedJob") || "";
  const [busyId, setBusyId] = useState(""), [error, setError] = useState("");
  const selected = jobs.find(job => job.id === selectedId);
  function navigate(nextStage, id = "") {
    setError("");
    navigatePage(sharedUrl(location.href, { jobStage: nextStage, sharedJob: id || null }));
  }
  async function archive(job) {
    if (busyId) return;
    if (!job.archivedAt && !window.confirm(t("一覧を整理するため、この案件をアーカイブしますか？取引の状態や発注者側の表示は変わりません。", "Archive this job for your own organization? Its transaction state and client view will not change."))) return;
    setBusyId(job.id); setError("");
    try {
      const value = await sharedRpc("pp_set_request_archive", { p_id: job.id, p_archived: !job.archivedAt });
      onArchiveChange(job.id, value.archivedAt);
    } catch (err) { setError(err.message); }
    finally { setBusyId(""); }
  }
  const archiveButton = job => <button type="button" className="secondary" disabled={Boolean(busyId) || workflowVersion < 2} onClick={() => archive(job)}>
    {job.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}{job.archivedAt ? t("元の一覧に戻す", "Restore to stage") : t("アーカイブ", "Archive")}
  </button>;
  const visible = jobs.filter(job => jobMatches(job, stage));
  return <section>
    <header className="hero compactHero"><div><p className="eyebrow">PortalProof</p><h1>{t("案件管理", "Manage your jobs")}</h1><p>{t("段階ごとに確認し、案件を開いて次の操作へ進みます。", "Review jobs by stage, then open one to take the next step.")}</p></div></header>
    <JobStageNavigation stage={stage} jobs={jobs} language={language} onChange={next => navigate(next)} />
    {error && <p className="notice" role="alert">{error}</p>}
    {selectedId ? <>
      <button type="button" className="secondary" onClick={() => navigate(stage)}><ArrowLeft size={16} />{t("一覧に戻る", "Back to list")}</button>
      {!selected ? <p>{t("案件を読み込み中、またはこのアカウントでは閲覧できません。", "Loading job, or it is unavailable to this account.")}</p> : <div className="manageLayout sharedJobDetail">
        <aside className="panel requestSidebar"><span className={`statusBadge ${selected.status}`}>{jobStageLabel(jobStage(selected), language)}</span><h2>{selected.serviceName}</h2><p>{selected.clientName}</p><dl><dt>{t("金額", "Amount")}</dt><dd>{selected.amount} tPOTv3</dd><dt>{t("納期", "Deadline")}</dt><dd>{selected.deadline}</dd></dl><p className="briefText">{selected.requestBrief}</p>{archiveButton(selected)}</aside>
        <div className="panel">
          {selected.requestVersion === 3 ? <RequestNegotiation key={`${selected.id}-${selected.version}`} job={selected} kind="creator" userId={ownerId} t={t} onChange={onJobChange} workflowVersion={workflowVersion} />
            : <p>{t("以前のテスト依頼です。新しい商談ルールの対象には自動変換していません。", "This earlier test request has not been automatically converted to the new agreement rules.")}</p>}
          {selected.requestVersion === 3 && <SharedProofWorkflow job={selected} kind="creator" t={t} onChange={onJobChange} workflowVersion={workflowVersion} />}
        </div>
      </div>}
    </> : visible.length ? <div className="requestCards sharedJobCards">{visible.map(job => <article className="panel requestCard" key={job.id}>
      <div className="requestCardTop"><span className={`statusBadge ${job.status}`}>{jobStageLabel(jobStage(job), language)}</span><time>{job.createdAt ? new Date(job.createdAt).toLocaleDateString(language === "ja" ? "ja-JP" : "en-US") : ""}</time></div>
      <h3>{job.clientName}</h3><p className="requestService">{job.serviceName}</p><p className="sharedBriefPreview">{job.requestBrief}</p>
      <dl><dt>{t("金額", "Amount")}</dt><dd>{job.amount} tPOTv3</dd><dt>{t("納期", "Deadline")}</dt><dd>{job.deadline}</dd></dl>
      <button type="button" className="primary wide" onClick={() => navigate(stage, job.id)}>{t("詳細を開く", "Open job")}<ArrowRight size={16} /></button>
      {archiveButton(job)}
    </article>)}</div> : <div className="panel emptyState"><h3>{t("この一覧に案件はありません", "No jobs in this stage")}</h3></div>}
  </section>;
}
