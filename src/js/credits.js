// These punctuation marks belong to a single credited name, not a collaboration.
const indivisibleNames = [
  "Fear, and Loathing in Las Vegas",
  "MYTH & ROID",
  "神様、僕は気づいてしまった",
  "アイナ・ジ・エンド",
  "メガテラ・ゼロ",
  "ユリイ・カノン",
  "ブレンド・A",
  "LIP×LIP",
];
const opening = new Map([
  ["(", ")"],
  ["（", "）"],
  ["[", "]"],
  ["〈", "〉"],
]);

export function creditParts(value) {
  if (!value) return [];
  // This existing credit uses a space between two full names.
  if (value === "大橋卓弥 常田真太郎")
    return [
      { text: "大橋卓弥", name: true },
      { text: " ", name: false },
      { text: "常田真太郎", name: true },
    ];
  const parts = [];
  const brackets = [];
  let start = 0;
  let index = 0;
  const split = (separator) => {
    const text = value.slice(start, index);
    if (text) parts.push({ text, name: Boolean(text.trim()) });
    if (separator) parts.push({ text: separator, name: false });
    index += separator.length;
    start = index;
  };
  while (index < value.length) {
    if (!brackets.length) {
      const atomic = indivisibleNames.find(
        (name) =>
          value.slice(index, index + name.length).toLowerCase() ===
          name.toLowerCase(),
      );
      if (atomic) {
        index += atomic.length;
        continue;
      }
      const separator =
        /^(?:\s+featuring\s+|\s+feat(?:\.\s*|\s+)|[、,，/／・&＆×;；\n]+)/i.exec(
          value.slice(index),
        );
      if (separator) {
        split(separator[0]);
        continue;
      }
    }
    const character = value[index];
    if (opening.has(character)) brackets.push(opening.get(character));
    else if (character === brackets.at(-1)) {
      brackets.pop();
      // Character/voice-actor credits can be adjacent without punctuation.
      if (
        !brackets.length &&
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
          value[index + 1] || "",
        )
      ) {
        index++;
        split("");
        continue;
      }
    }
    index++;
  }
  split("");
  return parts;
}

export function creditKey(value) {
  return (value || "")
    .normalize("NFKC")
    .replace(/\([^)]*\)/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\s/g, "")
    .toLowerCase();
}

export function matchesCredit(value, name) {
  const key = creditKey(name);
  return (
    Boolean(key) &&
    creditParts(value).some((part) => part.name && creditKey(part.text) === key)
  );
}
