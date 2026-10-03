import { CREDIT_ROLES } from "./credit-display.js";
const fail = (message) => {
  throw new Error(message);
};
const nonempty = (value, limit = 500) =>
  typeof value === "string" && !!value.trim() && value.length <= limit;

export function validateCreditStructure(song) {
  if (!Array.isArray(song.credits)) fail("creditsは配列で指定してください。");
  const seen = new Set();
  for (const c of song.credits) {
    if (!c || !/^cr-[0-9]{4,}$/.test(c.creatorId) || seen.has(c.creatorId))
      fail("Creator relationが不正または重複しています。");
    if (
      !Array.isArray(c.roles) ||
      !c.roles.length ||
      c.roles.some((r) => !CREDIT_ROLES.includes(r)) ||
      new Set(c.roles).size !== c.roles.length
    )
      fail("credit rolesが不正または重複しています。");
    if (c.displayOverride !== undefined && !nonempty(c.displayOverride, 2000))
      fail("displayOverrideは空でない文字列です。");
    if (
      c.displayOverrides !== undefined &&
      (!c.displayOverrides ||
        typeof c.displayOverrides !== "object" ||
        Array.isArray(c.displayOverrides) ||
        Object.entries(c.displayOverrides).some(
          ([role, value]) => !c.roles.includes(role) || !nonempty(value, 2000),
        ))
    )
      fail("displayOverridesは登録されたrole別の空でない表示名です。");
    seen.add(c.creatorId);
  }
  if (
    !song.creditDisplay ||
    typeof song.creditDisplay !== "object" ||
    Array.isArray(song.creditDisplay)
  )
    fail("creditDisplayが不正です。");
  for (const [role, parts] of Object.entries(song.creditDisplay)) {
    if (!CREDIT_ROLES.includes(role) || !Array.isArray(parts))
      fail("creditDisplay roleが不正です。");
    const linked = new Set();
    for (const p of parts) {
      if (!p || typeof p !== "object" || Array.isArray(p))
        fail("creditDisplayが不正です。");
      if (Object.hasOwn(p, "creatorId")) {
        if (
          Object.keys(p).length !== 1 ||
          !song.credits.some(
            (c) => c.creatorId === p.creatorId && c.roles.includes(role),
          )
        )
          fail("creditDisplayのCreator relationがありません。");
        linked.add(p.creatorId);
      } else if (
        typeof p.text !== "string" ||
        p.text.length > 2000 ||
        Object.keys(p).some((k) => !["text", "unresolved"].includes(k)) ||
        (p.unresolved !== undefined && p.unresolved !== true)
      )
        fail("creditDisplay textが不正です。");
    }
    if (
      song.credits.some(
        (c) => c.roles.includes(role) && !linked.has(c.creatorId),
      )
    )
      fail("表示されないCreator relationがあります。");
  }
  for (const c of song.credits)
    for (const role of c.roles)
      if (!song.creditDisplay[role])
        fail("creditDisplayがroleを欠いています。");
  return song;
}
