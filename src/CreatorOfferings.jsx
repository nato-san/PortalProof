import React, { useEffect, useState } from "react";
import { shared } from "./shared.js";
import { loadCreatorOfferings, offeringUrl, setOfferingActive } from "./offerings.js";

export function OfferingCards({ rows, base, onCopy, onToggle, disabled = false }) {
  return rows.map((row) => {
    const profile = row.profile || {};
    const url = offeringUrl(base, row.id);
    return <article className="panel" key={row.id}>
      <p>{row.active ? "受付中 / Open" : "受付停止中 / Closed"}</p>
      <h3>{profile.serviceName || "名称未設定 / Untitled"}</h3>
      <p>{profile.creatorName}</p>
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{profile.serviceDescription}</p>
      <label>受付URL / Request URL<input readOnly value={url} onFocus={(event) => event.target.select()} /></label>
      {row.active && <a className="buttonLink primary" href={url} target="_blank" rel="noopener noreferrer">依頼者ページを開く / Open request page</a>}
      <button type="button" className="secondary" onClick={() => onCopy(url)}>URLをコピー / Copy URL</button>
      <button type="button" className="secondary" disabled={disabled} onClick={() => onToggle(row)}>{row.active ? "受付を停止 / Close offering" : "受付を再開 / Reopen offering"}</button>
    </article>;
  });
}

export function CreatorOfferings({ ownerId, base, refreshKey }) {
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
        if (!cancelled) { setRows([]); setError(`募集一覧を取得できませんでした / Unable to load offerings: ${err.message}`); }
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
  async function copy(url) {
    try { await navigator.clipboard.writeText(url); setNotice("URLをコピーしました / URL copied"); }
    catch { setNotice("コピーできませんでした。受付URL欄を選択してコピーしてください。 / Select the URL field to copy manually."); }
  }
  async function toggle(row) {
    if (updating) return;
    if (row.active && !window.confirm("この募集の新規受付を停止しますか？既存の依頼は残ります。 / Close new requests? Existing jobs will be kept.")) return;
    setUpdating(true); setError(""); setNotice("");
    try {
      await setOfferingActive(shared, ownerId, row.id, !row.active);
      setNotice(row.active ? "受付を停止しました。既存の依頼は残っています。 / Offering closed; existing jobs kept." : "同じURLで受付を再開しました。 / Offering reopened at the same URL.");
    } catch (err) { setNotice(`更新できませんでした / Update failed: ${err.message}`); }
    finally { setUpdating(false); setReload((value) => value + 1); }
  }
  return <section aria-labelledby="creator-offerings-heading">
    <h2 id="creator-offerings-heading">作成済みの募集一覧 / Your offerings</h2>
    <p>このアカウントで作成した募集です。メールとウォレットのアカウントは別々に表示されます。</p>
    <button type="button" className="secondary" disabled={loading} onClick={() => setReload((value) => value + 1)}>一覧を更新 / Refresh</button>
    {loading && <p role="status">読み込み中 / Loading…</p>}
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!loading && !error && rows.length === 0 && <p>まだ募集がありません。上のフォームから作成できます。 / No offerings yet.</p>}
    <OfferingCards rows={rows} base={base} onCopy={copy} onToggle={toggle} disabled={loading || updating} />
  </section>;
}
