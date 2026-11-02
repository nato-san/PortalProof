import React from "react";
import { CreatorOfferings } from "./CreatorOfferings.jsx";
import { creatorTabs, sharedStatus } from "./sharedView.js";

export function CreatorNavigation({ tab, onChange, t }) {
  const labels = { create: t("募集作成", "Create offering"), open: t("受付中", "Open offerings"), closed: t("受付終了", "Closed offerings"), requests: t("届いた依頼", "Incoming requests") };
  return <nav className="sharedTabs" aria-label={t("クリエイターメニュー", "Creator navigation")}>
    {creatorTabs.map((key) => <button type="button" key={key} className={tab === key ? "primary" : "secondary"} aria-current={tab === key ? "page" : undefined} onClick={() => onChange(key)}>{labels[key]}</button>)}
  </nav>;
}

export function CreatorDashboard({ tab, onTabChange, profile, setProfile, createOffering, busy, savedUrl, ownerId, base, jobs, language, t }) {
  return <>
    <CreatorNavigation tab={tab} onChange={onTabChange} t={t} />
    {tab === "create" && <section className="panel">
      <h1>{t("募集を作成", "Create an offering")}</h1>
      <p>{t("サービスごとに受付リンクを作成できます。既存の募集は「受付中」「受付終了」から確認できます。", "Create a request link for each service. Find existing offerings under Open or Closed offerings.")}</p>
      <form onSubmit={(event) => { event.preventDefault(); createOffering(); }}>
        {["creatorName", "creatorWallet", "serviceName", "serviceDescription"].map((key) => <label key={key}>
          {({ creatorName: t("クリエイター名", "Creator name"), creatorWallet: t("受取ウォレット", "Receiving wallet"), serviceName: t("サービス名", "Service name"), serviceDescription: t("仕事内容", "Service description") })[key]}
          <input value={profile[key]} onChange={(event) => setProfile((old) => ({ ...old, [key]: event.target.value }))} />
        </label>)}
        <button className="primary" disabled={busy}>{t("受付リンクを作成", "Create request link")}</button>
      </form>
    </section>}
    {(tab === "open" || tab === "closed") && <CreatorOfferings key={ownerId} ownerId={ownerId} base={base} refreshKey={savedUrl} filter={tab} language={language} t={t} />}
    {tab === "requests" && <section>
      <h1>{t("届いた依頼", "Incoming requests")}</h1>
      {!jobs.length && <p>{t("まだ依頼は届いていません。", "No requests yet.")}</p>}
      {jobs.map((job) => <article className="panel" key={job.id}>
        <h3>{job.clientName} ／ {job.serviceName}</h3><p>{job.requestBrief}</p>
        <p>{job.amount} tPOTv3 ／ {job.deadline}</p>
        <p>{t("状態：", "Status: ")}{sharedStatus(job.status, language)}</p>
        {job.paymentTxHash && <p>{t("支払い報告（未照合）：", "Payment report (unverified): ")}<code>{job.paymentTxHash}</code></p>}
        <p>{t("新方式のオンチェーン記録は改訂版コントラクトとの接続後に利用できます。", "On-chain recording for this workflow requires integration with the revised contract.")}</p>
      </article>)}
    </section>}
  </>;
}
