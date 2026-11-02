// Authentication only: no transactions, chain switching, or wallet secrets.
export async function signInCreatorWithWallet(auth, wallet, pageUrl) {
  if (!wallet || typeof wallet.request !== "function") {
    throw new Error("ウォレットが見つかりません。MetaMaskなどのウォレット内ブラウザ、または拡張機能が使えるブラウザで開いてください。 / Open in an EVM wallet browser.");
  }
  const url = new URL(pageUrl);
  url.search = "?view=shared";
  url.hash = "";
  const { data, error } = await auth.signInWithWeb3({
    chain: "ethereum", wallet,
    statement: "Sign in to PortalProof workspace. Authentication only, not a payment or order approval.",
    options: { url: url.href, signInWithEthereum: { expirationTime: new Date(Date.now() + 300000) } },
  });
  if (error) throw error;
  if (!data?.session || !data?.user) throw new Error("認証を完了できませんでした。 / Authentication did not complete.");
  return data;
}
