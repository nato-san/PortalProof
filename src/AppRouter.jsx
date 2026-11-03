import React, { useEffect } from "react";
import { SharedWorkspace } from "./SharedWorkspace.jsx";
import { UsageGuide } from "./UsageGuide.jsx";
import { ClientPaymentReport } from "./PaymentReport.jsx";
import { localWorkspaceUrl, navigate, resolveRoute } from "./navigation.js";
import { usePageUrl } from "./usePageUrl.js";
import StageSetup from "./StageSetup.jsx";

function SavedLinkNotice({ url }) {
  const ja = url.searchParams.get("lang") !== "en";
  return <main className="shell"><section className="panel">
    <h1>{ja ? "このリンクは以前の端末保存方式のものです" : "This link uses browser-local storage"}</h1>
    <p>{ja ? "現在の募集・案件とは別の保存方式です。別端末で使うには、クリエイターから現在の募集リンクを受け取ってください。保存済みのデータは削除していません。" : "It cannot be treated as a shared commission. Ask the creator for their current offering link to use another device. Saved data has not been deleted."}</p>
    <a className="buttonLink primary" href={`${url.pathname}?view=shared&lang=${ja ? "ja" : "en"}`}>{ja ? "PortalProofのホームへ" : "PortalProof home"}</a>
    <details><summary>{ja ? "この端末の保存済みデータを確認する" : "Access existing data on this device"}</summary><p>{ja ? "保存した端末・ブラウザでのみ確認できます。現在の共有案件へは自動移行されません。" : "Use the original browser and device. Data is not automatically migrated to shared commissions."}</p><a className="buttonLink secondary" href={localWorkspaceUrl(url.href)}>{ja ? "保存済み画面を開く" : "Open saved workspace"}</a></details>
  </section></main>;
}

// Historical links stay isolated. New navigation must never fall back to App.
export function AppRouter({ LocalApp, contractAddress }) {
  const url = usePageUrl();
  const route = resolveRoute(url.href);
  useEffect(() => {
    if (route.kind === "shared" && route.href !== location.href) navigate(route.href, { replace: true });
  }, [url.href]);
  if (route.kind === "stage-setup") return <StageSetup />;
  if (route.kind === "guide") return <UsageGuide role={route.role} />;
  if (route.kind === "payment-report") return <ClientPaymentReport token={route.token} contractAddress={contractAddress} />;
  if (route.kind === "saved-link") return <SavedLinkNotice url={url} />;
  if (route.kind === "local") return <div onClickCapture={event => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor) return;
    const destination = new URL(anchor.href, location.href);
    if (destination.origin === url.origin && destination.pathname === url.pathname && destination.searchParams.get("view") !== "shared" && !destination.searchParams.has("guide") && !destination.searchParams.has("paymentReport")) anchor.href = localWorkspaceUrl(destination.href);
  }}><aside className="notice" role="status">{url.searchParams.get("lang") === "en" ? "Saved browser-local workspace — not shared commissions." : "この端末に保存された案件の確認画面です。現在の共有案件とは別の保存方式です。"} <a href={`${url.pathname}?view=shared`}>PortalProof ホーム / Home</a></aside><LocalApp /></div>;
  const identity = [url.searchParams.get("role"), url.searchParams.get("offering"), url.searchParams.get("clientRequest")].join(":");
  return <SharedWorkspace key={identity} />;
}
