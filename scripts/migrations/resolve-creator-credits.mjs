// 人間が確認したraw表記→Creator IDを明示指定した場合だけ解決。aliasの類似比較や自動統合なし。
import fs from "node:fs";
import { GAMES } from "../../src/js/site-config.js";
import { listGarupaSongs } from "../../src/js/garupa-data.js";
import {
  CREDIT_ROLES,
  validateCreatorDatabase,
} from "../../src/js/creators-data.js";
const [mode, creatorId, raw] = process.argv.slice(2);
if (!["report", "apply"].includes(mode) || !creatorId || !raw)
  throw new Error(
    '使い方: node scripts/migrations/resolve-creator-credits.mjs report|apply cr-0001 "確認済みの元表記"',
  );
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const master = read("data/creators.json"),
  works = read("data/works.json"),
  creator = master.creators.find((c) => c.id === creatorId);
if (!creator) throw new Error("登録済みCreator IDを指定してください。");
if (![creator.name, ...(creator.aliases ?? [])].includes(raw))
  throw new Error(
    "人間が確認した元表記を、先に指定Creatorのnameまたはaliasesへ登録してください。",
  );
const documents = Object.fromEntries(
    Object.values(GAMES).map((g) => [g.id, read(g.dataFile)]),
  ),
  changed = [];
for (const g of Object.values(GAMES))
  for (const group of documents[g.id].groups)
    for (const song of group.songs)
      for (const role of CREDIT_ROLES) {
        if (
          !(song.creditDisplay?.[role] ?? []).some(
            (p) => p.unresolved && p.text === raw,
          )
        )
          continue;
        let relation = song.credits.find((c) => c.creatorId === creatorId);
        if (relation && (relation.displayOverride ?? creator.name) !== raw)
          throw new Error(
            `role間で表示が異なります。手動確認が必要です: ${g.id}:${song.id}`,
          );
        if (!relation) {
          relation = {
            creatorId,
            roles: [],
            ...(raw !== creator.name ? { displayOverride: raw } : {}),
          };
          song.credits.push(relation);
        }
        if (!relation.roles.includes(role)) relation.roles.push(role);
        song.creditDisplay[role] = song.creditDisplay[role].map((p) =>
          p.unresolved && p.text === raw ? { creatorId } : p,
        );
        changed.push({ game: g.id, id: song.id, role, raw, creatorId });
      }
const songs = Object.values(GAMES).flatMap((g) =>
  listGarupaSongs(documents[g.id], g.id).map((s) => ({ ...s, gameId: g.id })),
);
const validation = validateCreatorDatabase(master, works, songs);
console.log(
  JSON.stringify({ changed, warnings: validation.warnings }, null, 2),
);
if (mode === "apply" && changed.length) {
  const folder = `.cache/creator-resolution-${Date.now()}`;
  fs.mkdirSync(folder, { recursive: true });
  for (const g of Object.values(GAMES)) {
    fs.copyFileSync(g.dataFile, `${folder}/${g.id}.json`);
    fs.writeFileSync(
      g.dataFile,
      JSON.stringify(documents[g.id], null, 2) + "\n",
    );
  }
  fs.writeFileSync(
    `${folder}/report.json`,
    JSON.stringify(changed, null, 2) + "\n",
  );
}
