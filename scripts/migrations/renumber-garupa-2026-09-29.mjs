import fs from "node:fs";

const garupaPath = "data/garupa/songs.json";
const ournotesPath = "data/ournotes/songs.json";
const legacyPath = "data/garupa/legacy-song-paths.json";
const timingPath = "data/garupa/song-timing-research.json";
const mappingPath = "docs/original-work-mapping.json";
const auditPath = "docs/ORIGINAL_WORK_AUDIT_2026-09-29.md";
const csvPath = "docs/GARUPA_ID_RENUMBER_2026-09-29.csv";
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const write = (path, value) =>
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n");

const garupa = read(garupaPath);
const ournotes = read(ournotesPath);
const legacy = read(legacyPath);
const timing = read(timingPath);
const mapping = read(mappingPath);
const audit = fs.readFileSync(auditPath, "utf8");
const songs = garupa.groups.flatMap((group) => group.songs);
if (songs.length !== 798 || Math.max(...songs.map((song) => song.id)) !== 823)
  throw new Error("移行元のガルパ楽曲データが想定と異なります。");

const byDate = new Map();
for (const song of songs) {
  const date = Date.parse(song.releaseDate);
  if (!Number.isFinite(date)) throw new Error(`配信日時が不正: ${song.id}`);
  const cohort = byDate.get(date) ?? [];
  cohort.push(song);
  byDate.set(date, cohort);
}
const ranks = new Map();
for (const cohort of byDate.values()) {
  if (cohort.length === 1) {
    ranks.set(cohort[0], null);
    continue;
  }
  const orders = cohort.map((song) => song.releaseOrder);
  if (
    orders.some((order) => !Number.isSafeInteger(order)) ||
    new Set(orders).size !== orders.length
  )
    throw new Error(`同時配信曲の旧順位が不正: ${cohort[0].releaseDate}`);
  cohort
    .toSorted((a, b) => a.releaseOrder - b.releaseOrder || a.id - b.id)
    .forEach((song, index) => ranks.set(song, index + 1));
}

const ordered = [...songs].sort(
  (a, b) =>
    Date.parse(a.releaseDate) - Date.parse(b.releaseDate) ||
    ranks.get(a) - ranks.get(b) ||
    a.id - b.id,
);
const ids = new Map(ordered.map((song, index) => [song.id, index + 1]));
if (ids.size !== songs.length) throw new Error("旧IDが重複しています。");
const remap = (reference) => {
  const match = /^garupa:(\d+)$/.exec(reference);
  if (!match) return reference;
  const id = ids.get(Number(match[1]));
  if (!id) throw new Error(`参照先が見つかりません: ${reference}`);
  return `garupa:${id}`;
};

const csv = ["oldId,newId,title,releaseDate"];
for (const song of ordered) {
  const oldId = song.id;
  song.id = ids.get(oldId);
  song.releaseOrder = ranks.get(song);
  csv.push(
    [oldId, song.id, song.title, song.releaseDate]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
}
for (const data of [garupa, ournotes])
  for (const group of data.groups)
    for (const song of group.songs)
      if (song.relatedSongIds)
        song.relatedSongIds = song.relatedSongIds.map(remap);
for (const entry of legacy) {
  if (entry.gameId !== "garupa") continue;
  const id = ids.get(Number(entry.stableSongId));
  if (!id) throw new Error(`旧曲名URLの転送先が不正: ${entry.stableSongId}`);
  entry.stableSongId = String(id);
}
for (const record of timing.records) {
  const id = ids.get(record.id);
  if (!id) throw new Error(`調査記録の曲IDが不正: ${record.id}`);
  record.id = id;
}
const remappedMapping = Object.fromEntries(
  Object.entries(mapping).map(([reference, value]) => [
    remap(reference),
    value,
  ]),
);
if (Object.keys(remappedMapping).length !== Object.keys(mapping).length)
  throw new Error("作品名監査のIDキーが重複しました。");
const remappedAudit = audit.replace(/garupa:\d+/g, remap);

write(garupaPath, garupa);
write(ournotesPath, ournotes);
write(legacyPath, legacy);
write(timingPath, timing);
write(mappingPath, remappedMapping);
fs.writeFileSync(auditPath, remappedAudit);
fs.writeFileSync(csvPath, csv.join("\n") + "\n");
console.log(
  `ガルパ${songs.length}曲を再採番し、同時配信${[...byDate.values()].filter((cohort) => cohort.length > 1).length}組を正規化しました。`,
);
