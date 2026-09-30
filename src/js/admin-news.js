import { GitHubNewsStore } from "./github-news-store.js";
import { NEWS_CATEGORY_LABELS, prepareNews } from "./news-data.js";
import { siteURL } from "./urls.js";

const connection = document.querySelector("#connection-form");
const connectionStatus = document.querySelector("#connection-status");
const form = document.querySelector("#news-form");
const status = document.querySelector("#form-status");
const listStatus = document.querySelector("#list-status");
const list = document.querySelector("#news-list");
const resultPanel = document.querySelector("#result");
const refreshButton = document.querySelector("#refresh-news");
const newButton = document.querySelector("#new-news");
const saveButton = document.querySelector("#save");
let store = null;
let loaded = null;
let editIndex = null;
let busy = false;
let dirty = false;
let savedEntries = null;

form.elements.category.replaceChildren(
  new Option("カテゴリを選択", ""),
  ...Object.entries(NEWS_CATEGORY_LABELS).map(
    ([value, label]) => new Option(label, value),
  ),
);

function message(text, type = "") {
  status.textContent = text;
  status.className = "message " + type;
}

function renderList() {
  list.replaceChildren();
  if (!loaded) {
    listStatus.textContent = "GitHubへの接続後に一覧を表示します。";
    return;
  }
  listStatus.textContent = loaded.entries.length
    ? `${loaded.entries.length}件のお知らせを取得しました。`
    : "現在登録されているお知らせはありません。";
  loaded.entries.forEach((entry, index) => {
    const item = document.createElement("li");
    const summary = document.createElement("div");
    summary.className = "news-summary";
    const meta = document.createElement("span");
    meta.textContent = `${entry.date.replaceAll("-", ".")} · ${NEWS_CATEGORY_LABELS[entry.category]}`;
    const title = document.createElement("strong");
    title.textContent = entry.title;
    summary.append(meta, title);
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary";
    edit.textContent = "編集";
    edit.setAttribute("aria-label", `「${entry.title}」を編集`);
    edit.addEventListener("click", () => {
      if (
        busy ||
        (dirty &&
          !confirm("入力中の内容を破棄して、このお知らせを読み込みますか？"))
      )
        return;
      editIndex = index;
      for (const field of ["date", "category", "title", "description"])
        form.elements[field].value = entry[field];
      document.querySelector("#edit-mode").textContent =
        `修正中：「${entry.title}」`;
      saveButton.textContent = "変更を保存する";
      resultPanel.hidden = true;
      savedEntries = null;
      dirty = false;
      message("内容を確認して変更を保存してください。");
      form.elements.title.focus();
    });
    item.append(summary, edit);
    list.append(item);
  });
}

function resetEditor({ preserveResult = false } = {}) {
  form.reset();
  editIndex = null;
  dirty = false;
  if (!preserveResult) savedEntries = null;
  document.querySelector("#edit-mode").textContent =
    "新しいお知らせを追加します。";
  saveButton.textContent = "お知らせを保存する";
  if (!preserveResult) resultPanel.hidden = true;
}

async function refreshNews({ reset = true } = {}) {
  if (!store) return;
  const latest = await store.loadNews();
  loaded = latest;
  renderList();
  if (reset) resetEditor();
}

try {
  const response = await fetch(siteURL("admin-config.json"));
  if (response.ok) {
    const defaults = await response.json();
    for (const key of ["owner", "repo", "branch"])
      connection.elements.namedItem(key).value =
        defaults[key] || (key === "branch" ? "main" : "");
  }
} catch {
  /* 保存先は手動でも入力できる。 */
}

connection.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const button = document.querySelector("#connect");
  button.disabled = true;
  connectionStatus.textContent = "GitHubとの接続を確認しています…";
  let candidate;
  try {
    const settings = Object.fromEntries(
      ["owner", "repo", "branch"].map((key) => [
        key,
        connection.elements.namedItem(key).value,
      ]),
    );
    candidate = new GitHubNewsStore(
      settings,
      connection.elements.namedItem("token").value,
      globalThis.fetch.bind(globalThis),
    );
    const checked = await candidate.connect();
    store = candidate;
    await refreshNews({ reset: false });
    connectionStatus.textContent = `${checked.owner}/${checked.repo}（${checked.branch}）に接続しました。`;
    connectionStatus.className = "message success";
    document.querySelector("#disconnect").hidden = false;
    button.hidden = true;
    for (const element of connection.elements)
      if (element.name) element.disabled = true;
    refreshButton.disabled = false;
  } catch (error) {
    if (candidate) candidate.token = "";
    store = null;
    loaded = null;
    renderList();
    connectionStatus.textContent = error.message;
    connectionStatus.className = "message error";
  } finally {
    busy = false;
    connection.elements.namedItem("token").value = "";
    button.disabled = false;
    connectionStatus.focus();
    connectionStatus.scrollIntoView({ block: "center" });
  }
});

document.querySelector("#disconnect").addEventListener("click", () => {
  if (busy) return;
  if (store) store.token = "";
  store = null;
  loaded = null;
  editIndex = null;
  savedEntries = null;
  renderList();
  resetEditor();
  for (const element of connection.elements) element.disabled = false;
  document.querySelector("#connect").hidden = false;
  document.querySelector("#disconnect").hidden = true;
  refreshButton.disabled = true;
  connectionStatus.textContent = "接続を解除しました。";
  connectionStatus.className = "message";
});

refreshButton.addEventListener("click", async () => {
  if (busy || !store) return;
  if (dirty && !confirm("入力中の内容を破棄して、最新データを読み直しますか？"))
    return;
  busy = true;
  refreshButton.disabled = true;
  listStatus.textContent = "GitHub上の最新データを読み込んでいます…";
  try {
    await refreshNews();
  } catch (error) {
    listStatus.textContent = error.message;
  } finally {
    busy = false;
    refreshButton.disabled = false;
  }
});

newButton.addEventListener("click", () => {
  if (
    busy ||
    (dirty &&
      !confirm("入力中の内容を破棄して、新しいお知らせを入力しますか？"))
  )
    return;
  resetEditor();
  message("新しいお知らせを入力してください。");
  form.elements.title.focus();
});

form.addEventListener("input", () => {
  if (busy) return;
  dirty = true;
  savedEntries = null;
  resultPanel.hidden = true;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  if (!store || !loaded) {
    message(
      "先にGitHubへ接続して、最新のお知らせを読み込んでください。",
      "error",
    );
    status.focus();
    return;
  }
  let entry;
  try {
    entry = prepareNews([
      Object.fromEntries(
        ["date", "category", "title", "description"].map((field) => [
          field,
          form.elements[field].value.trim(),
        ]),
      ),
    ])[0];
  } catch (error) {
    message(error.message, "error");
    status.focus();
    return;
  }
  busy = true;
  for (const element of form.elements) element.disabled = true;
  refreshButton.disabled = true;
  document.querySelector("#disconnect").disabled = true;
  message(
    "お知らせをGitHubに保存しています。この画面を閉じずにお待ちください。",
  );
  try {
    const saved = await store.saveNews({
      entry,
      index: editIndex,
      expectedSha: loaded.sha,
    });
    savedEntries = saved.entries;
    const repository = `https://github.com/${encodeURIComponent(store.settings.owner)}/${encodeURIComponent(store.settings.repo)}`;
    document.querySelector("#commit-link").href =
      `${repository}/commit/${encodeURIComponent(saved.head)}`;
    document.querySelector("#workflow-link").href = `${repository}/actions`;
    document.querySelector("#saved-message").textContent =
      `「${entry.title}」をGitHubに保存しました。サイトへの反映には更新処理の完了が必要です。`;
    document.querySelector("#publish-status").textContent =
      "保存済み・サイトの更新待ち";
    document.querySelector("#news-link").hidden = true;
    resultPanel.hidden = false;
    message(
      "保存しました。下のボタンでサイトへの反映を確認できます。",
      "success",
    );
    dirty = false;
    try {
      await refreshNews({ reset: false });
      resetEditor({ preserveResult: true });
    } catch (error) {
      loaded = null;
      listStatus.textContent = `保存は完了しましたが一覧を再取得できませんでした。再読み込みしてください。 ${error.message}`;
    }
  } catch (error) {
    message(
      /通信|時間切れ/.test(error.message)
        ? "通信結果を確認できませんでした。保存済みの可能性があります。最新データを読み直してから次の操作をしてください。"
        : error.message,
      "error",
    );
  } finally {
    busy = false;
    for (const element of form.elements) element.disabled = false;
    refreshButton.disabled = !store;
    document.querySelector("#disconnect").disabled = false;
    status.focus();
  }
});

document
  .querySelector("#check-published")
  .addEventListener("click", async () => {
    if (!savedEntries) return;
    const button = document.querySelector("#check-published");
    const publishStatus = document.querySelector("#publish-status");
    button.disabled = true;
    try {
      const response = await fetch(siteURL(`news.json?updated=${Date.now()}`), {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const published = prepareNews(await response.json());
      const current =
        JSON.stringify(published) === JSON.stringify(savedEntries);
      publishStatus.textContent = current
        ? "サイトへの反映が完了しました。"
        : "まだサイトへ反映されていません。「更新の進行状況」で成功・失敗を確認し、少し待ってから再確認してください。";
      document.querySelector("#news-link").hidden = !current;
    } catch {
      publishStatus.textContent =
        "公開サイトの状態を確認できませんでした。接続を確認して再試行してください。";
    } finally {
      button.disabled = false;
    }
  });
