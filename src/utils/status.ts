// src/utils/status.ts
export type UINormalizedStatus = "Pending" | "Approved" | "Rejected" | "Final";

export function normalizeStatus(raw: unknown): UINormalizedStatus {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (s === "approved") return "Approved";
  if (s === "rejected" || s === "failed" || s === "error") return "Rejected";

  // treat anything that means already done/posted as Final (hidden)
  if (s === "posted" || s === "done" || s === "success" || s === "rss_success")
    return "Final";

  // unknown/blank → Pending so editors can act
  if (
    !s ||
    s === "pending" ||
    s === "queue" ||
    s === "queued" ||
    s === "for review"
  )
    return "Pending";

  // default: keep editable
  return "Pending";
}

export const isPending = (st: UINormalizedStatus | string | undefined) =>
  normalizeStatus(st) === "Pending";
