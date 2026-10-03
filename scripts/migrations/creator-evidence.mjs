export const HUMAN_REVIEW_DOCUMENT =
  "docs/migrations/creators-2026-10-02/human-review-2026-10-02.md";
export function isHumanReview(source) {
  return (
    source?.sourceType === "human-review" &&
    source.access === "user-confirmed" &&
    source.document === HUMAN_REVIEW_DOCUMENT &&
    /^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt ?? "") &&
    typeof source.supports === "string" &&
    !!source.supports.trim()
  );
}
export function isConfirmedEvidence(source) {
  return (
    isHumanReview(source) ||
    (["read", "browser-rendered-dom"].includes(source?.access) &&
      !!source.supports &&
      !!source.checkedAt &&
      /^https:\/\//.test(source.url ?? ""))
  );
}
export function permitsNameChange(change, id, from, to) {
  return (
    change?.creatorId === id &&
    change.from === from &&
    change.to === to &&
    isHumanReview(change.evidence)
  );
}
