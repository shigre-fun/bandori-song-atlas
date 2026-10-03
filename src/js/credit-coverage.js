import { CREDIT_ROLES } from "./credit-display.js";

// Dataset coverage is editorial metadata. A single newly credited record cannot make a role complete.
export const DEFAULT_ROLE_COVERAGE = Object.freeze({
  lyricist: "unprepared",
  composer: "ready",
  arranger: "unprepared",
});
export function roleCoverage(value = DEFAULT_ROLE_COVERAGE, game = "") {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((r) => !CREDIT_ROLES.includes(r)) ||
    CREDIT_ROLES.some(
      (r) =>
        !(
          ["ready", "partial", "unprepared"].includes(value[r]) ||
          (value[r] &&
            typeof value[r] === "object" &&
            !Array.isArray(value[r]) &&
            Object.keys(value[r]).length === 2 &&
            ["garupa", "ournotes"].every((g) =>
              ["ready", "partial", "unprepared"].includes(value[r][g]),
            ))
        ),
    )
  )
    throw new Error(
      "roleCoverageは各担当・ゲームのready/partial/unpreparedを指定してください。",
    );
  return Object.fromEntries(
    CREDIT_ROLES.map((r) => {
      const v = value[r];
      return [
        r,
        typeof v === "string"
          ? v
          : game
            ? v[game]
            : Object.values(v).every((x) => x === "ready")
              ? "ready"
              : Object.values(v).every((x) => x === "unprepared")
                ? "unprepared"
                : "partial",
      ];
    }),
  );
}
export const availableCreditRoles = (coverage, game = "") =>
  CREDIT_ROLES.filter((r) => roleCoverage(coverage, game)[r] !== "unprepared");
