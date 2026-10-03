export const CREDIT_ROLES = ["lyricist", "composer", "arranger"];
export const ROLE_LABELS = {
  lyricist: "作詞",
  composer: "作曲",
  arranger: "編曲",
};
const fail = (message) => {
  throw new Error(message);
};
export function creditTokens(song, role, creators) {
  const byId = new Map(creators.map((c) => [c.id, c]));
  const relations = new Map((song.credits ?? []).map((c) => [c.creatorId, c]));
  return (song.creditDisplay?.[role] ?? []).map((p) => {
    if (!p.creatorId)
      return { text: p.text, ...(p.unresolved ? { unresolved: true } : {}) };
    const creator = byId.get(p.creatorId),
      relation = relations.get(p.creatorId);
    if (!creator || !relation) fail(`存在しないCreator: ${p.creatorId}`);
    return {
      text:
        relation.displayOverrides?.[role] ??
        relation.displayOverride ??
        creator.name,
      creator,
    };
  });
}
export const creditText = (song, role, creators) =>
  creditTokens(song, role, creators)
    .map((p) => p.text)
    .join("");
