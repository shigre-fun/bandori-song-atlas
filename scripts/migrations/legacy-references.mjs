import fs from "node:fs";
export function rebaseLegacyCredits(legacy, updates) {
  const refs = new Map();
  for (const entry of updates?.references ?? []) {
    if (
      refs.has(entry.from) ||
      !entry.title ||
      !entry.workId ||
      !/^(garupa|ournotes):\d+$/.test(entry.to)
    )
      throw new Error("旧収録参照の明示対応が不正です。");
    refs.set(entry.from, entry.to);
  }
  const result = legacy.map((entry) => ({
    ...entry,
    reference: refs.get(entry.reference) ?? entry.reference,
  }));
  if (new Set(result.map((e) => e.reference)).size !== result.length)
    throw new Error("旧収録参照の対応が重複します。");
  return result;
}
export function loadLegacyCredits(
  directory = "docs/migrations/creators-2026-10-02",
) {
  const legacy = JSON.parse(
    fs.readFileSync(`${directory}/legacy-credits.json`, "utf8"),
  );
  const file = `${directory}/record-reference-updates.json`;
  return rebaseLegacyCredits(
    legacy,
    fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null,
  );
}
export function validateReferenceUpdates(
  songs,
  directory = "docs/migrations/creators-2026-10-02",
) {
  const file = `${directory}/record-reference-updates.json`;
  if (!fs.existsSync(file)) return;
  for (const entry of JSON.parse(fs.readFileSync(file, "utf8")).references) {
    const song = songs.find((s) => `${s.gameId}:${s.id}` === entry.to);
    if (!song || song.title !== entry.title || song.workId !== entry.workId)
      throw new Error(`収録実体が参照確認後に変化: ${entry.to}`);
  }
}
