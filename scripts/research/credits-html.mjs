// Small read-only HTML tree for server-rendered official discography pages.
// It stores no page snapshots and executes no page scripts.
export function decodeHtml(text) {
  const named = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: "\u00a0",
    ndash: "–",
    mdash: "—",
    hellip: "…",
    bull: "•",
    copy: "©",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (all, key) =>
    key[0] === "#"
      ? String.fromCodePoint(
          key[1].toLowerCase() === "x"
            ? parseInt(key.slice(2), 16)
            : parseInt(key.slice(1), 10),
        )
      : (named[key] ?? all),
  );
}
export function parseHtml(html) {
  const root = { tag: "#document", attrs: {}, children: [] };
  const stack = [root],
    voids = new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ]);
  for (const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]*>|[^<]+/g) ??
    []) {
    if (token.startsWith("<!--") || token.startsWith("<!")) continue;
    const close = token.match(/^<\/\s*([\w:-]+)/);
    if (close) {
      const at = stack.findLastIndex((n) => n.tag === close[1].toLowerCase());
      if (at > 0) stack.length = at;
      continue;
    }
    const open = token.match(/^<\s*([\w:-]+)/);
    if (open) {
      const attrs = {};
      for (const m of token
        .slice(open[0].length)
        .matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
        attrs[m[1].toLowerCase()] = decodeHtml(m[2] ?? m[3] ?? m[4] ?? "");
      const node = { tag: open[1].toLowerCase(), attrs, children: [] };
      stack.at(-1).children.push(node);
      if (!voids.has(node.tag) && !token.endsWith("/>")) stack.push(node);
    } else stack.at(-1).children.push(decodeHtml(token));
  }
  return root;
}
export function nodes(root, predicate) {
  const found = [];
  const visit = (n) => {
    if (typeof n === "string") return;
    if (predicate(n)) found.push(n);
    for (const c of n.children) visit(c);
  };
  visit(root);
  return found;
}
export function hasClass(n, name) {
  return (n.attrs.class ?? "").split(/\s+/).includes(name);
}
export function textOf(n) {
  if (typeof n === "string") return n;
  if (["script", "style", "noscript"].includes(n.tag)) return "";
  if (n.tag === "br") return "\n";
  const text = n.children.map(textOf).join("");
  return [
    "p",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "tr",
    "section",
  ].includes(n.tag)
    ? "\n" + text + "\n"
    : text;
}
export function compactText(n) {
  return textOf(n)
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n");
}
export function discographyIndex(html, url) {
  const tree = parseHtml(html);
  const entries = nodes(tree, (n) => hasClass(n, "p-discography-list__item"))
    .map((n) => ({
      url: nodes(
        n,
        (x) => x.tag === "a" && hasClass(x, "p-discography-list__item-link"),
      )[0]?.attrs.href,
      title: compactText(
        nodes(n, (x) => hasClass(x, "p-discography-list__item-title"))[0] ?? {
          tag: "div",
          children: [],
        },
      ),
      artists: nodes(n, (x) =>
        hasClass(x, "p-discography-list__item-artist-item"),
      ).map(compactText),
      categories: nodes(n, (x) =>
        hasClass(x, "p-discography-list__item-category-item"),
      ).map(compactText),
    }))
    .filter((x) => x.url);
  const pagination = [
    ...new Set(
      nodes(tree, (n) => n.tag === "a")
        .map((n) => n.attrs.href)
        .filter(
          (h) =>
            h &&
            /^https:\/\/bang-dream\.com\/discographies\/page\/\d+\/$/.test(h),
        ),
    ),
  ];
  return { url, entries, pagination };
}
export function discographyDetail(html) {
  const tree = parseHtml(html),
    article = nodes(tree, (n) => hasClass(n, "p-discography-detail"))[0];
  if (!article) return null;
  const title = compactText(nodes(article, (n) => n.tag === "h1")[0]);
  const table = nodes(article, (n) =>
    hasClass(n, "p-discography-detail__table"),
  )[0];
  const metadata = Object.fromEntries(
    nodes(table ?? article, (n) => n.tag === "tr").map((n) => [
      compactText(
        nodes(n, (x) => x.tag === "th")[0] ?? { tag: "div", children: [] },
      ),
      compactText(
        nodes(n, (x) => x.tag === "td")[0] ?? { tag: "div", children: [] },
      ),
    ]),
  );
  const content = nodes(article, (n) =>
    hasClass(n, "p-discography-detail__content"),
  )[0];
  const lines = content ? compactText(content).split("\n") : [];
  return {
    pageTitle: title,
    artists: metadata["アーティスト"] ?? "",
    releaseDate: metadata["発売日"] ?? "",
    lines,
  };
}
