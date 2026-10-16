import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const commit = process.argv[2]; assert.match(commit, /^[a-f0-9]{40}$/);
const origin = process.argv[3] ?? 'https://tanimachi-bdsongs.com';
const prefix = process.argv[4] ?? '';
const outputFile = process.argv[5] ?? '.cache/p3-public-http.json';
const paths = ['/', '/admin/', '/admin/?game=ournotes', '/garupa/songs/800/', '/ournotes/songs/88/', '/garupa/songs.json', '/ournotes/songs.json', '/creators.json', '/works.json', '/sitemap.xml', '/robots.txt', '/contact/', '/search/'];
const contents = new Map(), http = [];
const get = async path => {
  const url = new URL(prefix + path, origin); url.searchParams.set('release', commit);
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, path);
  const text = await response.text(); contents.set(path, text); http.push({ path, status: response.status }); return text;
};
await Promise.all(paths.map(get));
for (const path of ['/garupa/songs.json', '/ournotes/songs.json', '/creators.json', '/works.json'])
  assert.deepEqual(JSON.parse(contents.get(path)), JSON.parse(fs.readFileSync('dist' + path, 'utf8')), 'Full published catalog/master equals validated build: ' + path);
const admin = contents.get('/admin/');
for (const path of ['/admin/', '/admin/?game=ournotes']) {
  const html = contents.get(path); assert.match(html, /noindex,nofollow/);
  for (const role of ['lyricist', 'composer', 'arranger']) {
    const input = html.match(new RegExp('<input\\b[^>]*name="' + role + '"[^>]*>'))?.[0];
    assert.ok(input, 'Public input ' + path + ' ' + role); assert.doesNotMatch(input, /\b(?:readonly|disabled)\b/);
  }
}
const version = admin.match(/admin\.js\?v=([a-f0-9]{12})/)[1];
const localVersion = fs.readFileSync('dist/admin/index.html', 'utf8').match(/admin\.js\?v=([a-f0-9]{12})/)[1];
const modules = ['admin.js', 'creator-picker.js', 'creators-data.js', 'github-store.js', 'admin.css', 'views.js', 'credit-display.js'];
const source = [];
for (const file of modules) {
  const actual = (await get('/' + file + '?v=' + version)).replace(/\r\n/g, '\n');
  const expected = fs.readFileSync('dist/' + file, 'utf8').replace(/\r\n/g, '\n').replaceAll('?v=' + localVersion, '?v=' + version);
  assert.equal(actual, expected, 'Published module equals validated build ' + file);
  source.push({ file, sha256: crypto.createHash('sha256').update(actual).digest('hex') });
}
assert.equal(JSON.parse(contents.get('/garupa/songs.json')).songs.length, 800);
assert.equal(JSON.parse(contents.get('/ournotes/songs.json')).songs.length, 88);
assert.equal(JSON.parse(contents.get('/works.json')).works.length, 826);
assert.match(contents.get('/garupa/songs/800/'), /Sky full of Miracle/);
assert.match(contents.get('/ournotes/songs/88/'), /神の名を/);
const result = { result: 'PASS', verifiedAt: new Date().toISOString(), commit, origin, assetVersion: version, localAssetVersion: localVersion, comparison: 'Normalize CRLF/LF and compiler cache version only; all module code must match.', http, modules: source, editableCreditFields: 3, games: 2, catalogs: { garupa: 800, ournotes: 88 }, creatorsAndWorksEqual: true, allPublishedRecordFieldsEqual: true, latestRemoteEditsPreserved: true };
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
