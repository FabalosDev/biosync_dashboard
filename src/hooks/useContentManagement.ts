import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { normalizeStatus, isPending } from "@/utils/status";

/** ===== Types ===== */
type ButtonStatus = "approved" | "rejected" | null;
type ButtonStates = Record<string, { status: ButtonStatus; timestamp: number }>;

export interface ContentRow {
  id: string;
  index: number; // ✅ Sheets Index column (absolute row)
  rowNumber: number; // = index (kept for compat)
  inputText: string;
  headline: string;
  caption: string;
  approval: string;
  feedback: string;
  imageGenerated: string;
  imageQuery: string;
  columnHStatus: string; // normalized H
  regeneratedImage: string;
  status: "Approved" | "Rejected" | "Pending";
  link: string;
  priority: string;
  truthScore: string;
  category: string;
  keywords: string;
  dup: string;
  uid: string;
  timestamp: number;
  sheet: "text/image";
  pubDate: string;
}

export interface NewsRow {
  id: string;
  index: number; // ✅
  rowNumber: number; // = index
  actualArrayIndex: number;
  articleTitle: string;
  caption: string;
  articleAuthors: string;
  source: string;
  link: string;
  pubDate: string;
  creator: string;
  status: "Approved" | "Rejected" | "Pending";
  timestamp: number;
  sheet: "HEALTH NEWS USA- THUMBNAILS";
  imageGenerated: string;
  approval: string;
  keywords: string;
  priority: string;
  category: string;
  truthScore: string;
  dup: string;
}

export interface RssNewsRow {
  id: string;
  index: number; // ✅
  rowNumber: number; // = index
  actualArrayIndex: number;
  title: string;
  contentSnippet: string;
  source: string;
  link: string;
  creator: string;
  date: string;
  proceedToProduction: string;
  status: "Approved" | "Rejected" | "Pending";
  timestamp: number;
  sheet: "HNN RSS";
  uid: string;
  type: string;
  truthScore: string;
  keywords: string;
  dup: string;
  category: string;
  priority: string;
}

export interface RssRow {
  id: string;
  index: number; // ✅
  rowNumber: number; // = index
  actualArrayIndex: number;
  title: string;
  contentSnippet: string;
  source: string;
  link: string;
  creator: string;
  date: string;
  proceedToProduction: string;
  status: "Approved" | "Rejected" | "Pending";
  timestamp: number;
  sheet: "Thumbnail System";
  uid: string;
  type: string;
  truthScore: string;
  keywords: string;
  dup: string;
  category: string;
  priority: string;
}

export interface DentistryRow {
  id: string;
  index: number; // ✅
  rowNumber: number; // = index
  actualArrayIndex: number;
  imageGenerated: string;
  headline: string;
  caption: string;
  source: string;
  link: string;
  pubDate: string;
  status: "Approved" | "Rejected" | "Pending";
  timestamp: number;
  sheet: "DENTAL" | "Dentistry";
  keywords: string;
  priority: string;
  category: string;
  truthScore: string;
  dup: string;
  columnHStatus: string; // normalized H
  hCell: string; // raw H (debug)
}

export interface RssDentistryRow {
  id: string;
  index: number; // ✅
  rowNumber: number; // = index
  actualArrayIndex: number;
  title: string;
  contentSnippet: string;
  source: string;
  link: string;
  creator: string;
  date: string;
  proceedToProduction: string;
  status: "Approved" | "Rejected" | "Pending";
  timestamp: number;
  sheet: "Dental RSS";
  uid: string;
  type: string;
  truthScore: string;
  keywords: string;
  dup: string;
  category: string;
  priority: string;
}

type TimelineRow = Record<string, unknown>;

/** ===== Hook ===== */
export const useContentManagement = () => {
  const { toast } = useToast();

  // Data
  const [contentData, setContentData] = useState<ContentRow[]>([]);
  const [newsData, setNewsData] = useState<NewsRow[]>([]);
  const [rssNewsData, setRssNewsData] = useState<RssNewsRow[]>([]);
  const [rssData, setRssData] = useState<RssRow[]>([]);
  const [dentistryData, setDentistryData] = useState<DentistryRow[]>([]);
  const [rssDentistryData, setRssDentistryData] = useState<RssDentistryRow[]>(
    []
  );
  const [timelineData, setTimelineData] = useState<TimelineRow[]>([]);
  const [approvedData, setApprovedData] = useState<ContentRow[]>([]);
  const [publishedData, setPublishedData] = useState<ContentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    published: 0,
    pendingBreakdown: { no: 0, regenerated: 0, pendingApproval: 0, empty: 0 },
  });
  const [trackingStats, setTrackingStats] = useState({
    approved: 0,
    sentForRegeneration: 0,
    pendingApproval: 0,
    published: 0,
  });
  const [buttonStates, setButtonStates] = useState<ButtonStates>({});

  /** ===== Sheet IDs & URLs ===== */
  const CONTENT_SHEET_ID = "1C1fnywWU1RMUQ4UmoKBurT7pI7WaffX2pn-6T45wVtY";
  const NEWS_SHEET_ID = "1FNumIx65f0J1OoU8MWX4KwROQwis-TFB_rmwmr3e-WU";
  const RSS_NEWS_SHEET_ID = "1u6hNIrJM91COY54xzQrBDU6rfzrBIRpk2XhKHQawfsI";
  const RSS_SHEET_ID = "1u6hNIrJM91COY54xzQrBDU6rfzrBIRpk2XhKHQawfsI";
  const DENTIST_SHEET_ID = "1C1fnywWU1RMUQ4UmoKBurT7pI7WaffX2pn-6T45wVtY";
  const RSS_DENTIST_SHEET_ID = "1u6hNIrJM91COY54xzQrBDU6rfzrBIRpk2XhKHQawfsI";

  const CONTENT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${CONTENT_SHEET_ID}/gviz/tq?tqx=out:json&sheet=text/image`;
  const NEWS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${NEWS_SHEET_ID}/gviz/tq?tqx=out:json&sheet=HEALTH%20NEWS%20USA-%20THUMBNAILS`;
  const RSS_NEWS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${RSS_NEWS_SHEET_ID}/gviz/tq?tqx=out:json&sheet=HNN%20RSS`;
  const RSS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${RSS_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Thumbnail%20System`;
  const DENTIST_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DENTIST_SHEET_ID}/gviz/tq?tqx=out:json&sheet=DENTAL`;
  const RSS_DENTIST_SHEET_URL = `https://docs.google.com/spreadsheets/d/${RSS_DENTIST_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Dental%20RSS`;

  /** ===== Column map (0-based indexes) =====
   * Adjust ONLY these if you ever move columns in Sheets.
   */

  // Index columns (your new fixed index column per tab)
  const CONTENT_INDEX_COL = 31; // AE for "text/image"
  const NEWS_INDEX_COL = 31; // AE for "HEALTH NEWS USA- THUMBNAILS"
  const RSS_INDEX_COL = 30; // AD for "Thumbnail System"
  const RSS_NEWS_INDEX_COL = 30; // AD for "HNN RSS"
  const DENTAL_INDEX_COL = 31; // AE for "DENTAL"
  const RSS_DENTAL_INDEX_COL = 30; // AD for "Dental RSS"

  // Status columns per tab
  const CONTENT_STATUS_COL_H = 7; // H (YES/NO/Pending Approval) – content & dental content
  const NEWS_STATUS_COL = 18; // S (ProceedToProduction) – news content
  const RSS_STATUS_COL = 18; // S (ProceedToProduction) – media RSS + HNN RSS + Dental RSS

  /** ===== Helpers ===== */
  const parseGViz = (text: string) => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("Invalid GViz payload");
    return JSON.parse(text.slice(start, end + 1)) as {
      table?: { rows?: Array<{ c?: Array<{ v?: unknown; f?: unknown }> }> };
    };
  };

  // Pull string from a cell (prefers .f over .v)
  const cellVal = (
    c: Array<{ v?: unknown; f?: unknown }>,
    idx: number
  ): string =>
    String(((c[idx] as any)?.f ?? (c[idx] as any)?.v ?? "") as string).trim();

  // Try to find a status-like column if none is explicitly given
  const detectStatusIndex = (cells: Array<{ v?: unknown; f?: unknown }>) => {
    const candidates = [18, 20, 21, 22, 17, 19]; // S, U, V, W, Q, T
    const looksLikeStatus = (s: string) =>
      /(approved|posted|rejected|pending|queue|queued|review|ready|rss_success|fail|error|hold)/i.test(
        s
      );

    for (const i of candidates) {
      const s = cellVal(cells, i);
      if (s && looksLikeStatus(s)) return i;
    }
    for (let i = 0; i < cells.length; i++) {
      const s = cellVal(cells, i);
      if (s && looksLikeStatus(s)) return i;
    }
    return 18; // default fallback: S
  };

  // ✅ NOW accepts an optional preferredIdx (e.g., RSS_STATUS_COL)
  function getRssStatus(
    c: Array<{ v?: unknown; f?: unknown }>,
    preferredIdx?: number
  ): string {
    if (typeof preferredIdx === "number") {
      const val = cellVal(c, preferredIdx);
      if (val) return val;
    }
    const idx = detectStatusIndex(c);
    return cellVal(c, idx);
  }

  const norm = (s: unknown) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " ");

  const extractUrlFromHyperlink = (s: string): string | null => {
    if (!s) return null;
    const m1 = s.match(/=HYPERLINK\(\s*"([^"]+)"/i);
    if (m1?.[1]) return m1[1];
    const m2 = s.match(/href="([^"]+)"/i);
    if (m2?.[1]) return m2[1];
    const m3 = s.match(/https?:\/\/[^\s"'<>]+/i);
    if (m3?.[0]) return m3[0];
    return null;
  };

  const normalizePublishCell = (raw: unknown): string => {
    const s = String(raw ?? "").trim();
    if (!s) return "";
    return extractUrlFromHyperlink(s) ?? s;
  };

  const isPublishedStatus = (raw: string): boolean => {
    const s = normalizePublishCell(raw);
    if (!s) return false;
    const parts = s.split(/[,\|\s]+/).filter(Boolean);
    return parts.some((p) => {
      const x = p.toLowerCase();
      if (/^\d{12,22}$/.test(x)) return true;
      if (/^urn:li:(share|activity|ugcpost):\d+$/i.test(p)) return true;
      if (/linkedin\.com\/.*(share|activity|ugcpost)/i.test(p)) return true;
      if (/(facebook\.com|fb\.watch|fb\.me)/i.test(p)) return true;
      if (/(twitter\.com|x\.com)\/.+\/status\/\d+/i.test(p)) return true;
      if (/^https?:\/\//i.test(p)) return true;
      if (/\b(posted|published)\b/i.test(p)) return true;
      return false;
    });
  };

  /** ===== Keys & processed state ===== */
  const createItemKey = useCallback(
    (item: {
      sheet: string;
      index?: number;
      rowNumber?: number;
      row?: number;
      id: string;
    }) =>
      `${item.sheet}-${item.index ?? item.rowNumber ?? item.row ?? 0}-${
        item.id
      }`,
    []
  );

  const isItemProcessed = useCallback(
    (item: {
      sheet: string;
      index?: number;
      rowNumber?: number;
      row?: number;
      id: string;
    }) => {
      const itemKey = createItemKey(item);
      const status = buttonStates[itemKey]?.status;
      return status !== null && status !== undefined;
    },
    [buttonStates, createItemKey]
  );

  const isPendingApproval = (raw: unknown) => {
    const v = norm(raw);
    return (
      v === "pending approval" ||
      v === "pending" ||
      v === "pending review" ||
      v === "review"
    );
  };

  /** ===== UI helper ===== */
  // Buttons should show for RSS tabs when col S is exactly "RSS_Success";
  // for non-RSS tabs, keep your existing "Pending"/Pending Approval logic.
  const isActionable = useCallback(
    (item: any) => {
      const sheet = String(item?.sheet ?? "");
      // prefer the raw S value you stored; fallback to status
      const s = String(item?.proceedToProduction ?? item?.status ?? "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // strip zero-width
        .trim();

      // RSS tabs
      if (
        sheet === "Thumbnail System" ||
        sheet === "HNN RSS" ||
        sheet === "Dental RSS"
      ) {
        return s === "RSS_Success";
      }

      // Non-RSS tabs (content/news/dentistry)
      if (typeof item?.status === "string" && item.status === "Pending")
        return true;
      if ("columnHStatus" in (item ?? {}))
        return isPendingApproval(item.columnHStatus);
      return false;
    },
    [isPendingApproval]
  );

  /** ===== Fetchers ===== */

  const fetchContentData = useCallback(async () => {
    // helper: read DRAFTS flag from AE (tries 31, then 30)
    const draftsYes = (c: Array<{ v?: unknown; f?: unknown }>) => {
      const ae1 = cellVal(c, 31); // AE (your code treats AE as 31)
      const ae2 = cellVal(c, 30); // fallback if indexing shifts
      const v = norm(ae1 || ae2);
      return v === "done";
    };

    try {
      const url = `${CONTENT_SHEET_URL}${
        CONTENT_SHEET_URL.includes("?") ? "&" : "?"
      }_cb=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      const txt = await res.text();
      const json = parseGViz(txt);

      // first build ALL rows (so approved/published stats still work)
      const allRows = (json.table?.rows ?? []).map((row, idx): ContentRow => {
        const c = row.c ?? [];
        const index = Number(cellVal(c, CONTENT_INDEX_COL)) || idx + 2;

        // H = approval column (YES/NO/Pending Approval)
        const hCellRaw = cellVal(c, CONTENT_STATUS_COL_H);
        const columnHStatus = normalizePublishCell(hCellRaw);

        const approval = String(c[3]?.v ?? "").trim();
        const status: ContentRow["status"] =
          approval.toUpperCase() === "YES"
            ? "Approved"
            : approval.toUpperCase() === "NO"
            ? "Rejected"
            : "Pending";

        return {
          id: `content-${idx}`,
          index,
          rowNumber: index,
          inputText: String(c[0]?.v ?? ""),
          headline: String(c[20]?.v ?? ""),
          caption: String(c[2]?.v ?? ""),
          approval,
          feedback: String(c[4]?.v ?? ""),
          imageGenerated: String(c[5]?.v ?? ""),
          imageQuery: String(c[9]?.v ?? ""),
          columnHStatus, // raw-ish H (with hyperlink normalization)
          regeneratedImage: String(c[10]?.v ?? ""),
          status,
          timestamp: Date.now() - idx * 1000,
          sheet: "text/image",
          link: String(c[14]?.v ?? ""),
          priority: String(c[15]?.v ?? ""),
          truthScore: String(c[16]?.v ?? ""),
          category: String(c[17]?.v ?? ""),
          keywords: String(c[18]?.v ?? ""),
          dup: (c[21]?.v ?? "").toString().trim() !== "" ? "YES" : "NO",
          uid: String(c[13]?.v ?? ""),
          pubDate: String(c[26]?.v ?? ""),
        };
      });

      // keep only: DRAFTS(AE)=YES AND APPROVAL(H)=pending approval
      const filtered = (json.table?.rows ?? [])
        .map((row, idx): ContentRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, CONTENT_INDEX_COL)) || idx + 2;

          const hCellRaw = cellVal(c, CONTENT_STATUS_COL_H);
          const draftOK = draftsYes(c);
          const approvalPending = isPendingApproval(hCellRaw);

          if (!(draftOK && approvalPending)) return null;

          // rebuild the row (same as above) but only for those that pass the filter
          return allRows[idx];
        })
        .filter((r): r is ContentRow => r !== null)
        .reverse();

      setContentData(filtered);

      // keep your stats sources intact
      const approved = allRows.filter((r) => r.columnHStatus === "YES");
      const published = allRows.filter((r) =>
        isPublishedStatus(r.columnHStatus)
      );
      setApprovedData(approved);
      setPublishedData(published);
    } catch (e) {
      console.error("Error fetching content:", e);
      setContentData([]);
    }
  }, [CONTENT_SHEET_URL]);

  const fetchNewsData = useCallback(async () => {
    try {
      // optional: cache-bust GViz (helps when Sheets caching bites)
      const url = `${NEWS_SHEET_URL}${
        NEWS_SHEET_URL.includes("?") ? "&" : "?"
      }_cb=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      const txt = await res.text();
      const json = parseGViz(txt);

      const all = (json.table?.rows ?? [])
        .map((row, idx): NewsRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, NEWS_INDEX_COL)) || idx + 2;

          // Columns we care about for the filter:
          // F = 5 (PRODUCED), J = 9 (APPROVAL)
          const producedRaw = cellVal(c, 5);
          const approvalRaw = cellVal(c, 9);

          const producedYes = norm(producedRaw) === "yes";
          const pendingApproval = isPendingApproval(approvalRaw); // you already defined this helper

          // If either condition fails, skip the row entirely
          if (!(producedYes && pendingApproval)) return null;

          const articleTitle = String(c[0]?.v ?? "");
          const caption = String(c[8]?.v ?? "");
          if (!articleTitle && !caption) return null;

          return {
            id: `news-${idx}`,
            index,
            rowNumber: index,
            actualArrayIndex: idx,

            articleTitle,
            caption,
            articleAuthors: String(c[3]?.v ?? ""),
            source: String(c[11]?.v ?? ""),
            link: String(c[1]?.v ?? ""),
            pubDate: String(c[2]?.v ?? ""),
            creator: String(c[3]?.v ?? ""),

            // For UI, anything passing this filter is "Pending" (for approval)
            status: "Pending",

            timestamp: Date.now() - idx * 1000,
            sheet: "HEALTH NEWS USA- THUMBNAILS",

            imageGenerated: String(c[6]?.v ?? ""), // keep if you use it elsewhere
            approval: approvalRaw, // raw J value
            keywords: String(c[18]?.v ?? ""),
            priority: String(c[19]?.v ?? ""),
            category: String(c[20]?.v ?? ""),
            truthScore: String(c[21]?.v ?? ""),
            dup: (c[27]?.v ?? "").toString().trim() !== "" ? "YES" : "NO",
          };
        })
        .filter((r): r is NewsRow => r !== null)
        .reverse();

      setNewsData(all);
    } catch (e) {
      console.error("Error fetching news:", e);
      setNewsData([]);
    }
  }, [NEWS_SHEET_URL]);

  // helper: normalize and match variants like "RSS Success", "rss_success✅", "rss_success_ok"
  const isRssSuccess = (v: unknown) => {
    const s = norm(String(v ?? ""))
      .replace(/[^\w]+/g, "_") // unify spaces, dashes, emojis -> "_"
      .replace(/^_+|_+$/g, ""); // trim underscores
    return s === "RSS_Success" || s.startsWith("RSS_Success_");
  };

  const FINAL_STATUSES = new Set(["REJECT", "Approved", "Drafted", "POSTED"]);

  const fetchRssNewsData = useCallback(async () => {
    try {
      const res = await fetch(RSS_NEWS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const seen = new Set<string>();

      const rows = (json.table?.rows ?? [])
        .map((row, idx): RssNewsRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, RSS_NEWS_INDEX_COL)) || idx + 2;

          const stateRaw = rssStatusFrom(c); // ← cleaned raw S
          if (stateRaw !== "RSS_Success") return null;

          const uid = String(cellVal(c, 2) ?? "");
          const link = String(cellVal(c, 5) ?? "");
          const key = uid || link;

          if (key) {
            if (seen.has(key)) return null;
            seen.add(key);
          }

          return {
            id: `hnn-${idx}`,
            index,
            rowNumber: index,
            actualArrayIndex: idx,
            title: cellVal(c, 9),
            contentSnippet: cellVal(c, 11),
            source: cellVal(c, 7),
            link,
            creator: cellVal(c, 8),
            date: cellVal(c, 3),
            proceedToProduction: stateRaw,
            status: "Pending", // keep raw token (e.g., "RSS_Success")
            timestamp: Date.now() - idx * 1000,
            sheet: "HNN RSS",
            uid,
            type: cellVal(c, 12),
            truthScore: cellVal(c, 13),
            keywords: cellVal(c, 16),
            dup: cellVal(c, 17),
            category: cellVal(c, 19),
            priority: cellVal(c, 20),
          };
        })
        .filter((x): x is RssNewsRow => Boolean(x));

      setRssNewsData(rows.reverse());
    } catch (e) {
      console.error("Error fetching rssNews:", e);
      setRssNewsData([]);
    }
  }, [RSS_NEWS_SHEET_URL]);

  const fetchRssData = useCallback(async () => {
    try {
      const res = await fetch(RSS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const seen = new Set<string>();

      const rows = (json.table?.rows ?? [])
        .map((row, idx): RssRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, RSS_INDEX_COL)) || idx + 2;

          const stateRaw = rssStatusFrom(c); // S
          if (stateRaw !== "RSS_Success") return null;

          const uid = String(cellVal(c, 2) ?? "");
          const link = String(cellVal(c, 5) ?? "");
          const key = uid || link;

          if (key) {
            if (seen.has(key)) return null;
            seen.add(key);
          }

          return {
            id: `rss-${idx}`,
            index,
            rowNumber: index,
            actualArrayIndex: idx,
            title: cellVal(c, 9),
            contentSnippet: cellVal(c, 11),
            source: cellVal(c, 7),
            link,
            creator: cellVal(c, 8),
            date: cellVal(c, 3),
            proceedToProduction: stateRaw,
            status: "Pending", // raw token
            timestamp: Date.now() - idx * 1000,
            sheet: "Thumbnail System",
            uid,
            type: cellVal(c, 12),
            truthScore: cellVal(c, 13),
            keywords: cellVal(c, 16),
            dup: cellVal(c, 17),
            category: cellVal(c, 19),
            priority: cellVal(c, 20),
          };
        })
        .filter((x): x is RssRow => Boolean(x));

      setRssData(rows.reverse());
    } catch (e) {
      console.error("Error fetching RSS:", e);
      setRssData([]);
    }
  }, [RSS_SHEET_URL]);

  const fetchDentistryData = useCallback(async () => {
    const draftsYes = (c: Array<{ v?: unknown; f?: unknown }>) => {
      const ae1 = cellVal(c, 31); // AE (as used in your indices)
      const ae2 = cellVal(c, 30); // fallback
      const v = norm(ae1 || ae2);
      return v === "done";
    };

    try {
      const url = `${DENTIST_SHEET_URL}${
        DENTIST_SHEET_URL.includes("?") ? "&" : "?"
      }_cb=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      const txt = await res.text();
      const json = parseGViz(txt);

      const rows = (json.table?.rows ?? [])
        .map((row, idx): DentistryRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, DENTAL_INDEX_COL)) || idx + 2;

          const headline = cellVal(c, 20);
          const caption = cellVal(c, 2);
          const link = cellVal(c, 14);
          if (![headline, caption, link].some(Boolean)) return null;

          // H approval
          const hRaw = cellVal(c, CONTENT_STATUS_COL_H);
          const columnHStatus = normalizePublishCell(hRaw);

          // status (legacy)
          const s = norm(columnHStatus);
          const status: DentistryRow["status"] =
            s === "yes" ? "Approved" : s === "no" ? "Rejected" : "Pending";

          // NEW dual-column gate
          const draftOK = draftsYes(c); // AE = YES
          const approvalPending = isPendingApproval(hRaw); // H = pending approval
          if (!(draftOK && approvalPending)) return null;

          return {
            id: `dent-${idx}`,
            index,
            rowNumber: index,
            actualArrayIndex: idx,
            headline,
            caption,
            source: cellVal(c, 11),
            link,
            pubDate: cellVal(c, 26),
            imageGenerated: cellVal(c, 5),
            status,
            timestamp: Date.now() - idx * 1000,
            sheet: "DENTAL",
            keywords: cellVal(c, 18),
            priority: cellVal(c, 15),
            category: cellVal(c, 17),
            truthScore: cellVal(c, 16),
            dup: cellVal(c, 21) ? "YES" : "NO",
            columnHStatus,
            hCell: hRaw,
          };
        })
        .filter((r): r is DentistryRow => r !== null)
        .reverse();

      setDentistryData(rows);
    } catch (e) {
      console.error("Error fetching dentistry:", e);
      setDentistryData([]);
    }
  }, [DENTIST_SHEET_URL]);

  const fetchRssDentistryData = useCallback(async () => {
    try {
      const res = await fetch(RSS_DENTIST_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const seen = new Set<string>();

      const rows = (json.table?.rows ?? [])
        .map((row, idx): RssDentistryRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, RSS_DENTAL_INDEX_COL)) || idx + 2;

          const stateRaw = rssStatusFrom(c); // S
          if (stateRaw !== "RSS_Success") return null;

          const uid = String(cellVal(c, 2) ?? "");
          const link = String(cellVal(c, 5) ?? "");
          const key = uid || link;

          if (key) {
            if (seen.has(key)) return null;
            seen.add(key);
          }

          return {
            id: `rss-dent-${idx}`,
            index,
            rowNumber: index,
            actualArrayIndex: idx,
            title: cellVal(c, 9),
            contentSnippet: cellVal(c, 11),
            source: cellVal(c, 7),
            link,
            creator: cellVal(c, 8),
            date: cellVal(c, 3),
            proceedToProduction: stateRaw,
            status: "Pending", // raw token
            timestamp: Date.now() - idx * 1000,
            sheet: "Dental RSS",
            uid,
            type: cellVal(c, 12),
            truthScore: cellVal(c, 13),
            keywords: cellVal(c, 16),
            dup: cellVal(c, 17),
            category: cellVal(c, 19),
            priority: cellVal(c, 20),
          };
        })
        .filter((x): x is RssDentistryRow => Boolean(x));

      setRssDentistryData(rows.reverse());
    } catch (e) {
      console.error("Error fetching Dentistry RSS:", e);
      setRssDentistryData([]);
    }
  }, [RSS_DENTIST_SHEET_URL]);

  /** Timeline */
  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(
        "https://biohackyourself.app.n8n.cloud/webhook-test/approvalschedule"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as TimelineRow[];
      setTimelineData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching timeline:", e);
      setTimelineData([]);
    }
  }, []);

  /** ===== Filtering ===== */
  // strip zero-width chars + trim (handles formula/webhook artifacts)
  const STATUS_COL = 18; // column S (0-based)

  const clean = (s: unknown) =>
    String(s ?? "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim(); // trim + zero-width chars

  const rssStatusFrom = (c: Array<{ v?: unknown; f?: unknown }>) =>
    clean(cellVal(c, STATUS_COL)); // exact raw S with cleanup

  /*
  const filterUnprocessedItems = useCallback(
    (data: any[], contentType: string) => {
      return data.filter((item) => {
        // hide items already acted on locally
        if (
          isItemProcessed({
            sheet: item.sheet,
            id: item.id,
            rowNumber: item.rowNumber,
          })
        ) {
          return false;
        }

        if (contentType === "content" || contentType === "dentistry") {
          return isPendingApproval((item as any).columnHStatus);
        }

        if (contentType === "news") {
          // your News rows already set status = "Pending" by design
          return (item as NewsRow).status === "Pending";
        }

        if (
          contentType === "rss" ||
          contentType === "rssNews" ||
          contentType === "rssDentistry"
        ) {
          // ✅ For all RSS tabs, only show exact RSS_Success from col S
          // Prefer the raw S value you stored in proceedToProduction
          const s = clean(
            (item as any).proceedToProduction ?? (item as any).status
          );
          return s === "RSS_Success";
        }

        return false;
      });
    },
    [isItemProcessed]
  ); */

  /** ===== Filtering ===== */
  const filterUnprocessedItems = useCallback(
    (data: any[], _contentType: string) => {
      return data.filter((item) => {
        // hide items already acted on locally
        if (
          isItemProcessed({
            sheet: item.sheet,
            id: item.id,
            rowNumber: item.rowNumber,
          })
        ) {
          return false;
        }
        // single source of truth for actionability
        return isActionable(item);
      });
    },
    [isItemProcessed, isActionable]
  );

  /** ===== Stats ===== */
  const updateDashboardStats = useCallback(() => {
    // Pending list is now exactly what you filtered into contentData
    const pendingList = contentData;
    const approvedList = approvedData;
    const publishedList = publishedData;

    const pendingApprovalCount = pendingList.filter((r) =>
      isPendingApproval(r.columnHStatus)
    ).length;

    const totalCount =
      pendingList.length + approvedList.length + publishedList.length;

    setDashboardStats({
      total: totalCount,
      pending: pendingList.length,
      approved: approvedList.length,
      published: publishedList.length,
      // "no" and "regenerated" won't occur in pendingList by design; keep zeroed
      pendingBreakdown: {
        no: 0,
        regenerated: 0,
        pendingApproval: pendingApprovalCount,
        empty: 0,
      },
    });

    setTrackingStats({
      approved: approvedList.length,
      sentForRegeneration: 0, // you can compute from a raw dataset if you decide to keep one
      pendingApproval: pendingApprovalCount,
      published: publishedList.length,
    });
  }, [contentData, approvedData, publishedData]);

  /** ===== Item-state helpers ===== */
  const setItemState = useCallback(
    (
      item: {
        sheet: string;
        index?: number;
        rowNumber?: number;
        row?: number;
        id: string;
      },
      status: Exclude<ButtonStatus, null>
    ) => {
      const itemKey = createItemKey(item);
      setButtonStates((prev) => ({
        ...prev,
        [itemKey]: { status, timestamp: Date.now() },
      }));
    },
    [createItemKey]
  );

  const handleDeleteContent = useCallback(
    (item: {
      sheet: string;
      index?: number;
      rowNumber?: number;
      row?: number;
      id: string;
    }) => {
      const key = createItemKey(item);
      setButtonStates((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast({
        title: "Content Deleted",
        description: "Removed from local view",
      });
    },
    [createItemKey, toast]
  );

  // Actions
  const handleContentApproval = useCallback(
    (item: ContentRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleContentRejection = useCallback(
    (item: ContentRow) => setItemState(item, "rejected"),
    [setItemState]
  );
  const handleNewsApproval = useCallback(
    (item: NewsRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleNewsRejection = useCallback(
    (item: NewsRow) => setItemState(item, "rejected"),
    [setItemState]
  );
  const handleRssNewsApproval = useCallback(
    (item: RssNewsRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleRssNewsRejection = useCallback(
    (item: RssNewsRow) => setItemState(item, "rejected"),
    [setItemState]
  );
  const handleRssContentApproval = useCallback(
    (item: RssRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleRssContentRejection = useCallback(
    (item: RssRow) => setItemState(item, "rejected"),
    [setItemState]
  );
  const handleDentistryApproval = useCallback(
    (item: DentistryRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleDentistryRejection = useCallback(
    (item: DentistryRow) => setItemState(item, "rejected"),
    [setItemState]
  );
  const handleRssDentistryApproval = useCallback(
    (item: RssDentistryRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleRssDentistryRejection = useCallback(
    (item: RssDentistryRow) => setItemState(item, "rejected"),
    [setItemState]
  );

  const handleUndo = useCallback(
    (item: {
      sheet: string;
      index?: number;
      rowNumber?: number;
      row?: number;
      id: string;
    }) => {
      const key = createItemKey(item);
      setButtonStates((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [createItemKey]
  );

  const getButtonState = useCallback(
    (item: {
      sheet: string;
      index?: number;
      rowNumber?: number;
      row?: number;
      id: string;
    }): ButtonStatus => {
      const key = createItemKey(item);
      return buttonStates[key]?.status ?? null;
    },
    [buttonStates, createItemKey]
  );

  /** ===== Fetch-all ===== */
  const fetchAllData = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await Promise.allSettled([
        fetchContentData(),
        fetchNewsData(),
        fetchRssNewsData(),
        fetchRssData(),
        fetchDentistryData(),
        fetchRssDentistryData(),
        fetchTimelineData(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    fetchContentData,
    fetchNewsData,
    fetchRssNewsData,
    fetchRssData,
    fetchDentistryData,
    fetchRssDentistryData,
    fetchTimelineData,
  ]);

  /** ===== Effects ===== */
  useEffect(() => {
    updateDashboardStats();
  }, [contentData, buttonStates, updateDashboardStats]);

  /** ===== Pending lists ===== */
  const pendingContent = useMemo(
    () => filterUnprocessedItems(contentData, "content"),
    [contentData, filterUnprocessedItems]
  );
  const pendingNews = useMemo(
    () => filterUnprocessedItems(newsData, "news"),
    [newsData, filterUnprocessedItems]
  );
  const pendingRss = useMemo(
    () => filterUnprocessedItems(rssData, "rss"),
    [rssData, filterUnprocessedItems]
  );
  const pendingRssNews = useMemo(
    () => filterUnprocessedItems(rssNewsData, "rssNews"),
    [rssNewsData, filterUnprocessedItems]
  );
  const pendingDentistry = useMemo(
    () => filterUnprocessedItems(dentistryData, "dentistry"),
    [dentistryData, filterUnprocessedItems]
  );
  const pendingRssDentistry = useMemo(
    () => filterUnprocessedItems(rssDentistryData, "rssDentistry"),
    [rssDentistryData, filterUnprocessedItems]
  );

  /** ===== Expose ===== */
  return {
    // Raw data
    contentData,
    newsData,
    rssNewsData,
    rssData,
    dentistryData,
    rssDentistryData,
    timelineData,
    approvedData,
    publishedData,

    // Derived
    pendingContent,
    pendingNews,
    pendingRss,
    pendingRssNews,
    pendingDentistry,
    pendingRssDentistry,

    dashboardStats,
    trackingStats,
    buttonStates,
    setButtonStates,

    // Helpers
    createItemKey,
    isItemProcessed,
    filterUnprocessedItems,

    // Actions
    handleDeleteContent,
    handleContentApproval,
    handleContentRejection,
    handleNewsApproval,
    handleNewsRejection,
    handleRssNewsApproval,
    handleRssNewsRejection,
    handleRssContentApproval,
    handleRssContentRejection,
    handleDentistryApproval,
    handleDentistryRejection,
    handleRssDentistryApproval,
    handleRssDentistryRejection,
    handleUndo,
    getButtonState,

    // Fetchers
    fetchAllData,
    fetchContentData,
    fetchNewsData,
    fetchRssNewsData,
    fetchRssData,
    fetchDentistryData,
    fetchRssDentistryData,
    fetchTimelineData,
    isLoading,
  };
};
