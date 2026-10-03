import crypto from "node:crypto";

export const ROLES = ["lyricist", "composer", "arranger"];
export const LABELS = { lyricist: "作詞", composer: "作曲", arranger: "編曲" };
export const BAND_CLASSES = {
  poppinparty: "Poppin'Party",
  afterglow: "Afterglow",
  "pastel-palettes": "Pastel＊Palettes",
  roselia: "Roselia",
  "hello-happy-world": "ハロー、ハッピーワールド！",
  morfonica: "Morfonica",
  "raise-a-suilen": "RAISE A SUILEN",
  mygo: "MyGO!!!!!",
};
export const fingerprint = (x) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(x))
    .digest("hex")
    .slice(0, 20);
export const normalizeFormat = (s) =>
  (s ?? "")
    .normalize("NFKC")
    .replace(/[\s\u200b]+/g, "")
    .replace(/[’‘]/g, "'");
export const normalizeTitle = (s) =>
  normalizeFormat(s)
    .replace(/[’‘]/g, "'")
    .replace(/[〜～]/g, "~");
export function titleVariant(title) {
  return title
    .replace(/^\[FULL\]\s*/i, "")
    .replace(/[（(]3Dライブモード対応[）)]$/, "")
    .replace(/[（(]MyGO!!!!!\s*ver\.[）)]$/, "")
    .trim();
}
const roleFromLabel = (label) => {
  const map = {
    作詞: ["lyricist"],
    詞: ["lyricist"],
    作曲: ["composer"],
    曲: ["composer"],
    作編曲: ["composer", "arranger"],
    編曲: ["arranger"],
  };
  return [
    ...new Set(
      (label.match(/作詞|作曲|作編曲|編曲|詞|曲/g) ?? []).flatMap(
        (part) => map[part],
      ),
    ),
  ];
};
const labels =
  /(作詞作曲(?:編曲)?|作詞(?:\s*[・/／&＆、]\s*(?:作詞|作曲|編曲|作編曲))*|作曲(?:\s*[・/／&＆、]\s*編曲)*|作編曲|編曲|詞|曲)\s*[:：]\s*/g;
export function parseCreditLine(text) {
  const matches = [...text.matchAll(labels)],
    values = [];
  for (const [i, m] of matches.entries()) {
    let raw = text
      .slice(m.index + m[0].length, matches[i + 1]?.index ?? text.length)
      .trim();
    if (matches[i + 1]) raw = raw.replace(/\s*[/／]\s*$/, "").trim();
    if (!raw) continue;
    for (const role of roleFromLabel(m[1]))
      values.push({ role, raw, label: m[1], creditText: text });
  }
  return {
    values,
    prefix: matches[0] ? text.slice(0, matches[0].index).trim() : null,
  };
}
export function gameFacts(source, game) {
  const sourceId = `s-${fingerprint(source.url)}`;
  return source.rows.map((row) => {
    const credits = {};
    for (const field of row.creditFields) {
      if (!field.label) continue;
      const parsed =
        field.value != null
          ? {
              values: roleFromLabel(field.label).map((role) => ({
                role,
                raw: field.value,
              })),
            }
          : parseCreditLine(
              field.label.replace(/^(作詞|作曲|編曲)\s+/, "$1："),
            );
      for (const { role, raw } of parsed.values) if (raw) credits[role] = raw;
    }
    const fact = {
      sourceId,
      sourceUrl: source.url,
      sourceType: source.sourceType,
      sourceTitle: source.pageTitle,
      checkedAt: source.checkedAt,
      pageReadStatus: source.pageReadStatus,
      game,
      title: row.title,
      artist: row.artist,
      bandContext: BAND_CLASSES[row.bandClass] ?? null,
      category: row.category,
      sourceScope: "record",
      credits,
      creditText: row.creditFields
        .filter((x) => x.label)
        .map((x) => x.creditText)
        .join("\n"),
      context: row.updated ?? source.context ?? null,
    };
    return { ...fact, id: `e-${fingerprint(fact)}` };
  });
}
export function cleanTrackTitle(text) {
  return text
    .trim()
    .replace(/^[●・]\s*/, "")
    .replace(/^(?:M\s*)?\d{1,2}\s*[.．:：、)]\s*/i, "")
    .replace(/^[①-⑳]\s*/, "")
    .trim()
    .replace(/^[「『](.*)[」』]$/, "$1");
}
export function releaseTrackTitle(text, artists) {
  const title = cleanTrackTitle(text);
  const quoted = title.match(/^(.*?)「([^「」]+)」$/);
  if (
    quoted &&
    artists
      .split("\n")
      .some((a) => normalizeTitle(a) === normalizeTitle(quoted[1]))
  )
    return quoted[2];
  return title;
}
export function discographyFacts(source) {
  const result = [],
    sourceId = `s-${fingerprint(source.url)}`;
  let title = null,
    credits = {},
    creditText = [],
    locations = [];
  const flush = () => {
    if (!Object.keys(credits).length) return;
    const fact = {
      sourceId,
      sourceUrl: source.url,
      sourceType: source.sourceType,
      sourceTitle: source.pageTitle,
      checkedAt: source.checkedAt,
      pageReadStatus: source.pageReadStatus,
      game: null,
      title: title ?? releaseTrackTitle(source.pageTitle, source.artists),
      artist: source.artists,
      bandContext: null,
      category: "release",
      sourceScope: "release",
      credits: { ...credits },
      creditText: creditText.join("\n"),
      context: source.releaseDate,
      sourceLines: [...locations],
      titleExplicit: title !== null,
    };
    result.push({ ...fact, id: `e-${fingerprint(fact)}` });
    credits = {};
    creditText = [];
    locations = [];
  };
  for (const line of source.creditLines ?? []) {
    const parsed = parseCreditLine(line.text);
    if (parsed.values.length) {
      if (parsed.prefix) {
        flush();
        title = releaseTrackTitle(parsed.prefix, source.artists);
      }
      if (parsed.values.some((x) => Object.hasOwn(credits, x.role))) {
        flush();
      }
      for (const { role, raw } of parsed.values) credits[role] = raw;
      creditText.push(line.text);
      locations.push(line.line);
    } else if (
      line.text.length <= 160 &&
      !/作詞|作曲|編曲|作編曲/.test(line.text) &&
      !/^Produced by /i.test(line.text)
    ) {
      flush();
      title = releaseTrackTitle(line.text, source.artists);
    }
  }
  flush();
  return result;
}
export function bandMatches(fact, record) {
  const wanted = normalizeTitle(record.band);
  return (
    normalizeTitle(fact.artist) === wanted ||
    normalizeTitle(fact.bandContext ?? "") === wanted ||
    fact.artist.split(/\n|\s*\/\s*/).some((x) => normalizeTitle(x) === wanted)
  );
}
export function candidateForRaw(raw, creators) {
  const exact = creators.filter((c) =>
    [c.name, ...(c.aliases ?? [])].includes(raw),
  );
  if (exact.length === 1)
    return {
      status: "AUTO_MATCH_EXACT",
      existingCreatorCandidateId: exact[0].id,
      tokensCandidate: [raw],
      tokenizationStatus: "WHOLE_RAW_EXACT",
    };
  const possible = creators
    .filter((c) =>
      [c.name, ...(c.aliases ?? [])].some(
        (s) => normalizeFormat(s) === normalizeFormat(raw),
      ),
    )
    .map((c) => c.id);
  // Splitting is only a review proposal; a punctuation mark can belong to a name.
  const candidate = raw
    .split(/\s*[/／、,]\s*|\s+[&＆]\s+|\s*[・×]\s*/)
    .filter(Boolean);
  return {
    status: possible.length ? "REVIEW_RECOMMENDED" : "UNRESOLVED",
    possibleCreatorCandidate: possible,
    newCreatorCandidate: possible.length === 0,
    tokensCandidate: candidate,
    tokenizationStatus:
      candidate.length > 1 ? "REVIEW_RECOMMENDED" : "UNSPLIT_RAW",
    notes:
      "候補の区切りは確定分割ではない。所属括弧と名前内記号を原文に保持し、人物同定/ID採番はPhase B。",
  };
}
