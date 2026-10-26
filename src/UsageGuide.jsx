import React, { useState } from "react";

export function GuideLink({ role, language }) {
  const href = `${location.pathname}?guide=${role}&lang=${language}`;
  return <a className="buttonLink secondary" href={href} target="_blank" rel="noopener noreferrer">{language === "ja" ? "使い方ガイド" : "How to use"} ↗</a>;
}

const steps = {
  creator: {
    ja: [
      ["受付ページを作る", "クリエイターTOPの「受付作成」で、仕事内容・参考価格・受取用ウォレットを入力します。依頼ページを確認し、受付リンクをSNSなどで共有してください。"],
      ["届いた依頼を確認する", "「仕事を管理」で案件を開き、依頼内容・金額・納期・双方のウォレットを確認します。公開版の依頼一覧は同じブラウザ内に保存される試作機能で、別端末からの受付はまだ同期されません。"],
      ["発注証明を記録する", "合意した案件でPortaldot V3モードに切り替え、案件に登録したクリエイターのウォレットを接続します。「発注証明を発行」を押し、MetaMaskでネットワークと手数料を確認して承認します。"],
      ["納品を記録する", "成果物を用意し、「納品」で納品URLを入力して記録します。ブロックチェーンにはURLのハッシュが残ります。公開URLは閲覧者がコピーできるため、アクセス制限のある保存先も検討してください。"],
      ["支払いを確認し、証明書を作る", "依頼者の支払いTxHashを「支払い」に入力します。送金元・送金先・金額・成功状態を確認し、支払い証明の記録をウォレットで承認します。完了後に証明書が表示されます。ローカル版の専用ページでは支払い報告を自動受信できます。同期中は案件画面を開いておいてください。"],
      ["案件と収益を整理する", "完了案件は案件カード内からアーカイブできます。途中の案件は理由を入力してキャンセル・アーカイブでき、売上から除外されます。アーカイブから元に戻せます。月別収益は入金日が保存された確認済み支払いを集計し、完了済みアーカイブも含みます。"]
    ],
    en: [
      ["Publish an offering", "From Creator home, set your service, reference price and receiving wallet. Preview the request page and share its link."],
      ["Review a request", "Open a job in Manage jobs. Check the brief, amount, deadline and both wallets. The public prototype inbox is browser-local; requests from other devices do not sync yet."],
      ["Record the agreement", "Select Portaldot V3 mode and connect the creator wallet registered for this job. Issue the order proof and review the network and fee in MetaMask before approving."],
      ["Record delivery", "Enter the delivery URL in Delivery and record its hash. Public URLs can be copied; use an appropriate delivery host for sensitive work."],
      ["Verify payment and create the certificate", "Enter the client’s payment hash in Payment. Verify sender, recipient, amount and success, then approve recording in your wallet. The certificate appears afterward. Local private pages can relay payment reports automatically; keep the job workspace open for synchronization."],
      ["Organize jobs and income", "Archive completed jobs from their cards. Cancel unfinished jobs with a reason to archive them and exclude them from income. Restore archived jobs when needed. Monthly income includes completed archived jobs with saved payment dates."]
    ]
  },
  client: {
    ja: [
      ["仕事内容を確認する", "クリエイターから届いた受付リンクを開き、サービス内容と参考価格を確認します。"],
      ["依頼を送る", "名前・依頼内容・支払いに使うウォレット・希望金額・納期を入力して送信します。クリエイターとは別のご自身のウォレットを指定してください。送信だけでは支払いは発生しません。"],
      ["確認ページを保存する（ローカル試作版）", "送信後に専用URLが表示された場合は、コピーまたはブックマークして保存します。閉じた後もそのURLから開けます。専用URLは他人へ公開しないでください。公開版では専用ページの自動同期はまだ利用できません。"],
      ["納品を確認し、支払う", "クリエイターと合意した納品内容・金額を確認して、指定の受取ウォレットへPortaldot V3上で送金します。ウォレットのネットワーク・送金先・金額を確認してください。現状はデポジットや自動支払いではありません。"],
      ["支払いを報告する", "ウォレットの取引履歴から今回の送金のトランザクションハッシュ（0xから始まる文字列）をコピーします。専用ページが使える場合は「支払いを報告」へ貼り付けて送信します。公開版はクリエイターへ共有してください。報告操作で追加送金は発生しません。"],
      ["証明書を確認する", "支払い報告済みなら追加の送金はせず、クリエイターの記録を待ちます。ローカル専用ページでは同期後に証明書が表示されます。QRコードは支払い取引の確認先です。公開版はクリエイターが表示する証明書を確認してください。"]
    ],
    en: [
      ["Review the service", "Open the creator’s request link and check the service description and reference price."],
      ["Submit your request", "Enter your name, brief, paying wallet, proposed amount and deadline. Use your own wallet, separate from the creator’s. Submitting a request does not send funds."],
      ["Save your private page (local prototype)", "If a private URL is provided after submission, bookmark or copy it to return later. Keep it private. Automatic private-page synchronization is not available on the public site yet."],
      ["Check delivery and pay", "Confirm the agreed delivery and amount. Transfer funds on Portaldot V3 to the designated creator wallet, checking the network, address and amount. The current version does not escrow funds or make automatic payments."],
      ["Report the payment", "Copy the transaction hash from your paying wallet’s history. If a private page is available, paste it into Report payment. On the public version, share it with the creator. Reporting does not send additional funds."],
      ["View the certificate", "After reporting, wait for the creator to record the evidence; do not pay again. Local private pages show the certificate after synchronization. The QR links to the payment transaction. For the public version, ask the creator to show the certificate."]
    ]
  }
};

export function UsageGuide({ role }) {
  const [language, setLanguage] = useState(() => new URL(location.href).searchParams.get("lang") === "en" ? "en" : "ja");
  const ja = language === "ja";
  return <main className="shell clientRequestPage"><nav className="topBar"><strong>PortalProof</strong><div className="languageToggle"><button onClick={() => setLanguage("ja")} className={ja ? "active" : ""}>日本語</button><button onClick={() => setLanguage("en")} className={!ja ? "active" : ""}>English</button></div></nav><header className="hero compactHero"><h1>{role === "creator" ? (ja ? "クリエイター向けガイド" : "Creator guide") : (ja ? "依頼者向けガイド" : "Client guide")}</h1><p>{ja ? "元の画面は別タブに残っています。確認したら、そのタブへ戻って操作してください。" : "Your original page remains in its tab. Return there to continue."}</p></header><section className="panel"><ol>{steps[role][language].map(([title, body]) => <li key={title}><h2>{title}</h2><p>{body}</p></li>)}</ol></section><p className="localNote">{ja ? "テストネットのtPOTv3を使います。秘密鍵やシードフレーズの入力は不要です。同じブラウザのタブはウォレットを共有します。両者を試す場合は別プロフィールを使うと分かりやすくなります。" : "Use testnet tPOTv3. Never enter a private key or seed phrase. Browser tabs share the wallet; separate profiles help test creator and client roles."}</p></main>;
}
