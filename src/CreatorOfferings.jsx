import React, { useEffect, useState } from "react";
import { shared } from "./shared.js";
import { loadCreatorOfferings, offeringUrl, setOfferingActive } from "./offerings.js";
import { offeringMatches } from "./sharedView.js";
const defaultT = (ja) => ja;

export function OfferingCards({ rows, base, onCopy, onToggle, disabled = false, t = defaultT }) {
  return rows.map((row) => {
    const profile = row.profile || {};
    const url = offeringUrl(base, row.id);
    return <article className="panel" key={row.id}>
      <p>{row.active ? t("受付中", "Open") : t("受付終了", "Closed")}</p>
      <h3>{profile.serviceName || t("名称未設定", "Untitled")}</h3>
      <p>{profile.creatorName}</p>
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{profile.serviceDescription}</p>
      <label>{t("受付URL", "Request URL")}<input readOnly value={url} onFocus={(event) => event.target.select()} /></label>
      {row.active && <a className="buttonLink primary" href={url} target="_blank" rel="noopener noreferrer">{t("依頼者ページを開く", "Open request page")}</a>}
      <button type="button" className="secondary" onClick={() => onCopy(url)}>{t("URLをコピー", "Copy URL")}</button>
      <button type="button" className="secondary" disabled={disabled} onClick={() => onToggle(row)}>{row.active ? t("受付を停止", "Close offering") : t("受付を再開", "Reopen offering")}</button>
    </article>;
  });
}

export function CreatorOfferings({ ownerId, base, refreshKey, filter, language = "ja", t = defaultT }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const value = await loadCreatorOfferings(shared, ownerId);
        if (!cancelled) { setRows(value); setError(""); }
      } catch (err) {
        if (!cancelled) { setRows([]); setError(err.message); }
      } finally {
        pending = false;
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [ownerId, refreshKey, reload]);
  useEffect(() => { setNotice(""); }, [language, filter]);
  async function copy(url) {
    try { await navigator.clipboard.writeText(url); setNotice(t("URLをコピーしました", "URL copied")); }
    catch { setNotice(t("コピーできませんでした。受付URL欄を選択してコピーしてください。", "Select the URL field to copy manually.")); }
  }
  async function toggle(row) {
    if (updating) return;
    if (row.active && !window.confirm(t("この募集の新規受付を停止しますか？既存の依頼は残ります。", "Close new requests? Existing jobs will be kept."))) return;
    setUpdating(true); setError(""); setNotice("");
    try {
      await setOfferingActive(shared, ownerId, row.id, !row.active);
      setNotice(row.active ? t("受付を停止しました。「受付終了」で確認できます。既存の依頼は残っています。", "Offering closed. Find it under Closed offerings; existing jobs are kept.") : t("同じURLで受付を再開しました。「受付中」で確認できます。", "Offering reopened at the same URL. Find it under Open offerings."));
    } catch (err) { setNotice(`${t("更新できませんでした", "Update failed")}: ${err.message}`); }
    finally { setUpdating(false); setReload((value) => value + 1); }
  }
  const visibleRows = rows.filter((row) => offeringMatches(row, filter));
  return <section aria-labelledby="creator-offerings-heading">
    <h1 id="creator-offerings-heading">{filter === "closed" ? t("受付終了の募集", "Closed offerings") : t("受付中の募集", "Open offerings")}</h1>
    <p>{t("このアカウントで作成した募集です。", "Offerings created by this account.")}</p>
    <button type="button" className="secondary" disabled={loading} onClick={() => setReload((value) => value + 1)}>{t("一覧を更新", "Refresh")}</button>
    {loading && <p role="status">{t("読み込み中", "Loading…")}</p>}
    {error && <p role="alert">{t("募集一覧を取得できませんでした", "Unable to load offerings")}: {error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!loading && !error && visibleRows.length === 0 && <p>{filter === "closed" ? t("受付終了の募集はありません。", "No closed offerings.") : t("受付中の募集はありません。「募集作成」から作成できます。", "No open offerings. Use Create offering to add one.")}</p>}
    <OfferingCards rows={visibleRows} base={base} onCopy={copy} onToggle={toggle} disabled={loading || updating} t={t} />
  </section>;
}
