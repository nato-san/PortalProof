// Optional component/DOM integration check. JSDOM and every backend response
// are test-only. It does not replace physical mobile-app handoff verification.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
const { JSDOM } = await import(process.env.JSDOM_MODULE || "jsdom");
const require = createRequire(import.meta.url);
const dom = new JSDOM('<div id="root"></div>', { url: "https://example.com/PortalProof/", pretendToBeVisual: true });
for (const key of ["window", "document", "navigator", "location", "history", "localStorage", "Event", "PopStateEvent"]) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react"), { act } = React;
const { createRoot } = require("react-dom/client");
const user = { id: "test-owner" };
const job = { id: "test-job", requestVersion: 3, version: 1, serviceName: "Test service", clientName: "Test client", requestBrief: "Test brief", workflowPhase: "negotiating", status: "negotiating", amount: "10", deadline: "2026-11-06" };
globalThis.__portalproofTestClient = {
  auth: { getSession: async () => ({ data: { session: { user } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
  rpc: async name => ({ data: name === "pp_signed_workflow_version" ? 2 : name === "pp_get_client_request" ? job : null, error: null }),
  from(name) {
    const data = name === "pp_requests" ? [{ id: job.id, data: job, version: 1 }] : [];
    const query = { select: () => query, eq: () => query, order: () => query, then: (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject) };
    return query;
  },
};
const bundle = await build({
  entryPoints: ["src/AppRouter.jsx"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "mock-shared-backend", setup(api) {
    api.onResolve({ filter: /\/shared\.js$/ }, () => ({ path: "shared", namespace: "test" }));
    api.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const shared = globalThis.__portalproofTestClient; export async function sharedRpc(name) { return (await shared.rpc(name)).data; }" }));
  } }],
});
const module = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(require, module, module.exports);
const { AppRouter } = module.exports;
const root = createRoot(document.getElementById("root"));
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const text = () => document.body.textContent;
async function settle(action) { await act(async () => { action?.(); await tick(); }); }
async function click(label) {
  const button = [...document.querySelectorAll("button")].find(item => item.textContent.includes(label));
  assert.ok(button, "Missing button: " + label);
  await settle(() => button.click());
}
async function visit(href) { await settle(() => { history.pushState(null, "", href); window.dispatchEvent(new Event("popstate")); }); }
await settle(() => root.render(React.createElement(AppRouter, { LocalApp: () => React.createElement("h1", null, "ISOLATED LOCAL APP") })));
assert.match(text(), /クリエイターホーム/);
assert.equal(new URL(location.href).searchParams.get("view"), "shared");
assert.doesNotMatch(text(), /ISOLATED LOCAL APP/);
await click("案件を管理");
assert.match(text(), /Test client/);
await click("詳細を開く");
assert.match(text(), /一覧に戻る/);
await settle(() => history.back());
assert.ok([...document.querySelectorAll("button")].some(button => button.textContent === "詳細を開く"));
await settle(() => history.back());
assert.match(text(), /クリエイターホーム/);
await settle(() => history.forward());
assert.match(text(), /案件管理/);
await click("承認済");
assert.match(location.search, /jobStage=approved/);
await settle(() => history.back());
assert.match(text(), /Test client/);
const guideHref = [...document.querySelectorAll("a")].find(item => item.textContent.includes("使い方ガイド")).href;
await visit(guideHref);
assert.match(text(), /クリエイター向けガイド/);
const backHref = [...document.querySelectorAll("a")].find(item => item.textContent.includes("アプリに戻る")).href;
await visit(backHref);
assert.match(text(), /案件管理/);
await visit("?view=shared&role=client");
assert.match(text(), /自分が依頼した仕事/);
await visit("?view=shared&role=client&clientRequest=test-job");
assert.match(text(), /ご依頼の確認/);
assert.ok([...document.querySelectorAll("a")].some(item => item.textContent === "← 自分が依頼した仕事へ"));
await visit("?view=jobs");
assert.match(text(), /案件管理/);
assert.equal(new URL(location.href).searchParams.get("view"), "shared");
localStorage.setItem("portalproof-requests-v1", "preserve-test-only");
await visit("?mode=job&v=1&id=old");
assert.match(text(), /このリンクは以前の端末保存方式/);
assert.doesNotMatch(text(), /ISOLATED LOCAL APP/);
await visit("?workspace=local&mode=job&v=1&id=old");
assert.match(text(), /ISOLATED LOCAL APP/);
await visit("/");
assert.match(text(), /クリエイターホーム/);
assert.equal(localStorage.getItem("portalproof-requests-v1"), "preserve-test-only");
await settle(() => root.unmount());
dom.window.close();
console.log("DOM integration passed: canonical root, creator/job/stage back-forward, guide return, client details, old entry aliases, explicit saved-data isolation, data preservation. Backend mocked; not physical mobile QA.");
