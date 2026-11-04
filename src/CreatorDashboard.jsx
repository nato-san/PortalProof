import React from "react";
import { Settings2, BriefcaseBusiness, Link2, ArrowRight, Home } from "lucide-react";
import { CreatorOfferings } from "./CreatorOfferings.jsx";
import { CreatorJobs } from "./CreatorJobs.jsx";

export function CreatorNavigation({ tab, onChange, t }) {
  const selected = tab === "closed" ? "open" : tab;
  const labels = { home: t("ホーム", "Home"), create: t("募集作成", "Create offering"), open: t("募集管理", "Manage offerings"), requests: t("案件管理", "Manage jobs") };
  return <nav className="sharedMainNav" aria-label={t("受注者メニュー", "Provider navigation")}>
    {Object.entries(labels).map(([key, label]) => <button type="button" key={key} className={selected === key ? "active" : ""} aria-current={selected === key ? "page" : undefined} onClick={() => onChange(key)}>{label}</button>)}
  </nav>;
}

export function CreatorDashboard({ tab, onTabChange, profile, setProfile, creatorWallet, createOffering, busy, savedUrl, ownerId, base, jobs, language, t, onJobChange, onArchiveChange, workflowVersion }) {
  return <>
    {tab !== "home" && <CreatorNavigation tab={tab} onChange={onTabChange} t={t} />}
    {tab === "home" && <>
      <header className="hero compactHero"><div><p className="eyebrow">PORTALDOT HACKER HOUSE 2026 / ECOSYSTEM DAPPS</p><h1>{t("仕事を受ける", "Provide services")}</h1><p>{t("やりたいことを選んで、受注した仕事を進めましょう。", "Choose what you want to do as the provider.")}</p></div></header>
      <section className="creatorHome">
        <div className="creatorOnlyNote"><Home size={20} /><div><strong>{t("受注者専用エリア", "Provider-only area")}</strong><span>{t("このウォレットで管理する募集と依頼を確認できます。", "Manage this wallet's offerings and incoming requests.")}</span></div></div>
        <div className="homeCards">
          {[
            { tab: "create", icon: <Settings2 size={24} />, title: t("募集を作成", "Create an offering"), help: t("仕事内容と受付ページを設定し、募集を公開します。", "Set up a service and create its public request page.") },
            { tab: "requests", icon: <BriefcaseBusiness size={24} />, title: t("案件を管理", "Manage your jobs"), help: t("届いた依頼を段階別に確認し、案件ごとに進めます。", "Review incoming jobs by stage and open each workspace."), count: jobs.filter(job => !job.archivedAt).length },
            { tab: "open", icon: <Link2 size={24} />, title: t("募集とリンクを管理", "Manage offerings and links"), help: t("SNS用リンクのコピーや、受付の停止・再開ができます。", "Copy links for social media, close or reopen offerings.") },
          ].map(card => <button type="button" key={card.tab} className={`homeCard sharedHomeCard ${card.tab === "open" ? "publicEntry" : ""}`} onClick={() => onTabChange(card.tab)}>
            <span className="homeCardIcon">{card.icon}</span>{card.count !== undefined && <span className="homeCardCount">{card.count}</span>}
            <div><strong>{card.title}</strong><p>{card.help}</p></div><span className="homeCardAction">{t("開く", "Open page")}<ArrowRight size={16} /></span>
          </button>)}
        </div>
      </section>
    </>}
    {tab === "create" && <section className="panel sharedForm">
      <h1>{t("募集を作成", "Create an offering")}</h1><p className="muted">{t("サービスごとに受付リンクを作成できます。", "Create a request link for each service.")}</p>
      <form onSubmit={event => { event.preventDefault(); createOffering(); }}>
        {["creatorName", "serviceName", "serviceDescription"].map(key => <label key={key}>
          {({ creatorName: t("受注者名・事業者名", "Provider or business name"), serviceName: t("サービス名", "Service name"), serviceDescription: t("仕事内容", "Service description") })[key]}
          <input required value={profile[key]} onChange={event => setProfile(old => ({ ...old, [key]: event.target.value }))} />
        </label>)}
        <label>{t("受取ウォレット（ログイン中）", "Receiving wallet (signed in)")}<input readOnly value={creatorWallet || ""} /></label>
        <p className="muted">{t("手入力は不要です。署名ログインしたウォレットを安全に設定します。", "No manual entry is needed. Your signed-in wallet is used automatically.")}</p>
        <button className="primary wide" disabled={busy || !creatorWallet}>{t("受付リンクを作成", "Create request link")}</button>
      </form>
    </section>}
    {(tab === "open" || tab === "closed") && <>
      <nav className="jobFilters" aria-label={t("募集の受付状況", "Offering availability")}>{["open", "closed"].map(key => <button type="button" key={key} className={tab === key ? "active" : ""} aria-current={tab === key ? "page" : undefined} onClick={() => onTabChange(key)}>{key === "open" ? t("受付中", "Open") : t("受付終了", "Closed")}</button>)}</nav>
      <CreatorOfferings key={ownerId} ownerId={ownerId} base={base} refreshKey={savedUrl} filter={tab} language={language} t={t} />
    </>}
    {tab === "requests" && <CreatorJobs jobs={jobs} ownerId={ownerId} language={language} t={t} onJobChange={onJobChange} onArchiveChange={onArchiveChange} workflowVersion={workflowVersion} />}
  </>;
}
