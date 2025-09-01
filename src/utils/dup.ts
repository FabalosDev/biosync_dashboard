// src/utils/dup.ts
export type DupInfo = { tag: "YES" | "NO"; reason: string };

/** YES if either field is non-empty; NO otherwise. */
export function getDupInfoFromItem(it: any): DupInfo {
  const norm = (v: unknown) =>
    typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

  // Support camelCase and snake_case
  const linkText = norm(it.duplicateLink ?? it.duplicate_link);
  const keywordText = norm(it.duplicateKeyword ?? it.duplicate_keyword);

  const hasAny = !!(linkText || keywordText);

  // We'll keep the raw reason ONLY for tooltip, not visible in UI
  const reason = [linkText, keywordText].filter(Boolean).join(" | ");

  return hasAny ? { tag: "YES", reason } : { tag: "NO", reason: "" };
}
