import { validateContact } from "./contact-validation.js";

export function initContact(doc = document, fetcher = globalThis.fetch) {
  const form = doc.getElementById("contact-form");
  if (!form) return;
  const button = doc.getElementById("contact-submit");
  const fields = doc.getElementById("contact-fields");
  const status = doc.getElementById("contact-status");
  const email = doc.getElementById("contact-email");
  const radios = [...form.querySelectorAll('[name="replyRequested"]')];
  const win = doc.defaultView;
  let token = "";
  let widget = null;
  let submitting = false;
  let widgetSize = "";
  let widgetProblem = false;
  const replyWanted = () =>
    radios.some((radio) => radio.checked && radio.value === "yes");
  const syncButton = () => {
    button.disabled = submitting || !token;
    button.textContent = submitting ? "送信しています…" : "送信する";
  };
  const announce = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };
  const updateReply = () => {
    const wanted = replyWanted();
    doc.getElementById("contact-email-field").hidden = !wanted;
    email.disabled = !wanted;
    email.required = wanted;
    if (!wanted) {
      email.value = "";
      email.removeAttribute("aria-invalid");
      doc.getElementById("contact-email-error").hidden = true;
    }
  };
  const showErrors = (errors) => {
    let first;
    for (const name of [
      "category",
      "pageUrl",
      "message",
      "replyRequested",
      "email",
    ]) {
      const output = doc.getElementById(`contact-${name}-error`);
      const controls =
        name === "replyRequested"
          ? radios
          : [doc.getElementById(`contact-${name}`)];
      const message = typeof errors?.[name] === "string" ? errors[name] : "";
      output.textContent = message;
      output.hidden = !message;
      for (const control of controls) {
        if (message) control.setAttribute("aria-invalid", "true");
        else control.removeAttribute("aria-invalid");
      }
      if (message && !first) first = controls[0];
    }
    return first;
  };
  radios.forEach((radio) => radio.addEventListener("change", updateReply));
  updateReply();
  form.noValidate = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    const payload = {
      category: doc.getElementById("contact-category").value,
      pageUrl: doc.getElementById("contact-pageUrl").value,
      message: doc.getElementById("contact-message").value,
      replyRequested: replyWanted(),
      email: email.disabled ? "" : email.value,
      turnstileToken: token,
      contact_guard: doc.getElementById("contact-guard").value,
    };
    const { fieldErrors, value } = validateContact(payload);
    const first = showErrors(fieldErrors);
    if (!value) {
      announce("入力内容を確認してください。", true);
      first?.focus();
      return;
    }
    if (!token) {
      announce("送信を確認できませんでした。もう一度お試しください。", true);
      return;
    }
    submitting = true;
    fields.disabled = true;
    form.setAttribute("aria-busy", "true");
    syncButton();
    announce("送信しています…");
    let focus;
    try {
      const result = await fetcher(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
        signal: AbortSignal.timeout(30_000),
      });
      const body = await result.json();
      if (result.ok && body?.ok === true) {
        form.hidden = true;
        doc.getElementById("contact-success").hidden = false;
        doc.getElementById("contact-success-reply").hidden =
          !payload.replyRequested;
        form.reset();
        token = "";
        announce("お問い合わせを送信しました。");
        focus = doc.getElementById("contact-success-title");
      } else {
        focus = showErrors(body?.code === "validation" ? body.fieldErrors : {});
        announce(
          body?.code === "verification"
            ? "送信を確認できませんでした。もう一度お試しください。"
            : body?.code === "validation"
              ? "入力内容を確認してください。"
              : body?.code === "unavailable"
                ? "お問い合わせは現在受付準備中です。時間をおいてもう一度お試しください。"
                : "送信に失敗しました。時間をおいてもう一度お試しください。",
          true,
        );
      }
    } catch {
      announce(
        "通信を確認できませんでした。時間をおいてもう一度お試しください。",
        true,
      );
    } finally {
      submitting = false;
      fields.disabled = false;
      form.removeAttribute("aria-busy");
      updateReply();
      token = "";
      if (!form.hidden && widget !== null) {
        try {
          win.turnstile.reset(widget);
        } catch {
          widgetError();
        }
      }
      syncButton();
      focus?.focus();
    }
  });
  const script = doc.createElement("script");
  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  const widgetError = () => {
    widgetProblem = true;
    token = "";
    syncButton();
    if (!submitting && !form.hidden)
      announce(
        "送信の確認機能を利用できません。時間をおいてページを読み直してください。",
        true,
      );
  };
  script.addEventListener("error", widgetError);
  script.addEventListener("load", () => {
    try {
      // scriptのload後なのでready()を重ねず、明示的にrenderする。
      const renderWidget = () => {
        if (submitting || form.hidden) return;
        const container = doc.getElementById("contact-turnstile");
        // flexibleの最小幅は300px。狭い画面ではcompactへ切り替える。
        const size = container.clientWidth < 300 ? "compact" : "flexible";
        if (widget !== null && size === widgetSize) return;
        token = "";
        syncButton();
        try {
          if (widget !== null) win.turnstile.remove(widget);
          widgetSize = size;
          widget = win.turnstile.render(container, {
            sitekey: form.dataset.sitekey,
            action: "contact",
            size,
            language: "ja",
            callback: (value) => {
              token = value;
              syncButton();
              if (
                !submitting &&
                !form.hidden &&
                (widgetProblem || !status.classList.contains("is-error"))
              )
                announce("送信できます。");
              widgetProblem = false;
            },
            "expired-callback": () => {
              widgetProblem = true;
              token = "";
              syncButton();
              if (!submitting && !form.hidden)
                announce(
                  "送信の確認が期限切れになりました。もう一度確認してください。",
                  true,
                );
            },
            "error-callback": () => {
              widgetError();
              return true;
            },
            "timeout-callback": widgetError,
            "unsupported-callback": widgetError,
          });
        } catch {
          widgetError();
        }
      };
      renderWidget();
      win.addEventListener("resize", renderWidget);
    } catch {
      widgetError();
    }
  });
  doc.head.append(script);
}

if (typeof document !== "undefined") initContact();
