import {
  CONTACT_CATEGORIES,
  CONTACT_LIMITS,
} from "../src/js/contact-validation.js";
import { escapeHTML } from "../src/js/seo.js";

export function renderContact({ siteKey = "", local }) {
  const intro = `<h1>お問い合わせ</h1><section class="panel contact-panel">
<p>データの誤り、不具合、ご意見・ご要望、権利関係などについてご連絡ください。名前の入力は不要です。返信を希望する場合のみメールアドレスをご入力ください。</p>
<p>入力情報の扱いは<a href="${escapeHTML(local("privacy/"))}">プライバシーポリシー</a>をご確認ください。</p>`;
  if (!siteKey.trim())
    return `${intro}<p class="contact-status" role="status">お問い合わせは現在受付準備中です。時間をおいてもう一度お試しください。</p></section>`;
  return `${intro}
<noscript><p class="contact-status">お問い合わせの送信にはJavaScriptを有効にしてください。</p></noscript>
<form id="contact-form" class="contact-form" action="${escapeHTML(local("api/contact"))}" method="post" data-sitekey="${escapeHTML(siteKey)}">
<fieldset id="contact-fields" class="contact-fields"><legend class="sr-only">お問い合わせの入力</legend>
<div class="contact-field"><label for="contact-category">お問い合わせの種類 <span class="contact-required">（必須）</span></label>
<select id="contact-category" name="category" required aria-describedby="contact-category-error"><option value="">選択してください</option>${Object.entries(
    CONTACT_CATEGORIES,
  )
    .map(
      ([value, label]) =>
        `<option value="${value}">${escapeHTML(label)}</option>`,
    )
    .join("")}</select>
<p id="contact-category-error" class="contact-error" hidden></p></div>
<div class="contact-field"><label for="contact-pageUrl">対象ページURL（任意）</label><input id="contact-pageUrl" name="pageUrl" type="text" maxlength="${CONTACT_LIMITS.pageUrl}" aria-describedby="contact-page-help contact-pageUrl-error" />
<p id="contact-page-help" class="help">データ訂正や不具合については、対象ページのURLを入力いただけると確認がスムーズです。ページの説明でも構いません。</p><p id="contact-pageUrl-error" class="contact-error" hidden></p></div>
<div class="contact-field"><label for="contact-message">お問い合わせ内容 <span class="contact-required">（必須）</span></label><textarea id="contact-message" name="message" rows="8" required minlength="${CONTACT_LIMITS.messageMin}" maxlength="${CONTACT_LIMITS.messageMax}" aria-describedby="contact-message-help contact-message-error"></textarea>
<p id="contact-message-help" class="help">10～4000文字で入力してください。画像等を提示したい場合は、その旨をご記載ください。添付ファイルには対応していません。</p><p id="contact-message-error" class="contact-error" hidden></p></div>
<fieldset class="contact-reply" aria-describedby="contact-replyRequested-error"><legend>返信希望</legend><label><input type="radio" name="replyRequested" value="no" checked /> 返信は不要</label><label><input type="radio" name="replyRequested" value="yes" /> 返信を希望する</label><p id="contact-replyRequested-error" class="contact-error" hidden></p></fieldset>
<div id="contact-email-field" class="contact-field" hidden><label for="contact-email">メールアドレス <span class="contact-required">（返信希望時は必須）</span></label><input id="contact-email" name="email" type="email" maxlength="${CONTACT_LIMITS.email}" autocomplete="email" disabled aria-describedby="contact-email-help contact-email-error" /><p id="contact-email-help" class="help">返信に使用します。サイト上で公開されることはありません。</p><p id="contact-email-error" class="contact-error" hidden></p></div>
<div hidden aria-hidden="true"><label for="contact-guard">自動送信防止用の欄（入力しないでください）</label><input id="contact-guard" name="contact_guard" type="text" tabindex="-1" autocomplete="off" /></div>
</fieldset>
<div id="contact-turnstile" class="contact-turnstile" aria-label="不正送信防止の確認"></div>
<p id="contact-status" class="contact-status" role="status" aria-live="polite" aria-atomic="true">送信の確認機能を読み込んでいます…</p>
<button id="contact-submit" type="submit" disabled>送信する</button>
</form>
<section id="contact-success" class="contact-success" hidden aria-labelledby="contact-success-title"><h2 id="contact-success-title" tabindex="-1">お問い合わせを送信しました。</h2><p>ご連絡ありがとうございます。</p><p id="contact-success-reply" hidden>返信をご希望の場合は、内容を確認後、入力いただいたメールアドレスへご連絡します。</p><a href="${escapeHTML(local(""))}">トップへ戻る</a></section>
</section>`;
}
