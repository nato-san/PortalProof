import React from "react";
import { shared } from "./shared.js";
import { signInCreatorWithWallet } from "./walletAuth.js";
export function WalletSignIn({ busy, run, t = (ja) => ja }) {
  return <section className="panel">
    <h1>{t("ウォレットでログイン", "Wallet sign-in")}</h1>
    <p>{t("メール登録不要です。認証メッセージに署名します。送金・ガス代は発生しません。", "No email required. Sign an authentication message; no payment or gas fee.")}</p>
    <button className="primary" disabled={busy} onClick={() => run(async () => {
      await signInCreatorWithWallet(shared.auth, window.ethereum, location.href);
    })}>{t("ウォレットで署名してログイン", "Sign in with wallet")}</button>
    <p>{t("スマホではMetaMaskなどのウォレット内ブラウザで開いてください。通常ブラウザからのWalletConnect接続は未対応です。", "On mobile, open this page in an EVM wallet browser such as MetaMask. WalletConnect from a standard browser is not supported yet.")}</p>
    <p>{t("メールアカウントとは別のアカウントになります。既存案件は削除せず、下のメールログインから確認できます。", "Wallet and email accounts are separate. Existing email-account jobs are kept and accessible via email login below.")}</p>
  </section>;
}
