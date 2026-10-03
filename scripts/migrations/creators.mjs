import fs from "node:fs";
import {
  loadLegacyCredits,
  validateReferenceUpdates,
} from "./legacy-references.mjs";
import path from "node:path";
import crypto from "node:crypto";
import { listGarupaSongs } from "../../src/js/garupa-data.js";
import { creditParts } from "../../src/js/credits.js";
import {
  CREDIT_ROLES,
  validateCreatorDatabase,
  creditText,
} from "../../src/js/creators-data.js";

const artifact = "docs/migrations/creators-2026-10-02";
const backup = ".cache/creator-migration-2026-10-02";
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const files = ["data/garupa/songs.json", "data/ournotes/songs.json"];
const mode = process.argv[2] ?? "report";
if (!["report", "apply", "verify", "restore"].includes(mode))
  throw new Error("report/apply/verify/restoreを指定してください。");
if (mode === "restore") {
  const manifest = read(`${backup}/applied.json`);
  for (const [file, expected] of Object.entries(manifest.hashes))
    if (hash(fs.readFileSync(file)) !== expected)
      throw new Error("migration後の編集を検出。restoreは上書きしません。");
  for (const file of files) fs.copyFileSync(`${backup}/before/${file}`, file);
  for (const file of ["data/creators.json", "data/works.json"])
    fs.unlinkSync(file);
  console.log("元データを復元しました。");
  process.exit(0);
}
const documents = Object.fromEntries(files.map((f) => [f, read(f)]));
const songs = files.flatMap((f, i) =>
  listGarupaSongs(documents[f], i ? "ournotes" : "garupa").map((s) => ({
    ...s,
    gameId: i ? "ournotes" : "garupa",
  })),
);
if (mode === "verify") {
  const creators = read("data/creators.json"),
    works = read("data/works.json");
  const result = validateCreatorDatabase(creators, works, songs);
  validateReferenceUpdates(songs, artifact);
  const before = loadLegacyCredits(artifact);
  for (const old of before) {
    const current = songs.find((s) => `${s.gameId}:${s.id}` === old.reference);
    for (const role of CREDIT_ROLES)
      if (creditText(current, role, creators.creators) !== (old[role] ?? ""))
        throw new Error(`表示変更: ${old.reference} ${role}`);
  }
  console.log(
    JSON.stringify(
      {
        songs: songs.length,
        creators: creators.creators.length,
        works: works.works.length,
        displayComparisons: before.length * 3,
        warnings: result.warnings,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
if (
  songs.some((s) => s.workId || s.credits) ||
  fs.existsSync("data/creators.json") ||
  fs.existsSync("data/works.json")
)
  throw new Error(
    "migration済みデータには再採番しません。verifyを使用してください。",
  );
const mapping = read("docs/migrations/creator-map.json");
const creators = {
  version: 1,
  ...(mapping.roleCoverage ? { roleCoverage: mapping.roleCoverage } : {}),
  nextId:
    Math.max(0, ...mapping.creators.map((c) => Number(c.id.slice(3)))) + 1,
  creators: mapping.creators,
};
const exact = new Map();
for (const c of creators.creators)
  for (const name of [c.name, ...(c.aliases ?? [])]) {
    if (exact.has(name)) throw new Error(`alias mapping重複: ${name}`);
    exact.set(name, c);
  }
const report = new Map();
for (const s of songs)
  for (const role of CREDIT_ROLES)
    if (s[role]) {
      const key = JSON.stringify([s[role], role]);
      if (!report.has(key))
        report.set(key, {
          original: s[role],
          count: 0,
          role,
          games: [],
          plannedCreators: [],
          aliasesCandidates: [],
          reviewRequired: false,
          records: [],
          parts: [],
        });
      const row = report.get(key);
      row.count++;
      if (!row.games.includes(s.gameId)) row.games.push(s.gameId);
      row.records.push(`${s.gameId}:${s.id}`);
      row.parts = creditParts(s[role])
        .filter((p) => p.name)
        .map((p) => ({
          original: p.text,
          creatorId: exact.get(p.text)?.id ?? null,
          reviewRequired: !exact.has(p.text),
          reason: exact.has(p.text)
            ? "明示exact alias map"
            : "人物/type/読み/分割を人間が確認。類似名は統合しない。",
        }));
      row.plannedCreators = [
        ...new Set(row.parts.map((p) => p.creatorId).filter(Boolean)),
      ];
      row.aliasesCandidates = creators.creators
        .filter((c) => row.plannedCreators.includes(c.id))
        .flatMap((c) => c.aliases ?? [])
        .filter((alias) => alias !== row.original);
      row.reviewRequired = row.parts.some((p) => p.reviewRequired);
    }
const byRef = new Map(songs.map((s) => [`${s.gameId}:${s.id}`, s]));
const visited = new Set(),
  workEntries = [],
  workReport = [];
const ordered = [...songs].sort(
  (a, b) => a.gameId.localeCompare(b.gameId) || a.id - b.id,
);
for (const first of ordered) {
  const ref = `${first.gameId}:${first.id}`;
  if (visited.has(ref)) continue;
  const pending = [ref],
    component = [];
  while (pending.length) {
    const key = pending.pop();
    if (visited.has(key)) continue;
    const s = byRef.get(key);
    if (!s) throw new Error(`存在しない関連曲: ${key}`);
    visited.add(key);
    component.push(s);
    for (const target of s.relatedSongIds ?? []) {
      const record = byRef.get(target);
      if (!record?.relatedSongIds?.includes(key))
        throw new Error(`非相互リンク: ${key} ${target}`);
      pending.push(target);
    }
  }
  const id = `wk-${String(workEntries.length + 1).padStart(4, "0")}`;
  workEntries.push({
    id,
    title: first.title,
    source:
      component.length > 1 ? "existing-relatedSongIds" : "independent-record",
  });
  workReport.push({
    workId: id,
    records: component.map((s) => `${s.gameId}:${s.id}`),
    titles: component.map((s) => s.title),
    basis:
      component.length > 1
        ? "既存明示相互リンク。タイトル一致は判定に使用しない。"
        : "既存リンクなしの独立レコード。推測統合しない。",
  });
  for (const s of component) s.workId = id;
}
for (const s of songs) {
  s.credits = [];
  s.creditDisplay = {};
  for (const role of CREDIT_ROLES)
    s.creditDisplay[role] = creditParts(s[role]).map((p) => {
      const c = p.name ? exact.get(p.text) : null;
      if (!c) return { text: p.text, ...(p.name ? { unresolved: true } : {}) };
      let relation = s.credits.find((r) => r.creatorId === c.id);
      if (!relation) {
        relation = {
          creatorId: c.id,
          roles: [],
          ...(p.text !== c.name ? { displayOverride: p.text } : {}),
        };
        s.credits.push(relation);
      }
      if (!relation.roles.includes(role)) relation.roles.push(role);
      return { creatorId: c.id };
    });
}
const works = {
  version: 1,
  nextId: workEntries.length + 1,
  works: workEntries,
};
const validated = validateCreatorDatabase(creators, works, songs);
for (const work of works.works)
  if (validated.warnings.some((w) => w.workId === work.id)) {
    work.reviewRequired = true;
    work.reviewReason = "record-credit-difference";
  }
for (const row of workReport)
  row.reviewRequired = validated.warnings.some((w) => w.workId === row.workId);
const summary = {
  records: songs.length,
  creators: creators.creators.length,
  linkedCreators: creators.creators.filter((c) =>
    songs.some((s) => s.credits.some((r) => r.creatorId === c.id)),
  ).length,
  migratedRecords: songs.filter((s) => s.credits.length).length,
  works: workEntries.length,
  mergedWorks: workReport.filter((w) => w.records.length > 1).length,
  creditStrings: report.size,
  reviewStrings: [...report.values()].filter((r) => r.reviewRequired).length,
  warnings: validated.warnings,
};
write(`${artifact}/credit-report.json`, {
  summary,
  entries: [...report.values()],
});
write(`${artifact}/work-report.json`, workReport);
write(
  `${artifact}/legacy-credits.json`,
  songs.map((s) => ({
    reference: `${s.gameId}:${s.id}`,
    ...Object.fromEntries(CREDIT_ROLES.map((r) => [r, s[r] ?? null])),
  })),
);
console.log(JSON.stringify(summary, null, 2));
if (mode === "report") process.exit(0);
for (const f of files) {
  const target = `${backup}/before/${f}`;
  if (fs.existsSync(target))
    throw new Error("backupが既にあります。上書きしません。");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(f, target);
}
for (const [f, document] of Object.entries(documents)) {
  const gameId = f.includes("ournotes") ? "ournotes" : "garupa";
  for (const group of document.groups)
    for (const raw of group.songs) {
      const s = byRef.get(`${gameId}:${raw.id}`);
      Object.assign(raw, {
        workId: s.workId,
        credits: s.credits,
        creditDisplay: s.creditDisplay,
      });
    }
  write(f, document);
}
write("data/creators.json", creators);
write("data/works.json", works);
write(`${backup}/applied.json`, {
  hashes: Object.fromEntries(
    [...files, "data/creators.json", "data/works.json"].map((f) => [
      f,
      hash(fs.readFileSync(f)),
    ]),
  ),
});
