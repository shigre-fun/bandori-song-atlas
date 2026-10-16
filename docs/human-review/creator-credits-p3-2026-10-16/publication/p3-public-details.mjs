import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const commit = process.argv[2];
assert.match(commit, /^[a-f0-9]{40}$/);
const origin = process.argv[3] ?? 'https://tanimachi-bdsongs.com';
const prefix = process.argv[4] ?? '';
const mode = process.argv[5] ?? 'all';
const output = process.argv[6] ?? '.cache/p2-public-details.json';
const directory = process.argv[7] ?? 'dist';
let targets = ['garupa', 'ournotes'].flatMap(game =>
  JSON.parse(fs.readFileSync(`${directory}/${game}/songs.json`, 'utf8')).songs.map(song => ({ game, song })));
if (mode === 'representative') {
  const chosen = new Map();
  for (const target of targets) chosen.set(`${target.game}:${target.song.type}`, target);
  for (const target of targets.filter(t => t.song.title === '夢我夢中' || t.song.title === 'Resound the Way'))
    chosen.set(`${target.game}:${target.song.stableSongId}`, target);
  targets = [...new Map([...chosen.values()].map(t => [`${t.game}:${t.song.stableSongId}`, t])).values()];
}
const results = [], retries = [];
const get=async url=>{for(let attempt=0;attempt<4;attempt++){const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});if(response.status===429||response.status>=500){retries.push({url:String(url),status:response.status,attempt:attempt+1});if(attempt<3){await response.arrayBuffer();await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));continue;}}return response;}};
let cursor = 0;
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const information = html => html.match(/<h2>楽曲情報<\/h2>\s*(<dl>[\s\S]*?<\/dl>)/)?.[1];
await Promise.all(Array.from({ length: Math.min(6, targets.length) }, async () => {
  while (cursor < targets.length) {
    const { game, song } = targets[cursor++];
    const path = `/${game}/songs/${song.stableSongId}/`;
    const url = new URL(prefix + path, origin);
    url.searchParams.set('release', commit);
    const response = await get(url);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.deepEqual([...html.matchAll(/<dt>(作詞|作曲|編曲)<\/dt>/g)].map(m => m[1]), ['作詞', '作曲', '編曲'], path);
    assert.ok(!html.includes('原曲の作曲者'), path);
    const local = fs.readFileSync(`${directory}${path}index.html`, 'utf8');
    // Compare the actual validated root or subpath build directly.
    const expectedHTML = local;
    const actual = information(html), expected = information(expectedHTML);
    assert.ok(actual && expected, 'Song information section exists ' + path);
    assert.equal(actual.replace(/\r\n/g, '\n'), expected.replace(/\r\n/g, '\n'), 'All displayed fields and credit links match the build ' + path);
    results.push({ game, id: song.id, type: song.type, path, status: 200, labels: ['作詞', '作曲', '編曲'], infoSha256: hash(actual) });
    if (results.length % 100 === 0) console.log(`Verified ${results.length}/${targets.length} published song details`);
  }
}));
assert.equal(results.length, targets.length);
results.sort((a, b) => a.game.localeCompare(b.game) || a.id - b.id);
const result = { status: 'PASS', commit, verifiedAt: new Date().toISOString(), origin, prefix, mode, details: results.length, oldComposerLabelCount: 0, everyDisplayedFieldAndCreditLinkMatches: true, retries, results };
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, commit, mode, details: result.details, oldComposerLabelCount: 0 }));
