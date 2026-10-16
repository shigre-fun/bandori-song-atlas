import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { locateJSON, patchCreditFields } from "./credit-field-patch.mjs";
import {
  creditText,
  creditTokens,
  CREDIT_ROLES,
  isCreditSeparator,
} from "../../src/js/credit-display.js";
import { validateCreatorDatabase } from "../../src/js/creators-data.js";
export const REVIEW_DIR = "docs/human-review/creator-credits-p3-2026-10-16";
export const sha = (x) => createHash("sha256").update(x).digest("hex");
export function parseAnswers(text) {
  const result = {
    reviewer: null,
    humanReviewDate: null,
    candidates: [],
    aliases: [],
    splits: [],
    issues: [],
    answeredFields: 0,
  };
  let section = null,
    current = null;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const s = line.match(/^■ (\d+)\./);
    if (s) {
      section = Number(s[1]);
      current = null;
      continue;
    }
    if (section === 3) {
      const h = line.match(/^1\. (.+)$/);
      if (h) {
        current = {
          name: h[1],
          candidateKey: null,
          scopes: [],
          fields: {},
          lines: {},
        };
        result.candidates.push(current);
        continue;
      }
    }
    if (section === 4 || section === 5) {
      const h = line.match(/^## ([AS]\d+)\. (.+)$/);
      if (h) {
        current = { key: h[1], name: h[2], fields: {}, lines: {} };
        result[section === 4 ? "aliases" : "splits"].push(current);
        continue;
      }
    }
    if (current) {
      const key = line.match(/^candidateKey=(.+)$/);
      if (key) {
        current.candidateKey = key[1];
        continue;
      }
      if (section === 4) {
        const id = line.match(/^既存Creator(?: ID|候補)：(cr-\d+)/);
        if (id) {
          current.creatorId = id[1];
          continue;
        }
      }
      if (section === 3 || section === 4) {
        const r = line.match(/^(Garupa|OurNotes):(\d+) (.+)／(.+)$/);
        if (r) {
          current.scopes ??= [];
          for (const label of r[4].split("・")) {
            const role = {
              作詞: "lyricist",
              作曲: "composer",
              編曲: "arranger",
            }[label];
            assert.ok(role, label);
            current.scopes.push({
              game: r[1].toLowerCase(),
              recordId: Number(r[2]),
              title: r[3],
              role,
            });
          }
          continue;
        }
      }
    }
    if (![1, 3, 4, 5].includes(section)) continue;
    const pair = line.match(/^([^=]+)=(.*)$/);
    if (!pair) continue;
    if (
      section === 3 &&
      ![
        "identityConfirmed",
        "samePersonAs",
        "standardName",
        "reading",
        "sortKey",
        "slug",
        "type",
        "aliases",
        "affiliation",
        "備考",
      ].includes(pair[1])
    )
      continue;
    if (section === 1 && !["reviewer", "humanReviewDate"].includes(pair[1]))
      continue;
    if (
      section === 4 &&
      !/^(currentRaw|備考|.+同一|.+formal relation化してよい|.+aliasesへ追加してよい)$/.test(
        pair[1],
      )
    )
      continue;
    if (
      section === 5 &&
      ![
        "currentRaw",
        "分割結果",
        "全体を単一Creatorとして扱う",
        "備考",
      ].includes(pair[1])
    )
      continue;
    const m =
        pair[2].match(/^"([^"\n]*)"$/) ??
        pair[2].match(/^[“”]([^"“”\n]*)["“”]$/) ??
        pair[2].match(/^"([^"“”\n]*)[“”]$/),
      value = m?.[1] || null;
    if (current) {
      current.fields[pair[1]] = value;
      current.lines[pair[1]] = index + 1;
    } else if (
      section === 1 &&
      ["reviewer", "humanReviewDate"].includes(pair[1])
    )
      result[pair[1]] = value;
    if (value && pair[1] !== "currentRaw") result.answeredFields++;
    if (!m)
      result.issues.push({
        section,
        key: current?.candidateKey ?? current?.key,
        field: pair[1],
        literal: pair[2],
        line: index + 1,
      });
  }
  return result;
}
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2) + "\n");
const clone = (x) => structuredClone(x);
const canonical = (t) => t.replaceAll("\r\n", "\n");
const scopeKey = (s) => `${s.game}:${s.recordId}:${s.role}`;
const flat = (t) => JSON.parse(t).groups.flatMap((g) => g.songs);
const fields = [
  "identityConfirmed",
  "samePersonAs",
  "standardName",
  "reading",
  "sortKey",
  "slug",
  "type",
  "aliases",
  "affiliation",
];
const aliasList = (s) =>
  s == null
    ? null
    : s
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(/[;；]/)
        .map((x) => x.trim())
        .filter(Boolean);
export function loadBefore() {
  const baseline = read(REVIEW_DIR + "/baseline.json"),
    bytes = fs.readFileSync(REVIEW_DIR + "/before.json.gz");
  assert.equal(sha(bytes), baseline.fixtureHash);
  assert.equal(
    sha(fs.readFileSync(REVIEW_DIR + "/input.txt")),
    baseline.inputHash,
  );
  const before = JSON.parse(gunzipSync(bytes));
  for (const [p, t] of Object.entries(before.files))
    assert.equal(sha(t), baseline.sourceHashes[p], p);
  return { before, baseline };
}
function entitiesFor(c, overrides) {
  const f = { ...c.fields, ...overrides },
    count = (f.identityConfirmed ?? "").split(/;\s*/).length;
  const values = {};
  for (const key of fields) {
    if (key === "aliases")
      values[key] =
        count === 1 ? [f[key]] : (f[key]?.match(/\[[^\]]*\]/g) ?? []);
    else
      values[key] =
        count === 1
          ? [f[key]]
          : (f[key]?.split(/;\s*/).map((x) => x.trim()) ?? []);
  }
  return Array.from({ length: count }, (_, i) => ({
    uid: c.candidateKey + "#" + i,
    candidateKey: c.candidateKey,
    index: i,
    fields: Object.fromEntries(fields.map((k) => [k, values[k][i] ?? null])),
    notes: f.備考 ?? null,
  }));
}
export function planReview(
  before,
  answers,
  clarification = {},
  allocation = [],
) {
  const files = before.files,
    output = { ...files },
    oldMaster = JSON.parse(files["data/creators.json"]),
    master = clone(oldMaster);
  const records = new Map(
    ["garupa", "ournotes"].flatMap((game) =>
      flat(files[`data/${game}/songs.json`]).map((s) => [`${game}:${s.id}`, s]),
    ),
  );
  const candidates = new Map(
    before.ledger.candidates.map((c) => [c.candidateKey, c]),
  );
  const nodes = answers.candidates.flatMap((c) =>
      entitiesFor(c, clarification.candidates?.[c.candidateKey]),
    ),
    byUid = new Map(nodes.map((e) => [e.uid, e]));
  const held = [],
    conflicts = [],
    stale = [],
    registered = [],
    resolved = new Map(),
    allocationMap = new Map(allocation.map((a) => [a.uid, a]));
  const addHeld = (e, reason) => {
    if (!held.some((x) => x.uid === e.uid && x.reason === reason))
      held.push({
        uid: e.uid,
        candidateKey: e.candidateKey,
        name: e.fields.standardName,
        reason,
      });
    return null;
  };
  // Reuse saved sequential IDs across later clarifications; no renumbering.
  for (const a of allocation) {
    assert.equal(a.creator.id, "cr-" + String(master.nextId).padStart(4, "0"));
    master.creators.push(clone(a.creator));
    master.nextId++;
    registered.push(clone(a));
  }
  const resolving = new Set();
  function resolve(e) {
    if (resolved.has(e.uid)) return resolved.get(e.uid);
    const f = e.fields;
    const missing = fields.filter((k) => !f[k]);
    if (missing.length) return addHeld(e, "Required: " + missing.join(", "));
    if (f.identityConfirmed !== "はい")
      return addHeld(e, "identityConfirmed: " + f.identityConfirmed);
    if (!["person", "unit", "organization"].includes(f.type))
      return addHeld(e, "Invalid type: " + f.type);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug))
      return addHeld(e, "Invalid slug");
    if (resolving.has(e.uid)) return addHeld(e, "Candidate reference cycle");
    resolving.add(e.uid);
    let creator = null;
    const reference = f.samePersonAs.match(
      /^(?:candidate:)?(b1-[a-f0-9]+)(?:の(\d+)人目)?$/,
    );
    if (reference) {
      const target = byUid.get(
        reference[1] + "#" + (Number(reference[2] ?? 1) - 1),
      );
      if (!target) addHeld(e, "Missing candidate reference " + f.samePersonAs);
      else creator = resolve(target);
      if (!creator) addHeld(e, "Referenced Creator unresolved");
      else {
        for (const k of ["standardName", "reading", "sortKey", "slug", "type"])
          if (f[k] !== target.fields[k])
            conflicts.push({
              uid: e.uid,
              reason: "Merged metadata differs: " + k,
            });
        if (!oldMaster.creators.some((c) => c.id === creator.id))
          creator.aliases = [
            ...new Set([...creator.aliases, ...aliasList(f.aliases)]),
          ];
      }
    } else if (/^cr-\d+$/.test(f.samePersonAs)) {
      creator = master.creators.find((c) => c.id === f.samePersonAs) ?? null;
      if (!creator) addHeld(e, "Existing ID does not exist");
    } else if (f.samePersonAs === "既存IDなし") {
      const existing = oldMaster.creators.filter(
        (c) =>
          [c.name, ...(c.aliases ?? [])].includes(f.standardName) ||
          [c.slug, ...(c.previousSlugs ?? [])].includes(f.slug),
      );
      if (existing.length)
        addHeld(
          e,
          "New-ID declaration conflicts with existing " +
            existing.map((c) => c.id).join(", "),
        );
      else if (allocationMap.has(e.uid)) {
        creator = master.creators.find(
          (c) => c.id === allocationMap.get(e.uid).creator.id,
        );
        for (const [field, key] of [
          ["name", "standardName"],
          ["reading", "reading"],
          ["sortKey", "sortKey"],
          ["slug", "slug"],
          ["type", "type"],
        ])
          assert.equal(
            creator[field],
            f[key],
            "Previously allocated metadata changed: " + e.uid + " " + key,
          );
      } else {
        const duplicate = master.creators.find(
          (c) =>
            c.slug === f.slug ||
            c.previousSlugs?.includes(f.slug) ||
            c.name === f.standardName,
        );
        if (duplicate)
          addHeld(e, "New candidate namespace conflict " + duplicate.id);
        else {
          creator = {
            id: "cr-" + String(master.nextId++).padStart(4, "0"),
            name: f.standardName,
            slug: f.slug,
            type: f.type,
            reading: f.reading,
            sortKey: f.sortKey,
            sortKeyStatus: "confirmed",
            aliases: aliasList(f.aliases),
          };
          master.creators.push(creator);
          registered.push({ uid: e.uid, creator });
        }
      }
    } else addHeld(e, "Unrecognized samePersonAs: " + f.samePersonAs);
    resolving.delete(e.uid);
    if (creator) resolved.set(e.uid, creator);
    return creator;
  }
  for (const e of nodes) resolve(e);
  // Only section 4 authorizes adding aliases to existing master entries.
  const aliasChanges = [],
    approvals = new Map(),
    candidateMap = {};
  const addApproval = (scope, data) => {
    const key = scopeKey(scope);
    if (!approvals.has(key))
      approvals.set(key, { ...scope, assignments: [], candidateKeys: [] });
    const r = approvals.get(key);
    r.assignments.push(data);
    if (data.candidateKey && !r.candidateKeys.includes(data.candidateKey))
      r.candidateKeys.push(data.candidateKey);
  };
  for (const c of answers.candidates) {
    const source = candidates.get(c.candidateKey);
    candidateMap[c.candidateKey] = nodes
      .filter((n) => n.candidateKey === c.candidateKey)
      .map((n) => resolved.get(n.uid)?.id ?? null);
    if (!source || source.priority !== "P3") {
      stale.push({
        candidateKey: c.candidateKey,
        reason: "Not a current P3 candidate",
      });
      continue;
    }
    for (const scope of c.scopes) {
      const song = records.get(`${scope.game}:${scope.recordId}`);
      const sourceScope = source.affectedRecords.find(
        (r) =>
          r.game === scope.game &&
          r.recordId === scope.recordId &&
          r.role === scope.role &&
          r.creditContext === "CURRENT_RAW",
      );
      const tasks =
        before.ledger.songs
          .find((s) => s.game === scope.game && s.recordId === scope.recordId)
          ?.tasks.filter(
            (t) =>
              t.role === scope.role &&
              t.priority === "P3" &&
              t.creatorCandidateKey === c.candidateKey,
          ) ?? [];
      if (
        !song ||
        song.title !== scope.title ||
        !sourceScope ||
        !tasks.length
      ) {
        stale.push({
          scope: scopeKey(scope),
          candidateKey: c.candidateKey,
          reason: "Current task/record/role/title not matched",
        });
        continue;
      }
      const ns = nodes.filter((n) => n.candidateKey === c.candidateKey),
        names = [
          c.name,
          ...source.rawVariants,
          ...tasks.map((t) => t.tokenRaw).filter(Boolean),
          ...ns
            .flatMap((n) => [
              n.fields.standardName,
              ...(aliasList(n.fields.aliases) ?? []),
            ])
            .filter(Boolean),
        ];
      addApproval(
        { ...scope, workId: song.workId, raw: song[scope.role] },
        {
          candidateKey: c.candidateKey,
          nodes: ns,
          names,
          taskIds: tasks.map((t) => t.taskId),
        },
      );
    }
  }
  for (const a of answers.aliases) {
    const creator = master.creators.find((c) => c.id === a.creatorId);
    assert.ok(creator, a.key);
    const identity = Object.entries(a.fields).find(([k]) =>
      k.endsWith("同一"),
    )?.[1];
    if (identity !== "はい") continue;
    const aliasApproval = Object.entries(a.fields).find(([k]) =>
      k.endsWith("aliasesへ追加してよい"),
    )?.[1];
    if (
      aliasApproval === "はい" &&
      !creator.aliases.includes(a.fields.currentRaw)
    ) {
      creator.aliases.push(a.fields.currentRaw);
      aliasChanges.push({
        id: creator.id,
        alias: a.fields.currentRaw,
        answer: a.key,
      });
    }
    for (const scope of a.scopes ?? []) {
      const song = records.get(`${scope.game}:${scope.recordId}`);
      const roleLabel = {
        lyricist: "作詞",
        composer: "作曲",
        arranger: "編曲",
      }[scope.role];
      const approved =
        a.fields["既存Creatorへformal relation化してよい"] ??
        Object.entries(a.fields).find(([k]) =>
          k.includes("の" + roleLabel + "をformal relation化してよい"),
        )?.[1];
      if (approved !== "はい") continue;
      const tasks =
        before.ledger.songs
          .find((s) => s.game === scope.game && s.recordId === scope.recordId)
          ?.tasks.filter(
            (t) =>
              t.role === scope.role &&
              t.priority === "P3" &&
              t.category === "ALIAS_REVIEW",
          ) ?? [];
      if (
        !song ||
        song.title !== scope.title ||
        song[scope.role] !== a.fields.currentRaw ||
        !tasks.length
      ) {
        stale.push({
          alias: a.key,
          scope: scopeKey(scope),
          reason: "Alias scope not matched",
        });
        continue;
      }
      addApproval(
        { ...scope, workId: song.workId, raw: song[scope.role] },
        {
          alias: a.key,
          candidateKey: tasks[0].creatorCandidateKey,
          nodes: [],
          creatorId: creator.id,
          names: [a.fields.currentRaw],
          taskIds: tasks.map((t) => t.taskId),
        },
      );
    }
  }
  const splitByScope = new Map();
  for (const s of answers.splits) {
    const scope = s.name.match(
      /^(Garupa|OurNotes):(\d+) (.+)／(作詞|作曲|編曲)$/,
    );
    assert.ok(scope, s.key);
    const role = { 作詞: "lyricist", 作曲: "composer", 編曲: "arranger" }[
      scope[4]
    ];
    const key = `${scope[1].toLowerCase()}:${Number(scope[2])}:${role}`;
    if (
      s.fields.分割結果 &&
      s.fields["全体を単一Creatorとして扱う"] === "いいえ"
    )
      splitByScope.set(key, { ...s, parts: s.fields.分割結果.split(" / ") });
  }
  const patches = { garupa: new Map(), ournotes: new Map() },
    reviews = [];
  for (const r of approvals.values()) {
    const old = records.get(`${r.game}:${r.recordId}`),
      song = clone(patches[r.game].get(r.recordId)?.song ?? old),
      boundary = splitByScope.get(scopeKey(r));
    let parts = clone(song.creditDisplay?.[r.role] ?? []);
    const applied = [];
    function attach(id, text) {
      let rel = song.credits.find((c) => c.creatorId === id);
      if (!rel) {
        rel = { creatorId: id, roles: [r.role] };
        song.credits.push(rel);
      } else if (!rel.roles.includes(r.role)) rel.roles.push(r.role);
      const current =
        rel.displayOverrides?.[r.role] ??
        rel.displayOverride ??
        master.creators.find((c) => c.id === id).name;
      if (current !== text) {
        rel.displayOverrides ??= {};
        rel.displayOverrides[r.role] = text;
      }
      applied.push({ creatorId: id, raw: text });
      return { creatorId: id };
    }
    if (boundary) {
      assert.equal(boundary.fields.currentRaw, r.raw, "Split raw unchanged");
      const assignment = r.assignments.find(
        (a) => a.candidateKey === boundary.candidateKey,
      );
      assert.ok(assignment);
      assert.equal(
        assignment.nodes.length,
        boundary.parts.length,
        "Distinct entity answers match split count",
      );
      const ns = assignment.nodes;
      let cursor = 0;
      const replacement = [];
      boundary.parts.forEach((name, i) => {
        const start = r.raw.indexOf(name, cursor);
        assert.ok(start >= cursor, "Split names occur in order");
        if (start > cursor)
          replacement.push({ text: r.raw.slice(cursor, start) });
        const node = ns[i],
          id = resolved.get(node.uid)?.id;
        assert.ok(
          [
            node.fields.standardName,
            ...(aliasList(node.fields.aliases) ?? []),
          ].includes(name),
          "Split part maps to approved entity",
        );
        replacement.push(
          id ? attach(id, name) : { text: name, unresolved: true },
        );
        cursor = start + name.length;
      });
      if (cursor < r.raw.length)
        replacement.push({ text: r.raw.slice(cursor) });
      parts = replacement;
    } else
      for (const a of r.assignments) {
        if (a.nodes.length > 1) {
          conflicts.push({
            scope: scopeKey(r),
            reason: "Multiple entities without an approved boundary",
          });
          continue;
        }
        const id = a.creatorId ?? resolved.get(a.nodes[0]?.uid)?.id;
        if (!id) continue;
        let found = 0;
        parts = parts.flatMap((p) => {
          if (p.creatorId) return [p];
          if (!p.unresolved) return [p];
          const names = [...new Set(a.names)].sort(
            (a, b) => b.length - a.length,
          );
          for (const name of names) {
            const start = p.text.indexOf(name);
            if (start < 0) continue;
            const pre = p.text.slice(0, start),
              post = p.text.slice(start + name.length);
            if (!isCreditSeparator(pre) || !isCreditSeparator(post)) continue;
            found++;
            return [
              ...(pre ? [{ text: pre }] : []),
              attach(id, name),
              ...(post ? [{ text: post }] : []),
            ];
          }
          return [p];
        });
        if (found !== 1)
          conflicts.push({
            scope: scopeKey(r),
            candidateKey: a.candidateKey,
            reason:
              "Expected one exact unresolved subject token, found " + found,
          });
      }
    song.creditDisplay[r.role] = parts;
    assert.equal(
      creditText(song, r.role, master.creators),
      creditText(old, r.role, oldMaster.creators),
      "Preserve raw display " + scopeKey(r),
    );
    const actors = creditTokens(song, r.role, master.creators)
      .filter((t) => t.creator || t.unresolved)
      .map((t) => ({
        raw: t.text,
        creatorId: t.creator?.id ?? null,
        confidence: t.creator ? "CONFIRMED" : "UNRESOLVED",
        identityKey: t.creator?.id ?? undefined,
      }));
    reviews.push({
      ...r,
      assignments: undefined,
      actors,
      applied,
      splitConfirmed: !!boundary,
      boundary: boundary?.parts ?? null,
      reviewKind: "P3",
      humanReviewId: REVIEW_DIR + "/review.json",
    });
    patches[r.game].set(r.recordId, {
      title: song.title,
      workId: song.workId,
      song,
      fields: { credits: song.credits, creditDisplay: song.creditDisplay },
    });
  }
  // Structural patches retain every byte outside appended creators/approved aliases/credit structures.
  const original = files["data/creators.json"],
    tree = locateJSON(original),
    array = tree.properties.get("creators"),
    edits = [],
    nl = original.includes("\r\n") ? "\r\n" : "\n";
  for (const change of aliasChanges) {
    const index = oldMaster.creators.findIndex((c) => c.id === change.id),
      node = array.children[index].properties.get("aliases");
    assert.ok(node);
    edits.push({
      start: node.start,
      end: node.end,
      text: JSON.stringify(master.creators[index].aliases, null, 2).replaceAll(
        "\n",
        nl + "      ",
      ),
    });
  }
  if (registered.length) {
    const last = array.children.at(-1),
      next = tree.properties.get("nextId");
    edits.push({
      start: last.end,
      end: last.end,
      text: registered
        .map(
          (a) =>
            "," +
            nl +
            "    " +
            JSON.stringify(
              master.creators.find((c) => c.id === a.creator.id),
              null,
              2,
            ).replaceAll("\n", nl + "    "),
        )
        .join(""),
    });
    edits.push({
      start: next.start,
      end: next.end,
      text: String(master.nextId),
    });
  }
  let text = original;
  for (const e of edits.sort((a, b) => b.start - a.start))
    text = text.slice(0, e.start) + e.text + text.slice(e.end);
  output["data/creators.json"] = text;
  for (const game of ["garupa", "ournotes"])
    output[`data/${game}/songs.json`] = patchCreditFields(
      files[`data/${game}/songs.json`],
      patches[game],
    ).text;
  const plan = {
    output,
    registered: registered.map((a) => ({
      uid: a.uid,
      creator: master.creators.find((c) => c.id === a.creator.id),
    })),
    candidateMap,
    entities: nodes,
    held,
    conflicts,
    stale,
    aliasChanges,
    reviews,
    reviewer: answers.reviewer,
    humanReviewDate: answers.humanReviewDate,
  };
  verifyPreservation(before, plan);
  return plan;
}
export function verifyPreservation(before, plan) {
  const master = JSON.parse(plan.output["data/creators.json"]),
    oldMaster = JSON.parse(before.files["data/creators.json"]);
  assert.equal(
    master.creators.length,
    oldMaster.creators.length + plan.registered.length,
  );
  for (const c of oldMaster.creators) {
    const expected = clone(c);
    for (const a of plan.aliasChanges.filter((a) => a.id === c.id))
      expected.aliases = [...new Set([...expected.aliases, a.alias])];
    assert.deepEqual(
      master.creators.find((x) => x.id === c.id),
      expected,
      "Existing master preserved " + c.id,
    );
  }
  const approved = new Set(plan.reviews.map(scopeKey)),
    songs = [];
  for (const [p, t] of Object.entries(before.files)) {
    if (p === "data/creators.json") continue;
    const game = p.match(/^data\/(garupa|ournotes)\/songs\.json$/)?.[1];
    if (!game) {
      assert.equal(plan.output[p], t, "Unrelated data bytes " + p);
      continue;
    }
    const old = flat(t),
      now = flat(plan.output[p]);
    assert.equal(now.length, old.length);
    now.forEach((song, i) => {
      const prev = old[i],
        strip = (s) =>
          Object.fromEntries(
            Object.entries(s).filter(
              ([k]) => !["credits", "creditDisplay"].includes(k),
            ),
          );
      assert.deepEqual(
        strip(song),
        strip(prev),
        "Only credit structures " + game + ":" + song.id,
      );
      for (const role of CREDIT_ROLES) {
        assert.equal(
          creditText(song, role, master.creators),
          creditText(prev, role, oldMaster.creators),
          "All raw displays unchanged",
        );
        const a = creditTokens(song, role, master.creators),
          b = creditTokens(prev, role, oldMaster.creators);
        for (const token of b.filter((t) => t.creator))
          assert.ok(
            a.some(
              (t) =>
                t.creator?.id === token.creator.id && t.text === token.text,
            ),
            "Existing formal participant retained",
          );
        if (!approved.has(`${game}:${song.id}:${role}`)) {
          const tuple = (t) => ({
            text: t.text,
            creatorId: t.creator?.id ?? null,
            unresolved: !!t.unresolved,
          });
          assert.deepEqual(a.map(tuple), b.map(tuple), "Unrelated role kept");
        }
      }
      songs.push({ ...song, gameId: game });
    });
  }
  validateCreatorDatabase(
    master,
    JSON.parse(plan.output["data/works.json"]),
    songs,
  );
}
export function loadExecutionBefore(before) {
  const proofPath = REVIEW_DIR + "/remote-integration.json";
  if (!fs.existsSync(proofPath)) return before;
  const proof = read(proofPath);
  const bytes = fs.readFileSync(REVIEW_DIR + "/remote-inputs.json.gz");
  assert.equal(sha(bytes), proof.fixtureHash, "Pinned remote fixture");
  const remote = JSON.parse(gunzipSync(bytes));
  assert.equal(remote.sha, proof.sha);
  for (const [p, text] of Object.entries(remote.files))
    assert.equal(sha(text), proof.sourceHashes[p], "Pinned remote data " + p);
  assert.deepEqual(
    Object.keys(remote.files).sort(),
    Object.keys(before.files).sort(),
  );
  return { ...before, files: remote.files };
}
export function runReview(mode = "verify") {
  const { before, baseline } = loadBefore(),
    answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8"));
  const clarification = fs.existsSync(REVIEW_DIR + "/clarification.json")
      ? read(REVIEW_DIR + "/clarification.json")
      : {},
    allocation = fs.existsSync(REVIEW_DIR + "/allocation.json")
      ? read(REVIEW_DIR + "/allocation.json")
      : [];
  const executionBefore = loadExecutionBefore(before);
  const plan = planReview(executionBefore, answers, clarification, allocation);
  if (mode === "apply") {
    assert.equal(
      plan.conflicts.length,
      0,
      "Unreconciled scopes " + JSON.stringify(plan.conflicts),
    );
    assert.equal(
      plan.stale.length,
      0,
      "Stale scopes " + JSON.stringify(plan.stale),
    );
    const previous = fs.existsSync(REVIEW_DIR + "/review.json")
      ? read(REVIEW_DIR + "/review.json")
      : null;
    for (const [p, t] of Object.entries(executionBefore.files)) {
      const current = canonical(fs.readFileSync(p, "utf8"));
      assert.ok(
        current === canonical(t) || sha(current) === previous?.dataHashes[p],
        "User edit since reviewed baseline " + p,
      );
    }
    for (const [p, t] of Object.entries(plan.output))
      if (canonical(fs.readFileSync(p, "utf8")) !== canonical(t))
        fs.writeFileSync(p, t);
    const { output, ...receipt } = plan,
      clarificationHash = sha(JSON.stringify(clarification));
    save(REVIEW_DIR + "/allocation.json", plan.registered);
    save(REVIEW_DIR + "/review.json", {
      ...receipt,
      receivedOn: "2026-10-16",
      appliedAt:
        previous?.clarificationHash === clarificationHash
          ? previous.appliedAt
          : new Date().toISOString(),
      inputHash: baseline.inputHash,
      clarificationHash,
      dataHashes: Object.fromEntries(
        Object.keys(before.files).map((p) => [
          p,
          sha(canonical(fs.readFileSync(p, "utf8"))),
        ]),
      ),
    });
  } else
    for (const [p, t] of Object.entries(plan.output))
      assert.equal(
        canonical(fs.readFileSync(p, "utf8")),
        canonical(t),
        "Saved P3 reproduces data " + p,
      );
  for (const [p, h] of Object.entries(baseline.protectedEvidenceHashes))
    assert.equal(sha(fs.readFileSync(p)), h, "Prior evidence immutable " + p);
  return plan;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const p = runReview(process.argv[2] ?? "verify");
  console.log({
    registered: p.registered.length,
    held: p.held,
    conflicts: p.conflicts,
    stale: p.stale,
    reviewedRoles: p.reviews.length,
  });
}
