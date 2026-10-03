import { GitHubCreatorStore } from "./github-creator-store.js";
import { searchCreators } from "./creators-data.js";
import { siteURL } from "./urls.js";
const connection = document.querySelector("#connection-form"),
  form = document.querySelector("#creator-form"),
  status = document.querySelector("#form-status"),
  connectionStatus = document.querySelector("#connection-status");
let store = null,
  loaded = null,
  editingId = null,
  busy = false,
  dirty = false,
  operationId = crypto.randomUUID(),
  savedData = null;
const notify = (text, error = false) => {
  status.textContent = text;
  status.className = `message ${error ? "error" : "success"}`;
  status.focus();
};
function reset() {
  form.reset();
  editingId = null;
  dirty = false;
  operationId = crypto.randomUUID();
  document.querySelector("#delete-creator").hidden = true;
  document.querySelector("#delete-confirmation").hidden = true;
  document.querySelector("#edit-mode").textContent = "新しいクリエイター";
  document.querySelector("#previous-slugs").textContent = "旧URL履歴：なし";
}
function renderList() {
  const list = document.querySelector("#creator-list");
  list.replaceChildren();
  if (!loaded) {
    document.querySelector("#list-status").textContent =
      "接続後に一覧を取得してください。";
    return;
  }
  const creators = searchCreators(
    loaded.data.creators,
    document.querySelector("#creator-search").value,
  );
  document.querySelector("#list-status").textContent = `${creators.length}件`;
  for (const c of creators) {
    const li = document.createElement("li"),
      name = document.createElement("span"),
      button = document.createElement("button");
    name.textContent = `${c.name} (${c.id})`;
    button.type = "button";
    button.textContent = "編集";
    button.setAttribute("aria-label", `${c.name}を編集`);
    button.onclick = () => {
      if (busy || (dirty && !confirm("入力中の内容を破棄して読み込みますか？")))
        return;
      editingId = c.id;
      document.querySelector("#delete-confirmation").hidden = true;
      for (const key of ["id", "name", "sortKey", "slug", "type"])
        form.elements[key].value = c[key];
      form.elements.aliases.value = (c.aliases ?? []).join("\n");
      document.querySelector("#previous-slugs").textContent =
        `旧URL履歴：${c.previousSlugs?.join("、") || "なし"}（自動保存・編集不可）`;
      dirty = false;
      operationId = crypto.randomUUID();
      document.querySelector("#delete-creator").hidden = false;
      document.querySelector("#edit-mode").textContent = `修正中：${c.name}`;
      form.elements.name.focus();
    };
    li.append(name, button);
    list.append(li);
  }
}
async function refresh() {
  loaded = await store.loadCreators();
  renderList();
}
try {
  const response = await fetch(siteURL("admin-config.json"));
  if (response.ok) {
    const defaults = await response.json();
    for (const key of ["owner", "repo", "branch"])
      connection.elements[key].value =
        defaults[key] || (key === "branch" ? "main" : "");
  }
} catch {
  /* 手動入力可 */
}
connection.onsubmit = async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  let candidate;
  try {
    candidate = new GitHubCreatorStore(
      Object.fromEntries(
        ["owner", "repo", "branch"].map((k) => [
          k,
          connection.elements[k].value,
        ]),
      ),
      connection.elements.token.value,
    );
    await candidate.connect();
    store = candidate;
    await refresh();
    connectionStatus.textContent = `${store.settings.owner}/${store.settings.repo}に接続しました。`;
    for (const field of connection.elements) field.disabled = true;
    document.querySelector("#disconnect").disabled = false;
    document.querySelector("#disconnect").hidden = false;
    document.querySelector("#connect").hidden = true;
    document.querySelector("#refresh-creators").disabled = false;
  } catch (error) {
    if (candidate) candidate.token = "";
    store = null;
    loaded = null;
    renderList();
    connectionStatus.textContent = error.message;
  } finally {
    connection.elements.token.value = "";
    busy = false;
    connectionStatus.focus();
  }
};
document.querySelector("#disconnect").onclick = () => {
  if (busy) return;
  if (store) store.token = "";
  store = null;
  loaded = null;
  savedData = null;
  renderList();
  for (const field of connection.elements) field.disabled = false;
  document.querySelector("#connect").hidden = false;
  document.querySelector("#disconnect").hidden = true;
  document.querySelector("#refresh-creators").disabled = true;
  connectionStatus.textContent = "接続を解除しました。";
};
document.querySelector("#refresh-creators").onclick = async () => {
  if (busy || !store) return;
  busy = true;
  try {
    await refresh();
  } catch (error) {
    notify(error.message, true);
  } finally {
    busy = false;
  }
};
document.querySelector("#creator-search").oninput = renderList;
document.querySelector("#new-creator").onclick = () => {
  if (busy || (dirty && !confirm("入力中の内容を破棄しますか？"))) return;
  reset();
};
form.oninput = () => {
  dirty = true;
  operationId = crypto.randomUUID();
  savedData = null;
  document.querySelector("#result").hidden = true;
};
form.elements.name.onchange = () => {
  if (!editingId && !form.elements.slug.value) {
    const name = form.elements.name.value;
    form.elements.slug.value = /^[\x20-\x7e]+$/.test(name)
      ? name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : `creator-${loaded?.data.nextId ?? "new"}`;
  }
};
async function save(deleteId = null) {
  if (busy) return;
  if (!store || !loaded) {
    notify("先にGitHubへ接続して最新データを取得してください。", true);
    return;
  }
  const creator = deleteId
    ? null
    : {
        ...(editingId ? { id: editingId } : {}),
        ...Object.fromEntries(
          ["name", "sortKey", "slug", "type"].map((k) => [
            k,
            form.elements[k].value.trim(),
          ]),
        ),
        aliases: form.elements.aliases.value
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean),
      };
  busy = true;
  for (const field of form.elements) field.disabled = true;
  try {
    const saved = await store.saveCreator({
      creator,
      deleteId,
      expectedSha: loaded.sha,
      operationId,
    });
    savedData = saved.data;
    const repository = `https://github.com/${encodeURIComponent(store.settings.owner)}/${encodeURIComponent(store.settings.repo)}`;
    document.querySelector("#commit-link").href =
      `${repository}/commit/${saved.head}`;
    document.querySelector("#workflow-link").href = `${repository}/actions`;
    document.querySelector("#saved-message").textContent =
      "GitHubに保存しました。公開サイトは更新処理の完了待ちです。";
    document.querySelector("#publish-status").textContent =
      "保存済み・サイト更新待ち";
    document.querySelector("#result").hidden = false;
    dirty = false;
    await refresh();
    reset();
    notify("保存しました。");
  } catch (error) {
    notify(error.message, true);
  } finally {
    busy = false;
    for (const field of form.elements) field.disabled = false;
  }
}
form.onsubmit = (event) => {
  event.preventDefault();
  save();
};
document.querySelector("#delete-creator").onclick = () => {
  if (busy || !editingId) return;
  document.querySelector("#delete-confirmation").hidden = false;
  document.querySelector("#confirm-delete").focus();
};
document.querySelector("#confirm-delete").onclick = () => save(editingId);
document.querySelector("#cancel-delete").onclick = () => {
  document.querySelector("#delete-confirmation").hidden = true;
  document.querySelector("#delete-creator").focus();
};
document.querySelector("#check-published").onclick = async () => {
  if (!savedData) return;
  const target = document.querySelector("#publish-status");
  try {
    const r = await fetch(siteURL(`creators.json?updated=${Date.now()}`), {
      cache: "no-store",
    });
    if (!r.ok) throw new Error();
    target.textContent =
      JSON.stringify(await r.json()) === JSON.stringify(savedData)
        ? "サイトへの反映が完了しました。"
        : "まだ反映されていません。更新の進行状況を確認してください。";
  } catch {
    target.textContent = "公開状態を確認できませんでした。再試行してください。";
  }
};
renderList();
