// Optional real-browser regression test. All Supabase calls and signatures are
// mocked; no real accounts, requests, transactions or wallet secrets are used.
import assert from "node:assert/strict";
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const wallet = "0x1111111111111111111111111111111111111111";
const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", identities: [{ provider: "web3", identity_data: { custom_claims: { chain: "ethereum", address: wallet } } }] };
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = [ { alg: "HS256", typ: "JWT" }, { sub: user.id, exp, role: "authenticated" } ].map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".test-only";
const session = { access_token: jwt, refresh_token: "browser-test-only", expires_in: 3600, expires_at: exp, token_type: "bearer", user };
const job = { id: "00000000-0000-4000-8000-000000000002", version: 1, requestVersion: 3, clientName: "Test client", creatorName: "Test creator", serviceName: "Test service", requestBrief: "Test brief", amount: "10", deadline: "2026-11-06", workflowPhase: "negotiating", status: "negotiating", creatorWallet: wallet, clientWallet: "0x2222222222222222222222222222222222222222" };

async function fixture(context, injected = true) {
  await context.addInitScript(({ wallet }) => {
    window.testWalletMethods = [];
    localStorage.setItem("portalproof-requests-v1", '[{"id":"preserved-local-job"}]');
    if (wallet) window.ethereum = { request: async ({ method }) => {
      window.testWalletMethods.push(method);
      if (method === "eth_requestAccounts") return [wallet];
      if (method === "eth_chainId") return "0x190f1ca9";
      if (method === "personal_sign") return "0x" + "11".repeat(65);
      throw new Error("Unexpected wallet method: " + method);
    } };
  }, { wallet: injected ? wallet : null });
  await context.route("https://jpagtalwwdykopwqhbgp.supabase.co/**", async route => {
    const url = new URL(route.request().url());
    let body;
    if (url.pathname === "/auth/v1/token") body = session;
    else if (url.pathname === "/auth/v1/user") body = user;
    else if (url.pathname === "/auth/v1/logout") body = {};
    else if (url.pathname.endsWith("pp_signed_workflow_version")) body = 2;
    else if (url.pathname.endsWith("pp_get_offering")) body = { creatorName: "Test creator", serviceName: "Test service", serviceDescription: "Test offering" };
    else if (url.pathname.endsWith("pp_get_client_request")) body = job;
    else if (url.pathname.endsWith("pp_requests")) body = [{ id: job.id, version: 1, data: job }];
    else if (url.pathname.endsWith("pp_offerings")) body = [{ id: "test-offer", profile: { creatorName: "Test creator", serviceName: "Test service", serviceDescription: "Test offering" }, active: true }];
    else if (url.pathname.endsWith("pp_request_archives")) body = [];
    else throw new Error("Unmocked Supabase operation: " + url.pathname);
    await route.fulfill({ json: body, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
  });
}

for (const [name, engine, options] of [
  ["Chromium mobile", chromium, { executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }],
  ["WebKit mobile", webkit, {}],
]) {
  if (process.env.BROWSER_ENGINE && !name.toLowerCase().includes(process.env.BROWSER_ENGINE.toLowerCase())) continue;
  const browser = await engine.launch({ headless: true, ...options });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await fixture(context);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole("heading", { name: "ウォレットでログイン", exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("view"), "shared");
    await page.getByRole("button", { name: "ウォレットで署名してログイン", exact: true }).click();
    await page.getByRole("heading", { name: "クリエイターホーム", exact: true }).waitFor();
    const methods = await page.evaluate(() => window.testWalletMethods);
    assert.deepEqual(methods, ["eth_requestAccounts", "eth_chainId", "personal_sign"]);
    await page.getByRole("button", { name: /案件を管理/ }).click();
    await page.getByRole("heading", { name: "案件管理", exact: true }).waitFor();
    await page.getByRole("button", { name: "詳細を開く" }).click();
    await page.getByRole("button", { name: "一覧に戻る" }).waitFor();
    await page.goBack();
    await page.getByRole("button", { name: "詳細を開く" }).waitFor();
    await page.goBack();
    await page.getByRole("heading", { name: "クリエイターホーム", exact: true }).waitFor();
    await page.goForward();
    await page.getByRole("heading", { name: "案件管理", exact: true }).waitFor();
    await page.getByRole("button", { name: /承認済/ }).click();
    assert.match(page.url(), /jobStage=approved/);
    await page.goBack();
    await page.getByRole("button", { name: "詳細を開く" }).waitFor();
    const popupPromise = context.waitForEvent("page");
    await page.getByRole("link", { name: /使い方ガイド/ }).click();
    const guide = await popupPromise;
    await guide.getByRole("heading", { name: "クリエイター向けガイド" }).waitFor();
    await guide.getByRole("link", { name: "← アプリに戻る" }).click();
    await guide.getByRole("heading", { name: "案件管理", exact: true }).waitFor();
    assert.equal(new URL(guide.url()).searchParams.get("view"), "shared");
    await guide.close();
    await page.getByRole("link", { name: "自分が依頼した仕事", exact: true }).click();
    await page.getByRole("heading", { name: "自分が依頼した仕事", exact: true }).waitFor();
    await page.getByRole("link", { name: "依頼の詳細", exact: true }).click();
    await page.getByRole("heading", { name: "ご依頼の確認", exact: true }).waitFor();
    await page.getByRole("link", { name: "← 自分が依頼した仕事へ" }).click();
    await page.getByRole("heading", { name: "自分が依頼した仕事", exact: true }).waitFor();
    await page.goto(base + "?view=jobs");
    await page.getByRole("heading", { name: "案件管理", exact: true }).waitFor();
    await page.goto(base + "?mode=job&v=1&id=old-test");
    await page.getByRole("heading", { name: "このリンクは以前の端末保存方式のものです" }).waitFor();
    await page.getByRole("link", { name: "PortalProofのホームへ" }).click();
    await page.getByRole("heading", { name: "クリエイターホーム", exact: true }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "クリエイターホーム", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("portalproof-requests-v1")), '[{"id":"preserved-local-job"}]');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile page overflows horizontally");
    assert.deepEqual(errors, []);
    console.log(`${name}: root, mocked sign-in, back/forward, stage history, guide return, roles, saved links, reload, data preservation and width passed`);
    await context.close();
  } finally { await browser.close(); }
}
console.log("Browser regression checks passed; native MetaMask app handoff and physical iOS/Android devices still require manual testing.");
