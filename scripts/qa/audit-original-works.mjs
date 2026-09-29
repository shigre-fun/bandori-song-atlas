import fs from "node:fs";

const cases = [
  ["garupa", "data/garupa/songs.json"],
  ["ournotes", "data/ournotes/songs.json"],
];

const findings = [];
let total = 0;
for (const [game, path] of cases) {
  const data = JSON.parse(fs.readFileSync(path, "utf8"));
  for (const group of data.groups) {
    for (const song of group.songs) {
      const work = song.originalWork;
      if (!work) continue;
      total++;
      const reasons = [];
      if (work.includes("TVアニメ")) reasons.push("TVアニメ表記");
      if (/アニメ「[^」]*第\d+クール/.test(work))
        reasons.push("クールを作品名の内側に記載");
      const uses = work.split(
        /、(?=(?:アニメ|OVA|映画|ドラマ|CM|ゲーム|バラエティ|情報番組|音楽番組|イベント|スポーツ中継)「)/,
      );
      for (const use of uses) {
        const medium = use.match(
          /^(アニメ|OVA|映画|ドラマ|CM|ゲーム|バラエティ|情報番組|音楽番組|イベント|スポーツ中継)「/,
        )?.[1];
        if (!medium) {
          reasons.push(`媒体形式不明: ${use}`);
          continue;
        }
        const accepted = {
          アニメ: /(?:OP|ED|挿入歌|劇中歌)/,
          OVA: /(?:OP|ED|挿入歌|劇中歌|主題歌)/,
          映画: /(?:主題歌|挿入歌|劇中歌|OP|ED)/,
          ドラマ: /(?:OP|ED|テーマソング|挿入歌|劇中歌)/,
          CM: /^CM「[^」]+」テーマソング$/,
          ゲーム:
            /(?:OP|ED|主題歌|テーマソング|挿入歌|劇中歌|BGM|書き下ろし楽曲|アレンジ)/,
          バラエティ: /(?:OP|ED|主題歌|テーマソング|挿入歌|番組使用曲)/,
          情報番組:
            /(?:OP|ED|主題歌|テーマソング|テーマ曲|コーナー曲|挿入歌|番組使用曲)/,
          音楽番組: /(?:OP|ED|主題歌|テーマソング|挿入歌|番組使用曲)/,
          イベント: /(?:テーマソング|使用曲|課題曲)/,
          スポーツ中継: /(?:テーマソング|テーマ曲)/,
        }[medium];
        if (!accepted.test(use))
          reasons.push(
            use.includes("主題歌") && ["アニメ", "ドラマ"].includes(medium)
              ? `${medium}のOP/ED未特定`
              : `${medium}の用途・形式要確認`,
          );
      }
      if (reasons.length)
        findings.push({ game, id: song.id, title: song.title, work, reasons });
    }
  }
}

console.log(`作品名あり ${total} 曲 / 要確認 ${findings.length} 曲`);
for (const item of findings)
  console.log(
    `${item.game}:${item.id}\t${item.title}\t${item.reasons.join("、")}\t${item.work}`,
  );
