import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  ROLES,
  fingerprint,
  normalizeFormat,
  normalizeTitle,
  titleVariant,
  gameFacts,
  discographyFacts,
  bandMatches,
  candidateForRaw,
  parseCreditLine,
} from "./credit-evidence.mjs";
import { validateSchema } from "./research-schema.mjs";

export const DIRECTORY = "docs/migrations/credits-phase-a-2026-10-03";
export const CONFIRMED = new Set(["CONFIRMED", "MULTI_SOURCE_CONFIRMED"]);
export const STATUSES = [
  "CONFIRMED",
  "MULTI_SOURCE_CONFIRMED",
  "SOURCE_MISSING",
  "SOURCE_UNREADABLE",
  "CREDIT_NOT_LISTED",
  "CONFLICT",
  "MATCH_UNCERTAIN",
  "NEEDS_REVIEW",
];
export const AUDIT_CLASSES = [
  "EXACT",
  "FORMAT_ONLY",
  "KNOWN_CREATOR_EQUIVALENT",
  "OFFICIAL_DIFFERS",
  "CURRENT_MISSING",
  "OFFICIAL_MISSING",
  "MATCH_UNCERTAIN",
];
const key = (r) => `${r.game}:${r.recordId}`;
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sortedUnique = (xs) => [...new Set(xs)].sort();
const reference = (r) => ({
  game: r.game,
  recordId: r.recordId,
  workId: r.workId,
  title: r.title,
  band: r.band,
});
const sourceId = (url) => `s-${fingerprint(url)}`;
const percent = (n, d) => `${n}/${d} (${((n / d) * 100).toFixed(2)}%)`;
const markdown = (v) =>
  String(v ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
const table = (heads, rows) =>
  `| ${heads.join(" | ")} |\n| ${heads.map(() => "---").join(" | ")} |\n${rows.map((row) => "| " + row.map(markdown).join(" | ") + " |").join("\n")}\n`;
const write = (file, value) => {
  const content =
    typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n";
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content)
    fs.writeFileSync(file, content);
};

export function assertProtected(baseline) {
  for (const [file, expected] of Object.entries(baseline.sourceHashes)) {
    if (sha(fs.readFileSync(file)) !== expected)
      throw new Error(
        `Protected source changed: ${file}; keep user edits and reconcile a new baseline explicitly`,
      );
  }
}
// Delimiters are comparison-only. They never become a raw or a confirmed split.
export function comparisonKey(raw) {
  let depth = 0,
    result = "";
  for (const c of normalizeFormat(raw)) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    result += depth === 0 && /[/、,・&]/.test(c) ? "|" : c;
  }
  return result;
}
function exactCreator(raw, creators) {
  const found = creators.filter((c) =>
    [c.name, ...(c.aliases ?? [])].includes(raw),
  );
  return found.length === 1 ? found[0].id : null;
}
function equivalent(a, b, creators) {
  return (
    comparisonKey(a) === comparisonKey(b) ||
    (exactCreator(a, creators) !== null &&
      exactCreator(a, creators) === exactCreator(b, creators))
  );
}
export function compareComposer(current, role, creators) {
  if (
    role.evidenceStatus === "MATCH_UNCERTAIN" ||
    role.evidenceStatus === "CONFLICT"
  )
    return "MATCH_UNCERTAIN";
  const values = role.variants
    .filter((v) => v.applicability === "applicable")
    .map((v) => v.raw);
  if (!values.length) return "OFFICIAL_MISSING";
  if (!current) return "CURRENT_MISSING";
  if (values.includes(current)) return "EXACT";
  if (values.some((v) => comparisonKey(v) === comparisonKey(current)))
    return "FORMAT_ONLY";
  if (
    values.some(
      (v) =>
        exactCreator(v, creators) &&
        exactCreator(v, creators) === exactCreator(current, creators),
    )
  )
    return "KNOWN_CREATOR_EQUIVALENT";
  return "OFFICIAL_DIFFERS";
}
const provenance = (
  fact,
  scope,
  method,
  applicability,
  relatedRecord = null,
) => ({
  evidenceId: fact.id,
  sourceId: fact.sourceId,
  sourceUrl: fact.sourceUrl,
  sourceType: fact.sourceType,
  sourceTitle: fact.sourceTitle,
  sourceReliability: "PRIMARY",
  checkedAt: fact.checkedAt,
  pageReadStatus: fact.pageReadStatus,
  sourceScope: scope,
  sourceGame: fact.game,
  sourceTrackTitle: fact.title,
  sourceArtist: fact.artist,
  sourceContext: fact.context,
  creditText: fact.creditText,
  matchingMethod: method,
  applicability,
  relatedRecord,
  notes:
    applicability === "version-review"
      ? "発売版/別versionの編曲原文。対象ゲーム収録への適用は未確認。"
      : applicability === "matching-review"
        ? "歌唱主体またはversionの対応に不確実性。自動確定禁止。"
        : scope === "work"
          ? "既存Work参照による作品creditの利用。対象ゲーム専用sourceではない。"
          : "",
});
export function roleResult(role, evidence, attempts, contexts, creators) {
  const variants = evidence
    .filter((e) => e.fact.credits[role])
    .map((e) => ({
      raw: e.fact.credits[role],
      ...provenance(
        e.fact,
        e.scope,
        e.method,
        e.applicability,
        e.relatedRecord,
      ),
    }));
  const usable = variants.filter((v) => v.applicability === "applicable");
  let evidenceStatus, reason;
  if (usable.length) {
    const disagreement = usable.some(
      (v) => !equivalent(v.raw, usable[0].raw, creators),
    );
    evidenceStatus = disagreement
      ? "CONFLICT"
      : new Set(usable.map((v) => v.sourceId)).size > 1
        ? "MULTI_SOURCE_CONFIRMED"
        : "CONFIRMED";
    reason = disagreement
      ? "同じroleに実質的に異なる一次原文がある。全variantを保持し、選択しない。"
      : "一次資料の明示role欄を曲名・歌唱主体・game/release contextで対応。";
  } else if (variants.length) {
    evidenceStatus = variants.every(
      (v) => v.applicability === "matching-review",
    )
      ? "MATCH_UNCERTAIN"
      : "NEEDS_REVIEW";
    reason =
      evidenceStatus === "MATCH_UNCERTAIN"
        ? "公式同名欄は読めたが、歌唱主体/versionがlocal recordと一致しない。"
        : "作品/発売版の原文は取得したが、ゲーム固有の編曲との同一性が未確認。";
  } else if (contexts.length) {
    evidenceStatus = "CREDIT_NOT_LISTED";
    reason =
      "対象曲/歌唱主体の公式発売・掲載contextを確認したが、このroleの明示creditがない。記載欠如は担当者なしを意味しない。";
  } else {
    evidenceStatus = "SOURCE_MISSING";
    reason =
      "ゲーム公式MUSIC全掲載欄と公式discography全26一覧、関連artistの詳細本文を確認した範囲で、対象recordに確実に対応する明示creditが見つからない。全Webで不存在とは断定しない。";
  }
  const chosen =
    usable.length && evidenceStatus !== "CONFLICT"
      ? usable[0].raw
      : variants.length === 1
        ? variants[0].raw
        : null;
  return {
    raw: chosen,
    rawValues: sortedUnique(variants.map((v) => v.raw)),
    evidenceStatus,
    reason,
    sourceIds: sortedUnique(variants.map((v) => v.sourceId)),
    sourceUrls: sortedUnique(variants.map((v) => v.sourceUrl)),
    variants,
    candidates: sortedUnique(variants.map((v) => v.raw)).map((raw) => ({
      raw,
      ...candidateForRaw(raw, creators),
    })),
    attemptedSourceIds: attempts,
  };
}

export function buildSchema() {
  const str = { type: "string", minLength: 1 },
    array = { type: "array", items: str };
  const variant = {
    type: "object",
    required: [
      "raw",
      "evidenceId",
      "sourceId",
      "sourceUrl",
      "sourceType",
      "sourceTitle",
      "sourceReliability",
      "checkedAt",
      "pageReadStatus",
      "sourceScope",
      "sourceGame",
      "sourceTrackTitle",
      "sourceArtist",
      "sourceContext",
      "creditText",
      "matchingMethod",
      "applicability",
      "relatedRecord",
      "notes",
    ],
    properties: {
      raw: str,
      evidenceId: str,
      sourceId: str,
      sourceUrl: { type: "string", pattern: "^https://" },
      sourceType: str,
      sourceTitle: { type: "string" },
      sourceReliability: { enum: ["PRIMARY"] },
      checkedAt: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T" },
      pageReadStatus: { enum: ["HTTP_CONFIRMED", "BROWSER_CONFIRMED"] },
      sourceScope: { enum: ["record", "work", "release", "original-song"] },
      sourceGame: { type: ["string", "null"] },
      sourceTrackTitle: str,
      sourceArtist: { type: "string" },
      sourceContext: { type: ["string", "null"] },
      creditText: str,
      matchingMethod: str,
      applicability: {
        enum: ["applicable", "version-review", "matching-review"],
      },
      relatedRecord: { type: ["object", "null"] },
      notes: { type: "string" },
    },
    additionalProperties: false,
  };
  const role = {
    type: "object",
    required: [
      "raw",
      "rawValues",
      "evidenceStatus",
      "reason",
      "sourceIds",
      "sourceUrls",
      "variants",
      "candidates",
      "attemptedSourceIds",
    ],
    properties: {
      raw: { type: ["string", "null"] },
      rawValues: array,
      evidenceStatus: { enum: STATUSES },
      reason: str,
      sourceIds: array,
      sourceUrls: array,
      variants: { type: "array", items: variant },
      candidates: {
        type: "array",
        items: {
          type: "object",
          required: ["raw", "status", "tokensCandidate", "tokenizationStatus"],
          properties: {
            raw: str,
            status: {
              enum: ["AUTO_MATCH_EXACT", "REVIEW_RECOMMENDED", "UNRESOLVED"],
            },
            tokensCandidate: array,
            tokenizationStatus: str,
          },
        },
      },
      attemptedSourceIds: { type: "array", minItems: 1, items: str },
    },
    additionalProperties: false,
  };
  const record = {
    type: "object",
    required: [
      "game",
      "recordId",
      "workId",
      "title",
      "band",
      "baselineReference",
      "currentLyricistRaw",
      "currentComposerRaw",
      "currentArrangerRaw",
      "researchedLyricistRaw",
      "researchedComposerRaw",
      "researchedArrangerRaw",
      "roles",
      "investigation",
      "composerAudit",
      "currentComposerRelationAudit",
      "notes",
    ],
    properties: {
      game: { enum: ["garupa", "ournotes"] },
      recordId: { type: "integer" },
      workId: str,
      title: str,
      band: str,
      baselineReference: { type: "object" },
      currentLyricistRaw: { type: ["string", "null"] },
      currentComposerRaw: { type: ["string", "null"] },
      currentArrangerRaw: { type: ["string", "null"] },
      researchedLyricistRaw: { type: ["string", "null"] },
      researchedComposerRaw: { type: ["string", "null"] },
      researchedArrangerRaw: { type: ["string", "null"] },
      roles: {
        type: "object",
        required: ROLES,
        properties: Object.fromEntries(ROLES.map((r) => [r, role])),
        additionalProperties: false,
      },
      investigation: {
        type: "object",
        required: [
          "status",
          "checkedSourceIds",
          "trackContextSourceIds",
          "steps",
        ],
        properties: {
          status: { enum: ["INVESTIGATED"] },
          checkedSourceIds: array,
          trackContextSourceIds: array,
          steps: array,
        },
      },
      composerAudit: { enum: AUDIT_CLASSES },
      currentComposerRelationAudit: { type: "object" },
      notes: array,
    },
    additionalProperties: false,
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Credit research Phase A",
    type: "object",
    required: ["version", "phase", "baselineHead", "checkedAt", "records"],
    properties: {
      version: { enum: [1] },
      phase: { enum: ["A"] },
      baselineHead: str,
      checkedAt: str,
      records: { type: "array", minItems: 884, items: record },
    },
    additionalProperties: false,
  };
}
export function verifyResearch(
  dataset,
  sources,
  facts,
  baseline,
  creators,
  schema = buildSchema(),
) {
  validateSchema(dataset, schema);
  const refs = new Map(baseline.records.map((r) => [key(r), r])),
    seen = new Set(),
    src = new Map(sources.map((s) => [s.id, s])),
    ev = new Map(facts.map((f) => [f.id, f]));
  if (
    src.size !== sources.length ||
    new Set(sources.map((s) => s.url)).size !== sources.length
  )
    throw new Error("Duplicate source");
  if (ev.size !== facts.length) throw new Error("Duplicate evidence");
  if (dataset.records.length !== 884)
    throw new Error("Expected 884 research records");
  for (const r of dataset.records) {
    if (seen.has(key(r))) throw new Error(`Duplicate record ${key(r)}`);
    seen.add(key(r));
    if (
      !refs.has(key(r)) ||
      JSON.stringify(reference(r)) !==
        JSON.stringify(reference(refs.get(key(r))))
    )
      throw new Error(`Baseline reference mismatch ${key(r)}`);
    const original = refs.get(key(r));
    for (const role of ROLES) {
      const cap = role[0].toUpperCase() + role.slice(1),
        v = r.roles[role];
      if (r[`current${cap}Raw`] !== original[`current${cap}Raw`])
        throw new Error("Current raw changed");
      if (r[`researched${cap}Raw`] !== v.raw)
        throw new Error("Research raw field mismatch");
      if (!v.reason || !v.attemptedSourceIds.length)
        throw new Error("Missing investigation reason");
      if (
        JSON.stringify(sortedUnique(v.variants.map((x) => x.raw))) !==
        JSON.stringify(v.rawValues)
      )
        throw new Error("Raw value list inconsistent");
      if (
        JSON.stringify(sortedUnique(v.variants.map((x) => x.sourceId))) !==
          JSON.stringify(v.sourceIds) ||
        JSON.stringify(sortedUnique(v.variants.map((x) => x.sourceUrl))) !==
          JSON.stringify(v.sourceUrls)
      )
        throw new Error("Source value list inconsistent");
      for (const id of v.attemptedSourceIds)
        if (!src.has(id)) throw new Error("Dangling attempted source");
      if (
        CONFIRMED.has(v.evidenceStatus) &&
        !v.variants.some((x) => x.applicability === "applicable")
      )
        throw new Error("Confirmed without applicable evidence");
      for (const x of v.variants) {
        const s = src.get(x.sourceId),
          f = ev.get(x.evidenceId);
        if (
          !s ||
          !f ||
          s.url !== x.sourceUrl ||
          f.sourceId !== x.sourceId ||
          f.credits[role] !== x.raw ||
          f.creditText !== x.creditText ||
          s.checkedAt !== x.checkedAt ||
          s.readStatus !== x.pageReadStatus
        )
          throw new Error("Dangling or altered raw evidence");
        if (!["HTTP_CONFIRMED", "BROWSER_CONFIRMED"].includes(s.readStatus))
          throw new Error("Unread source used as evidence");
        if (
          role === "arranger" &&
          x.applicability === "applicable" &&
          (x.sourceScope !== "record" || x.sourceGame !== r.game)
        )
          throw new Error("Game arranger requires same-game record evidence");
        if (
          x.matchingMethod === "exact title + band + game/category" &&
          (normalizeTitle(x.sourceTrackTitle) !== normalizeTitle(r.title) ||
            !bandMatches(f, r))
        )
          throw new Error("False title/band match");
        if (
          x.matchingMethod.startsWith("explicit artist + track title") &&
          (!bandMatches(f, r) ||
            normalizeTitle(
              f.title.replace(/[（(](?:Cover|TV Size)[）)]$/i, "").trim(),
            ) !== normalizeTitle(titleVariant(r.title)))
        )
          throw new Error("False release title/band match");
      }
      for (const c of v.candidates) {
        if (Object.hasOwn(c, "creatorId"))
          throw new Error("New Creator ID forbidden");
        if (
          c.existingCreatorCandidateId &&
          exactCreator(c.raw, creators) !== c.existingCreatorCandidateId
        )
          throw new Error("Non-exact Creator annotation");
      }
    }
    for (const id of r.investigation.checkedSourceIds)
      if (!src.has(id)) throw new Error("Dangling investigation source");
    if (r.investigation.trackContextSourceIds.some((id) => !src.has(id)))
      throw new Error("Dangling context source");
    if (
      compareComposer(r.currentComposerRaw, r.roles.composer, creators) !==
      r.composerAudit
    )
      throw new Error("Composer audit inconsistent");
  }
  if (seen.size !== refs.size) throw new Error("Missing baseline record");
  for (const [game, count] of [
    ["garupa", 799],
    ["ournotes", 85],
  ])
    if (dataset.records.filter((r) => r.game === game).length !== count)
      throw new Error(`Game count ${game}`);
  return {
    records: seen.size,
    duplicates: 0,
    missing: 0,
    sourceCount: src.size,
    protectedSources: "checked separately",
  };
}

export function generate(directory = DIRECTORY) {
  const baseline = read(path.join(directory, "baseline.json"));
  assertProtected(baseline);
  const creators = read("data/creators.json").creators;
  const files = fs
    .readdirSync(path.join(directory, "sources"))
    .filter((f) =>
      /^game-.*\.json$|^discography-\d+\.json$|^band-.*\.json$/.test(f),
    )
    .sort();
  const pages = files.map((f) => read(path.join(directory, "sources", f)));
  const discovery = read(
    path.join(directory, "sources/discography-discovery.json"),
  );
  const sources = pages.map((p) => ({
    id: sourceId(p.url),
    url: p.url,
    sourceType: p.sourceType,
    pageTitle: p.pageTitle,
    checkedAt: p.checkedAt,
    readStatus: p.pageReadStatus,
    sourceReliability: "PRIMARY",
    purpose: "credit / track context",
    reason: p.reason ?? null,
    retrievalAttempts: p.retrievalAttempts ?? [],
    recordUsage: [],
  }));
  for (const p of discovery.pages)
    sources.push({
      id: sourceId(p.url),
      url: p.url,
      sourceType: "bangdream-discography",
      pageTitle: "BanG Dream! official discography index",
      checkedAt: p.checkedAt,
      readStatus: p.readStatus,
      sourceReliability: "PRIMARY",
      purpose: "discovery",
      reason: p.reason ?? null,
      recordUsage: [],
    });
  sources.sort((a, b) => a.url.localeCompare(b.url));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const game = pages
    .filter((p) => p.sourceType === "game-official")
    .flatMap((p) =>
      gameFacts(p, p.url.includes("bang-dream-on") ? "ournotes" : "garupa"),
    );
  const releases = pages
    .filter((p) => p.sourceType === "bangdream-discography")
    .flatMap(discographyFacts);
  const band = pages
    .filter((p) => p.rows && p.sourceType !== "game-official")
    .flatMap((p) =>
      p.rows.map((row) => {
        const f = {
          sourceId: sourceId(p.url),
          sourceUrl: p.url,
          sourceType: p.sourceType,
          sourceTitle: p.pageTitle,
          checkedAt: p.checkedAt,
          pageReadStatus: p.pageReadStatus,
          game: null,
          title: row.title,
          artist: row.artist,
          bandContext: null,
          category: p.sourceScope ?? "work",
          sourceScope: p.sourceScope ?? "work",
          credits:
            row.credits ??
            Object.fromEntries(
              parseCreditLine(row.creditText).values.map((v) => [
                v.role,
                v.raw,
              ]),
            ),
          creditText: row.creditText,
          context:
            row.context ?? "Official authorship listing; arranger not listed",
        };
        return { ...f, id: `e-${fingerprint(f)}` };
      }),
    );
  const facts = [...game, ...releases, ...band].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const expectedCategory = {
    normal: "original",
    anime: "cover",
    tie_up: "extra",
  };
  const direct = (r) =>
    game.filter(
      (f) =>
        f.game === r.game &&
        normalizeTitle(f.title) === normalizeTitle(r.title) &&
        bandMatches(f, r) &&
        f.category === expectedCategory[r.type],
    );
  const workMembers = new Map();
  for (const r of baseline.records) {
    if (!workMembers.has(r.workId)) workMembers.set(r.workId, []);
    workMembers.get(r.workId).push(r);
  }
  const records = baseline.records.map((r) => {
    const evidence = direct(r).map((f) => ({
      fact: f,
      scope: "record",
      method: "exact title + band + game/category",
      applicability: "applicable",
      roles: ROLES,
    }));
    // Release suffixes have explicit scope; they are never a game-arrangement assertion.
    for (const f of [...releases, ...band]) {
      const sourceTitle = f.title
        .replace(/[（(](?:Cover|TV Size)[）)]$/i, "")
        .trim();
      if (
        bandMatches(f, r) &&
        normalizeTitle(sourceTitle) === normalizeTitle(titleVariant(r.title))
      ) {
        evidence.push({
          fact: f,
          scope: f.sourceScope,
          method: "explicit artist + track title; release/version recorded",
          applicability: "applicable",
          roles: ["lyricist", "composer"],
        });
        evidence.push({
          fact: f,
          scope: f.sourceScope,
          method: "explicit artist + track title; game arrangement unverified",
          applicability: "version-review",
          roles: ["arranger"],
        });
      }
    }
    for (const other of workMembers.get(r.workId)) {
      if (key(other) === key(r)) continue;
      for (const f of direct(other))
        evidence.push({
          fact: f,
          scope: "work",
          method:
            "existing immutable Work reference to separately matched record",
          applicability: "applicable",
          roles: ["lyricist", "composer"],
          relatedRecord: reference(other),
        });
    }
    if (!evidence.length)
      for (const f of game.filter(
        (f) =>
          f.game === r.game &&
          normalizeTitle(f.title) === normalizeTitle(r.title),
      ))
        evidence.push({
          fact: f,
          scope: "record",
          method: "same title; artist/version mismatch",
          applicability: "matching-review",
          roles: ROLES,
        });
    // A related-version arranger is retained for review only, and only within one game/band.
    if (
      !evidence.some(
        (e) => e.roles.includes("arranger") && e.fact.credits.arranger,
      )
    )
      for (const other of workMembers
        .get(r.workId)
        .filter(
          (x) => x.game === r.game && x.band === r.band && key(x) !== key(r),
        ))
        for (const f of direct(other))
          evidence.push({
            fact: f,
            scope: "work",
            method: "same-game Work version; arrangement unverified",
            applicability: "version-review",
            roles: ["arranger"],
            relatedRecord: reference(other),
          });
    const contexts = pages.filter(
      (p) =>
        (p.trackContexts ?? []).some(
          (c) => c.game === r.game && c.recordId === r.recordId,
        ) ||
        evidence.some(
          (e) =>
            e.fact.sourceId === sourceId(p.url) &&
            e.applicability === "applicable" &&
            e.scope !== "work",
        ),
    );
    const attempted = sortedUnique([
      sourceId(
        r.game === "garupa"
          ? "https://bang-dream.bushimo.jp/music/"
          : "https://bang-dream-on.bushimo.jp/music/",
      ),
      ...discovery.pages.map((p) => sourceId(p.url)),
      ...pages
        .filter(
          (p) =>
            p.artists
              ?.split("\n")
              .some((a) => normalizeTitle(a) === normalizeTitle(r.band)) ||
            (p.rows ?? []).some((row) => row.artist === r.band),
        )
        .map((p) => sourceId(p.url)),
      ...evidence.map((e) => e.fact.sourceId),
    ]);
    const roles = Object.fromEntries(
      ROLES.map((role) => [
        role,
        roleResult(
          role,
          evidence.filter((e) => e.roles.includes(role)),
          attempted,
          contexts,
          creators,
        ),
      ]),
    );
    const currentIds = (r.currentCredits ?? [])
      .filter((c) => (c.roles ?? []).includes("composer"))
      .map((c) => c.creatorId);
    const wholeIds = sortedUnique(
      roles.composer.candidates
        .map((c) => c.existingCreatorCandidateId)
        .filter(Boolean),
    );
    const relationStatus =
      currentIds.length === 0
        ? "NO_CURRENT_ID_RELATION"
        : roles.composer.evidenceStatus === "CONFLICT"
          ? "SOURCE_CONFLICT"
          : currentIds.length === 1 &&
              wholeIds.length === 1 &&
              currentIds[0] === wholeIds[0]
            ? "WHOLE_RAW_EXACT_RELATION_MATCH"
            : "HUMAN_REVIEW";
    return {
      ...reference(r),
      baselineReference: reference(r),
      currentLyricistRaw: r.currentLyricistRaw,
      currentComposerRaw: r.currentComposerRaw,
      currentArrangerRaw: r.currentArrangerRaw,
      researchedLyricistRaw: roles.lyricist.raw,
      researchedComposerRaw: roles.composer.raw,
      researchedArrangerRaw: roles.arranger.raw,
      roles,
      investigation: {
        status: "INVESTIGATED",
        checkedSourceIds: attempted,
        trackContextSourceIds: sortedUnique(
          contexts.map((p) => sourceId(p.url)),
        ),
        steps: [
          "当該game公式MUSICの曲名/歌唱主体/カテゴリ照合",
          "公式discography全26一覧/504発売情報から関連artist・cover collectionを選び396詳細本文を確認",
          "不足曲はMyGO公式著作者表記/Dream Monster公式作品欄で補完（実際の利用URLはrole provenanceを参照）",
          "明示credit、track context、既存Work参照を分離して確認。不確実なversion/編曲はreviewへ",
        ],
      },
      composerAudit: compareComposer(
        r.currentComposerRaw,
        roles.composer,
        creators,
      ),
      currentComposerRelationAudit: {
        status: relationStatus,
        currentCreatorIds: currentIds,
        exactWholeRawCandidateIds: wholeIds,
        notes:
          "複数名の分割・alias同定は今回適用しない。HUMAN_REVIEW全件を機械可読一覧に保持。",
      },
      notes: [
        "rawは原文。matching/comparison normalizationは別処理。",
        "arrangerの別ゲーム転用0。発売版/別version原文はNEEDS_REVIEWとして取得。",
      ],
    };
  });
  for (const s of sources) {
    s.recordUsage = records.flatMap((r) =>
      ROLES.filter((role) => r.roles[role].sourceIds.includes(s.id)).map(
        (role) => ({
          ...reference(r),
          role,
          usage: "credit",
          evidenceStatus: r.roles[role].evidenceStatus,
        }),
      ),
    );
    for (const r of records.filter((r) =>
      r.investigation.trackContextSourceIds.includes(s.id),
    ))
      if (!s.recordUsage.some((x) => key(x) === key(r)))
        s.recordUsage.push({
          ...reference(r),
          role: null,
          usage: "track-context",
        });
    s.recordCount = new Set(s.recordUsage.map(key)).size;
    s.investigationRecordCount = records.filter((r) =>
      r.investigation.checkedSourceIds.includes(s.id),
    ).length;
  }
  const dataset = {
    version: 1,
    phase: "A",
    baselineHead: baseline.head,
    checkedAt: pages
      .map((p) => p.checkedAt)
      .sort()
      .at(-1),
    records,
  };
  const schema = buildSchema();
  verifyResearch(dataset, sources, facts, baseline, creators, schema);
  const rawIndex = (roles) => {
    const map = new Map();
    for (const r of records)
      for (const role of roles)
        for (const raw of r.roles[role].rawValues) {
          if (!map.has(raw))
            map.set(raw, {
              raw,
              roles: new Set(),
              records: new Map(),
              sources: new Set(),
              ...candidateForRaw(raw, creators),
            });
          const item = map.get(raw);
          item.roles.add(role);
          item.records.set(key(r), reference(r));
          for (const v of r.roles[role].variants.filter((v) => v.raw === raw))
            item.sources.add(v.sourceId);
        }
    return [...map.values()]
      .map((x) => ({
        raw: x.raw,
        roles: [...x.roles].sort(),
        recordCount: x.records.size,
        workCount: new Set([...x.records.values()].map((r) => r.workId)).size,
        gameCount: new Set([...x.records.values()].map((r) => r.game)).size,
        games: sortedUnique([...x.records.values()].map((r) => r.game)),
        sourceCount: x.sources.size,
        sourceIds: [...x.sources].sort(),
        representativeSongs: [...x.records.values()].slice(0, 5),
        records: [...x.records.values()],
        status: x.status,
        ...(x.existingCreatorCandidateId
          ? { existingCreatorCandidateId: x.existingCreatorCandidateId }
          : {}),
        ...(x.possibleCreatorCandidate
          ? { possibleCreatorCandidate: x.possibleCreatorCandidate }
          : {}),
        newCreatorCandidate: x.newCreatorCandidate ?? false,
        tokensCandidate: x.tokensCandidate,
        tokenizationStatus: x.tokenizationStatus,
        notes: x.notes ?? "既存name/aliasの原文完全一致。候補annotationのみ。",
      }))
      .sort(
        (a, b) => b.recordCount - a.recordCount || a.raw.localeCompare(b.raw),
      );
  };
  const indices = Object.fromEntries(
    ROLES.map((role) => [role, rawIndex([role])]),
  );
  const cross = rawIndex(ROLES),
    newCandidates = cross.filter(
      (x) => x.newCreatorCandidate && x.roles.some((r) => r !== "composer"),
    ),
    unresolvedRaw = cross.filter((x) => x.status !== "AUTO_MATCH_EXACT");
  const coverage = {
    total: records.length,
    investigated: records.length,
    officialBodyMatchedRecords: records.filter((r) =>
      ROLES.some((role) => r.roles[role].variants.length),
    ).length,
    roles: {},
    games: {},
    workAllRecordsConfirmed: {},
    sourceStats: {
      fetched: sources.length,
      creditOrTrackContextUsed: sources.filter((s) => s.recordCount > 0).length,
      creditUsed: sources.filter((s) =>
        s.recordUsage.some((u) => u.usage === "credit"),
      ).length,
      browser: sources.filter((s) => s.readStatus === "BROWSER_CONFIRMED")
        .length,
      unreadable: sources.filter((s) => s.readStatus === "SOURCE_UNREADABLE")
        .length,
    },
    composerAudit: Object.fromEntries(
      AUDIT_CLASSES.map((c) => [
        c,
        records.filter((r) => r.composerAudit === c).length,
      ]),
    ),
  };
  const roleCounts = (list, role) => ({
    rawAcquired: list.filter((r) => r.roles[role].rawValues.length).length,
    confirmed: list.filter((r) => CONFIRMED.has(r.roles[role].evidenceStatus))
      .length,
    missing: list.filter((r) => !r.roles[role].rawValues.length).length,
    conflicts: list.filter((r) => r.roles[role].evidenceStatus === "CONFLICT")
      .length,
    unreadable: list.filter(
      (r) => r.roles[role].evidenceStatus === "SOURCE_UNREADABLE",
    ).length,
    statuses: Object.fromEntries(
      STATUSES.map((s) => [
        s,
        list.filter((r) => r.roles[role].evidenceStatus === s).length,
      ]),
    ),
  });
  for (const role of ROLES) {
    coverage.roles[role] = roleCounts(records, role);
    coverage.workAllRecordsConfirmed[role] = [...workMembers.values()].filter(
      (rs) =>
        rs.every((r) =>
          CONFIRMED.has(
            records.find((x) => key(x) === key(r)).roles[role].evidenceStatus,
          ),
        ),
    ).length;
  }
  for (const game of ["garupa", "ournotes"])
    coverage.games[game] = {
      total: records.filter((r) => r.game === game).length,
      ...Object.fromEntries(
        ROLES.map((role) => [
          role,
          roleCounts(
            records.filter((r) => r.game === game),
            role,
          ),
        ]),
      ),
    };
  coverage.composerComparable = records.filter(
    (r) => !["OFFICIAL_MISSING", "MATCH_UNCERTAIN"].includes(r.composerAudit),
  ).length;
  const conflicts = records.flatMap((r) =>
    ROLES.filter((role) => r.roles[role].evidenceStatus === "CONFLICT").map(
      (role) => ({
        ...reference(r),
        role,
        reason: r.roles[role].reason,
        variants: r.roles[role].variants,
      }),
    ),
  );
  const unresolved = records
    .filter((r) =>
      ["lyricist", "arranger"].some(
        (role) => !CONFIRMED.has(r.roles[role].evidenceStatus),
      ),
    )
    .map((r) => ({
      ...reference(r),
      roles: Object.fromEntries(
        ["lyricist", "arranger"]
          .filter((role) => !CONFIRMED.has(r.roles[role].evidenceStatus))
          .map((role) => [role, r.roles[role]]),
      ),
      checkedSourceIds: r.investigation.checkedSourceIds,
    }));
  const audit = records.map((r) => ({
    ...reference(r),
    classification: r.composerAudit,
    currentRaw: r.currentComposerRaw,
    officialRaw: r.researchedComposerRaw,
    officialRawValues: r.roles.composer.rawValues,
    evidenceStatus: r.roles.composer.evidenceStatus,
    variants: r.roles.composer.variants,
    relationAudit: r.currentComposerRelationAudit,
  }));
  const differences = { composer: [], arranger: [] };
  for (const [workId, members] of workMembers)
    for (const role of ["composer", "arranger"]) {
      if (members.length < 2) continue;
      const rs = records.filter((r) => r.workId === workId),
        values = sortedUnique(rs.flatMap((r) => r.roles[role].rawValues));
      if (values.length < 2) continue;
      const groups = sortedUnique(values.map(comparisonKey));
      differences[role].push({
        workId,
        classification:
          groups.length === 1
            ? "FORMAT_ONLY"
            : "SUBSTANTIVE_OR_VERSION_DIFFERENCE",
        rawValues: values,
        records: rs.map((r) => ({
          ...reference(r),
          rawValues: r.roles[role].rawValues,
          evidenceStatus: r.roles[role].evidenceStatus,
          variants: r.roles[role].variants,
        })),
        notes:
          "発売版/別versionのreview原文も含む。record値の自動統一はしない。",
      });
    }
  const usedEvidence = new Set(
    records.flatMap((r) =>
      ROLES.flatMap((role) => r.roles[role].variants.map((v) => v.evidenceId)),
    ),
  );
  const usedFacts = facts.filter((f) => usedEvidence.has(f.id));
  const outputs = {
    "credit-research.json": dataset,
    "credit-research.schema.json": schema,
    "source-index.json": sources,
    "evidence-facts.json": usedFacts,
    "coverage.json": coverage,
    "lyricist-raw.json": indices.lyricist,
    "composer-raw.json": indices.composer,
    "arranger-raw.json": indices.arranger,
    "raw-cross-role-index.json": cross,
    "creator-candidates.json": {
      existingExact: cross.filter((x) => x.status === "AUTO_MATCH_EXACT"),
      newCandidates,
      top30New: newCandidates.slice(0, 30),
      top50Unresolved: unresolvedRaw.slice(0, 50),
    },
    "composer-audit.json": audit,
    "conflicts.json": conflicts,
    "unresolved.json": unresolved,
    "work-credit-differences.json": differences,
  };
  const heading = "# Phase A credit research\n\n";
  outputs["composer-audit.md"] =
    heading +
    "比較はrecord単位。分類は現在rawと適用可能な公式原文の比較であり、変更は行わない。CONFLICTは比較値を選ばずMATCH_UNCERTAINへ送る。FORMAT_ONLYでもrawは別々に保持する。\n\n" +
    table(["分類", "件数"], Object.entries(coverage.composerAudit)) +
    "\n## 実質差・不足・照合不確実 全件\n\n" +
    table(
      [
        "game/ID",
        "Work",
        "title / band",
        "分類",
        "現在raw",
        "公式raw / status",
        "根拠",
      ],
      audit
        .filter((r) =>
          ["OFFICIAL_DIFFERS", "CURRENT_MISSING", "MATCH_UNCERTAIN"].includes(
            r.classification,
          ),
        )
        .map((r) => [
          key(r),
          r.workId,
          `${r.title} / ${r.band}`,
          r.classification,
          r.currentRaw,
          `${r.officialRawValues.join(" ⟷ ")} / ${r.evidenceStatus}`,
          sortedUnique(r.variants.map((v) => v.sourceUrl)).join(" "),
        ]),
    ) +
    "\nID relationの複数名分割を含む全監査は composer-audit.json に保存。\n";
  outputs["conflicts.md"] =
    heading +
    "全CONFLICTを列挙。同一URL内の矛盾する掲載欄も含む。表記形式だけの差はCONFLICTに数えない。\n\n" +
    table(
      ["game/ID", "Work", "title / band", "role", "全原文 / context", "根拠"],
      conflicts.map((r) => [
        key(r),
        r.workId,
        `${r.title} / ${r.band}`,
        r.role,
        r.variants
          .map((v) => `${v.raw} (${v.sourceScope}; ${v.sourceTrackTitle})`)
          .join(" ⟷ "),
        sortedUnique(r.variants.map((v) => v.sourceUrl)).join(" "),
      ]),
    );
  outputs["unresolved.md"] =
    heading +
    "作詞または編曲が未確定の全record。raw未取得に加え、CONFLICT/版の適用不確実も含む。確認したURLと原文は unresolved.json / source-index.json で追跡できる。\n\n" +
    table(
      ["game/ID", "Work", "title", "band", "role / status / reason"],
      unresolved.map((r) => [
        key(r),
        r.workId,
        r.title,
        r.band,
        Object.entries(r.roles)
          .map(([role, v]) => `${role}: ${v.evidenceStatus}: ${v.reason}`)
          .join("\n"),
      ]),
    );
  outputs["work-credit-differences.md"] =
    heading +
    "同一Work内raw差の全件。record編曲を作品共通値へ統一しない。review中の発売版値を含むためゲーム版確定差の件数ではない。\n\n" +
    table(
      ["role", "Work", "分類", "原文", "records"],
      Object.entries(differences).flatMap(([role, list]) =>
        list.map((r) => [
          role,
          r.workId,
          r.classification,
          r.rawValues.join(" ⟷ "),
          r.records
            .map((x) => `${key(x)} ${x.title} (${x.evidenceStatus})`)
            .join("\n"),
        ]),
      ),
    );
  const candidateTable = (list) =>
    table(
      [
        "raw",
        "roles",
        "records",
        "Work",
        "games",
        "sources",
        "分割候補 / status",
        "代表曲",
      ],
      list.map((x) => [
        x.raw,
        x.roles.join("/"),
        x.recordCount,
        x.workCount,
        x.games.join("/"),
        x.sourceCount,
        `${x.tokensCandidate.join(" | ")} / ${x.tokenizationStatus}`,
        x.representativeSongs.map((r) => `${key(r)} ${r.title}`).join("\n"),
      ]),
    );
  outputs["credit-review.md"] =
    heading +
    "## Priority A：一次資料CONFLICT\n\n全件は [conflicts.md](conflicts.md)。複数roleを含む場合はrecord-role単位で集計。重複掲載きゅ〜まい＊flowerの作曲を人間確認し、FULL等へ自動転用しない。\n\n## Priority B：composer実質差\n\n全件は [composer-audit.md](composer-audit.md)。Mela!等の発売版creditと現サイト差は出典・版を人間確認してから判断。\n\n## Priority C：record matching / version\n\n同名でも歌唱主体が異なるもの、略称/特別バンド、FULL/別game、TV Size/Cover発売版の適用を確認。arrangerのrelease原文をゲーム版へ確定しない。全件は [unresolved.md](unresolved.md)。\n\n## Priority D：未取得\n\n公式のtrack contextは確認できてもcredit欄がない例はCREDIT_NOT_LISTED。SOURCE_MISSINGは今回確認した公式範囲内の未発見であり、不存在の断定ではない。後続では本人/制作会社/原曲公式またはゲーム内の明示creditを優先して補う。\n\n## Priority E：Creator / tokenization\n\nraw完全一致candidateだけを既知候補とし、区切り・括弧・Diggy-MO’等を人物同定に使わない。新ID採番、alias統合、relation適用、nextId更新はPhase Bの別承認範囲。\n\n### 新候補 Top30（人数ではなく未同定raw）\n\n" +
    candidateTable(newCandidates.slice(0, 30)) +
    "\n### 高頻度未解決raw Top50\n\n" +
    candidateTable(unresolvedRaw.slice(0, 50));
  outputs["README.md"] =
    heading +
    "884収録の収集・監査のみ。songs/creators/works/roleCoverageへの書込み、commit/push/deployは行わない。\n\n- `node scripts/research/collect-credit-sources.mjs`：公式indexの実hrefを巡回し詳細credit/短いcontextを保存。cacheで再開。\n- `node scripts/research/collect-band-credits.mjs`：MyGO公式著作者表記欄を収集。保存済み結果を保持。\n- `node scripts/research/credits-phase-a.mjs generate`：保存された一次抽出から資料生成。保全hash gate付き。ネットワークなし。\n- `node scripts/research/credits-phase-a.mjs verify`：schema、884参照、raw/provenance、game編曲、候補、source保全を検証。\n\nゲームMUSICは通常web取得のInternal Error後、実ブラウザーDOMで本文確認。二つともBROWSER_CONFIRMED。396詳細と26index、MyGO著作者表記はHTTP本文。検索snippetは根拠に使用しない。\n\n`credit-research.json`がrecord正本。rolesごとに原文variant/sourceScope/statusを保存。CONFIRMED件数にはMULTI_SOURCE_CONFIRMEDを含む。raw取得件数には未確定version原文も含む。競合時はscalar rawをnullとして全rawValuesとvariantを保持。作品creditは同一Work参照を明示し、arrangerへ別ゲームの値を転用しない。\n\nsource-indexのrecordCountはcreditまたは明示track contextで使用した収録数、investigationRecordCountは探索対象。公式bodyMatchedは対象/候補欄の原文を取得した収録数で、全role確定ではない。source URL使用数はcredit/track contextのあるURL、全425読取URLは別記。\n\n[最終52項目報告](PHASE_A_REPORT.md)、[優先review](credit-review.md)、[未確定全件](unresolved.md)、[composer監査](composer-audit.md)、[conflict全件](conflicts.md)。原文uniqueを人数と解釈しない。\n";
  outputs["README.md"] = outputs["README.md"]
    .replace("全425読取URL", `全${sources.length}読取URL`)
    .replace(
      "MyGO著作者表記はHTTP本文。",
      "MyGO著作者表記はHTTP本文。Dream Monster公式作品詳細はbrowser DOM。",
    );
  for (const [file, value] of Object.entries(outputs))
    write(path.join(directory, file), value);
  assertProtected(baseline);
  return {
    baseline,
    dataset,
    sources,
    facts: usedFacts,
    coverage,
    indices,
    cross,
    newCandidates,
    unresolvedRaw,
    conflicts,
    unresolved,
    audit,
    differences,
    outputs,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const mode = process.argv[2] ?? "verify";
  if (mode === "generate") {
    const r = generate();
    console.log(
      JSON.stringify({
        records: r.dataset.records.length,
        coverage: r.coverage,
        conflicts: r.conflicts.length,
        newCandidates: r.newCandidates.length,
      }),
    );
  } else if (mode === "verify") {
    const baseline = read(`${DIRECTORY}/baseline.json`);
    assertProtected(baseline);
    console.log(
      JSON.stringify(
        verifyResearch(
          read(`${DIRECTORY}/credit-research.json`),
          read(`${DIRECTORY}/source-index.json`),
          read(`${DIRECTORY}/evidence-facts.json`),
          baseline,
          read("data/creators.json").creators,
          read(`${DIRECTORY}/credit-research.schema.json`),
        ),
      ),
    );
  } else throw new Error("Use generate or verify");
}
