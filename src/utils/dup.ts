// src/utils/dup.ts
export type DupInfo = { tag: "YES" | "NO"; reason: string };

const normStr = (v: unknown): string => (v == null ? "" : String(v).trim());

const isAffirmative = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  const s = normStr(v).toLowerCase();
  if (!s) return false;
  // treat common "true" values as yes
  return ["yes", "true", "y", "dup", "duplicate", "1"].includes(s);
};

const isNegative = (v: unknown): boolean => {
  const s = normStr(v).toLowerCase();
  return ["no", "false", "0", "none", "n"].includes(s);
};

/** YES if any known dup flags / fields are affirmative or contain non-empty text. */
export function getDupInfoFromItem(it: any): DupInfo {
  if (!it || typeof it !== "object") return { tag: "NO", reason: "" };

  // 1) Explicit boolean-ish flags commonly seen
  const flagKeys = [
    "dup",
    "isDup",
    "is_duplicate",
    "duplicate",
    "hasDuplicate",
    "isDuplicate",
    "duped",
  ];
  for (const k of flagKeys) {
    if (k in it) {
      const v = (it as any)[k];
      if (isAffirmative(v)) return { tag: "YES", reason: `${k}=${normStr(v)}` };
      if (isNegative(v)) continue; // explicit no
    }
  }

  // 2) Text / link reason fields (your earlier code + common variants)
  const textKeys = [
    "duplicateLink",
    "duplicate_link",
    "duplicateURL",
    "duplicate_url",
    "dupLink",
    "dup_link",
    "duplicateKeyword",
    "duplicate_keyword",
    "dupKeyword",
    "dup_keyword",
    "dupReason",
    "dup_reason",
    "duplicateReason",
    "duplicate_reason",
    // your sheet often sets a simple "dup" string like "YES" or reason text
    "dup", // also treat as text if not strictly boolean
  ];

  const reasons: string[] = [];
  for (const k of textKeys) {
    if (k in it) {
      const val = normStr((it as any)[k]);
      if (val && !isNegative(val)) {
        reasons.push(`${k}:${val}`);
      }
    }
  }
  if (reasons.length) {
    return { tag: "YES", reason: reasons.join(" | ") };
  }

  // 3) Generic scan fallback: ANY key with "dup" or "duplicat" containing a non-empty, non-"no"/"false" value
  //    (helps if upstream changes field names)
  for (const [k, v] of Object.entries(it)) {
    if (!/(dup|duplicat)/i.test(k)) continue;
    const s = normStr(v);
    if (s && !isNegative(s)) {
      if (isAffirmative(s) || s.length > 0) {
        return { tag: "YES", reason: `${k}:${s}` };
      }
    }
  }

  return { tag: "NO", reason: "" };
}
