import { PORTALDOT_V3 } from "./domain.js";

export function walletClientOptions(pageUrl) {
  const url = new URL(pageUrl);
  // Never send private request URLs/tokens to the connection relay or analytics.
  url.search = "?view=shared";
  url.hash = "";
  return {
    dapp: { name: "PortalProof", url: url.href, iconUrl: new URL("./portalproof-icon-192.png", url).href },
    api: { supportedNetworks: { [PORTALDOT_V3.chainId]: PORTALDOT_V3.rpcUrls[0] } },
    ui: { preferExtension: true, showInstallModal: false },
    mobile: { useDeeplink: true },
    skipAutoAnnounce: true,
    analytics: { enabled: false },
  };
}

export function createWalletConnector(load = () => import("@metamask/connect-evm")) {
  let clientPromise;
  return async function connectWallet(injected, pageUrl) {
    // Existing extension and wallet-internal-browser sign-in stays unchanged.
    if (typeof injected?.request === "function") return injected;
    if (!clientPromise) clientPromise = load().then(({ createEVMClient }) => createEVMClient(walletClientOptions(pageUrl))).catch(error => { clientPromise = null; throw error; });
    const client = await clientPromise;
    await client.connect({ chainIds: [PORTALDOT_V3.chainId] });
    const provider = client.getProvider();
    if (typeof provider?.request !== "function") throw new Error("MetaMask connection did not provide a wallet");
    return provider;
  };
}

export const connectBrowserWallet = createWalletConnector();

export function walletLoginError(error, t) {
  const code = error?.rpcCode ?? error?.code;
  if (Number(code) === 4001) return new Error(t("ウォレットで接続または署名がキャンセルされました。もう一度お試しください。", "Wallet connection or signing was cancelled. Please try again."));
  if (Number(code) === -32002) return new Error(t("ウォレットに確認待ちの操作があります。MetaMaskを開いて確認してください。", "A wallet request is pending. Open MetaMask to review it."));
  return error;
}
