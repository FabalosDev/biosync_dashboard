// utils/text.ts (optional helper file)
export function captionLen(s: string | null | undefined): number {
  if (!s) return 0;
  // Count by Unicode code points (handles emoji/surrogates)
  return Array.from(String(s)).length;
}
export function captionClass(len: number, max = 2000, warnAt = 1800): string {
  if (len > max) return "bg-red-100 text-red-600";
  if (len > warnAt) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}
