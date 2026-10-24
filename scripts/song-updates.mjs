// Audited latest song-file edits before this UI migration. Later admin saves update admin-state.
const baseline = {
  garupa: "2026-10-22T19:22:12+09:00",
  ournotes: "2026-10-23T19:25:37+09:00",
};
export function songUpdatedAt(game, state) {
  return new Date(
    Math.max(Date.parse(baseline[game]), Date.parse(state.updatedAt) || 0),
  ).toISOString();
}
