import { CREDIT_ROLES, creditTokens, creditText } from "./credit-display.js";
import { validateCreditStructure } from "./credit-structure.js";
import { roleCoverage } from "./credit-coverage.js";
export {
  CREDIT_ROLES,
  ROLE_LABELS,
  creditTokens,
  creditText,
} from "./credit-display.js";
export { validateCreditStructure } from "./credit-structure.js";
export const CREATOR_TYPES = {
  person: "個人",
  organization: "制作組織",
  unit: "ユニット",
};
export const CREATORS_PATH = "data/creators.json";
export const WORKS_PATH = "data/works.json";
const fail = (message) => {
  throw new Error(message);
};
const nonempty = (value, limit = 500) =>
  typeof value === "string" && !!value.trim() && value.length <= limit;

export function validateCreators(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.creators))
    fail("Creator masterの形式が不正です。");
  roleCoverage(data.roleCoverage);
  const ids = new Set(),
    slugs = new Set();
  for (const c of data.creators) {
    if (!c || !/^cr-[0-9]{4,}$/.test(c.id) || ids.has(c.id))
      fail("Creator idが不正または重複しています。");
    if (
      !nonempty(c.slug, 100) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug) ||
      slugs.has(c.slug)
    )
      fail("Creator slugが不正または重複しています。");
    if (!nonempty(c.name) || !nonempty(c.sortKey))
      fail("Creator nameとsortKeyは必須です。");
    if (!Object.hasOwn(CREATOR_TYPES, c.type)) fail("Creator typeが不正です。");
    if (
      c.aliases !== undefined &&
      (!Array.isArray(c.aliases) ||
        c.aliases.length > 100 ||
        c.aliases.some((a) => !nonempty(a)) ||
        new Set(c.aliases).size !== c.aliases.length)
    )
      fail("Creator aliasesが不正です。");
    if (
      c.previousSlugs !== undefined &&
      (!Array.isArray(c.previousSlugs) ||
        c.previousSlugs.length > 100 ||
        c.previousSlugs.some(
          (slug) =>
            !nonempty(slug, 100) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
        ))
    )
      fail("Creator previousSlugsが不正です。");
    for (const slug of [c.slug, ...(c.previousSlugs ?? [])]) {
      if (slugs.has(slug))
        fail(
          "Creator current/previous slugが重複しています。旧slugは再利用できません。",
        );
      slugs.add(slug);
    }
    ids.add(c.id);
  }
  if (
    !Number.isSafeInteger(data.nextId) ||
    data.nextId <=
      Math.max(0, ...data.creators.map((c) => Number(c.id.slice(3))))
  )
    fail("Creator nextIdが不正です。");
  return data;
}
export function validateWorks(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.works))
    fail("Work masterの形式が不正です。");
  const ids = new Set();
  for (const w of data.works) {
    if (
      !w ||
      !/^wk-[0-9]{4,}$/.test(w.id) ||
      ids.has(w.id) ||
      !nonempty(w.title)
    )
      fail("Work idが不正/重複、またはtitleが空欄です。");
    ids.add(w.id);
  }
  if (
    !Number.isSafeInteger(data.nextId) ||
    data.nextId <= Math.max(0, ...data.works.map((w) => Number(w.id.slice(3))))
  )
    fail("Work nextIdが不正です。");
  return data;
}
export function creatorRedirects(data) {
  validateCreators(data);
  return data.creators.flatMap((c) =>
    (c.previousSlugs ?? []).map((slug) => ({
      creatorId: c.id,
      from: `/creators/${slug}/`,
      to: `/creators/${c.slug}/`,
    })),
  );
}
export function validateCreatorDatabase(creatorData, workData, songs) {
  validateCreators(creatorData);
  validateWorks(workData);
  const ids = new Set(creatorData.creators.map((c) => c.id)),
    workIds = new Set(workData.works.map((w) => w.id));
  const references = new Map(),
    members = new Map(),
    warnings = [];
  for (const s of songs) {
    const key = `${s.gameId}:${s.id}`;
    if (references.has(key)) fail(`同一ゲームレコードが重複しています: ${key}`);
    references.set(key, s);
    if (!workIds.has(s.workId)) fail(`存在しないworkId: ${key} ${s.workId}`);
    validateCreditStructure(s);
    for (const c of s.credits)
      if (!ids.has(c.creatorId))
        fail(`存在しないcreatorId: ${key} ${c.creatorId}`);
    for (const role of CREDIT_ROLES)
      if (creditText(s, role, creatorData.creators) !== (s[role] ?? ""))
        fail(`クレジット表示不一致: ${key} ${role}`);
    if (!members.has(s.workId)) members.set(s.workId, []);
    members.get(s.workId).push(s);
  }
  for (const s of songs)
    for (const ref of s.relatedSongIds ?? []) {
      const target = references.get(ref);
      if (
        !target ||
        !(target.relatedSongIds ?? []).includes(`${s.gameId}:${s.id}`)
      )
        fail(`関連楽曲の相互参照が不正です: ${ref}`);
      if (s.workId !== target.workId)
        fail(
          `既存ゲーム間リンクとworkIdが不一致です: ${s.gameId}:${s.id} ${ref}`,
        );
    }
  for (const [workId, records] of members)
    for (const role of CREDIT_ROLES) {
      // Missing identities do not assert a different author. Arrangements belong to individual performances.
      if (typeof creatorData.roleCoverage?.[role] === "object") {
        const known = records.filter(
          (s) =>
            s.credits.some((c) => c.roles.includes(role)) &&
            !s.creditDisplay[role]?.some((p) => p.unresolved),
        );
        const partitions = new Map();
        for (const s of known) {
          const key =
            role === "arranger" ? JSON.stringify([s.gameId, s.band]) : "work";
          if (!partitions.has(key)) partitions.set(key, []);
          partitions.get(key).push(s);
        }
        for (const subset of partitions.values()) {
          const ids = subset.map((s) =>
            s.credits
              .filter((c) => c.roles.includes(role))
              .map((c) => c.creatorId)
              .sort()
              .join(","),
          );
          if (new Set(ids).size > 1)
            warnings.push({
              workId,
              role,
              records: subset.map((s) => s.gameId + ":" + s.id),
              reason:
                "同じ作品・担当の確定Creatorに差異があります。編曲は同じゲームと演奏バンドの収録間で比較しています。",
            });
        }
        continue;
      }
      const signatures = records.map((s) =>
        s.credits
          .filter((c) => c.roles.includes(role))
          .map((c) => c.creatorId)
          .sort()
          .join(","),
      );
      // Different overrides are expected once every displayed name has a confirmed ID.
      const hasUnresolved = records.some((s) =>
        s.creditDisplay[role]?.some((p) => p.unresolved),
      );
      const raw = records.map((s) => creditText(s, role, creatorData.creators));
      if (
        new Set(signatures).size > 1 ||
        (hasUnresolved && new Set(raw.filter(Boolean)).size > 1)
      )
        warnings.push({
          workId,
          role,
          records: records.map((s) => `${s.gameId}:${s.id}`),
          reason:
            "同一Workのcredit/表示に差異があります。記録別情報を保持し、統一していません。",
        });
    }
  return { warnings, members };
}
export function searchCreators(creators, query = "") {
  const key = query.normalize("NFKC").toLocaleLowerCase("ja").trim();
  return creators.filter((c) =>
    [c.name, c.sortKey, c.slug, ...(c.aliases ?? [])].some((v) =>
      v.normalize("NFKC").toLocaleLowerCase("ja").includes(key),
    ),
  );
}
export function creatorParticipation(creatorId, songs) {
  const works = new Map();
  let recordings = 0;
  for (const s of songs) {
    const relation = (s.credits ?? []).find((c) => c.creatorId === creatorId);
    if (!relation) continue;
    recordings++;
    if (!works.has(s.workId))
      works.set(s.workId, { workId: s.workId, roles: new Set(), records: [] });
    const w = works.get(s.workId);
    relation.roles.forEach((r) => w.roles.add(r));
    w.records.push(s);
  }
  return {
    works: [...works.values()].map((w) => ({ ...w, roles: [...w.roles] })),
    recordings,
    total: works.size,
    ...Object.fromEntries(
      CREDIT_ROLES.map((r) => [
        r,
        [...works.values()].filter((w) => w.roles.has(r)).length,
      ]),
    ),
  };
}
export function creditRows(song) {
  return CREDIT_ROLES.flatMap((role) =>
    (song.creditDisplay?.[role] ?? [])
      .filter((p) => p.creatorId)
      .map((p) => ({
        role,
        creatorId: p.creatorId,
        displayOverride:
          song.credits.find((c) => c.creatorId === p.creatorId)
            ?.displayOverrides?.[role] ??
          song.credits.find((c) => c.creatorId === p.creatorId)
            ?.displayOverride ??
          "",
      })),
  );
}
export function selectedCreditData(rows, creators, previous = null) {
  if (
    !Array.isArray(rows) ||
    rows.some((r) => !r || !CREDIT_ROLES.includes(r.role))
  )
    fail("クレジットの担当が不正です。");
  const credits = [],
    creditDisplay = {};
  for (const role of CREDIT_ROLES) {
    const selected = rows.filter((r) => r.role === role),
      tokens = [];
    for (const row of selected) {
      if (!creators.some((c) => c.id === row.creatorId))
        fail("登録済みCreatorを選択してください。");
      let c = credits.find((c) => c.creatorId === row.creatorId);
      if (!c) {
        c = {
          creatorId: row.creatorId,
          roles: [],
          ...(row.displayOverride
            ? { displayOverride: row.displayOverride }
            : {}),
        };
        credits.push(c);
      }
      if ((c.displayOverride ?? "") !== (row.displayOverride ?? "")) {
        if (!previous)
          fail("同じCreatorの表示名はrole間で共通にしてください。");
        c.displayOverrides ??= {};
        c.displayOverrides[role] =
          row.displayOverride ||
          creators.find((x) => x.id === row.creatorId).name;
      }
      if (c.roles.includes(role))
        fail("同じroleに同じCreatorは1回だけ選択してください。");
      c.roles.push(role);
      if (tokens.length) tokens.push({ text: "、" });
      tokens.push({ creatorId: row.creatorId });
    }
    const equal =
      previous &&
      JSON.stringify(
        selected.map((r) => [r.creatorId, r.displayOverride ?? ""]),
      ) ===
        JSON.stringify(
          creditRows(previous)
            .filter((r) => r.role === role)
            .map((r) => [r.creatorId, r.displayOverride ?? ""]),
        );
    if (!equal && previous?.creditDisplay?.[role]?.some((p) => p.unresolved))
      fail(
        "確認待ちの既存クレジットは、migration mappingで解決してから変更してください。",
      );
    creditDisplay[role] = equal ? previous.creditDisplay[role] : tokens;
  }
  const result = { credits, creditDisplay };
  for (const role of CREDIT_ROLES)
    result[role] = creditText(result, role, creators) || null;
  validateCreditStructure(result);
  return result;
}

// Direct entry records the displayed name without inferring a Creator identity.
// Other roles retain their existing tokens, including unresolved fragments.
export function enteredCreditData(rows, creators, previous, values, textRoles) {
  if (
    !Array.isArray(textRoles) ||
    textRoles.some((r) => !CREDIT_ROLES.includes(r))
  )
    fail("直接入力したクレジットの担当が不正です。");
  const replacedRoles = [
    ...new Set([
      ...textRoles,
      ...CREDIT_ROLES.filter(
        (role) =>
          previous &&
          JSON.stringify(rows.filter((r) => r.role === role)) !==
            JSON.stringify(creditRows(previous).filter((r) => r.role === role)),
      ),
    ]),
  ];
  const unchanged = previous ? structuredClone(previous) : null;
  if (unchanged) {
    unchanged.credits = unchanged.credits.flatMap((c) => {
      const roles = c.roles.filter((role) => !replacedRoles.includes(role));
      if (!roles.length) return [];
      const next = { ...c, roles };
      if (next.displayOverrides)
        next.displayOverrides = Object.fromEntries(
          Object.entries(next.displayOverrides).filter(([role]) =>
            roles.includes(role),
          ),
        );
      return [next];
    });
    for (const role of replacedRoles) unchanged.creditDisplay[role] = [];
  }
  const result = selectedCreditData(
    rows.filter((r) => !textRoles.includes(r.role)),
    creators,
    unchanged,
  );
  for (const role of textRoles) {
    const text = values[role].trim();
    result[role] = text || null;
    result.creditDisplay[role] = text ? [{ text, unresolved: true }] : [];
  }
  validateCreditStructure(result);
  return result;
}
