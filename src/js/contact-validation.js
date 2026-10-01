export const CONTACT_CATEGORIES = Object.freeze({
  data: "データの訂正",
  bug: "サイトの不具合",
  feature: "機能・改善要望",
  rights: "権利関係について",
  other: "その他",
});

export const CONTACT_LIMITS = Object.freeze({
  pageUrl: 500,
  messageMin: 10,
  messageMax: 4000,
  email: 254,
});

// 単一の通常のメールアドレスのみ。表示名・複数宛先・制御文字を許可しない。
export function validContactEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= CONTACT_LIMITS.email &&
    !/[\s\u0000-\u001f\u007f]/.test(value) &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(
      value,
    )
  );
}

export function validateContact(input) {
  const fieldErrors = {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    return {
      fieldErrors: { category: "入力内容を確認してください。" },
      value: null,
    };
  if (
    typeof input.category !== "string" ||
    !Object.hasOwn(CONTACT_CATEGORIES, input.category)
  )
    fieldErrors.category = "お問い合わせの種類を選択してください。";
  const pageUrl = input.pageUrl === undefined ? "" : input.pageUrl;
  if (typeof pageUrl !== "string" || pageUrl.length > CONTACT_LIMITS.pageUrl)
    fieldErrors.pageUrl = "対象ページURLは500文字以内で入力してください。";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (
    message.length < CONTACT_LIMITS.messageMin ||
    message.length > CONTACT_LIMITS.messageMax
  )
    fieldErrors.message = "お問い合わせ内容は10～4000文字で入力してください。";
  if (typeof input.replyRequested !== "boolean")
    fieldErrors.replyRequested = "返信希望の有無を選択してください。";
  const email = input.email === undefined ? "" : input.email;
  if (
    typeof email !== "string" ||
    (email !== "" && !validContactEmail(email)) ||
    (input.replyRequested === true && email === "")
  )
    fieldErrors.email =
      input.replyRequested === true && email === ""
        ? "返信先のメールアドレスを入力してください。"
        : "有効なメールアドレスを入力してください。";
  if (Object.keys(fieldErrors).length) return { fieldErrors, value: null };
  return {
    fieldErrors,
    value: {
      category: input.category,
      pageUrl: pageUrl.trim(),
      message,
      replyRequested: input.replyRequested,
      email,
    },
  };
}
