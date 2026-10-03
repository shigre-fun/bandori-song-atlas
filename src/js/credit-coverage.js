import { CREDIT_ROLES } from "./credit-display.js";

// Dataset coverage is editorial metadata. A single newly credited record cannot make a role complete.
export const DEFAULT_ROLE_COVERAGE = Object.freeze({
  lyricist: "unprepared",
  composer: "ready",
  arranger: "unprepared",
});
export function roleCoverage(value = DEFAULT_ROLE_COVERAGE) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((r) => !CREDIT_ROLES.includes(r)) ||
    CREDIT_ROLES.some((r) => !["ready", "unprepared"].includes(value[r]))
  )
    throw new Error(
      "roleCoverageは各担当のready/unpreparedを指定してください。",
    );
  return value;
}
export const availableCreditRoles = (coverage) =>
  CREDIT_ROLES.filter((r) => roleCoverage(coverage)[r] === "ready");
