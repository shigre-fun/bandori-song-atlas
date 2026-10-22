import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";

export const directory = "docs/research/original-work-2026-10-22";
export const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
export function recordings() {
  return ["garupa", "ournotes"].flatMap((game) => {
    const data = JSON.parse(fs.readFileSync(`data/${game}/songs.json`, "utf8"));
    return data.groups.flatMap((group) =>
      group.songs.map((song) => ({
        game,
        band: group.band,
        category: group.category,
        ...song,
        reference: `${game}:${song.id}`,
      })),
    );
  });
}
export function withoutWork(song) {
  const { originalWork, ...rest } = song;
  return rest;
}
export function review() {
  const baseline = JSON.parse(
    fs.readFileSync(`${directory}/baseline.json`, "utf8"),
  );
  const decisions = JSON.parse(
    fs.readFileSync(`${directory}/decisions.json`, "utf8"),
  );
  const search = JSON.parse(
    fs.readFileSync(`${directory}/search-index.json`, "utf8"),
  );
  const notes = JSON.parse(
    fs.readFileSync(`${directory}/unresolved-notes.json`, "utf8"),
  );
  const rows = recordings();
  assert.equal(rows.length, 890);
  assert.equal(
    digest(JSON.stringify(rows.map(withoutWork))),
    baseline.untouchedDigest,
    "originalWork以外の楽曲・ID・Work・担当・グループ等が変わっています",
  );
  const targets = new Map(
    baseline.rows.filter((s) => s.target).map((s) => [s.reference, s]),
  );
  assert.equal(targets.size, 582);
  const confirmationPath = `${directory}/human-confirmation.json`;
  const confirmation = fs.existsSync(confirmationPath)
    ? JSON.parse(fs.readFileSync(confirmationPath, "utf8"))
    : null;
  if (confirmation) {
    const frozen = fs.readFileSync(
      `${directory}/before-human-confirmation/human-review.json`,
    );
    assert.equal(digest(frozen), confirmation.listSHA256);
    const original = JSON.parse(frozen);
    assert.equal(original.count, 416);
    assert.equal(confirmation.value, "なし");
    assert.equal(confirmation.sourceType, "user_confirmation");
    assert.ok(confirmation.statement);
    assert.deepEqual(
      confirmation.references,
      original.rows.map((s) => s.reference),
    );
    for (const ref of confirmation.references) {
      assert.ok(targets.has(ref), ref);
      assert.ok(!decisions.some((d) => d.references.includes(ref)), ref);
    }
    decisions.push({
      references: confirmation.references,
      value: confirmation.value,
      sources: [],
      sourceType: confirmation.sourceType,
      reason: confirmation.statement,
    });
  }
  for (const d of decisions) {
    assert.ok(
      d.value.trim() &&
        (d.sources.length || d.sourceType === "user_confirmation") &&
        d.reason,
    );
    for (const url of d.sources) assert.equal(new URL(url).protocol, "https:");
    for (const ref of d.references)
      assert.ok(targets.has(ref), `対象外: ${ref}`);
  }
  const audit = baseline.rows.map((before) => {
    const current = rows.find((s) => s.reference === before.reference);
    const matching = decisions.filter((d) =>
      d.references.includes(before.reference),
    );
    const values = [...new Set(matching.map((d) => d.value))].filter(
      (value) =>
        !matching.some(
          (d) =>
            d.value !== value &&
            d.value.replace(/第\d+話(?=劇中歌|ED)/u, "") === value,
        ),
    );
    assert.ok(
      !(values.includes("なし") && values.length > 1),
      before.reference,
    );
    const value = values.length ? values.join("、") : before.originalWork;
    const status = !before.target
      ? "existing"
      : values.length
        ? value === "なし"
          ? "none"
          : "confirmed"
        : "human_review";
    const searches = (search.queries || [])
      .filter((q) => q.reference === before.reference)
      .map((q) => ({
        query: q.q,
        searchURL: `https://www.google.com/search?q=${encodeURIComponent(q.q)}`,
        resultIndex: q.resultIndex,
      }));
    if (status === "human_review")
      assert.ok(searches.length, `未調査: ${before.reference}`);
    if (!before.target)
      assert.equal(
        current.originalWork,
        before.originalWork,
        `既登録変更: ${before.reference}`,
      );
    else
      assert.ok(
        current.originalWork === before.originalWork ||
          current.originalWork === value,
        `同時編集を検出: ${before.reference}`,
      );
    return {
      ...before,
      status,
      value,
      notes:
        notes[before.reference] ||
        (status === "human_review"
          ? "曲名・歌手/バンド別の用途検索と主題歌/劇中歌資料を照合したが、使用作品の有無を断定できない。通常のゲーム収録・実写ライブ・MVだけから用途や『なし』を推測せず、人間確認。"
          : null),
      findings: matching.map(({ value, sources, reason, sourceType }) => ({
        value,
        sources,
        reason,
        ...(sourceType ? { sourceType } : {}),
      })),
      searches,
    };
  });
  return {
    date: "2026-10-22",
    total: 890,
    targets: 582,
    counts: Object.fromEntries(
      ["existing", "confirmed", "none", "human_review"].map((status) => [
        status,
        audit.filter((s) => s.status === status).length,
      ]),
    ),
    rows: audit,
  };
}
export function applyReview() {
  const result = review();
  for (const game of ["garupa", "ournotes"]) {
    const path = `data/${game}/songs.json`;
    const raw = fs.readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    for (const group of data.groups)
      for (const s of group.songs) {
        const row = result.rows.find((r) => r.reference === `${game}:${s.id}`);
        s.originalWork = row.value;
      }
    const content = JSON.stringify(data, null, 2) + "\n";
    if (raw !== content) fs.writeFileSync(path, content);
  }
  return result;
}
export function writeReport() {
  const result = review();
  const unknown = result.rows.filter((s) => s.status === "human_review");
  fs.writeFileSync(
    `${directory}/review.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  fs.writeFileSync(
    `${directory}/human-review.json`,
    JSON.stringify(
      { date: result.date, count: unknown.length, rows: unknown },
      null,
      2,
    ) + "\n",
  );
  const escape = (s) =>
    String(s ?? "")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  const link = (s) =>
    `[${escape(s.title)}](https://tanimachi-bdsongs.com/${s.reference.replace(":", "/songs/")}/)`;
  const lines = [
    "# 使用作品・タイアップの人間確認リスト（2026-10-22）",
    "",
    `全890収録を点検。今回の対象582件のうち、作品・タイアップ判明 ${result.counts.confirmed}件、確認済みの「なし」${result.counts.none}件、下記の確認待ち ${unknown.length}件。既登録308件はそのまま保持。件数は楽曲ページ（収録）単位。`,
    "",
    unknown.length
      ? "下記の表示は「未登録」です。候補は確定情報ではありません。確認結果を記入してください。"
      : "確認待ちは0件です。前回の416件はユーザーが全件『なし』と確認したため反映済みです。[確認前リスト](before-human-confirmation/HUMAN_REVIEW.md) / [確認結果・対象416件](human-confirmation.json)。",
    "",
    "一次情報での用途明記を優先しています。公式サイト群は2026-10-21 20時からメンテナンスで直接取得503だったため、公式ページの検索保存内容・公式プレスリリース・出版社/放送局資料で照合。検索で見つからないだけでは「なし」にしていません。通常のゲーム収録・実写ライブ/一般MV・別歌手の後発カバーを原曲タイアップと自動判定しません。公式が命名したアーティストタイアップ企画は記載します。",
    "",
    "[全890件の調査台帳](review.json) / [確認待ちJSON](human-review.json) / [検索参照URL一覧](search-index.json)",
    "",
    "個別検索語はJSONの searches に保存。resultIndex は search-index.json の results の配列位置に対応し、参照候補URLを確認できます。候補がない行も使用なしの断定はしていません。公式一覧のアルバム全体説明や付属ライブBDの曲一覧を、個々の曲の本編用途へ転記しないよう注意してください。",
    "",
  ];
  for (const game of ["garupa", "ournotes"]) {
    lines.push(`## ${game === "garupa" ? "ガルパ" : "アワーノーツ"}`, "");
    const bands = [
      ...new Set(
        unknown
          .filter((s) => s.reference.startsWith(game + ":"))
          .map((s) => s.band),
      ),
    ];
    for (const band of bands) {
      lines.push(
        `### ${band}`,
        "",
        "| ID | 曲名 | 種類 | 確認事項 | 人間の確認結果・根拠URL |",
        "| --- | --- | --- | --- | --- |",
      );
      for (const s of unknown.filter(
        (s) => s.reference.startsWith(game + ":") && s.band === band,
      ))
        lines.push(
          `| ${s.reference} | ${link(s)} | ${s.category} | ${escape(s.notes).replace("曲名・歌手/バンド別の用途検索と主題歌/劇中歌資料を照合したが、使用作品の有無を断定できない。通常のゲーム収録・実写ライブ・MVだけから用途や『なし』を推測せず、人間確認。", "用途有無の確証不足（曲別検索済み）")} | 未確認 |`,
        );
      lines.push("");
    }
  }
  fs.writeFileSync(`${directory}/HUMAN_REVIEW.md`, lines.join("\n").trimEnd() + "\n");
  const changes = [
    "# 今回反映した使用作品・タイアップ",
    "",
    `2026-10-22。既登録308件は保持し、下記${result.counts.confirmed + result.counts.none}収録の originalWork のみ更新。原曲・ID・担当・Workの同定には変更なし。`,
    "",
    "| ID | 楽曲 | 種類 | 反映値 | 根拠 |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const s of result.rows.filter(
    (s) => s.target && s.status !== "human_review",
  )) {
    const urls = [...new Set(s.findings.flatMap((f) => f.sources))];
    changes.push(
      `| ${s.reference} | ${link(s)} | ${s.category} | ${escape(s.value)} | ${urls.length ? urls.map((url, i) => `[出典${i + 1}](${url})`).join(" / ") : "[ユーザーによる全件確認](human-confirmation.json)"} |`,
    );
  }
  fs.writeFileSync(`${directory}/CHANGES.md`, changes.join("\n") + "\n");
  return result;
}
if (["apply", "report", "verify"].includes(process.argv[2])) {
  if (process.argv[2] === "apply") applyReview();
  const result = process.argv[2] === "verify" ? review() : writeReport();
  if (process.argv[2] !== "report")
    for (const s of recordings())
      assert.equal(
        s.originalWork,
        result.rows.find((r) => r.reference === s.reference).value,
        s.reference,
      );
  console.log(
    JSON.stringify({
      total: result.total,
      targets: result.targets,
      ...result.counts,
    }),
  );
}
if (process.argv[2] === "baseline") {
  fs.mkdirSync(directory, { recursive: true });
  const rows = recordings();
  const baseline = {
    date: "2026-10-22",
    total: rows.length,
    untouchedDigest: digest(JSON.stringify(rows.map(withoutWork))),
    rows: rows.map((s) => ({
      reference: s.reference,
      title: s.title,
      band: s.band,
      category: s.category,
      workId: s.workId,
      originalWork: s.originalWork,
      target:
        s.category === "オリジナル" ||
        !s.originalWork ||
        s.originalWork === "未登録",
    })),
  };
  const path = `${directory}/baseline.json`;
  if (fs.existsSync(path)) throw new Error("Baseline already exists");
  fs.writeFileSync(path, JSON.stringify(baseline, null, 2) + "\n");
  console.log(
    JSON.stringify({
      total: rows.length,
      targets: baseline.rows.filter((s) => s.target).length,
      originals: rows.filter((s) => s.category === "オリジナル").length,
      unknownCovers: baseline.rows.filter(
        (s) => s.target && s.category !== "オリジナル",
      ).length,
    }),
  );
}
