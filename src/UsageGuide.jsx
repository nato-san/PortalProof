import React, { useState } from "react";
import { guideReturnUrl } from "./navigation.js";

export function GuideLink({ role, language, flow }) {
  const href = new URL(location.pathname, location.origin);
  href.searchParams.set("guide", role); href.searchParams.set("lang", language);
  href.searchParams.set("flow", flow === "local" ? "local" : "shared");
  if (flow !== "local") href.searchParams.set("returnTo", `${location.pathname}${location.search}`);
  return <a className="buttonLink secondary" href={href.href} target="_blank" rel="noopener noreferrer">{language === "ja" ? "使い方ガイド" : "How to use"} ↗</a>;
}

const legacySteps = {
  creator: {
    ja: [
      ["受付ページを作る", "「仕事を受ける」の「受付作成」で、仕事内容・参考価格・受取用ウォレットを入力します。依頼ページを確認し、受付リンクをSNSなどで共有してください。"],
      ["届いた依頼を確認する", "「仕事を管理」で案件を開き、依頼内容・金額・納期・双方のウォレットを確認します。公開版の依頼一覧は同じブラウザ内に保存される試作機能で、別端末からの受付はまだ同期されません。"],
      ["発注証明を記録する", "合意した案件でPortaldot V3モードに切り替え、案件に登録した受注者のウォレットを接続します。「発注証明を発行」を押し、MetaMaskでネットワークと手数料を確認して承認します。"],
      ["納品を記録する", "成果物を用意し、「納品」で納品URLを入力して記録します。ブロックチェーンにはURLのハッシュが残ります。公開URLは閲覧者がコピーできるため、アクセス制限のある保存先も検討してください。"],
      ["支払いを確認し、証明書を作る", "発注者の支払いTxHashを「支払い」に入力します。送金元・送金先・金額・成功状態を確認し、支払い証明の記録をウォレットで承認します。完了後に証明書が表示されます。ローカル版の専用ページでは支払い報告を自動受信できます。同期中は案件画面を開いておいてください。"],
      ["案件と収益を整理する", "完了案件は案件カード内からアーカイブできます。途中の案件は理由を入力してキャンセル・アーカイブでき、売上から除外されます。アーカイブから元に戻せます。月別収益は入金日が保存された確認済み支払いを集計し、完了済みアーカイブも含みます。"]
    ],
    en: [
      ["Publish an offering", "From Provide services, set your service, reference price and receiving wallet. Preview the request page and share its link."],
      ["Review a request", "Open a job in Manage jobs. Check the brief, amount, deadline and both wallets. The public prototype inbox is browser-local; requests from other devices do not sync yet."],
      ["Record the agreement", "Select Portaldot V3 mode and connect the provider wallet registered for this job. Issue the order proof and review the network and fee in MetaMask before approving."],
      ["Record delivery", "Enter the delivery URL in Delivery and record its hash. Public URLs can be copied; use an appropriate delivery host for sensitive work."],
      ["Verify payment and create the certificate", "Enter the client’s payment hash in Payment. Verify sender, recipient, amount and success, then approve recording in your wallet. The certificate appears afterward. Local private pages can relay payment reports automatically; keep the job workspace open for synchronization."],
      ["Organize jobs and income", "Archive completed jobs from their cards. Cancel unfinished jobs with a reason to archive them and exclude them from income. Restore archived jobs when needed. Monthly income includes completed archived jobs with saved payment dates."]
    ]
  },
  client: {
    ja: [
      ["仕事内容を確認する", "受注者から届いた受付リンクを開き、サービス内容と参考価格を確認します。"],
      ["依頼を送る", "名前・依頼内容・支払いに使うウォレット・希望金額・納期を入力して送信します。受注者とは別のご自身のウォレットを指定してください。送信だけでは支払いは発生しません。"],
      ["確認ページを保存する（ローカル試作版）", "送信後に専用URLが表示された場合は、コピーまたはブックマークして保存します。閉じた後もそのURLから開けます。専用URLは他人へ公開しないでください。公開版では専用ページの自動同期はまだ利用できません。"],
      ["納品を確認し、支払う", "受注者と合意した納品内容・金額を確認して、指定の受取ウォレットへPortaldot V3上で送金します。ウォレットのネットワーク・送金先・金額を確認してください。現状はデポジットや自動支払いではありません。"],
      ["支払いを報告する", "ウォレットの取引履歴から今回の送金のトランザクションハッシュ（0xから始まる文字列）をコピーします。専用ページが使える場合は「支払いを報告」へ貼り付けて送信します。公開版は受注者へ共有してください。報告操作で追加送金は発生しません。"],
      ["証明書を確認する", "支払い報告済みなら追加の送金はせず、受注者の記録を待ちます。ローカル専用ページでは同期後に証明書が表示されます。QRコードは支払い取引の確認先です。公開版は受注者が表示する証明書を確認してください。"]
    ],
    en: [
      ["Review the service", "Open the provider’s request link and check the service description and reference price."],
      ["Submit your request", "Enter your name, brief, paying wallet, proposed amount and deadline. Use your own wallet, separate from the provider’s. Submitting a request does not send funds."],
      ["Save your private page (local prototype)", "If a private URL is provided after submission, bookmark or copy it to return later. Keep it private. Automatic private-page synchronization is not available on the public site yet."],
      ["Check delivery and pay", "Confirm the agreed delivery and amount. Transfer funds on Portaldot V3 to the designated provider wallet, checking the network, address and amount. The current version does not escrow funds or make automatic payments."],
      ["Report the payment", "Copy the transaction hash from your paying wallet’s history. If a private page is available, paste it into Report payment. On the public version, share it with the creator. Reporting does not send additional funds."],
      ["View the certificate", "After reporting, wait for the provider to record the evidence; do not pay again. Local private pages show the certificate after synchronization. The QR links to the payment transaction. For the public version, ask the provider to show the certificate."]
    ]
  }
};

export const sharedGuideSteps = {
  creator: {
    ja: [
      ["ウォレットでログイン", "PCはブラウザのウォレットで署名します。スマホのSafari・ChromeではMetaMaskアプリへ接続し、接続とログイン署名を確認して元のブラウザへ戻ります。MetaMaskアプリが必要です。ログインに送金・ガス代は不要です。"],
      ["募集を作成・共有", "ホームの「募集を作成」で仕事内容と受取ウォレットを設定します。受取ウォレットはログインした本人確認済みウォレットを指定してください。「募集管理」で受付URLをコピーしてSNSなどへ掲載できます。募集は複数作成でき、受付停止・再開もできます。"],
      ["届いた依頼を確認", "「案件管理」の「未処理」から案件の詳細を開きます。「承認して商談を開始」で承認済へ進みます。この時点ではまだ条件確定・受注成立ではありません。"],
      ["条件を確定", "元の依頼内容・金額・納期でよければ「元の条件で交渉を確定」を選びます。変更を提案した場合は、発注者が承認して交渉済（受注成立）になります。商談中は理由を送って辞退できますが、成立後はキャンセルを申請して相手の同意が必要です。"],
      ["案件を整理", "案件は未処理・承認済・交渉済・納品済・キャンセル済に分かれます。アーカイブは自分の一覧を整理するだけで、取引の状態や相手側の表示は変えません。アーカイブから元の一覧へ戻せます。"],
      ["納品・支払い・証明書", "受注成立後に、発注証明をPortaldot V3へ記録し、納品URLのハッシュを記録します。発注者が支払いTxHashを送ると、送金元・送金先・金額・成功状態を検証できます。受注者が検証済み支払い証跡を記録すると、双方にオンチェーン記録を開くQR付き証明書が表示されます。オンチェーン操作には少額のテストネットガス代が必要です。"],
    ],
    en: [
      ["Sign in with your wallet", "On desktop, use a browser wallet. On mobile Safari or Chrome, connect to the MetaMask app, approve the connection and sign-in message, then return to your browser. MetaMask must be installed. Authentication signatures do not send funds or incur gas fees."],
      ["Create and share an offering", "Use Create an offering on the home screen. The receiving wallet must match your authenticated wallet. Manage offerings to copy a public link for social media, create multiple offerings, and close or reopen them."],
      ["Review incoming requests", "Open a job from Manage jobs → Unprocessed. Approve and start negotiation moves it to Approved. This starts negotiation; it does not finalize terms."],
      ["Finalize terms", "Finalize the client's original terms if unchanged. If you propose a different brief, price or deadline, the client must approve. You may decline with a reason during negotiation. After terms are agreed, cancellation requires the other participant's consent."],
      ["Organize jobs", "Browse Unprocessed, Approved, Terms agreed, Delivered and Cancelled. Archiving only organizes your own list; it does not cancel a job or change the other participant's view. Restore archived jobs to their existing stage."],
      ["Delivery, payment and certificate", "After agreement, record the order proof and delivery URL hash on Portaldot V3. The client submits the payment transaction hash; PortalProof verifies its sender, recipient, amount and successful receipt. After the provider records the verified evidence, both participants can open a QR certificate linked to the on-chain record. On-chain actions require a small testnet gas fee."],
    ],
  },
  client: {
    ja: [
      ["募集ページを開く", "受注者がSNSなどで共有した受付URLを開き、仕事内容を確認します。"],
      ["ログインして依頼を送る", "送信前に自分のウォレットで署名ログインし、名前・依頼内容・希望金額・納期を入力します。ログインや依頼送信で送金・ガス代は発生しません。受注者とは別のご自身のウォレットを使ってください。"],
      ["自分の依頼を確認・整理", "送信後の「自分の依頼を確認する」または上部の「依頼した仕事」から一覧を開けます。同じウォレットでログインすれば、別端末からも確認できます。不要になった表示はアーカイブへ移し、後から進行中の依頼へ戻せます。これは自分の一覧だけの整理で、案件状態や受注者側の表示は変わりません。"],
      ["条件を確認", "受注者が依頼を確認して商談を開始します。元の条件のままなら受注者の条件確定で成立し、変更提案があればあなたの承認で成立します。商談中は受注者が理由付きで辞退できます。成立後のキャンセルには相手の同意が必要です。"],
      ["キャンセルに回答", "キャンセル申請と理由が届いたら、依頼の詳細で同意・不同意を選べます。自分の申請を自分で承認することはできません。キャンセルされても依頼と理由の記録は残ります。"],
      ["納品を確認して支払いを報告", "受注成立後、受注者が発注証明と納品URLのハッシュを記録するまで支払わないでください。納品を確認して合意額を指定ウォレットへ送金したら、取引履歴のTxHashを案件画面から送信します。送金元・送金先・金額・成功状態が一致した支払いだけが証明へ進みます。"],
      ["QR証明書を確認", "受注者が検証済み支払い証跡を記録すると証明書タブが開きます。QRコードからPortaldot V3の最終記録を確認できます。これはQR付き取引証明書であり、ウォレットへミントされるSBTではありません。"],
    ],
    en: [
      ["Open an offering", "Open the provider's public request link from social media and review the service."],
      ["Sign in and submit", "Sign in with your own wallet before submitting your name, brief, proposed amount and deadline. Neither sign-in nor request submission sends funds or charges gas. Use a wallet separate from the provider's."],
      ["Find and organize your requests", "After submitting, select View my request or My requests in the header. The same wallet can access its authenticated requests on another device. Move an item to Archive and restore it later without changing the job status or the provider's view."],
      ["Review terms", "The provider reviews and starts negotiation. The provider can finalize unchanged original terms; proposed changes require your approval. The provider may decline with a reason before agreement. Cancellation after agreement needs the other participant's consent."],
      ["Respond to cancellation", "Open request details to agree to or decline a cancellation request. You cannot approve your own cancellation request. Original requests and cancellation reasons remain recorded."],
      ["Review delivery and report payment", "After agreement, wait until the provider records the order proof and delivery URL hash. Review the delivery, transfer the agreed amount to the designated wallet, then submit the transaction hash from your wallet history. Only a transfer whose sender, recipient, amount and success status match can proceed to proof."],
      ["View the QR certificate", "After the provider records the verified payment evidence, open the Certificate stage. Its QR code opens the final Portaldot V3 record. This is a QR transaction certificate, not an SBT minted into a wallet."],
    ],
  },
};

export function UsageGuide({ role }) {
  const [language, setLanguage] = useState(() => new URL(location.href).searchParams.get("lang") === "en" ? "en" : "ja");
  const ja = language === "ja";
  const local = new URL(location.href).searchParams.get("flow") === "local";
  const steps = local ? legacySteps : sharedGuideSteps;
  const back = guideReturnUrl(location.href, role, language);
  return <main className="shell clientRequestPage"><nav className="topBar"><a className="brand" href={back}>PortalProof</a><div className="languageToggle"><button onClick={() => setLanguage("ja")} className={ja ? "active" : ""}>日本語</button><button onClick={() => setLanguage("en")} className={!ja ? "active" : ""}>English</button></div></nav><header className="hero compactHero"><h1>{role === "creator" ? (ja ? "仕事を受ける方のガイド" : "Provider guide") : (ja ? "仕事を依頼する方のガイド" : "Client guide")}</h1><p>{local ? (ja ? "このガイドは端末保存方式の確認用です。現在の共有案件とは操作が異なります。" : "This guide covers saved browser-local data, not shared commissions.") : (ja ? "元の画面は別タブに残っています。確認したら、そのタブへ戻って操作してください。" : "Your original page remains in its tab. Return there to continue.")}</p><a className="buttonLink secondary" href={back}>{ja ? "← アプリに戻る" : "← Return to app"}</a></header><section className="panel"><ol>{steps[role][language].map(([title, body]) => <li key={title}><h2>{title}</h2><p>{body}</p></li>)}</ol></section><p className="localNote">{ja ? "テストネットのtPOTv3を使います。秘密鍵やシードフレーズの入力は不要です。同じブラウザのタブはウォレットを共有します。両者を試す場合は別プロフィールを使うと分かりやすくなります。" : "Use testnet tPOTv3. Never enter a private key or seed phrase. Browser tabs share the wallet; separate profiles help test provider and client roles."}</p></main>;
}
