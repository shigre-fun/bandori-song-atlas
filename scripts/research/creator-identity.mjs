import crypto from "node:crypto";

export const ROLES = ["lyricist", "composer", "arranger"];
export const keyFor = (value) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 20);
export const formatKey = (value) =>
  value.normalize("NFKC").replace(/\s/g, "").replace(/[‘’]/g, "'");
export const referenceKey = (record) => `${record.game}:${record.recordId}`;
export const isShortName = (name) =>
  /^[a-z0-9-]{1,4}$/i.test(name) ||
  ["あの", "じん", "ナノ", "冬真"].includes(name);
const affiliations = ["Elements Garden", "SUPA LOVE", "Dream Monster"];

export function separateAffiliation(raw) {
  for (const company of affiliations) {
    const suffix = new RegExp(
      `\\s*[（(]${company.replaceAll(" ", "\\s*")}[）)]$`,
    );
    if (suffix.test(raw))
      return {
        normalized: raw.replace(suffix, "").trim(),
        affiliation: company,
      };
  }
  return { normalized: raw.trim(), affiliation: null };
}

// Reviewed author boundaries. Each credit retains its Phase A role-labelled source.
// These are explicit finite decisions, not automatic approval of a separator regex.
const reviewedPairs = new Map([
  [
    "都丸椋太（Elements Garden）／宮崎京一",
    ["都丸椋太（Elements Garden）", "宮崎京一"],
  ],
  [
    "都丸椋太（Elements Garden）／加納望",
    ["都丸椋太（Elements Garden）", "加納望"],
  ],
  [
    "母里治樹（Elements Garden）/加納望",
    ["母里治樹（Elements Garden）", "加納望"],
  ],
  [
    "母里治樹（Elements Garden）／加納望",
    ["母里治樹（Elements Garden）", "加納望"],
  ],
  ["shito、Gom", ["shito", "Gom"]],
  ["植木建象、冬真", ["植木建象", "冬真"]],
  ["植木建象、神田ジョン", ["植木建象", "神田ジョン"]],
  [
    "植木建象、神田ジョン(from PENGUIN RESEARCH)",
    ["植木建象", "神田ジョン(from PENGUIN RESEARCH)"],
  ],
  ["あの、真部 脩一", ["あの", "真部 脩一"]],
  ["大橋卓弥 常田真太郎", ["大橋卓弥", "常田真太郎"]],
  ["大橋卓弥/常田真太郎", ["大橋卓弥", "常田真太郎"]],
  [
    "藤田淳平(Elements Garden)・日高勇輝(Elements Garden)",
    ["藤田淳平(Elements Garden)", "日高勇輝(Elements Garden)"],
  ],
  [
    "藤田淳平（Elements Garden）/日高勇輝（Elements Garden）",
    ["藤田淳平（Elements Garden）", "日高勇輝（Elements Garden）"],
  ],
  [
    "藤田淳平(Elements Garden)、Seonoo Kim(Elements Garden)",
    ["藤田淳平(Elements Garden)", "Seonoo Kim(Elements Garden)"],
  ],
  [
    "日高勇輝（Elements Garden）/Seonoo Kim（Elements Garden）",
    ["日高勇輝（Elements Garden）", "Seonoo Kim（Elements Garden）"],
  ],
  [
    "岩橋星実（Elements Garden）/下田晃太郎（Elements Garden）",
    ["岩橋星実（Elements Garden）", "下田晃太郎（Elements Garden）"],
  ],
  [
    "笠井雄太（Elements Garden）/藤田淳平（Elements Garden）",
    ["笠井雄太（Elements Garden）", "藤田淳平（Elements Garden）"],
  ],
  [
    "上松範康（Elements Garden）/織田あすか（Elements Garden）",
    ["上松範康（Elements Garden）", "織田あすか（Elements Garden）"],
  ],
  ["DECO*27 & ピノキオピー", ["DECO*27", "ピノキオピー"]],
  ["Giga・TeddyLoid", ["Giga", "TeddyLoid"]],
  ["Giga、TeddyLoid", ["Giga", "TeddyLoid"]],
  ["atsuko/KATSU", ["atsuko", "KATSU"]],
]);

function tentativeParts(raw) {
  let depth = 0,
    start = 0;
  const result = [];
  for (let i = 0; i < raw.length; i++) {
    if ("(（".includes(raw[i])) depth++;
    if (")）".includes(raw[i])) depth = Math.max(0, depth - 1);
    if (!depth && "／/、,".includes(raw[i])) {
      result.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  result.push(raw.slice(start));
  return result.filter((x) => x.trim());
}

export function splitCredit(raw, creators, reviewed = []) {
  if (raw === "末益涼太（Elements Garden）竹田祐介（Elements Garden）")
    return {
      rawCredit: raw,
      creatorTokens: [],
      status: "SUPERSEDED_ROLE_ERROR",
      reason: "human-flowerで作曲/編曲連結を訂正。竹田を作曲tokenにしない。",
      reviewedBy: "human-review",
    };
  const exact = creators.find((c) =>
    [c.name, ...c.aliases].includes(raw.trim()),
  );
  if (exact || reviewed.includes(raw) || !/[／/、,&・×]/.test(raw))
    return {
      rawCredit: raw,
      creatorTokens: [{ raw, ...separateAffiliation(raw) }],
      status: "CONFIRMED_SINGLE",
      reason: exact
        ? "既存確認済みname/alias全体一致。名前内の記号を保持。"
        : "単一credit欄を1tokenとして保持。人物同定は別status。",
      reviewedBy: exact ? "existing-master" : "credit-structure-review",
    };
  const pair = reviewedPairs.get(raw);
  if (pair)
    return {
      rawCredit: raw,
      creatorTokens: pair.map((part) => ({
        raw: part,
        ...separateAffiliation(part),
      })),
      status: "CONFIRMED_SPLIT",
      reason:
        "有限の明示split review。Phase Aの同じrole欄・各token/既存主体・一次identity文脈を照合。",
      reviewedBy: "b1-credit-structure-review",
    };
  // SUPA LOVE joint composition is explicitly repeated in label-labelled originals.
  if (
    (/、Diggy-MO[’']$/.test(raw) && /^.+[（(]SUPA LOVE[）)]、/.test(raw)) ||
    /^Diggy-MO'、松坂康司\(SUPA LOVE\)$/.test(raw)
  ) {
    return {
      rawCredit: raw,
      creatorTokens: tentativeParts(raw).map((part) => ({
        raw: part,
        ...separateAffiliation(part),
      })),
      status: "CONFIRMED_SPLIT",
      reason:
        "共同作曲を人間Symbol reviewとPhase Aの明示role原文で確認。同じ2名並記構文、DiggyとSUPA所属作家を別主体とする。",
      reviewedBy: "b1-credit-structure-review",
    };
  }
  const parts = tentativeParts(raw);
  return {
    rawCredit: raw,
    creatorTokens: parts.map((part) => ({
      raw: part,
      ...separateAffiliation(part),
    })),
    status: "REVIEW_RECOMMENDED",
    reason:
      "記号から候補を分割しただけ。単位名/別名/作者境界の一次根拠が不足、全体を自動適用から除外。",
    reviewedBy: "candidate-only",
  };
}

export function masterEvidence(c) {
  return {
    sourceUrl: null,
    sourceType: "existing-creator-db",
    checkedAt: "2026-10-03",
    document: "data/creators.json",
    supports: `${c.id}: ${c.name}の確認済みname/aliasesと完全一致。`,
    note: c.identityEvidence ?? "既存masterの固定IDを再利用。",
  };
}

export function buildIdentityResolver(creators, identityEvidence, humanReview) {
  const entries = [...identityEvidence.entries];
  const humanAliases = {
    samfree: ["SAM(samfree)"],
    Aira: ["Aira(Dream Monster)"],
    瀬名水紀: ["瀬名水紀(Dream Monster)"],
    長屋晴子: ["長屋 晴子"],
    小林壱誓: ["小林 壱誓"],
    "Diggy-MO’": ["Diggy-MO'"],
  };
  for (const review of humanReview.cases) {
    const names = [
      ...new Set(
        Object.values(review.roles ?? {})
          .flat()
          .concat(review.standardName ? [review.standardName] : []),
      ),
    ];
    for (let name of names) {
      if (name === "Diggy-MO'") name = "Diggy-MO’";
      entries.unshift({
        standardName: name,
        aliases: humanAliases[name] ?? [],
        type: "person",
        confidence: "CONFIRMED",
        officialLatinName: /^[a-zA-Z'-]+$/.test(name) ? name : null,
        sortKeyStatus: "provisional-original",
        applicability: "RECORD_SCOPED",
        recordReferences: review.recordReferences,
        evidence: [review.evidence],
        humanReviewId: review.id,
        note: review.reason,
      });
    }
  }
  return (token, record, role, phaseEvidence) => {
    const name = token.normalized;
    const entry =
      entries.find(
        (e) =>
          [e.standardName, ...e.aliases].some((a) => a === name) &&
          (!e.recordReferences ||
            e.recordReferences.some(
              (r) => referenceKey(r) === referenceKey(record),
            )),
      ) ?? entries.find((e) => [e.standardName, ...e.aliases].includes(name));
    let c = creators.find(
      (c) =>
        [c.name, ...c.aliases].includes(token.raw.trim()) ||
        [c.name, ...c.aliases].includes(name),
    );
    if (!c && entry)
      c = creators.find((c) =>
        [c.name, ...c.aliases].includes(entry.standardName),
      );
    let confidence = c ? "CONFIRMED" : (entry?.confidence ?? "UNRESOLVED");
    let applicability = entry?.applicability ?? "GLOBAL_CONFIRMED";
    const evidence = [
      ...(entry?.evidence ?? []),
      ...(c ? [masterEvidence(c)] : []),
      ...phaseEvidence,
    ];
    let reason =
      entry?.note ??
      (c
        ? "既存name/aliasまたは人間確認済み所属を除いたnameとの完全一致。"
        : "一次identity情報不足。原文role以外の同一性・typeを断定しない。");
    if (!c && !entry) {
      const near = creators.filter((c) =>
        [c.name, ...c.aliases].some(
          (a) =>
            formatKey(separateAffiliation(a).normalized) === formatKey(name),
        ),
      );
      if (near.length === 1) {
        c = near[0];
        confidence = "PROBABLE";
        reason = "既存IDの形式差候補。同一性を形式正規化だけで確定しない。";
        evidence.unshift(masterEvidence(c));
      }
    }
    const standardName = c?.name ?? entry?.standardName ?? name;
    const short =
      isShortName(standardName) ||
      (!c && entry?.applicability === "RECORD_SCOPED");
    if (c && !short) applicability = "GLOBAL_CONFIRMED";
    if (short) {
      applicability = "RECORD_SCOPED";
      const existingScope =
        c &&
        record.currentComposerRelationAudit?.currentCreatorIds?.includes(c.id);
      const humanScope = entry?.recordReferences?.some(
        (r) => referenceKey(r) === referenceKey(record),
      );
      const webScope =
        !entry?.recordReferences &&
        entry?.confidence === "CONFIRMED" &&
        phaseEvidence.some((e) => e.sourceUrl && e.supports.includes(role));
      if (!(existingScope || humanScope || webScope)) {
        confidence = confidence === "CONFIRMED" ? "UNRESOLVED" : confidence;
        reason += " 短名は既存確認済みrecordまたは一次role文脈が必要。";
      }
    }
    if (
      entry?.recordReferences &&
      !entry.recordReferences.some(
        (r) => referenceKey(r) === referenceKey(record),
      ) &&
      !c
    ) {
      confidence = "UNRESOLVED";
      reason += " 人間確認の対象record外。";
    }
    if (confidence !== "CONFIRMED") applicability = "REVIEW_REQUIRED";
    return {
      ...token,
      standardName,
      existingCreatorId: c?.id ?? null,
      candidateKey: c ? null : `b1-${keyFor(formatKey(standardName))}`,
      identityKey: c?.id ?? `b1-${keyFor(formatKey(standardName))}`,
      confidence,
      applicability,
      type: c?.type ?? entry?.type ?? "person",
      typeStatus:
        c || entry?.confidence === "CONFIRMED"
          ? "confirmed"
          : "provisional-credit-subject",
      officialLatinName: entry?.officialLatinName ?? null,
      sortKey: c?.sortKey ?? entry?.sortKey ?? standardName,
      sortKeyStatus:
        c?.sortKeyStatus ??
        (c
          ? "existing-master"
          : (entry?.sortKeyStatus ?? "provisional-original")),
      evidence,
      reason,
      affiliationParticipation: false,
      confirmedAliases:
        confidence === "CONFIRMED" && entry?.confidence === "CONFIRMED"
          ? entry.aliases
          : [],
      scopePolicy: short ? "RECORD_SCOPED" : "GLOBAL_IF_CONFIRMED",
      recordScope: short ? referenceKey(record) : null,
    };
  };
}
