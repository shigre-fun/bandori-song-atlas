export function connectSongControls(params) {
  const search = document.querySelector("#search");
  if (search) search.value = params.get("q") || "";
  const searchForm = document.querySelector("#song-search-form");
  if (searchForm)
    for (const [name, value] of params) {
      if (
        ![
          "sort",
          "difficulty",
          "direction",
          "type",
          "band",
          "songType",
          "gekisou",
          "credit",
        ].includes(name)
      )
        continue;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      searchForm.append(input);
    }
  const form = document.querySelector("#filters");
  for (const chip of document.querySelectorAll("[data-filter]"))
    chip.addEventListener("click", () => {
      const selected = chip.getAttribute("aria-pressed") !== "true";
      chip.setAttribute("aria-pressed", String(selected));
      const input = [...form.querySelectorAll('input[type="hidden"]')].find(
        (i) => i.name === chip.dataset.filter && i.value === chip.dataset.value,
      );
      if (!selected) input?.remove();
      else if (!input) {
        const added = document.createElement("input");
        added.type = "hidden";
        added.name = chip.dataset.filter;
        added.value = chip.dataset.value;
        form.append(added);
      }
    });
  const sort = document.querySelector("#song-sort");
  if (sort) {
    for (const select of sort.querySelectorAll("select"))
      select.addEventListener("change", () => sort.requestSubmit());
    sort.querySelector("[data-reverse]").addEventListener("click", () => {
      const field = sort.querySelector('[name="direction"]');
      field.value = field.value === "reverse" ? "forward" : "reverse";
    });
  }
}
