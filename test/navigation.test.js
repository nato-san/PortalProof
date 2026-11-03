import assert from "node:assert/strict";
import { resolveRoute, sharedUrl, navigate, localWorkspaceUrl, guideReturnUrl } from "../src/navigation.js";
const base = "https://example.com/PortalProof/";
for (const query of ["", "?view=shared", "?role=client", "?offering=offer", "?clientRequest=job", "?view=unknown"]) {
  const route = resolveRoute(base + query);
  assert.equal(route.kind, "shared");
  assert.equal(new URL(route.href).searchParams.get("view"), "shared");
}
assert.equal(new URL(resolveRoute(base + "?view=setup").href).searchParams.get("creatorTab"), "create");
assert.equal(new URL(resolveRoute(base + "?view=jobs").href).searchParams.get("creatorTab"), "requests");
assert.equal(new URL(resolveRoute(base + "?tab=inbox").href).searchParams.get("creatorTab"), "requests");
for (const mode of ["job", "request"]) assert.equal(resolveRoute(base + `?mode=${mode}&v=1&id=old`).kind, "saved-link");
assert.equal(resolveRoute(localWorkspaceUrl(base + "?mode=job&id=old")).kind, "local");
assert.equal(resolveRoute(base + "?view=deploy").kind, "local");
assert.equal(resolveRoute(base + "?guide=creator").kind, "guide");
assert.deepEqual(resolveRoute(base + "?setup=job-stages"), { kind: "shared", href: base + "?view=shared" });
assert.equal(resolveRoute(base + "?paymentReport=private").kind, "payment-report");
const detail = sharedUrl(base + "?lang=en&view=shared&creatorTab=requests&sharedJob=job&jobStage=approved", { sharedJob: null });
assert.equal(detail.searchParams.has("sharedJob"), false);
assert.equal(detail.searchParams.get("lang"), "en");
const browser = new EventTarget();
browser.location = new URL(base);
const entries = [base]; let index = 0, notifications = 0;
browser.history = {
  pushState(_s, _t, href) { entries.splice(++index); entries[index] = href; browser.location = new URL(href); },
  replaceState(_s, _t, href) { entries[index] = href; browser.location = new URL(href); },
};
browser.addEventListener("popstate", () => notifications++);
navigate(base + "?view=shared", { replace: true }, browser);
navigate(sharedUrl(browser.location, { creatorTab: "requests" }), {}, browser);
navigate(sharedUrl(browser.location, { sharedJob: "job" }), {}, browser);
assert.equal(entries.length, 3);
assert.equal(notifications, 3);
navigate(browser.location.href, {}, browser);
assert.equal(notifications, 3);
assert.throws(() => navigate("https://untrusted.example/", {}, browser), /same-origin/);
const guide = new URL(base + "?guide=client");
guide.searchParams.set("returnTo", "/PortalProof/?view=shared&role=client&clientRequest=job");
assert.equal(new URL(guideReturnUrl(guide.href, "client", "en")).searchParams.get("clientRequest"), "job");
for (const bad of ["https://untrusted.example/", "/another-app/", "?mode=job&id=old", "?guide=creator", "http://["]) {
  guide.searchParams.set("returnTo", bad);
  assert.equal(guideReturnUrl(guide.href, "client", "ja"), base + "?view=shared&role=client&lang=ja");
}
console.log("Navigation tests passed: canonical entry, saved-link isolation, history, safe guide return");
