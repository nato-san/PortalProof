import React from "react";
import { shared } from "./shared.js";
import { signInCreatorWithWallet } from "./walletAuth.js";
export function WalletSignIn({ busy, run }) {
  return <section className="panel">
    <h1>ウォレットでログイン / Wallet sign-in</h1>
    <p>メール登録不要です。認証メッセージに署名します。送金・ガス代は発生しません。</p>
    <p>No email required. Sign an authentication message; no payment or gas fee.</p>
    <button className="primary" disabled={busy} onClick={() => run(async () => {
      await signInCreatorWithWallet(shared.auth, window.ethereum, location.href);
    })}>ウォレットで署名してログイン / Sign in with wallet</button>
    <p>スマホではMetaMaskなどのウォレット内ブラウザで開いてください。通常ブラウザからのWalletConnect接続は未対応です。</p>
    <p>メールアカウントとは別のアカウントになります。既存案件は削除せず、下のメールログインから確認できます。</p>
  </section>;
}
