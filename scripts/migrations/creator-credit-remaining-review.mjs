import fs from "node:fs";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { patchCreditFields, locateJSON } from "./credit-field-patch.mjs";
import {
  creditText,
  creditTokens,
  CREDIT_ROLES,
  isCreditSeparator,
} from "../../src/js/credit-display.js";
import {
  validateCreatorDatabase,
  creditRows,
  selectedCreditData,
} from "../../src/js/creators-data.js";
export const REVIEW_DIR =
  "docs/human-review/creator-credits-remaining-2026-10-21";
export const sha = (x) => createHash("sha256").update(x).digest("hex");
const read = (p) => JSON.parse(fs.readFileSync(p)),
  save = (p, x) => fs.writeFileSync(p, JSON.stringify(x, null, 2) + "\n");
export const loadBefore = () =>
  JSON.parse(gunzipSync(fs.readFileSync(REVIEW_DIR + "/before.json.gz")));
const scope = (t) => t.taskId.split(":").slice(0, 3).join(":"),
  flat = (t) => JSON.parse(t).groups.flatMap((g) => g.songs);
export function quoted(literal) {
  return literal?.match(/^["“”]([^"“”]*)["“”](?:（[^\n]*）)?$/)?.[1] ?? null;
}
const fields = (text) =>
  Object.fromEntries(
    [...text.matchAll(/^([^=\r\n]+)=(.*)$/gm)].map((m) => [
      m[1],
      quoted(m[2].trim()),
    ]),
  );
const aliasList = (s) =>
  s === null
    ? null
    : s
        .replace(/^\[|\]$/g, "")
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean);
export function parseAnswers(text) {
  const blocks = [
    ...text.matchAll(
      /^(B\d{3}|C\d{3}|D\d{2}|E\d{2})｜(.+)\r?\n([\s\S]*?)(?=^(?:B\d{3}|C\d{3}|D\d{2}|E\d{2})｜|^[A-H]\. |$(?![\s\S]))/gm,
    ),
  ].map((m) => ({
    id: m[1],
    name: m[2],
    text: m[3],
    fields: fields(m[3]),
    candidateKey: m[3].match(/^candidateKey: (.+)/m)?.[1]?.trim(),
    taskIds: [
      ...m[3].matchAll(
        /^(?:identityTaskId|registrationTaskId|taskId): ([^\r\n]+)/gm,
      ),
    ].map((t) => t[1].split(" ／ ")[0].trim()),
  }));
  const candidates = blocks.filter((b) => b.id.startsWith("B")),
    aliases = [];
  for (const b of blocks.filter((b) => b.id.startsWith("C")))
    for (const m of b.text.matchAll(
      /^(Garupa|OurNotes):(\d+) 「(.+)」／(?:作詞|作曲|編曲)：token「(.*)」／raw「(.*)」(?:\r?\n)+taskId: ([^\r\n]+)\r?\n([\s\S]*?)(?=^(?:OurNotes|Garupa):|$(?![\s\S]))/gm,
    ))
      aliases.push({
        blockId: b.id,
        creatorId: b.name.match(/cr-\d+/)[0],
        taskId: m[6].split(" ／ ")[0],
        token: m[4],
        raw: m[5],
        title: m[3],
        auto: m[7].includes("完全一致"),
        fields: fields(m[7]),
      });
  const versions = blocks
    .filter((b) => b.id.startsWith("D"))
    .map((b) => ({
      ...b,
      taskId: b.taskIds[0],
      raw: b.text.match(/^game内編曲raw: (.+)/m)?.[1].trim(),
    }));
  const roles = blocks
    .filter((b) => b.id.startsWith("E"))
    .map((b) => ({
      ...b,
      taskId: b.taskIds[0],
      raw: b.text.match(/^現行raw: (.+)/m)?.[1].trim(),
    }));
  const f = text.match(/^F\. ([\s\S]*?)^G\. /m)?.[1] ?? "";
  return {
    reviewer: quoted(text.match(/^reviewer=(.+)$/m)?.[1].trim()),
    humanReviewDate:
      quoted(text.match(/^humanReviewDate=(.*)$/m)?.[1].trim()) || null,
    candidates,
    aliases,
    versions,
    roles,
    split: { taskId: "ournotes:46:arranger:SPLIT_REVIEW", fields: fields(f) },
    answeredFields: [...text.matchAll(/^[^=\r\n]+=(.*)$/gm)].filter((m) =>
      quoted(m[1].trim()),
    ).length,
  };
}
export function planReview(
  before,
  answers,
  clarification = {},
  allocation = [],
) {
  const master = JSON.parse(before.files["data/creators.json"]),
    oldMaster = structuredClone(master),
    games = Object.fromEntries(
      ["garupa", "ournotes"].map((g) => [
        g,
        JSON.parse(before.files[`data/${g}/songs.json`]),
      ]),
    ),
    records = new Map(
      Object.entries(games).flatMap(([game, data]) =>
        data.groups.flatMap((g) =>
          g.songs.map((song) => [`${game}:${song.id}`, song]),
        ),
      ),
    );
  const original = before.previous.records.flatMap((r) =>
      r.tasks.map((t) => ({
        ...t,
        game: r.game,
        recordId: r.recordId,
        title: r.title,
        workId: r.workId,
      })),
    ),
    live = new Map(
      before.ledger.songs.flatMap((r) =>
        r.tasks.map((t) => [
          t.taskId,
          {
            ...t,
            game: r.game,
            recordId: r.recordId,
            title: r.title,
            workId: r.workId,
          },
        ]),
      ),
    );
  assert.equal(original.length, 375);
  const inputIds = [
    ...answers.candidates.flatMap((b) => b.taskIds),
    ...answers.aliases.map((a) => a.taskId),
    ...answers.versions.map((a) => a.taskId),
    ...answers.roles.map((a) => a.taskId),
    answers.split.taskId,
  ];
  assert.equal(inputIds.length, 375);
  assert.equal(new Set(inputIds).size, 375);
  assert.deepEqual([...inputIds].sort(), original.map((t) => t.taskId).sort());
  const stale = [],
    held = [],
    nodes = [],
    resolved = new Map(),
    registered = [],
    approvals = new Map(),
    taskAnswers = new Map(),
    aliasChanges = [],
    metadataChanges = [];
  const addHeld = (uid, reason) => {
    if (!held.some((x) => x.uid === uid && x.reason === reason))
      held.push({ uid, reason });
  };
  const valid = (t) => {
    const c = live.get(t.taskId),
      s = records.get(`${t.game}:${t.recordId}`);
    if (
      !c ||
      !s ||
      s.title !== t.title ||
      s.workId !== t.workId ||
      s[t.role] !== t.raw ||
      c.raw !== t.raw ||
      c.creatorCandidateKey !== t.creatorCandidateKey
    ) {
      stale.push({
        taskId: t.taskId,
        reason:
          "Current task/game/record/role/title/Work/raw/candidate differs",
      });
      return false;
    }
    return true;
  };
  for (const t of original) valid(t);
  for (const b of answers.candidates) {
    for (const id of b.taskIds)
      assert.equal(
        original.find((t) => t.taskId === id).creatorCandidateKey,
        b.candidateKey,
        "Input candidate/task identity",
      );
    for (const m of b.text.matchAll(
      /^(Garupa|OurNotes):(\d+) 「(.+)」／(?:作詞|作曲|編曲) 〔raw：(.+) \/ 主体token:「(.*)」〕\r?\nidentityTaskId: ([^\r\n]+)/gm,
    )) {
      const t = original.find((t) => t.taskId === m[6].trim());
      assert.ok(t);
      assert.equal(t.game, m[1].toLowerCase());
      assert.equal(t.recordId, Number(m[2]));
      assert.ok(
        [m[3], "「" + m[3] + "」"].includes(t.title),
        "Input title quote wrapper",
      );
      assert.equal(t.raw, m[4]);
    }
  }
  const staleIds = new Set(stale.map((x) => x.taskId));
  for (const b of answers.candidates) {
    const f = { ...b.fields, ...clarification.fields?.[b.id] },
      split = ["B047", "B062"].includes(b.id),
      count = split ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const n = {
        uid: b.id + (split ? ":" + i : ""),
        candidateKey: b.candidateKey,
        blockId: b.id,
        fields: Object.fromEntries(
          Object.entries(f).map(([k, v]) => [
            k,
            split &&
            !["identityConfirmed", "備考", "承認から除外する担当"].includes(k)
              ? (v?.split(";").map((x) => x.trim())[i] ?? null)
              : v,
          ]),
        ),
        split,
      };
      if (split)
        n.fields.identityConfirmed =
          f.identityConfirmed === "いいえ" ? "はい" : null;
      nodes.push(n);
    }
  }
  const byKey = new Map();
  for (const n of nodes) {
    if (!byKey.has(n.candidateKey)) byKey.set(n.candidateKey, []);
    byKey.get(n.candidateKey).push(n);
  }
  // IDs already allocated by an earlier pass remain frozen when clarification arrives.
  for (const a of allocation) {
    master.creators.push(structuredClone(a.creator));
    master.nextId = Math.max(master.nextId, Number(a.creator.id.slice(3)) + 1);
    registered.push(structuredClone(a));
  }
  const resolving = new Set();
  function resolve(n) {
    if (resolved.has(n.uid)) return resolved.get(n.uid);
    if (resolving.has(n.uid)) {
      addHeld(n.uid, "Cyclic candidate reference");
      return null;
    }
    resolving.add(n.uid);
    const f = n.fields;
    let c = null;
    const finish = () => {
      resolving.delete(n.uid);
      if (c) resolved.set(n.uid, c);
      return c;
    };
    if (
      f.identityConfirmed !== "はい" ||
      f["対象担当をすべて本人・上記Creatorとして承認"] !== "はい"
    ) {
      addHeld(n.uid, "Identity/role approval incomplete");
      return finish();
    }
    if (n.blockId === "B021" && clarification.kensei !== "register") {
      addHeld(
        n.uid,
        "Identity note contradicts positive answer; awaiting clarification",
      );
      return finish();
    }
    if (n.blockId === "B030" && !clarification.fields?.B030?.affiliation) {
      addHeld(
        n.uid,
        "Affiliation person appears to be a misplaced type; unanswered",
      );
      return finish();
    }
    if (
      ["B072", "B073", "B079", "B080"].includes(n.blockId) &&
      !clarification.mergeDuplicates
    ) {
      addHeld(n.uid, "Duplicate new identity declarations need clarification");
      return finish();
    }
    const ref = f.samePersonAs?.match(
      /^(?:candidate:|candidateKey:\s*)(.+)$/,
    )?.[1];
    if (ref) {
      const target = byKey.get(ref);
      if (target?.length === 1) c = resolve(target[0]);
      else addHeld(n.uid, "Missing/compound candidate reference");
      if (!c) addHeld(n.uid, "Referenced candidate remains unresolved");
      return finish();
    }
    if (/^cr-\d+$/.test(f.samePersonAs ?? "")) {
      c = master.creators.find((x) => x.id === f.samePersonAs);
      if (!c) addHeld(n.uid, "Unknown existing ID");
      return finish();
    }
    if (f.samePersonAs !== "既存IDなし") {
      addHeld(n.uid, "samePersonAs missing/invalid");
      return finish();
    }
    const missing = [
      "standardName",
      "reading",
      "sortKey",
      "slug",
      "type",
      "aliases",
      "affiliation",
    ].filter((k) => !f[k]);
    if (missing.length) {
      addHeld(n.uid, "Required: " + missing.join(", "));
      return finish();
    }
    if (
      !["person", "unit", "organization"].includes(f.type) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)
    ) {
      addHeld(n.uid, "Invalid type/slug");
      return finish();
    }
    const existing = oldMaster.creators.filter(
      (x) =>
        [x.name, ...x.aliases].includes(f.standardName) ||
        [x.slug, ...(x.previousSlugs ?? [])].includes(f.slug),
    );
    if (existing.length) {
      addHeld(
        n.uid,
        "New identity conflicts with existing " + existing.map((x) => x.id),
      );
      return finish();
    }
    const allocated = allocation.find((a) => a.uid === n.uid);
    if (allocated) {
      c = master.creators.find((x) => x.id === allocated.creator.id);
      return finish();
    }
    const duplicate = master.creators.find(
      (x) =>
        x.name === f.standardName ||
        [x.slug, ...(x.previousSlugs ?? [])].includes(f.slug),
    );
    if (duplicate) {
      if (clarification.mergeDuplicates && ["B073", "B080"].includes(n.blockId))
        c = duplicate;
      else addHeld(n.uid, "Duplicate candidate namespace " + duplicate.id);
      return finish();
    }
    c = {
      id: "cr-" + String(master.nextId++).padStart(4, "0"),
      name: f.standardName,
      reading: f.reading,
      sortKey: f.sortKey,
      sortKeyStatus: "confirmed",
      slug: f.slug,
      type: f.type,
      aliases: aliasList(f.aliases),
    };
    master.creators.push(c);
    registered.push({ uid: n.uid, creator: structuredClone(c) });
    return finish();
  }
  for (const n of nodes) resolve(n);
  // The one requested existing slug change retains the old URL history.
  const nayuta = nodes.find((n) => n.blockId === "B045");
  if (resolved.has(nayuta.uid)) {
    const c = resolved.get(nayuta.uid),
      f = nayuta.fields;
    if (c.slug !== f.slug) {
      assert.ok(
        !master.creators.some(
          (x) =>
            x.id !== c.id &&
            [x.slug, ...(x.previousSlugs ?? [])].includes(f.slug),
        ),
      );
      const oldSlug = c.slug;
      c.previousSlugs = [...new Set([...(c.previousSlugs ?? []), oldSlug])];
      c.slug = f.slug;
      metadataChanges.push({ id: c.id, oldSlug, newSlug: c.slug });
    }
  }
  const add = (t, names, ids, extra = {}) => {
    if (staleIds.has(t.taskId)) return;
    const k = scope(t);
    if (!approvals.has(k))
      approvals.set(k, {
        game: t.game,
        recordId: t.recordId,
        role: t.role,
        title: t.title,
        workId: t.workId,
        raw: t.raw,
        assignments: [],
        taskIds: [],
      });
    const r = approvals.get(k);
    r.assignments.push({ names, ids, ...extra });
    r.taskIds.push(t.taskId);
  };
  for (const b of answers.candidates) {
    const ns = byKey.get(b.candidateKey),
      ids = ns.map((n) => resolved.get(n.uid)?.id ?? null),
      f = { ...b.fields, ...clarification.fields?.[b.id] };
    for (const id of b.taskIds) {
      const t = original.find((t) => t.taskId === id);
      if (f["承認から除外する担当"]) {
        addHeld(b.id, "Exclusions supplied: requires explicit matching");
        continue;
      }
      if (ids.some((x) => !x)) continue;
      const variants = [
        ...[
          ...(b.text.match(/^台帳raw表記: (.+)/m)?.[1] ?? "").matchAll(
            /「([^」]+)」/g,
          ),
        ].map((m) => m[1]),
        ...(aliasList(f.aliases) ?? []),
        f.standardName,
        b.name,
        t.tokenRaw,
      ].filter(Boolean);
      const currentParts = creditTokens(
        records.get(`${t.game}:${t.recordId}`),
        t.role,
        oldMaster.creators,
      ).filter((p) => p.unresolved);
      const exact = variants.find((name) =>
        currentParts.some((p) => {
          const index = p.text.indexOf(name);
          return (
            index >= 0 &&
            isCreditSeparator(p.text.slice(0, index)) &&
            isCreditSeparator(p.text.slice(index + name.length))
          );
        }),
      );
      const names =
        ns.length > 1
          ? ns.map((n) => n.fields.standardName)
          : [exact ?? variants[0]];
      add(t, names, ids, {
        compound: ns.length > 1,
        blockId: b.id,
        tokenRaw: t.tokenRaw,
      });
      taskAnswers.set(id, { answer: "はい", blockId: b.id, creatorIds: ids });
    }
  }
  for (const a of answers.aliases) {
    const t = original.find((t) => t.taskId === a.taskId),
      c = master.creators.find((c) => c.id === a.creatorId),
      f = { ...a.fields, ...clarification.tasks?.[a.taskId] };
    assert.equal(a.raw, t.raw);
    assert.equal(a.title, t.title);
    if (a.auto) {
      const hits = oldMaster.creators.filter((c) =>
        [c.name, ...c.aliases].includes(a.token),
      );
      if (hits.length !== 1 || hits[0].id !== a.creatorId) {
        addHeld(a.taskId, "Auto exact match is not unique");
        continue;
      }
    } else if (f["同一Creatorとして当該roleに紐付け"] !== "はい") continue;
    if (
      f.alias追加 === "はい" &&
      c.name !== a.token &&
      !c.aliases.includes(a.token)
    ) {
      const conflicting = master.creators.filter(
        (x) => x.id !== c.id && [x.name, ...x.aliases].includes(a.token),
      );
      if (conflicting.length) {
        addHeld(a.taskId, "Alias namespace conflict");
        continue;
      }
      c.aliases.push(a.token);
      aliasChanges.push({ id: c.id, alias: a.token, taskId: a.taskId });
    }
    add(t, [a.token], [c.id], { auto: a.auto, blockId: a.blockId });
    taskAnswers.set(a.taskId, {
      answer: "はい",
      creatorIds: [c.id],
      automatic: a.auto,
    });
  }
  const versionAnswers = [],
    roleAnswers = [];
  for (const a of answers.versions) {
    const t = original.find((t) => t.taskId === a.taskId);
    assert.equal(a.raw, t.raw);
    const answer =
      clarification.tasks?.[a.taskId]?.sameArrangementAsRelease ??
      a.fields.sameArrangementAsRelease;
    versionAnswers.push({ taskId: a.taskId, answer: answer ?? null });
    if (["はい", "いいえ"].includes(answer)) {
      add(t, [], [], { versionAnswer: answer });
      taskAnswers.set(t.taskId, { answer, kind: "version" });
    }
  }
  for (const a of answers.roles) {
    const t = original.find((t) => t.taskId === a.taskId);
    assert.equal(a.raw, t.raw);
    const answer = a.fields["現行rawとroleを確認"];
    roleAnswers.push({ taskId: a.taskId, answer });
    if (answer === "はい") {
      add(t, [], [], { roleConfirmed: true });
      taskAnswers.set(t.taskId, { answer, kind: "role" });
    }
  }
  const splitAnswer = answers.split.fields["この曲の編曲担当としてsplitを確定"];
  if (splitAnswer === "はい") {
    const t = original.find((t) => t.taskId === answers.split.taskId),
      nor = resolved.get("B006");
    if (nor) {
      assert.equal(
        answers.split.fields["分割結果（原文順）"],
        "Nor / 堀江晶太",
      );
      assert.equal(
        answers.split.fields["全体を単一Creatorとして扱う"],
        "いいえ",
      );
      add(t, ["Nor", "堀江晶太"], [nor.id, "cr-0028"], {
        compound: true,
        splitConfirmed: true,
      });
      taskAnswers.set(t.taskId, {
        answer: "はい",
        kind: "split",
        creatorIds: [nor.id, "cr-0028"],
      });
    }
  }
  const conflicts = [],
    reviews = [],
    patches = { garupa: new Map(), ournotes: new Map() };
  const attach = (song, role, id, text) => {
    let rel = song.credits.find((c) => c.creatorId === id);
    if (!rel) {
      rel = { creatorId: id, roles: [] };
      song.credits.push(rel);
    }
    if (!rel.roles.includes(role)) rel.roles.push(role);
    if (text !== master.creators.find((c) => c.id === id)?.name) {
      rel.displayOverrides ??= {};
      rel.displayOverrides[role] = text;
    }
    return { creatorId: id };
  };
  for (const [k, r] of approvals) {
    const originalSong = records.get(`${r.game}:${r.recordId}`),
      song = structuredClone(originalSong);
    song.credits ??= [];
    song.creditDisplay ??= {};
    let parts = creditTokens(song, r.role, oldMaster.creators).map((t) =>
        t.creator
          ? { creatorId: t.creator.id, text: t.text }
          : { text: t.text, ...(t.unresolved ? { unresolved: true } : {}) },
      ),
      applied = [];
    const assignments = r.assignments.filter((a) => a.ids.length);
    const dedup = [
      ...new Map(
        assignments.map((a) => [JSON.stringify([a.names, a.ids]), a]),
      ).values(),
    ];
    if (dedup.some((a) => a.blockId === "B064")) {
      assert.equal(r.raw, "sabio/高村風太");
      const id = "cr-0071";
      parts = [{ creatorId: id, text: r.raw }];
      attach(song, r.role, id, r.raw);
      applied.push({ creatorId: id, raw: r.raw });
      const c = master.creators.find((c) => c.id === id);
      if (!c.aliases.includes(r.raw)) {
        c.aliases.push(r.raw);
        aliasChanges.push({ id, alias: r.raw, taskId: r.taskIds[0] });
      }
    } else
      for (const a of dedup) {
        for (let i = 0; i < a.ids.length; i++) {
          const name = a.names[i],
            id = a.ids[i];
          let found = 0;
          parts = parts.flatMap((p) => {
            if (p.creatorId) return [p];
            if (!p.unresolved) return [p];
            if (p.text === name) {
              found++;
              return [{ creatorId: id, text: name }];
            }
            const start = p.text.indexOf(name);
            if (start < 0) return [p];
            const pre = p.text.slice(0, start),
              post = p.text.slice(start + name.length);
            const boundary = (x) => !x || isCreditSeparator(x.slice(-1));
            const endBoundary = (x) => !x || isCreditSeparator(x[0]);
            if (!boundary(pre) || !endBoundary(post)) return [p];
            if (
              !a.compound &&
              (!isCreditSeparator(pre) || !isCreditSeparator(post))
            )
              return [p];
            found++;
            return [
              ...(pre
                ? [{ text: pre, unresolved: !isCreditSeparator(pre) }]
                : []),
              { creatorId: id, text: name },
              ...(post
                ? [{ text: post, unresolved: !isCreditSeparator(post) }]
                : []),
            ];
          });
          if (
            found === 0 &&
            parts.some((p) => p.creatorId === id && p.text === name)
          )
            continue;
          if (found !== 1)
            conflicts.push({
              scope: k,
              name,
              reason: "Expected one exact approved subject, found " + found,
            });
        }
      }
    if (conflicts.some((c) => c.scope === k)) continue;
    song.creditDisplay[r.role] = parts.map((p) =>
      p.creatorId
        ? attach(song, r.role, p.creatorId, p.text)
        : { text: p.text, ...(p.unresolved ? { unresolved: true } : {}) },
    );
    for (const p of parts.filter((p) => p.creatorId))
      applied.push({ creatorId: p.creatorId, raw: p.text });
    assert.equal(
      creditText(song, r.role, master.creators),
      creditText(originalSong, r.role, oldMaster.creators),
      "Raw display " + k,
    );
    const existingPatch = patches[r.game].get(r.recordId);
    if (existingPatch) {
      existingPatch.song.credits = song.credits.reduce((all, rel) => {
        const old = all.find((x) => x.creatorId === rel.creatorId);
        if (old) {
          old.roles = [...new Set([...old.roles, ...rel.roles])];
          old.displayOverrides = {
            ...old.displayOverrides,
            ...rel.displayOverrides,
          };
          if (!Object.keys(old.displayOverrides).length)
            delete old.displayOverrides;
        } else all.push(rel);
        return all;
      }, existingPatch.song.credits);
      existingPatch.song.creditDisplay[r.role] = song.creditDisplay[r.role];
      existingPatch.fields = {
        credits: existingPatch.song.credits,
        creditDisplay: existingPatch.song.creditDisplay,
      };
    } else
      patches[r.game].set(r.recordId, {
        title: r.title,
        workId: r.workId,
        song,
        fields: { credits: song.credits, creditDisplay: song.creditDisplay },
      });
    const priorReview = [
      before.input.p3Review,
      before.input.p2Review,
      before.input.humanReview,
    ]
      .map((review) =>
        review?.reviews.find(
          (a) =>
            a.game === r.game &&
            a.recordId === r.recordId &&
            a.role === r.role &&
            a.raw === r.raw,
        ),
      )
      .find(Boolean);
    const version = r.assignments.find((a) => a.versionAnswer)?.versionAnswer,
      actors = creditTokens(song, r.role, master.creators)
        .filter((t) => t.creator || t.unresolved)
        .map((t) => ({
          raw: t.text,
          creatorId: t.creator?.id ?? null,
          identityKey:
            t.creator?.id ??
            priorReview?.actors.find((a) => a.raw === t.text)?.identityKey,
          confidence: t.creator ? "CONFIRMED" : "UNRESOLVED",
        }));
    reviews.push({
      ...r,
      assignments: undefined,
      actors,
      bindings: applied,
      applied,
      reviewKind: "Remaining375",
      humanReviewId: REVIEW_DIR + "/review.json",
      roleConfirmed:
        r.assignments.some((a) => a.roleConfirmed) || dedup.length > 0,
      splitConfirmed: r.assignments.some((a) => a.compound || a.splitConfirmed),
      relationshipAnswer: version ?? null,
      relationshipStatus:
        version === "はい"
          ? "SAME_ARRANGEMENT_CONFIRMED"
          : version === "いいえ"
            ? "DIFFERENT_ARRANGEMENT_CONFIRMED"
            : null,
    });
  }
  for (const game of ["garupa", "ournotes"])
    for (const [id, patch] of patches[game]) {
      const oldSong = records.get(`${game}:${id}`),
        song = patch.song;
      const canonical = selectedCreditData(
        creditRows(song),
        master.creators,
        song,
      );
      song.credits = song.credits.map((rel) =>
        oldSong.credits.some((old) => old.creatorId === rel.creatorId)
          ? rel
          : canonical.credits.find((c) => c.creatorId === rel.creatorId),
      );
      patch.fields = {
        credits: song.credits,
        creditDisplay: song.creditDisplay,
      };
    }
  const output = { "data/creators.json": before.files["data/creators.json"] };
  // Patch existing metadata values and append new entries without rewriting unrelated bytes.
  const text = output["data/creators.json"],
    tree = locateJSON(text),
    arr = tree.properties.get("creators"),
    edits = [],
    nl = text.includes("\r\n") ? "\r\n" : "\n";
  for (let i = 0; i < oldMaster.creators.length; i++) {
    const old = oldMaster.creators[i],
      c = master.creators[i];
    if (JSON.stringify(old) !== JSON.stringify(c))
      edits.push({
        start: arr.children[i].start,
        end: arr.children[i].end,
        value: JSON.stringify(c, null, 2).replaceAll("\n", nl + "    "),
      });
  }
  if (master.creators.length > oldMaster.creators.length) {
    const last = arr.children.at(-1);
    edits.push({
      start: last.end,
      end: last.end,
      value: master.creators
        .slice(oldMaster.creators.length)
        .map(
          (c) =>
            "," +
            nl +
            "    " +
            JSON.stringify(c, null, 2).replaceAll("\n", nl + "    "),
        )
        .join(""),
    });
    const next = tree.properties.get("nextId");
    edits.push({
      start: next.start,
      end: next.end,
      value: String(master.nextId),
    });
  }
  let patched = text;
  for (const e of edits.sort((a, b) => b.start - a.start))
    patched = patched.slice(0, e.start) + e.value + patched.slice(e.end);
  output["data/creators.json"] = patched;
  for (const game of ["garupa", "ournotes"])
    output[`data/${game}/songs.json`] = patchCreditFields(
      before.files[`data/${game}/songs.json`],
      patches[game],
    ).text;
  const validationSongs = ["garupa", "ournotes"].flatMap((g) =>
    flat(output[`data/${g}/songs.json`]).map((s) => ({ ...s, gameId: g })),
  );
  validateCreatorDatabase(
    master,
    JSON.parse(before.files["data/works.json"]),
    validationSongs,
  );
  return {
    output,
    registered,
    held,
    conflicts,
    stale,
    reviews,
    aliasChanges,
    metadataChanges,
    versionAnswers,
    roleAnswers,
    taskAnswers: Object.fromEntries(taskAnswers),
    candidateMap: Object.fromEntries(
      [...byKey].map(([key, ns]) => [
        key,
        ns.map((n) => resolved.get(n.uid)?.id ?? null),
      ]),
    ),
    reviewer: answers.reviewer,
    humanReviewDate: answers.humanReviewDate,
    inputHash: sha(fs.readFileSync(REVIEW_DIR + "/input.txt")),
    sourceType: "人間による明示確認",
    answeredFields: answers.answeredFields,
  };
}
export function verifyPreservation(before, plan) {
  const old = JSON.parse(before.files["data/creators.json"]),
    master = JSON.parse(plan.output["data/creators.json"]);
  for (const [p, h] of Object.entries(before.protectedHashes))
    assert.equal(sha(fs.readFileSync(p)), h, "Prior evidence " + p);
  for (const [p, t] of Object.entries(before.files))
    if (!Object.hasOwn(plan.output, p))
      assert.equal(
        fs.readFileSync(p, "utf8"),
        t,
        "Unrelated source data including Work " + p,
      );
  const stripped = (text) => {
    const data = JSON.parse(text);
    for (const g of data.groups)
      for (const s of g.songs) {
        delete s.credits;
        delete s.creditDisplay;
      }
    return data;
  };
  for (const g of ["garupa", "ournotes"])
    assert.deepEqual(
      stripped(plan.output[`data/${g}/songs.json`]),
      stripped(before.files[`data/${g}/songs.json`]),
      "All group/top-level/non-credit fields " + g,
    );
  const allowed = new Set(
    plan.reviews.map((r) => `${r.game}:${r.recordId}:${r.role}`),
  );
  let rawFields = 0,
    bindings = 0;
  for (const game of ["garupa", "ournotes"]) {
    const prior = flat(before.files[`data/${game}/songs.json`]),
      after = flat(plan.output[`data/${game}/songs.json`]);
    assert.equal(prior.length, after.length);
    for (let i = 0; i < prior.length; i++) {
      const a = prior[i],
        b = after[i];
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
        if (!["credits", "creditDisplay"].includes(key))
          assert.deepEqual(b[key], a[key], game + ":" + a.id + "/" + key);
      for (const role of CREDIT_ROLES) {
        assert.equal(
          creditText(b, role, master.creators),
          creditText(a, role, old.creators),
        );
        rawFields++;
        if (!allowed.has(`${game}:${a.id}:${role}`))
          assert.deepEqual(b.creditDisplay?.[role], a.creditDisplay?.[role]);
        for (const rel of a.credits ?? [])
          if (rel.roles.includes(role))
            assert.ok(
              b.credits.some(
                (r) => r.creatorId === rel.creatorId && r.roles.includes(role),
              ),
            );
        for (const rel of b.credits ?? [])
          if (
            rel.roles.includes(role) &&
            !(a.credits ?? []).some(
              (r) => r.creatorId === rel.creatorId && r.roles.includes(role),
            )
          ) {
            assert.ok(allowed.has(`${game}:${a.id}:${role}`));
            bindings++;
          }
      }
    }
  }
  for (const c of old.creators) {
    const current = master.creators.find((x) => x.id === c.id);
    for (const k of new Set([...Object.keys(c), ...Object.keys(current)]))
      if (
        !(k === "aliases" && plan.aliasChanges.some((a) => a.id === c.id)) &&
        !(
          plan.metadataChanges.some((a) => a.id === c.id) &&
          ["slug", "previousSlugs"].includes(k)
        )
      )
        assert.deepEqual(current[k], c[k], c.id + "/" + k);
    for (const a of c.aliases) assert.ok(current.aliases.includes(a));
  }
  return { rawFields, bindings, WorkChanges: 0, unrelatedChanges: 0 };
}
export function runReview(mode = "verify") {
  const before = loadBefore(),
    answers = parseAnswers(fs.readFileSync(REVIEW_DIR + "/input.txt", "utf8")),
    clarification = fs.existsSync(REVIEW_DIR + "/clarification.json")
      ? read(REVIEW_DIR + "/clarification.json")
      : {},
    allocation = fs.existsSync(REVIEW_DIR + "/allocation.json")
      ? read(REVIEW_DIR + "/allocation.json")
      : [],
    plan = planReview(before, answers, clarification, allocation);
  plan.preservation = verifyPreservation(before, plan);
  assert.equal(plan.conflicts.length, 0, JSON.stringify(plan.conflicts));
  if (mode === "apply") {
    const receipt = fs.existsSync(REVIEW_DIR + "/review.json")
      ? read(REVIEW_DIR + "/review.json")
      : null;
    for (const [p, text] of Object.entries(plan.output)) {
      assert.ok(
        [sha(before.files[p]), receipt?.outputHashes?.[p]].includes(
          sha(fs.readFileSync(p)),
        ),
        "User edit since reviewed base " + p,
      );
      if (fs.readFileSync(p, "utf8") !== text) fs.writeFileSync(p, text);
    }
    save(REVIEW_DIR + "/allocation.json", plan.registered);
    save(REVIEW_DIR + "/parsed-answers.json", answers);
    const record = {
      ...plan,
      output: undefined,
      outputHashes: Object.fromEntries(
        Object.entries(plan.output).map(([p, t]) => [p, sha(t)]),
      ),
      appliedAt: receipt?.appliedAt ?? new Date().toISOString(),
    };
    save(REVIEW_DIR + "/review.json", record);
  } else if (mode === "verify")
    for (const [p, t] of Object.entries(plan.output))
      assert.equal(fs.readFileSync(p, "utf8"), t, p);
  console.log({
    mode,
    registered: plan.registered.length,
    held: plan.held,
    conflicts: plan.conflicts,
    stale: plan.stale,
    roles: plan.reviews.length,
    preservation: plan.preservation,
  });
  return plan;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  runReview(process.argv[2] ?? "verify");
