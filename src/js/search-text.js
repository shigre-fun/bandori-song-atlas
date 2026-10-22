// Search normalization is independent of identity matching and display/sort data.
export function normalizeSearch(value, foldVoicing = true) {
  const text = (value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  return (
    foldVoicing ? text.normalize("NFD").replace(/\p{M}/gu, "") : text
  ).replace(/[\s\p{P}\p{S}]/gu, "");
}

// Kana in the title anchors the corresponding reading of each kanji run.
// Only a unique, complete alignment is used; uncertain readings fall back to
// the existing title/reading search. No dictionary guesses or typo matching.
const readingCache = new Map();
function readingParts(title, reading, foldVoicing) {
  const key = JSON.stringify([title, reading, foldVoicing]);
  if (readingCache.has(key)) return readingCache.get(key);
  const text = normalizeSearch(title, foldVoicing),
    kana = normalizeSearch(reading, foldVoicing);
  const parts =
    text.match(/[\p{Script=Han}々〆]+|[^\p{Script=Han}々〆]+/gu) || [];
  const alignments = [];
  function align(index, offset, result) {
    if (alignments.length > 1) return;
    if (index === parts.length) {
      if (offset === kana.length) alignments.push(result);
      return;
    }
    const part = parts[index];
    if (/^[\p{Script=Han}々〆]+$/u.test(part)) {
      for (let end = offset + 1; end <= kana.length; end++)
        align(index + 1, end, [...result, [part, kana.slice(offset, end)]]);
    } else if (kana.startsWith(part, offset)) {
      align(index + 1, offset + part.length, [...result, [part]]);
    }
  }
  if (parts.length && kana && !/\p{Script=Han}/u.test(kana)) align(0, 0, []);
  const result = alignments.length === 1 ? alignments[0] : [];
  readingCache.set(key, result);
  return result;
}

export function matchesMixedReading(title, reading, query, foldVoicing = true) {
  const key = normalizeSearch(query, foldVoicing);
  if (!key) return true;
  let offsets = new Set();
  for (const alternatives of readingParts(title, reading, foldVoicing)) {
    const next = new Set();
    for (const text of alternatives) {
      if (text.includes(key)) return true;
      for (const offset of offsets) {
        const rest = key.slice(offset);
        if (text.startsWith(rest)) return true;
        if (rest.startsWith(text)) next.add(offset + text.length);
      }
      for (let size = 1; size < key.length && size <= text.length; size++)
        if (text.endsWith(key.slice(0, size))) next.add(size);
    }
    offsets = next;
  }
  return false;
}
