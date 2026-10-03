import {
  searchCreators,
  creditRows,
  selectedCreditData,
  ROLE_LABELS,
} from "./creators-data.js";
export function createCreatorPicker({ form, getStore, getPrevious, onChange }) {
  const field = form.elements.creatorRows,
    status = document.querySelector("#credit-status"),
    list = document.querySelector("#selected-creators"),
    workSelect = form.elements.workId;
  let creators = [],
    works = [];
  const rows = () => {
    const value = JSON.parse(field.value || "[]");
    if (!Array.isArray(value)) throw new Error("Creator選択データが不正です。");
    return value;
  };
  const change = (next) => {
    field.value = JSON.stringify(next);
    render();
    onChange();
  };
  function renderOptions() {
    const select = document.querySelector("#credit-creator");
    select.replaceChildren(
      ...searchCreators(
        creators,
        document.querySelector("#credit-search").value,
      )
        .slice(0, 100)
        .map((c) => new Option(`${c.name} (${c.id})`, c.id)),
    );
  }
  function renderWorks(selected = workSelect.value) {
    const query = document
      .querySelector("#work-search")
      .value.normalize("NFKC")
      .toLowerCase();
    const matching = works
      .filter((w) =>
        [w.id, w.title].some((v) =>
          v.normalize("NFKC").toLowerCase().includes(query),
        ),
      )
      .slice(0, 100);
    if (selected && !matching.some((w) => w.id === selected))
      matching.unshift(
        works.find((w) => w.id === selected) ?? {
          id: selected,
          title: "現在の音楽作品",
        },
      );
    workSelect.replaceChildren(
      new Option("新しい音楽作品として登録", ""),
      ...matching.map((w) => new Option(`${w.title} (${w.id})`, w.id)),
    );
    workSelect.value = selected;
  }
  function render() {
    list.replaceChildren();
    const overrideInputs = [];
    for (const [index, row] of rows().entries()) {
      const li = document.createElement("li"),
        text = document.createElement("span");
      text.textContent = `${ROLE_LABELS[row.role] ?? row.role}：${creators.find((c) => c.id === row.creatorId)?.name ?? row.creatorId}`;
      const label = document.createElement("label"),
        input = document.createElement("input");
      label.textContent = "表示名の上書き";
      input.value = row.displayOverride ?? "";
      input.maxLength = 2000;
      input.setAttribute("aria-label", `${text.textContent}の表示名`);
      overrideInputs.push({ creatorId: row.creatorId, input });
      input.oninput = input.onchange = () => {
        const next = rows().map((r) =>
          r.creatorId === row.creatorId
            ? { ...r, displayOverride: input.value }
            : r,
        );
        field.value = JSON.stringify(next);
        for (const other of overrideInputs)
          if (other.creatorId === row.creatorId && other.input !== input)
            other.input.value = input.value;
        if (creators.length) {
          try {
            form.elements.composer.value =
              selectedCreditData(next, creators, getPrevious()).composer ?? "";
          } catch (error) {
            status.textContent = error.message;
          }
        }
        onChange();
      };
      label.append(input);
      li.append(text, label);
      for (const [caption, delta] of [
        ["前へ", -1],
        ["後へ", 1],
        ["削除", 0],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary";
        button.textContent = caption;
        button.setAttribute("aria-label", `${text.textContent}を${caption}`);
        button.onclick = () => {
          const next = rows();
          if (!delta) next.splice(index, 1);
          else {
            const target = next.findIndex(
              (r, i) =>
                r.role === row.role &&
                (delta < 0
                  ? i ===
                    next
                      .slice(0, index)
                      .findLastIndex((x) => x.role === row.role)
                  : i > index),
            );
            if (target < 0) return;
            [next[index], next[target]] = [next[target], next[index]];
          }
          change(next);
        };
        li.append(button);
      }
      list.append(li);
    }
    const pending = Object.entries(getPrevious()?.creditDisplay ?? {}).filter(
      ([, parts]) => parts.some((p) => p.unresolved),
    );
    status.textContent = pending.length
      ? `確認待ち：${pending.map(([role]) => ROLE_LABELS[role]).join("・")}の既存表記は保持します。登録済みの対応を確認してmigration mappingで解決してください。`
      : "名前で検索して担当ごとに追加してください。表示順は前へ・後へで変更できます。";
    if (creators.length) {
      try {
        form.elements.composer.value =
          selectedCreditData(rows(), creators, getPrevious()).composer ?? "";
      } catch (error) {
        status.textContent = error.message;
      }
    }
  }
  async function refresh() {
    const store = getStore();
    if (!store) throw new Error("先にGitHubへ接続してください。");
    const options = await store.loadCreatorOptions();
    creators = options.creators;
    works = options.works;
    renderOptions();
    renderWorks();
    render();
  }
  document.querySelector("#refresh-creator-options").onclick = async () => {
    try {
      await refresh();
    } catch (error) {
      status.textContent = error.message;
    }
  };
  document.querySelector("#credit-search").oninput = renderOptions;
  document.querySelector("#work-search").oninput = () => renderWorks();
  document.querySelector("#add-credit").onclick = () => {
    const id = document.querySelector("#credit-creator").value,
      role = document.querySelector("#credit-role").value;
    if (!creators.some((c) => c.id === id)) {
      status.textContent = "登録済みCreatorを検索・選択してください。";
      return;
    }
    if (getPrevious()?.creditDisplay?.[role]?.some((p) => p.unresolved)) {
      status.textContent =
        "確認待ちの担当はmigrationで対応を確認してから変更してください。";
      return;
    }
    const next = rows();
    if (next.some((r) => r.creatorId === id && r.role === role)) {
      status.textContent = "この担当には既に選択されています。";
      return;
    }
    const existing = next.find((r) => r.creatorId === id);
    next.push({
      creatorId: id,
      role,
      displayOverride:
        existing?.displayOverride ??
        document.querySelector("#credit-override").value,
    });
    change(next);
  };
  return {
    refresh,
    render,
    setWork: renderWorks,
    setSong(song) {
      field.value = JSON.stringify(creditRows(song));
      renderWorks(song.workId ?? "");
      render();
    },
    reset() {
      field.value = "[]";
      renderWorks("");
      render();
    },
    entered() {
      if (!creators.length)
        throw new Error("クリエイター・Workを取得してください。");
      return {
        ...selectedCreditData(rows(), creators, getPrevious()),
        workId: workSelect.value || undefined,
      };
    },
  };
}
