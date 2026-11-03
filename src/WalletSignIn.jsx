import React from "react";
import { shared } from "./shared.js";
import { signInCreatorWithWallet } from "./walletAuth.js";
import { connectBrowserWallet, walletLoginError } from "./walletConnection.js";
export function WalletSignIn({ busy, run, t = (ja) => ja }) {
  return <section className="panel">
    <h1>{t("ウォレットでログイン", "Wallet sign-in")}</h1>
    <p>{t("メール登録不要です。認証メッセージに署名します。送金・ガス代は発生しません。", "No email required. Sign an authentication message; no payment or gas fee.")}</p>
    <button className="primary" disabled={busy} onClick={() => run(async () => {
      try {
        const wallet = await connectBrowserWallet(window.ethereum, location.href);
        await signInCreatorWithWallet(shared.auth, wallet, location.href);
      } catch (error) { throw walletLoginError(error, t); }
    })}>{busy ? t("ウォレットの確認待ち…", "Waiting for wallet…") : t("ウォレットで署名してログイン", "Sign in with wallet")}</button>
    <p>{t("スマホのSafari・ChromeではMetaMaskアプリへ接続します。接続とログイン署名を確認したら、元のブラウザへ戻ってください。MetaMaskアプリのインストールが必要です。", "On mobile Safari and Chrome, connect to the MetaMask app. Approve the connection and sign-in message, then return to this browser. The MetaMask app must be installed.")}</p>
    <p>{t("メールアカウントとは別のアカウントになります。既存案件は削除せず、下のメールログインから確認できます。", "Wallet and email accounts are separate. Existing email-account jobs are kept and accessible via email login below.")}</p>
  </section>;
}
