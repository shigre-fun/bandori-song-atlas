import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { locateJSON, patchCreditFields } from "./credit-field-patch.mjs";
import { creditText, CREDIT_ROLES } from "../../src/js/credit-display.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";

export const REVIEW_DIR = "docs/human-review/creator-credits-p2-2026-10-10";
export const sha = (x) => createHash("sha256").update(x).digest("hex");
export const canonicalText = (text) => text.replaceAll("\r\n", "\n");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2) + "\n");
const roleMap = { 作詞: "lyricist", 作曲: "composer", 編曲: "arranger" };
const ref = (r) => `${r.game}:${r.recordId}:${r.role}`;
const normalized = (x) => x.normalize("NFKC").replace(/\s/g, "");
const flat = (text) => JSON.parse(text).groups.flatMap((g) => g.songs);

export function loadBefore() {
  const baseline = read(REVIEW_DIR + "/baseline.json");
  const bytes = fs.readFileSync(REVIEW_DIR + "/before.json.gz");
  assert.equal(sha(bytes), baseline.fixtureHash, "Immutable snapshot");
  assert.equal(
    sha(fs.readFileSync(REVIEW_DIR + "/input.txt")),
    baseline.inputHash,
    "Immutable input",
  );
  const before = JSON.parse(gunzipSync(bytes));
  for (const [p, t] of Object.entries(before.files))
    assert.equal(sha(t), baseline.sourceHashes[p], p);
  return { baseline, before };
}

export function loadBaseFiles(before) {
  if (!fs.existsSync(REVIEW_DIR + "/remote-integration.json"))
    return before.files;
  const proof = read(REVIEW_DIR + "/remote-integration.json"),
    bytes = fs.readFileSync(REVIEW_DIR + "/remote-inputs.json.gz");
  assert.equal(sha(bytes), proof.fixtureHash, "Immutable remote integration");
  const remote = JSON.parse(gunzipSync(bytes));
  assert.equal(remote.sha, proof.sha);
  for (const [p, t] of Object.entries(remote.files))
    assert.equal(sha(t), proof.sourceHashes[p], p);
  return remote.files;
}

// Accept straight and typographic quote delimiters. Empty or malformed values remain unanswered.
export function parseAnswers(text) {
  const result = {
    reviewer: null,
    humanReviewDate: null,
    collections: [],
    candidates: [],
    roles: [],
    splits: [],
    issues: [],
    answeredFields: 0,
    emptyFields: 0,
  };
  let section = null,
    candidate = null;
  function fields(line, lineNumber) {
    const out = {};
    for (const segment of line.split("；")) {
      const pair = segment.match(/^([^=]+)=(.*)$/);
      if (!pair) continue;
      if (pair[1] === "対象Creator") continue; // Template context, not an answer field.
      const value = pair[2].match(/^["”]([^"”]*)["”]$/);
      out[pair[1]] = value?.[1] || null;
      if (value?.[1] && pair[1] !== "currentRaw") result.answeredFields++;
      else if (value) result.emptyFields++;
      else
        result.issues.push({
          line: lineNumber,
          field: pair[1],
          kind: "MALFORMED_QUOTING",
          literal: pair[2],
        });
    }
    return out;
  }
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    const s = line.match(/^■ ([A-J])\./);
    if (s) {
      section = s[1];
      candidate = null;
      continue;
    }
    if (section === "A" && /^(reviewer|humanReviewDate)=/.test(line))
      Object.assign(result, fields(line, i + 1));
    if (section === "C") {
      const head = line.match(/^## (.+) 〔(b1-[a-f0-9]+)〕$/);
      if (head) {
        candidate = {
          name: head[1],
          candidateKey: head[2],
          entities: [],
          scopes: [],
        };
        result.candidates.push(candidate);
        continue;
      }
      if (candidate && line.startsWith("identityConfirmed="))
        candidate.entities.push({ ...fields(line, i + 1), line: i + 1 });
    }
    const b = line.match(
      /^(Garupa|OurNotes):(\d+) (.+) \[(.+) \/ (wk-\d+)\]：(.*)$/,
    );
    if (section === "B" && b) {
      const f = fields(b[6], i + 1);
      for (const [label, role] of Object.entries(roleMap))
        if (Object.hasOwn(f, label + "者"))
          result.collections.push({
            game: b[1].toLowerCase(),
            recordId: +b[2],
            title: b[3],
            band: b[4],
            workId: b[5],
            role,
            raw: f[label + "者"],
            source: f[label + "根拠"],
            line: i + 1,
          });
    }
    const c = line.match(
      /^(Garupa|OurNotes):(\d+) (.+)／(作詞|作曲|編曲) raw=["”]([^"”]*)["”]：(.*)$/,
    );
    if (section === "C" && c && candidate)
      candidate.scopes.push({
        game: c[1].toLowerCase(),
        recordId: +c[2],
        title: c[3],
        role: roleMap[c[4]],
        token: c[5],
        ...fields(c[6], i + 1),
        line: i + 1,
      });
    const d = line.match(
      /^(Garupa|OurNotes):(\d+) (.+)／(作詞|作曲|編曲) \[taskId=([^\]]+)\]：(.*)$/,
    );
    if (d && ["D", "E"].includes(section))
      (section === "D" ? result.roles : result.splits).push({
        game: d[1].toLowerCase(),
        recordId: +d[2],
        title: d[3],
        role: roleMap[d[4]],
        taskId: d[5],
        ...fields(d[6], i + 1),
        line: i + 1,
      });
  }
  return result;
}

export function planReview(
  files,
  answers,
  before,
  clarification = {},
  allocation = [],
) {
  const output = { ...files },
    master = JSON.parse(files["data/creators.json"]),
    oldMaster = structuredClone(master);
  const candidates = JSON.parse(
    before.artifacts["HUMAN_TODO_BY_CREATOR.json"],
  ).candidates;
  const candidateMap = {},
    registered = [],
    held = [],
    reviews = [],
    stale = [],
    conflicts = [];
  for (const creator of allocation) {
    assert.equal(
      creator.id,
      "cr-" + String(master.nextId++).padStart(4, "0"),
      "Saved allocation order",
    );
    master.creators.push(creator);
    registered.push(creator);
  }
  const entities = [];
  const required = [
    "identityConfirmed",
    "samePersonAs",
    "standardName",
    "reading",
    "sortKey",
    "slug",
    "type",
    "aliases",
    "affiliation",
    "根拠URL・資料",
  ];
  for (const c of answers.candidates) {
    assert.ok(
      candidates.some((x) => x.candidateKey === c.candidateKey),
      "Unknown candidate " + c.candidateKey,
    );
    for (const original of c.entities) {
      const f = { ...original, ...clarification.creators?.[c.candidateKey] };
      if (clarification.existingCreators?.[f.standardName])
        f.samePersonAs = clarification.existingCreators[f.standardName];
      const missing = required.filter((k) => !f[k]);
      if (
        f.type === "person" &&
        f.備考?.includes("ユニット名義") &&
        !clarification.creators?.[c.candidateKey]?.type
      )
        missing.push("type（備考との矛盾）");
      if (missing.length || f.identityConfirmed !== "はい") {
        held.push({
          candidateKey: c.candidateKey,
          name: c.name,
          missing,
          fields: f,
        });
        continue;
      }
      let aliases;
      if (f.aliases === "[]") aliases = [];
      else if (/^\[[^\[\]]+\]$/.test(f.aliases))
        aliases = f.aliases
          .slice(1, -1)
          .split(/[,、]/)
          .map((x) => x.trim().replace(/^"|"$/g, ""));
      else {
        held.push({
          candidateKey: c.candidateKey,
          name: c.name,
          missing: ["aliases syntax"],
          fields: f,
        });
        continue;
      }
      if (f.samePersonAs.startsWith("b1-")) {
        entities.push({
          candidateKey: c.candidateKey,
          f,
          aliases,
          merge: true,
        });
        continue;
      }
      assert.ok(
        f.samePersonAs === "既存IDなし" || /^cr-\d{4}$/.test(f.samePersonAs),
        "Unanswered existing ID",
      );
      let creator =
        f.samePersonAs !== "既存IDなし"
          ? master.creators.find((x) => x.id === f.samePersonAs)
          : master.creators.find((x) => x.slug === f.slug);
      if (creator && f.samePersonAs === "既存IDなし")
        assert.equal(creator.name, f.standardName, "Occupied slug");
      if (
        creator &&
        f.samePersonAs === "既存IDなし" &&
        oldMaster.creators.some((c) => c.id === creator.id)
      ) {
        held.push({
          candidateKey: c.candidateKey,
          name: f.standardName,
          missing: ["既存Creator IDへの明示対応"],
          fields: f,
        });
        continue;
      }
      if (creator && f.samePersonAs === "既存IDなし")
        assert.deepEqual(
          creator,
          {
            id: creator.id,
            name: f.standardName,
            slug: f.slug,
            type: f.type,
            reading: f.reading,
            sortKey: f.sortKey,
            sortKeyStatus: "confirmed",
            aliases,
          },
          "Previously allocated metadata changed",
        );
      if (!creator) {
        assert.equal(f.samePersonAs, "既存IDなし", "Missing existing ID");
        assert.ok(
          !master.creators.some(
            (x) =>
              [x.slug, ...(x.previousSlugs ?? [])].includes(f.slug) ||
              normalized(x.name) === normalized(f.standardName) ||
              x.aliases.some(
                (a) => normalized(a) === normalized(f.standardName),
              ),
          ),
          "Creator identity collision " + f.standardName,
        );
        creator = {
          id: "cr-" + String(master.nextId++).padStart(4, "0"),
          name: f.standardName,
          slug: f.slug,
          type: f.type,
          reading: f.reading,
          sortKey: f.sortKey,
          sortKeyStatus: "confirmed",
          aliases,
        };
        master.creators.push(creator);
        registered.push(creator);
      }
      entities.push({ candidateKey: c.candidateKey, f, aliases, creator });
      (candidateMap[c.candidateKey] ??= []).push(creator.id);
    }
  }
  for (const e of entities.filter((e) => e.merge)) {
    if (!clarification.merges?.[e.candidateKey]) {
      held.push({
        candidateKey: e.candidateKey,
        name: e.f.standardName,
        missing: ["samePersonAs候補と標準名/slugの選択"],
        fields: e.f,
      });
      continue;
    }
    const ids = candidateMap[e.f.samePersonAs];
    assert.equal(ids?.length, 1, "Merge target identity");
    const creator = master.creators.find((c) => c.id === ids[0]);
    assert.ok(
      creator.aliases.includes(e.f.standardName),
      "Explicit reciprocal alias required",
    );
    e.creator = creator;
    candidateMap[e.candidateKey] = ids;
  }
  const oldByRole = new Map(before.tasks.map((t) => [t.taskId, t]));
  const baselineSongs = Object.fromEntries(
    ["garupa", "ournotes"].map((g) => [
      g,
      flat(before.files[`data/${g}/songs.json`]),
    ]),
  );
  const currentSongs = Object.fromEntries(
    ["garupa", "ournotes"].map((g) => [g, flat(files[`data/${g}/songs.json`])]),
  );
  const scopes = new Map();
  const ensure = (a) => {
    const old = baselineSongs[a.game]?.find((s) => s.id === a.recordId),
      song = currentSongs[a.game]?.find((s) => s.id === a.recordId);
    if (
      !song ||
      !old ||
      song.title !== a.title ||
      old.title !== a.title ||
      song.workId !== old.workId
    ) {
      stale.push({ ...a, reason: "record/title/Work changed" });
      return null;
    }
    const key = ref(a);
    if (!scopes.has(key))
      scopes.set(key, {
        game: a.game,
        recordId: a.recordId,
        title: a.title,
        workId: song.workId,
        role: a.role,
        raw: old[a.role] ?? creditText(old, a.role, oldMaster.creators),
        bindings: [],
        boundary: null,
        roleConfirmed: false,
        evidence: [],
        candidateKeys: [],
      });
    return scopes.get(key);
  };
  function addBinding(scope, token, id, source) {
    if (!id) return;
    const creator = master.creators.find((c) => c.id === id);
    assert.ok(creator, "Unknown ID " + id);
    const old = scope.bindings.find((b) => b.token === token);
    if (old) assert.equal(old.creatorId, id, "Conflicting scoped identity");
    else scope.bindings.push({ token, creatorId: id, source });
  }
  // Collection raw only, never map a newly collected name automatically.
  for (const a of answers.collections) {
    if (!a.raw || ["不明", "保留"].includes(a.raw)) continue;
    const s = ensure(a);
    if (!s) continue;
    if (a.workId !== s.workId && !clarification.workScopes?.[ref(a)]) {
      stale.push({ ...a, reason: "input Work differs from current" });
      scopes.delete(ref(a));
      continue;
    }
    s.raw = a.raw === "欄なし" ? null : a.raw;
    s.collection = true;
    s.evidence.push({ section: "B", line: a.line, source: a.source });
  }
  for (const c of answers.candidates)
    for (const a of c.scopes) {
      if (
        a["上記Creatorと同一"] !== "はい" ||
        a["formal relation化"] !== "はい"
      )
        continue;
      const old = candidates.find((x) => x.candidateKey === c.candidateKey);
      assert.ok(
        old.affectedRecords.some(
          (r) =>
            r.game === a.game &&
            r.recordId === a.recordId &&
            r.role === a.role &&
            normalized(r.raw) === normalized(a.token),
        ),
        "Unknown identity scope " + ref(a),
      );
      const s = ensure(a);
      if (!s) continue;
      s.candidateKeys.push(c.candidateKey);
      const es = entities.filter(
        (e) => e.candidateKey === c.candidateKey && e.creator,
      );
      if (es.length === 1)
        addBinding(s, a.token, es[0].creator.id, {
          section: "C",
          line: a.line,
        });
      else if (es.length > 1) {
        s.boundary = es.map((e) => e.f.standardName);
        for (const e of es)
          addBinding(s, e.f.standardName, e.creator.id, {
            section: "C",
            line: a.line,
            multipleSubjects: true,
          });
      }
    }
  for (const a of answers.roles) {
    const task = oldByRole.get(a.taskId);
    assert.ok(task, "Unknown P2 role task " + a.taskId);
    assert.equal(ref(task), ref(a));
    if (
      a["このrole/表記を確認した"] !== "はい" ||
      a["formal relation/既存Creator対応を適用してよい"] !== "はい"
    )
      continue;
    const s = ensure(a);
    if (!s) continue;
    const raw = clarification.raw?.[ref(a)] ?? a["確認したcredit原文"];
    if (raw) {
      if (s.collection && s.raw !== raw && !clarification.raw?.[ref(a)]) {
        conflicts.push({
          key: ref(a),
          collection: s.raw,
          role: raw,
          line: a.line,
        });
        continue;
      }
      s.raw = raw;
    }
    s.roleConfirmed = true;
    s.evidence.push({ section: "D", line: a.line, source: a.根拠 });
    const token = a.currentRaw?.match(/主体token:「(.+)」/)?.[1] ?? s.raw;
    const oldCandidate = candidates.find(
      (c) => c.candidateKey === task.creatorCandidateKey,
    );
    const explicitId = oldCandidate?.confirmedExistingCreatorId;
    const ids = candidateMap[task.creatorCandidateKey];
    if (explicitId)
      addBinding(s, token, explicitId, { section: "D", line: a.line });
    else if (ids?.length === 1)
      addBinding(s, token, ids[0], { section: "D", line: a.line });
    else if (!task.creatorCandidateKey) {
      // D explicitly approves this role and existing Creator correspondence.
      // Names are matched only within this approved field, never globally.
      const matches = master.creators.filter((c) =>
        [c.name, ...c.aliases].some(
          (n) => normalized(n) === normalized(s.raw ?? ""),
        ),
      );
      if (matches.length === 1)
        addBinding(s, s.raw, matches[0].id, { section: "D", line: a.line });
    }
  }
  for (const a of answers.splits) {
    assert.ok(oldByRole.has(a.taskId), "Unknown P2 split task " + a.taskId);
    const s = ensure(a);
    if (!s) continue;
    if (!a.currentRaw || normalized(a.currentRaw) !== normalized(s.raw)) {
      stale.push({ ...a, reason: "split raw differs" });
      continue;
    }
    if (
      !a["分割結果"] ||
      a["順序は原文どおりでよい"] !== "はい" ||
      !["はい", "いいえ"].includes(a["全体を単一Creatorとして扱う"])
    )
      continue;
    s.boundary = a["分割結果"].split(" / ");
    s.splitConfirmed = true;
    s.evidence.push({ section: "E", line: a.line, source: a.根拠 });
    const mappings = (a["各部分のCreator対応"] ?? "")
      .split(/[;、]/)
      .map((x) => x.trim())
      .map((x) => x.match(/^(.+)=([^=]+)$/))
      .filter(Boolean);
    for (const [, token, value] of mappings) {
      assert.ok(
        s.boundary.includes(token),
        "Mapping outside approved boundary",
      );
      const ids = value.startsWith("cr-") ? [value] : candidateMap[value];
      if (ids?.length === 1)
        addBinding(s, token, ids[0], { section: "E", line: a.line });
    }
  }
  // Preserve existing Creator bytes and append only the approved identities.
  if (registered.length) {
    const text = files["data/creators.json"],
      root = locateJSON(text),
      next = root.properties.get("nextId"),
      last = root.properties.get("creators").children.at(-1),
      nl = text.includes("\r\n") ? "\r\n" : "\n";
    const addition = registered
      .map(
        (c) =>
          "," +
          nl +
          "    " +
          JSON.stringify(c, null, 2).replaceAll("\n", nl + "    "),
      )
      .join("");
    output["data/creators.json"] =
      text.slice(0, last.end) + addition + text.slice(last.end);
    output["data/creators.json"] =
      output["data/creators.json"].slice(0, next.start) +
      String(master.nextId) +
      output["data/creators.json"].slice(next.end);
  }
  const patches = { garupa: new Map(), ournotes: new Map() };
  for (const s of scopes.values()) {
    if (conflicts.some((c) => c.key === ref(s))) continue;
    const old = baselineSongs[s.game].find((x) => x.id === s.recordId),
      current = currentSongs[s.game].find((x) => x.id === s.recordId);
    const song = structuredClone(
      patches[s.game].get(s.recordId)?.song ?? current,
    );
    const raw = s.raw;
    if (raw == null) {
      s.actors = [];
      continue;
    } // Field absence must not be guessed into a human value.
    for (const p of (old.creditDisplay?.[s.role] ?? []).filter(
      (p) => p.creatorId,
    )) {
      const relation = old.credits.find((c) => c.creatorId === p.creatorId);
      const token =
        relation.displayOverrides?.[s.role] ??
        oldMaster.creators.find((c) => c.id === p.creatorId).name;
      if (raw.includes(token))
        addBinding(s, token, p.creatorId, { section: "EXISTING_FORMAL" });
    }
    const previousParts = old.creditDisplay?.[s.role] ?? [];
    const boundary =
      s.boundary ??
      (raw === old[s.role] && previousParts.length > 1
        ? previousParts
            .filter((p) => p.creatorId || p.unresolved)
            .map(
              (p) =>
                p.text ??
                old.credits.find((c) => c.creatorId === p.creatorId)
                  ?.displayOverrides?.[s.role] ??
                oldMaster.creators.find((c) => c.id === p.creatorId)?.name,
            )
        : [raw]);
    // Explicit split parts must occur in the raw in order. Name-internal punctuation stays in each part.
    let cursor = 0,
      parts = [],
      actors = [];
    for (const token of boundary) {
      const start = raw.indexOf(token, cursor);
      assert.ok(
        start >= cursor,
        "Approved token absent from raw " + ref(s) + " / " + token,
      );
      if (start > cursor) parts.push({ text: raw.slice(cursor, start) });
      let binding = s.bindings.find((b) => b.token === token);
      if (!binding)
        binding = s.bindings.find(
          (b) => normalized(b.token) === normalized(token),
        );
      if (
        !binding &&
        boundary.length === 1 &&
        s.bindings.length === 1 &&
        normalized(s.bindings[0].token) === normalized(token)
      )
        binding = s.bindings[0];
      // For an unreviewed boundary, locate explicitly approved C token spans within raw.
      if (
        !s.boundary &&
        boundary.length === 1 &&
        !binding &&
        s.bindings.length
      ) {
        const sorted = s.bindings
          .map((b) => ({ ...b, start: raw.indexOf(b.token) }))
          .sort((a, b) => a.start - b.start);
        let offset = 0;
        for (const b of sorted) {
          assert.ok(b.start >= offset, "Ambiguous approved token span");
          if (b.start > offset)
            parts.push({ text: raw.slice(offset, b.start), unresolved: true });
          parts.push({ creatorId: b.creatorId });
          actors.push({
            raw: b.token,
            creatorId: b.creatorId,
            confidence: "CONFIRMED",
          });
          offset = b.start + b.token.length;
        }
        if (offset < raw.length)
          parts.push({ text: raw.slice(offset), unresolved: true });
        cursor = raw.length;
        break;
      }
      if (binding) {
        parts.push({ creatorId: binding.creatorId });
        actors.push({
          raw: token,
          creatorId: binding.creatorId,
          confidence: "CONFIRMED",
        });
      } else {
        parts.push({ text: token, unresolved: true });
        const original = candidates.find((c) =>
          c.affectedRecords.some(
            (a) =>
              a.game === s.game &&
              a.recordId === s.recordId &&
              a.role === s.role &&
              normalized(a.raw) === normalized(token),
          ),
        );
        actors.push({
          raw: token,
          identityKey: original?.candidateKey,
          confidence: "UNRESOLVED",
        });
      }
      cursor = start + token.length;
    }
    if (cursor < raw.length)
      parts.push({ text: raw.slice(cursor), unresolved: true });
    // Existing formal role references may not be removed by a partial human answer.
    for (const previous of (old.creditDisplay?.[s.role] ?? []).filter(
      (p) => p.creatorId,
    ))
      if (!parts.some((p) => p.creatorId === previous.creatorId)) {
        const relation = old.credits.find(
            (c) => c.creatorId === previous.creatorId,
          ),
          name =
            relation.displayOverrides?.[s.role] ??
            oldMaster.creators.find((c) => c.id === previous.creatorId).name;
        const index = parts.findIndex((p) => p.unresolved && p.text === name);
        assert.ok(
          index >= 0,
          "Existing formal credit would be removed " + ref(s),
        );
        parts[index] = { creatorId: previous.creatorId };
      }
    for (const actor of actors.filter((a) => a.creatorId)) {
      let relation = song.credits.find((c) => c.creatorId === actor.creatorId);
      if (!relation) {
        relation = { creatorId: actor.creatorId, roles: [] };
        song.credits.push(relation);
      }
      if (!relation.roles.includes(s.role)) relation.roles.push(s.role);
      relation.displayOverrides ??= {};
      relation.displayOverrides[s.role] = actor.raw;
    }
    song[s.role] = raw;
    song.creditDisplay[s.role] = parts;
    assert.equal(
      creditText(song, s.role, master.creators),
      raw,
      "Display preservation",
    );
    const fields = Object.fromEntries(
      [s.role, "credits", "creditDisplay"].map((k) => [k, song[k]]),
    );
    const existing = patches[s.game].get(s.recordId);
    patches[s.game].set(s.recordId, {
      title: song.title,
      workId: song.workId,
      fields: { ...existing?.fields, ...fields },
      song,
    });
    reviews.push({
      ...s,
      actors,
      splitStatus:
        s.splitConfirmed || s.boundary
          ? "HUMAN_BOUNDARY_CONFIRMED"
          : "HUMAN_RAW_CONFIRMED",
      humanReviewId: REVIEW_DIR + "/review.json",
      reviewKind: "P2",
    });
  }
  for (const game of ["garupa", "ournotes"])
    output[`data/${game}/songs.json`] = patchCreditFields(
      files[`data/${game}/songs.json`],
      patches[game],
    ).text;
  const plan = {
    output,
    candidateMap,
    registered,
    held,
    reviews,
    stale,
    conflicts,
  };
  verifyPreservation(files, output, plan);
  return plan;
}

export function verifyPreservation(before, after, plan) {
  for (const p of Object.keys(before))
    if (
      ![
        "data/creators.json",
        "data/garupa/songs.json",
        "data/ournotes/songs.json",
      ].includes(p)
    )
      assert.equal(
        canonicalText(after[p]),
        canonicalText(before[p]),
        "Unrelated file (Git EOL only) " + p,
      );
  const b = JSON.parse(before["data/creators.json"]),
    a = JSON.parse(after["data/creators.json"]);
  assert.deepEqual(
    a.creators.slice(0, b.creators.length),
    b.creators,
    "Previous Creator metadata",
  );
  assert.equal(
    a.creators.length - b.creators.length,
    a.nextId - b.nextId,
    "Dynamic allocator",
  );
  const reviewByRole = new Map(plan.reviews.map((r) => [ref(r), r]));
  for (const game of ["garupa", "ournotes"]) {
    const old = JSON.parse(before[`data/${game}/songs.json`]),
      now = JSON.parse(after[`data/${game}/songs.json`]);
    const stripped = (x) => ({
      ...x,
      groups: x.groups.map((g) => ({
        ...g,
        songs: g.songs.map((s) =>
          Object.fromEntries(
            Object.entries(s).filter(
              ([k]) =>
                !CREDIT_ROLES.includes(k) &&
                !["credits", "creditDisplay"].includes(k),
            ),
          ),
        ),
      })),
    });
    assert.deepEqual(
      stripped(now),
      stripped(old),
      "All non-credit fields and Work identity",
    );
    const previous = new Map(
      old.groups.flatMap((g) => g.songs).map((s) => [s.id, s]),
    );
    for (const song of now.groups.flatMap((g) => g.songs))
      for (const role of CREDIT_ROLES) {
        const prev = previous.get(song.id),
          r = reviewByRole.get(ref({ game, recordId: song.id, role }));
        if (!r) {
          assert.equal(song[role], prev[role], "Unrelated raw");
          assert.deepEqual(
            song.creditDisplay[role],
            prev.creditDisplay[role],
            "Unrelated display",
          );
          assert.deepEqual(
            song.credits
              .filter((c) => c.roles.includes(role))
              .map((c) => ({
                id: c.creatorId,
                override: c.displayOverrides?.[role],
              })),
            prev.credits
              .filter((c) => c.roles.includes(role))
              .map((c) => ({
                id: c.creatorId,
                override: c.displayOverrides?.[role],
              })),
            "Unrelated relation",
          );
        } else {
          assert.equal(song[role], r.raw);
          assert.equal(creditText(song, role, a.creators), r.raw);
          for (const c of prev.credits.filter((c) => c.roles.includes(role)))
            assert.ok(
              song.credits.some(
                (n) => n.creatorId === c.creatorId && n.roles.includes(role),
              ),
              "P0/P1 retained",
            );
        }
        if (r)
          assert.deepEqual(
            new Set(
              song.credits
                .filter((c) => c.roles.includes(role))
                .map((c) => c.creatorId),
            ),
            new Set([
              ...r.actors.filter((a) => a.creatorId).map((a) => a.creatorId),
              ...prev.credits
                .filter((c) => c.roles.includes(role))
                .map((c) => c.creatorId),
            ]),
            "Only approved bindings",
          );
      }
  }
  validateCreatorDatabase(
    a,
    JSON.parse(after["data/works.json"]),
    ["garupa", "ournotes"].flatMap((g) =>
      flat(after[`data/${g}/songs.json`]).map((s) => ({ ...s, gameId: g })),
    ),
  );
}

export function runReview(mode = "verify") {
  const { baseline, before } = loadBefore(),
    answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8"));
  const clarification = fs.existsSync(REVIEW_DIR + "/clarification.json")
    ? read(REVIEW_DIR + "/clarification.json")
    : {};
  const allocation = fs.existsSync(REVIEW_DIR + "/allocation.json")
    ? read(REVIEW_DIR + "/allocation.json")
    : [];
  const baseFiles = loadBaseFiles(before);
  const plan = planReview(
    baseFiles,
    answers,
    before,
    clarification,
    allocation,
  );
  if (mode === "apply") {
    const current = Object.fromEntries(
      Object.keys(before.files).map((p) => [p, fs.readFileSync(p, "utf8")]),
    );
    if (
      Object.entries(current).some(
        ([p, t]) =>
          canonicalText(t) !== canonicalText(baseFiles[p]) &&
          canonicalText(t) !== canonicalText(plan.output[p]),
      )
    ) {
      assert.ok(
        fs.existsSync(REVIEW_DIR + "/review.json"),
        "Current data changed",
      );
      const previous = read(REVIEW_DIR + "/review.json");
      verifyPreservation(baseFiles, current, previous);
      assert.deepEqual(
        JSON.parse(current["data/creators.json"]).creators.slice(
          JSON.parse(before.files["data/creators.json"]).creators.length,
        ),
        previous.registered,
        "Prior approved allocation",
      );
    }
    for (const [p, t] of Object.entries(plan.output))
      if (canonicalText(fs.readFileSync(p, "utf8")) !== canonicalText(t))
        fs.writeFileSync(p, t);
    const { output, ...receipt } = plan;
    save(REVIEW_DIR + "/review.json", {
      status: "APPLIED",
      inputHash: baseline.inputHash,
      clarificationHash: sha(JSON.stringify(clarification)),
      answers,
      ...receipt,
    });
    save(REVIEW_DIR + "/allocation.json", plan.registered);
  } else
    for (const [p, t] of Object.entries(plan.output))
      assert.equal(
        canonicalText(fs.readFileSync(p, "utf8")),
        canonicalText(t),
        "Reproduce from saved review (Git EOL filter only): " + p,
      );
  for (const [p, h] of Object.entries(baseline.protectedEvidenceHashes))
    assert.equal(sha(fs.readFileSync(p)), h, "Prior evidence retained " + p);
  return plan;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const p = runReview(process.argv[2]);
  console.log(
    JSON.stringify(
      {
        registered: p.registered.length,
        held: p.held,
        reviewedRoles: p.reviews.length,
        conflicts: p.conflicts,
        stale: p.stale,
      },
      null,
      2,
    ),
  );
}
