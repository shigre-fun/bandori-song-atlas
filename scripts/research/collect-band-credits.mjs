import fs from "node:fs";
import { parseHtml, nodes, hasClass, compactText } from "./credits-html.mjs";

const output =
  "docs/migrations/credits-phase-a-2026-10-03/sources/band-mygo-inst.json";
// A saved, already checked extraction is reused without changing its check date.
if (fs.existsSync(output)) {
  console.log(`Reused ${output}`);
} else {
  const url = "https://bang-dream.com/mygo_inst/";
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const tree = parseHtml(await response.text());
  const paragraphs = nodes(
    tree,
    (n) => n.tag === "p" && hasClass(n, "itemName"),
  ).map(compactText);
  const rows = [];
  for (let i = 0; i < paragraphs.length - 1; i++) {
    const title = paragraphs[i],
      creditText = paragraphs[i + 1];
    if (/作詞|作曲/.test(title) || !/^作詞[\s　]/.test(creditText)) continue;
    const credits = {};
    for (const line of creditText.split("\n")) {
      const match = line.match(/^(作詞|作曲)[\s　]+(.+)$/);
      if (match)
        credits[match[1] === "作詞" ? "lyricist" : "composer"] = match[2];
    }
    if (!rows.some((r) => r.title === title && r.creditText === creditText))
      rows.push({ title, artist: "MyGO!!!!!", credits, creditText });
  }
  if (rows.length < 15)
    throw new Error("Expected explicit title/credit paragraph pairs missing");
  const source = {
    url,
    sourceType: "band-official",
    sourceReliability: "PRIMARY",
    pageTitle: "MyGO!!!!! 楽曲のインスト音源・MV・ライブVJ映像を公開！",
    checkedAt: new Date().toISOString(),
    pageReadStatus: "HTTP_CONFIRMED",
    rows,
    notes:
      "著作者表記欄の曲名と隣接する作詞/作曲を確認。音源・映像の取得や規約への操作は行わない。編曲の記載なし。",
  };
  fs.writeFileSync(output, JSON.stringify(source, null, 2) + "\n");
  console.log(JSON.stringify({ url, rows: rows.length }));
}
