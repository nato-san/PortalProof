// All normal entry points use the shared workspace. Historical browser-local
// links are never silently interpreted as shared requests or deleted.
export function resolveRoute(value) {
  const url = new URL(value);
  const q = url.searchParams;
  // The temporary operator setup page has been removed; old links return home.
  if (q.get("setup") === "job-stages") q.delete("setup");
  if (["creator", "client"].includes(q.get("guide"))) return { kind: "guide", role: q.get("guide") };
  if (q.get("paymentReport")) return { kind: "payment-report", token: q.get("paymentReport") };
  if (q.get("workspace") === "local" || q.get("view") === "deploy") return { kind: "local" };
  if (["request", "job"].includes(q.get("mode"))) return { kind: "saved-link" };
  if (q.get("view") === "setup") q.set("creatorTab", "create");
  if (q.get("view") === "jobs" || q.get("tab") === "inbox") q.set("creatorTab", "requests");
  q.set("view", "shared");
  q.delete("tab");
  return { kind: "shared", href: url.href };
}

export function sharedUrl(value, changes = {}) {
  const url = new URL(value);
  url.searchParams.set("view", "shared");
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  return url;
}

export function navigate(value, { replace = false } = {}, browser = window) {
  const url = new URL(value, browser.location.href);
  if (url.origin !== browser.location.origin) throw new Error("Only same-origin navigation is allowed");
  if (url.href === browser.location.href) return;
  browser.history[replace ? "replaceState" : "pushState"](null, "", url.href);
  browser.dispatchEvent(new Event("popstate"));
}

export function localWorkspaceUrl(value) {
  const url = new URL(value);
  url.searchParams.set("workspace", "local");
  return url.href;
}

export function guideReturnUrl(value, role, language) {
  const url = new URL(value);
  const fallback = new URL(`${url.pathname}?view=shared&role=${role}&lang=${language}`, url);
  const saved = url.searchParams.get("returnTo");
  if (!saved) return fallback.href;
  let target;
  try { target = new URL(saved, url); } catch { return fallback.href; }
  if (target.origin !== url.origin || target.pathname !== url.pathname || resolveRoute(target.href).kind !== "shared") return fallback.href;
  target.searchParams.set("lang", language);
  return sharedUrl(target.href).href;
}
