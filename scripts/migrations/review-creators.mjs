import fs from "node:fs";
import {
  loadLegacyCredits,
  validateReferenceUpdates,
} from "./legacy-references.mjs";
import path from "node:path";
import crypto from "node:crypto";
import { permitsNameChange } from "./creator-evidence.mjs";
import { fileURLToPath } from "node:url";
import { GAMES } from "../../src/js/site-config.js";
import { creditParts } from "../../src/js/credits.js";
import {
  CREDIT_ROLES,
  creditText,
  validateCreatorDatabase,
} from "../../src/js/creators-data.js";
const artifact = "docs/migrations/creators-2026-10-02";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};
const formattingKey = (s) =>
  s.normalize("NFKC").replace(/[’‘]/g, "'").replace(/\s/g, "").toLowerCase();
const affiliationKey = (s) =>
  formattingKey(s).replace(/\(elementsgarden\)$/i, "");

export function reviewCreatorCandidates(legacy, songs, mapping, research) {
  const byRef = new Map(songs.map((s) => [`${s.gameId}:${s.id}`, s]));
  const exact = new Map();
  for (const c of mapping.creators)
    for (const raw of [c.name, ...(c.aliases ?? [])]) {
      if (exact.has(raw) && exact.get(raw).id !== c.id)
        throw new Error("明示mapの表記が重複しています。");
      exact.set(raw, c);
    }
  const tokens = new Map(),
    rawEntries = new Map();
  for (const old of legacy)
    for (const role of CREDIT_ROLES)
      if (old[role]) {
        const s = byRef.get(old.reference);
        if (!s) throw new Error(`元レコードが見つかりません: ${old.reference}`);
        const rawKey = JSON.stringify([old[role], role]);
        if (!rawEntries.has(rawKey))
          rawEntries.set(rawKey, {
            original: old[role],
            role,
            records: [],
            parts: creditParts(old[role])
              .filter((p) => p.name)
              .map((p) => ({
                original: p.text,
                creatorId: exact.get(p.text)?.id ?? null,
                status: exact.has(p.text) ? "AUTO_RESOLVED" : "UNRESOLVED",
              })),
          });
        rawEntries.get(rawKey).records.push(old.reference);
        for (const p of creditParts(old[role]).filter((p) => p.name)) {
          if (!tokens.has(p.text))
            tokens.set(p.text, {
              original: p.text,
              records: new Set(),
              works: new Set(),
              roles: new Set(),
              games: new Set(),
            });
          const t = tokens.get(p.text);
          t.records.add(old.reference);
          t.works.add(s.workId);
          t.roles.add(role);
          t.games.add(s.gameId);
        }
      }
  const candidates = [];
  const visited = new Set();
  const registeredFor = (token) => {
    const c = exact.get(token.original);
    if (
      !c ||
      (mapping.applyRoles &&
        [...token.roles].some((r) => !mapping.applyRoles.includes(r)))
    )
      return null;
    return c.approvedReferences &&
      [...token.records].some((r) => !c.approvedReferences.includes(r))
      ? null
      : c;
  };
  for (const first of tokens.values()) {
    if (visited.has(first.original)) continue;
    const confirmed = registeredFor(first);
    // These keys only propose review groups. They are never used by the apply path.
    const peers = [...tokens.values()].filter(
      (t) =>
        !visited.has(t.original) &&
        (confirmed
          ? registeredFor(t)?.id === confirmed.id
          : !registeredFor(t) &&
            affiliationKey(t.original) === affiliationKey(first.original)),
    );
    peers.forEach((t) => visited.add(t.original));
    const variants = peers.map((t) => t.original);
    const affiliation =
      variants.length > 1 &&
      new Set(variants.map(formattingKey)).size > 1 &&
      variants.some((v) => /[(（]Elements Garden[)）]/i.test(v));
    const ambiguous = variants.some((v) =>
      /[()（）]|CV[.:：]|声優|feat|制作委員会|project/i.test(v),
    );
    const group = affiliation
      ? "A"
      : variants.length > 1
        ? "B"
        : ambiguous
          ? "C"
          : "D";
    const status = confirmed
      ? "AUTO_RESOLVED"
      : group === "D"
        ? "UNRESOLVED"
        : "REVIEW_RECOMMENDED";
    const canonical =
      confirmed?.name ??
      variants.find((v) => !/[()（）]/.test(v)) ??
      variants[0];
    const records = new Set(peers.flatMap((t) => [...t.records])),
      works = new Set(peers.flatMap((t) => [...t.works]));
    candidates.push({
      group,
      status,
      confidence: confirmed
        ? "confirmed"
        : group === "A"
          ? "high"
          : group === "B"
            ? "medium"
            : group === "C"
              ? "requires-evidence"
              : "single",
      originals: variants,
      roles: [...new Set(peers.flatMap((t) => [...t.roles]))],
      recordCount: records.size,
      workCount: works.size,
      games: [...new Set(peers.flatMap((t) => [...t.games]))],
      candidateName: canonical,
      candidateAliases:
        confirmed?.aliases ?? variants.filter((v) => v !== canonical),
      candidateType: confirmed?.type ?? null,
      sortKey: confirmed?.sortKey ?? null,
      sortKeyStatus:
        confirmed?.sortKeyStatus ??
        (confirmed ? "registered" : "review-required"),
      slug: confirmed?.slug ?? null,
      creatorId: confirmed?.id ?? null,
      evidence:
        confirmed?.identityEvidence ??
        (confirmed
          ? "既存creator-mapの明示対応"
          : affiliation
            ? "同じ基底表記とElements Garden括弧表記。人物同定は未確認"
            : variants.length > 1
              ? "NFKC/空白/括弧形式/記号の候補一致。人物同定は未確認"
              : ambiguous
                ? "所属/複合名等の意味・種別・読みを人間が確認"
                : "他表記との重複候補なし。種別/読み/slugを確認"),
      variants: peers.map((t) => ({
        original: t.original,
        recordCount: t.records.size,
        workCount: t.works.size,
        roles: [...t.roles],
        games: [...t.games],
      })),
      records: [...records],
    });
  }
  candidates.sort(
    (a, b) =>
      b.recordCount - a.recordCount ||
      a.group.localeCompare(b.group) ||
      a.candidateName.localeCompare(b.candidateName, "ja"),
  );
  for (const r of rawEntries.values())
    for (const p of r.parts) {
      const c = exact.get(p.original);
      const allowed =
        c &&
        (!mapping.applyRoles || mapping.applyRoles.includes(r.role)) &&
        (!c.approvedReferences ||
          r.records.every((ref) => c.approvedReferences.includes(ref)));
      p.creatorId = allowed ? c.id : null;
      p.status = allowed ? "AUTO_RESOLVED" : "UNRESOLVED";
    }
  const entries = [...rawEntries.values()].map((r) => ({
    ...r,
    status: r.parts.every((p) => p.creatorId)
      ? "AUTO_RESOLVED"
      : r.parts.some((p) =>
            candidates.some(
              (c) =>
                c.originals.includes(p.original) &&
                c.status === "REVIEW_RECOMMENDED",
            ),
          )
        ? "REVIEW_RECOMMENDED"
        : "UNRESOLVED",
    count: r.records.length,
    workCount: new Set(r.records.map((ref) => byRef.get(ref).workId)).size,
    games: [...new Set(r.records.map((ref) => byRef.get(ref).gameId))],
  }));
  const summary = {
    creditStrings: entries.length,
    autoResolvedStrings: entries.filter((r) => r.status === "AUTO_RESOLVED")
      .length,
    reviewRecommendedStrings: entries.filter(
      (r) => r.status === "REVIEW_RECOMMENDED",
    ).length,
    unresolvedStrings: entries.filter((r) => r.status === "UNRESOLVED").length,
    remainingUnidentifiedStrings: entries.filter(
      (r) => r.status !== "AUTO_RESOLVED",
    ).length,
    candidateGroups: candidates.length,
    groupCounts: Object.fromEntries(
      ["A", "B", "C", "D"].map((g) => [
        g,
        candidates.filter((c) => c.group === g).length,
      ]),
    ),
    candidateStatuses: Object.fromEntries(
      ["AUTO_RESOLVED", "REVIEW_RECOMMENDED", "UNRESOLVED"].map((status) => [
        status,
        candidates.filter((c) => c.status === status).length,
      ]),
    ),
  };
  if (research) {
    for (const c of candidates) {
      const e = research.entries.find((e) =>
        e.originals.some((r) => c.originals.includes(r)),
      );
      c.researchStatus =
        e?.status ?? (c.creatorId ? "CONFIRMED" : "UNRESOLVED");
      c.researched = Boolean(e);
      c.normalizedName = c.candidateName;
      c.aliases = c.candidateAliases;
      c.type = c.candidateType;
      c.officialLatinName = e?.officialLatinName ?? null;
      c.sources = e?.evidence ?? [];
      c.notes =
        e?.notes ??
        (c.creatorId
          ? "既存ユーザー確認済み固定IDを保持。今回のWeb調査件数には含めない。"
          : "未調査の低頻度候補。文字列類似だけで同定しない。");
      c.confidence = c.researchStatus.toLowerCase();
    }
    summary.research = research.summary;
  }
  return { summary, entries, candidates };
}

export function applyConfirmedCreators(master, works, documents, mapping) {
  const next = structuredClone(master),
    workNext = structuredClone(works),
    docs = structuredClone(documents);
  for (const c of mapping.creators) {
    if (mapping.phase === 3 && c.researchStatus !== "CONFIRMED")
      throw new Error("非CONFIRMEDは適用できません。");
    const existing = next.creators.find((x) => x.id === c.id);
    if (
      existing &&
      (existing.type !== c.type ||
        (existing.name !== c.name &&
          !permitsNameChange(
            c.canonicalNameChange,
            c.id,
            existing.name,
            c.name,
          )))
    )
      throw new Error("明示mapと既存固定IDが競合しています。");
    if (existing && existing.name !== c.name) {
      for (const document of Object.values(docs))
        for (const group of document.groups)
          for (const song of group.songs)
            for (const relation of song.credits)
              if (
                relation.creatorId === c.id &&
                relation.displayOverride === undefined
              )
                relation.displayOverride = existing.name;
    }
    const publicCreator = Object.fromEntries(
      [
        "id",
        "slug",
        "previousSlugs",
        "name",
        "sortKey",
        "sortKeyStatus",
        "type",
        "aliases",
      ]
        .filter((key) => c[key] !== undefined)
        .map((key) => [key, structuredClone(c[key])]),
    );
    if (!existing) next.creators.push(publicCreator);
    else if (mapping.phase === 3) {
      Object.assign(existing, publicCreator);
      if (existing.identityEvidence !== undefined && c.identityEvidence)
        existing.identityEvidence = c.identityEvidence;
    }
  }
  next.nextId = Math.max(
    next.nextId,
    ...next.creators.map((c) => Number(c.id.slice(3)) + 1),
  );
  next.roleCoverage = mapping.roleCoverage ?? next.roleCoverage;
  const exact = new Map();
  for (const c of mapping.creators)
    for (const raw of [c.name, ...(c.aliases ?? [])]) {
      if (exact.has(raw) && exact.get(raw).id !== c.id)
        throw new Error("明示map表記重複");
      exact.set(raw, c.id);
    }
  const changed = [];
  for (const g of Object.values(GAMES))
    for (const group of docs[g.id].groups)
      for (const s of group.songs)
        for (const role of mapping.applyRoles ?? CREDIT_ROLES) {
          s.creditDisplay[role] = (s.creditDisplay[role] ?? []).map((p) => {
            if (!p.unresolved || !exact.has(p.text)) return p;
            const id = exact.get(p.text),
              c = next.creators.find((c) => c.id === id);
            const approval = mapping.creators.find((c) => c.id === id);
            if (
              approval.approvedReferences &&
              !approval.approvedReferences.includes(`${g.id}:${s.id}`)
            )
              return p;
            let relation = s.credits.find((c) => c.creatorId === id);
            if (relation && (relation.displayOverride ?? c.name) !== p.text)
              throw new Error("複数担当/表記の手動確認が必要です。");
            if (!relation) {
              relation = {
                creatorId: id,
                roles: [],
                ...(p.text !== c.name ? { displayOverride: p.text } : {}),
              };
              s.credits.push(relation);
            }
            if (!relation.roles.includes(role)) relation.roles.push(role);
            changed.push({
              reference: `${g.id}:${s.id}`,
              role,
              original: p.text,
              creatorId: id,
            });
            return { creatorId: id };
          });
        }
  const songs = Object.values(GAMES).flatMap((g) =>
    docs[g.id].groups.flatMap((gr) =>
      gr.songs.map((s) => ({ ...s, gameId: g.id })),
    ),
  );
  const result = validateCreatorDatabase(next, workNext, songs);
  for (const w of workNext.works)
    if (
      w.reviewReason === "record-credit-difference" &&
      !result.warnings.some((x) => x.workId === w.id)
    ) {
      delete w.reviewRequired;
      delete w.reviewReason;
      w.creditReview = {
        status: "resolved",
        basis: "confirmed-creator-ids",
        display: "record overrides retained",
      };
    }
  return {
    master: next,
    works: workNext,
    documents: docs,
    songs,
    changed,
    warnings: result.warnings,
  };
}
export function markdown(report) {
  const escape = (s) =>
    String(s ?? "確認待ち")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  return (
    "# Creator確認レポート\n\n候補の文字列正規化はレビュー提示専用です。AUTO_RESOLVED（明示map）だけを適用し、A/B/C/D候補から自動同定しません。出現収録数の多い順に掲載。sortKey/slug/typeが確認待ちの候補は登録しません。\n\n```json\n" +
    JSON.stringify(report.summary, null, 2) +
    "\n```\n\n| 元表記 | role | 収録数 | 作品数 | ゲーム | 候補標準名 | aliases候補 | type | sortKey | slug | 区分/確度 | 状態 | 根拠 |\n| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
    report.candidates
      .map(
        (c) =>
          "| " +
          [
            c.originals.join(" / "),
            c.roles.join(","),
            c.recordCount,
            c.workCount,
            c.games.join(","),
            c.candidateName,
            c.candidateAliases.join(" / "),
            c.candidateType,
            c.sortKey,
            c.slug,
            c.group + " / " + c.confidence,
            c.status,
            c.evidence,
          ]
            .map(escape)
            .join(" | ") +
          " |",
      )
      .join("\n") +
    "\n\n原表記ごとの件数・Work数・ゲーム・担当と固定ID対応はcreator-review.jsonのentries/variants、既存のcredit-report/legacy-creditsを参照してください。候補は名称以外の人物プロフィール情報を含みません。\n" +
    (report.summary.research
      ? "\n## 一次情報・人間確認による調査結果\n\nCONFIRMEDのみ適用。human-reviewはユーザー確認として区別。未調査の低頻度候補もUNRESOLVEDとして保持。詳細な旧表記対応・所属の意味・曲文脈は[creator-research.json](creator-research.json)。\n\n| 標準名 | 状態 | 公式英字 | 根拠と確認事項 | 備考 |\n| --- | --- | --- | --- | --- |\n" +
        report.candidates
          .map(
            (c) =>
              "| " +
              [
                c.candidateName,
                c.researchStatus,
                c.officialLatinName,
                c.sources
                  .map(
                    (s) =>
                      `[${s.sourceType}](${s.url ?? s.document?.split("/").at(-1)}) (${s.checkedAt}, ${s.access}): ${s.supports}`,
                  )
                  .join(" / "),
                c.notes,
              ]
                .map(escape)
                .join(" | ") +
              " |",
          )
          .join("\n") +
        "\n"
      : "")
  );
}
export function runReview(mode) {
  if (!["report", "apply"].includes(mode))
    throw new Error("report/applyを指定してください。");
  const mapping = read("docs/migrations/creator-map.json"),
    master = read("data/creators.json"),
    works = read("data/works.json"),
    legacy = loadLegacyCredits(artifact);
  const documents = Object.fromEntries(
    Object.values(GAMES).map((g) => [g.id, read(g.dataFile)]),
  );
  const plan = applyConfirmedCreators(master, works, documents, mapping);
  validateReferenceUpdates(plan.songs, artifact);
  for (const old of legacy)
    for (const role of CREDIT_ROLES)
      if (
        creditText(
          plan.songs.find((s) => `${s.gameId}:${s.id}` === old.reference),
          role,
          plan.master.creators,
        ) !== (old[role] ?? "")
      )
        throw new Error("旧表示が変更されています。");
  const research = fs.existsSync(`${artifact}/creator-research.json`)
    ? read(`${artifact}/creator-research.json`)
    : undefined;
  const report = reviewCreatorCandidates(legacy, plan.songs, mapping, research);
  write(`${artifact}/creator-review.json`, report);
  fs.writeFileSync(`${artifact}/creator-review.md`, markdown(report));
  console.log(
    JSON.stringify(
      {
        mode,
        plannedMasterCount: plan.master.creators.length,
        changedTokens: plan.changed.length,
        warnings: plan.warnings,
        ...report.summary,
      },
      null,
      2,
    ),
  );
  if (mode === "report") return;
  const paths = [
    "data/creators.json",
    "data/works.json",
    ...Object.values(GAMES).map((g) => g.dataFile),
    `${artifact}/credit-report.json`,
    `${artifact}/work-report.json`,
  ];
  const changes = [
    JSON.stringify(master) !== JSON.stringify(plan.master),
    JSON.stringify(works) !== JSON.stringify(plan.works),
    plan.changed.length > 0,
  ];
  if (!changes.some(Boolean)) return;
  const backup = `.cache/creator-phase${mapping.phase ?? 2}-${Date.now()}`;
  for (const p of paths) {
    fs.mkdirSync(path.dirname(`${backup}/${p}`), { recursive: true });
    fs.copyFileSync(p, `${backup}/${p}`);
  }
  write(`${backup}/manifest.json`, {
    beforeHashes: Object.fromEntries(
      paths.map((p) => [
        p,
        crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"),
      ]),
    ),
    changed: plan.changed,
  });
  write("data/creators.json", plan.master);
  write("data/works.json", plan.works);
  for (const g of Object.values(GAMES)) write(g.dataFile, plan.documents[g.id]);
  const oldReport = read(`${artifact}/credit-report.json`);
  oldReport.summary = {
    ...oldReport.summary,
    creators: plan.master.creators.length,
    migratedRecords: plan.songs.filter((s) => s.credits.length).length,
    linkedCreators: plan.master.creators.filter((c) =>
      plan.songs.some((s) => s.credits.some((r) => r.creatorId === c.id)),
    ).length,
    reviewStrings: report.summary.remainingUnidentifiedStrings,
    warnings: plan.warnings,
    originalReviewStrings: 341,
  };
  for (const row of oldReport.entries) {
    const r = report.entries.find(
      (r) => r.original === row.original && r.role === row.role,
    );
    row.parts = r.parts.map((p) => ({
      ...p,
      reviewRequired: !p.creatorId,
      reason: p.creatorId
        ? "明示exact map（既存/ユーザー確認）"
        : "人間確認待ち",
    }));
    row.status = r.status;
    row.reviewRequired = r.status !== "AUTO_RESOLVED";
    row.plannedCreators = [
      ...new Set(r.parts.map((p) => p.creatorId).filter(Boolean)),
    ];
    row.aliasesCandidates = plan.master.creators
      .filter((c) => row.plannedCreators.includes(c.id))
      .flatMap((c) => c.aliases ?? [])
      .filter((a) => a !== row.original);
  }
  write(`${artifact}/credit-report.json`, oldReport);
  const workReport = read(`${artifact}/work-report.json`);
  for (const r of workReport) {
    r.reviewRequired = plan.warnings.some((w) => w.workId === r.workId);
    if (plan.works.works.find((w) => w.id === r.workId)?.creditReview)
      r.creditReview = plan.works.works.find(
        (w) => w.id === r.workId,
      ).creditReview;
  }
  write(`${artifact}/work-report.json`, workReport);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runReview(process.argv[2] ?? "report");
