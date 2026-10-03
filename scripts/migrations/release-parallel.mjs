import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { locateJSON, patchSongFields } from "./credit-field-patch.mjs";
const directory = "docs/migrations/credits-phase-b2-2026-10-03";
const creditKeys = new Set([
  "lyricist",
  "composer",
  "arranger",
  "credits",
  "creditDisplay",
]);
const allowedFields = [
  "releaseDate",
  "durationSeconds",
  "difficulties",
  "revision",
  "relatedSongIds",
  "mv",
];
export const nonCredit = (song) =>
  Object.fromEntries(
    Object.entries(song).filter(([key]) => !creditKeys.has(key)),
  );
export function verifyNonCredit(prior, now, game) {
  assert.equal(prior.groups.length, now.groups.length);
  prior.groups.forEach((group, index) => {
    const current = now.groups[index];
    assert.deepEqual({ ...group, songs: null }, { ...current, songs: null });
    assert.equal(group.songs.length, current.songs.length);
    group.songs.forEach((song, songIndex) =>
      assert.deepEqual(
        nonCredit(song),
        nonCredit(current.songs[songIndex]),
        "non-credit " + game + ":" + song.id,
      ),
    );
  });
}
export function parallelReview() {
  const human = JSON.parse(
    fs.readFileSync(directory + "/human-review.json", "utf8"),
  );
  if (!human.parallelReleaseReview) return null;
  const review = human.parallelReleaseReview;
  assert.equal(review.sourceType, "human-review");
  assert.equal(review.records, 885);
  assert.equal(review.works, 823);
  const bytes = fs.readFileSync(
    directory + "/release-parallel-preservation.json",
  );
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    review.preservationSha256,
  );
  const manifest = JSON.parse(bytes);
  assert.equal(manifest.remoteSha, review.remoteSHA);
  assert.equal(manifest.record.id, 86);
  assert.equal(manifest.record.title, "過去を喰らう");
  assert.deepEqual(manifest.record.relatedSongIds, ["garupa:758"]);
  assert.equal(manifest.linkedRecordId, 758);
  assert.equal(manifest.record.workId, manifest.linkedWorkId);
  assert.equal(manifest.composer.name, manifest.record.composer);
  return manifest;
}
export function approvedSource(text, game, manifest = parallelReview()) {
  if (!manifest) return text;
  const patches = new Map();
  for (const item of manifest.changes[game]) {
    const fields = {};
    for (const change of item.changes) {
      assert.ok(allowedFields.includes(change.field));
      fields[change.field] = change.remote;
    }
    patches.set(item.id, { title: item.title, workId: item.workId, fields });
  }
  let output = patchSongFields(text, patches, allowedFields).text;
  if (game === "ournotes") {
    const root = locateJSON(output);
    const groups = root.properties.get("groups").children;
    const target = groups.find((node) => {
      const group = JSON.parse(output.slice(node.start, node.end));
      return (
        group.band === manifest.group.band &&
        group.category === manifest.group.category
      );
    });
    assert.ok(target);
    const songs = target.properties.get("songs");
    assert.ok(
      !songs.children.some(
        (node) => JSON.parse(output.slice(node.start, node.end)).id === 86,
      ),
    );
    const last = songs.children.at(-1);
    const indent = output
      .slice(output.lastIndexOf("\n", last.start) + 1, last.start)
      .match(/^\s*/)[0];
    const value =
      ",\n" +
      indent +
      JSON.stringify(manifest.record, null, 2).replaceAll("\n", "\n" + indent);
    output = output.slice(0, last.end) + value + output.slice(last.end);
  }
  JSON.parse(output);
  return output;
}
export function parallelNormalized(manifest) {
  const song = manifest.record;
  const scope = "ournotes:86";
  const roles = Object.fromEntries(
    ["lyricist", "composer", "arranger"].map((role) => {
      const composer = role === "composer";
      return [
        role,
        {
          target: composer,
          creatorResolved: composer && !!manifest.composer.id,
          excludedReason: composer
            ? manifest.composer.id
              ? null
              : "PARALLEL_RELEASE_IDENTITY_UNRESOLVED"
            : "PARALLEL_RELEASE_CREDIT_NOT_COLLECTED",
          resolvedBy:
            composer && manifest.composer.id
              ? "existing-master-exact-match"
              : null,
          effective: {
            rawCredit: composer ? song.composer : "",
            splitStatus: composer ? "CONFIRMED_SINGLE" : "NOT_COLLECTED",
            creatorTokens: composer
              ? [
                  {
                    raw: song.composer,
                    normalized: song.composer,
                    standardName: manifest.composer.name,
                    creatorId: manifest.composer.id,
                    existingCreatorId: manifest.composer.id,
                    identityKey: manifest.composer.id,
                    candidateKey: null,
                    confidence: manifest.composer.id
                      ? "CONFIRMED"
                      : "UNRESOLVED",
                    applicability: "RECORD_SCOPED",
                    scopePolicy: "RECORD_SCOPED",
                    recordScope: scope,
                    evidence: [
                      {
                        sourceType: "existing-master-exact-lookup",
                        found: !!manifest.composer.id,
                        remoteSha: manifest.remoteSha,
                      },
                    ],
                  },
                ]
              : [],
          },
        },
      ];
    }),
  );
  return {
    game: "ournotes",
    recordId: 86,
    title: song.title,
    band: manifest.group.band,
    category: manifest.group.category,
    workId: song.workId,
    outsideOriginalB2: true,
    sourcePhase: "release-parallel-record",
    roles,
  };
}
