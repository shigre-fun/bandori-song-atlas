import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { loadGameCatalog } from "../catalog.mjs";
import { GAMES } from "../../src/js/site-config.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";
import {
  CREDIT_ROLES,
  creditTokens,
  isCreditSeparator,
} from "../../src/js/credit-display.js";

export function summarizeCreditCoverage(songs, master) {
  const games = {},
    records = [];
  for (const game of Object.keys(GAMES)) {
    const selected = songs.filter((s) => s.gameId === game);
    games[game] = { songs: selected.length, roles: {} };
    for (const role of CREDIT_ROLES) {
      const counts = {
        raw: 0,
        empty: 0,
        formalRecords: 0,
        formalBindings: 0,
        fullyLinked: 0,
        unresolvedRecords: 0,
        unlinkedTextRecords: 0,
        placeholders: 0,
        missing: [],
      };
      for (const song of selected) {
        const raw = song[role] ?? "";
        const tokens = creditTokens(song, role, master.creators);
        const ids = song.credits
          .filter((c) => c.roles.includes(role))
          .map((c) => c.creatorId);
        const unlinked = tokens.filter(
          (t) => !t.creator && t.text?.trim() && !isCreditSeparator(t.text),
        );
        const unresolved = tokens.some((t) => t.unresolved);
        const placeholder =
          /^(?:未確認|不明|未収集|未確定|確認中|未整備|なし|不詳|[-—–?？]+)$/u.test(
            raw.trim(),
          );
        const complete =
          !!raw.trim() &&
          ids.length > 0 &&
          !unlinked.length &&
          !unresolved &&
          !placeholder;
        counts[raw.trim() ? "raw" : "empty"]++;
        if (ids.length) counts.formalRecords++;
        counts.formalBindings += ids.length;
        if (complete) counts.fullyLinked++;
        if (unresolved) counts.unresolvedRecords++;
        if (unlinked.length) counts.unlinkedTextRecords++;
        if (placeholder) counts.placeholders++;
        const record = {
          game,
          id: song.id,
          title: song.title,
          workId: song.workId,
          role,
          raw,
          creatorIds: ids,
          complete,
          unresolved,
          unlinked,
          placeholder,
        };
        records.push(record);
        if (!complete) counts.missing.push(record);
      }
      games[game].roles[role] = counts;
    }
  }
  return { games, records, missing: records.filter((r) => !r.complete) };
}

export function auditCurrentCoverage() {
  const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  const master = read("data/creators.json"),
    works = read("data/works.json");
  const songs = Object.values(GAMES).flatMap(loadGameCatalog);
  const db = validateCreatorDatabase(master, works, songs);
  const coverage = summarizeCreditCoverage(songs, master);
  return {
    status:
      coverage.missing.length || db.warnings.length
        ? "REVIEW_REQUIRED"
        : "PASS",
    node: process.version,
    creators: master.creators.length,
    works: works.works.length,
    roleCoverage: master.roleCoverage,
    dbWarnings: db.warnings,
    ...coverage,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = auditCurrentCoverage();
  if (process.argv[2])
    fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + "\n");
  console.log(
    JSON.stringify({ ...result, records: result.records.length }, null, 2),
  );
  if (result.status !== "PASS") process.exitCode = 1;
}
