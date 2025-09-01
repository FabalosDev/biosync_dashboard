import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

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

  /** ===== Fetchers ===== */

  const fetchContentData = useCallback(async () => {
    try {
      const res = await fetch(CONTENT_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const rows = (json.table?.rows ?? [])
        .map((row, idx): ContentRow => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, CONTENT_INDEX_COL)) || idx + 2; // fallback
          const hCellRaw = cellVal(c, CONTENT_STATUS_COL_H); // H
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
            columnHStatus,
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
        })
        .reverse();

      setContentData(rows);

      const approved = rows.filter((r) => r.columnHStatus === "YES");
      const published = rows.filter((r) => isPublishedStatus(r.columnHStatus));
      setApprovedData(approved);
      setPublishedData(published);
    } catch (e) {
      console.error("Error fetching content:", e);
      setContentData([]);
    }
  }, [CONTENT_SHEET_URL]);

  const fetchNewsData = useCallback(async () => {
    try {
      const res = await fetch(NEWS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const all = (json.table?.rows ?? [])
        .map((row, idx): NewsRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, NEWS_INDEX_COL)) || idx + 2;

          const stateRaw = cellVal(c, NEWS_STATUS_COL); // S
          const s = norm(stateRaw);

          // Normalize to one of: "Approved" | "Rejected" | "Pending"
          const status: NewsRow["status"] =
            s === "approved" || s === "posted"
              ? "Approved"
              : s === "rejected"
              ? "Rejected"
              : "Pending";

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
            status,
            timestamp: Date.now() - idx * 1000,
            sheet: "HEALTH NEWS USA- THUMBNAILS",
            imageGenerated: String(c[6]?.v ?? ""),
            approval: String(c[9]?.v ?? ""),
            keywords: String(c[18]?.v ?? ""),
            priority: String(c[19]?.v ?? ""),
            category: String(c[20]?.v ?? ""),
            truthScore: String(c[21]?.v ?? ""),
            dup: (c[27]?.v ?? "").toString().trim() !== "" ? "YES" : "NO",
          };
        })
        // Show ONLY items that still need approval (i.e., not approved/posted)
        .filter((r): r is NewsRow => r !== null && r.status === "Pending")
        .reverse();

      setNewsData(all);
    } catch (e) {
      console.error("Error fetching news:", e);
      setNewsData([]);
    }
  }, [NEWS_SHEET_URL]);

  const fetchRssNewsData = useCallback(async () => {
    try {
      const res = await fetch(RSS_NEWS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const all = (json.table?.rows ?? []).map((row, idx): RssNewsRow => {
        const c = row.c ?? [];
        const index = Number(cellVal(c, RSS_NEWS_INDEX_COL)) || idx + 2;

        const stateRaw = cellVal(c, RSS_STATUS_COL); // S
        const s = norm(stateRaw);
        const status: RssNewsRow["status"] =
          s === "approved" || s === "posted"
            ? "Approved"
            : s === "rejected"
            ? "Rejected"
            : "Pending";

        return {
          id: `hnn-${idx}`,
          index,
          rowNumber: index,
          actualArrayIndex: idx,
          title: cellVal(c, 9),
          contentSnippet: cellVal(c, 11),
          source: cellVal(c, 7),
          link: cellVal(c, 5),
          creator: cellVal(c, 8),
          date: cellVal(c, 3),
          proceedToProduction: stateRaw,
          status,
          timestamp: Date.now() - idx * 1000,
          sheet: "HNN RSS",
          uid: cellVal(c, 2),
          type: cellVal(c, 12),
          truthScore: cellVal(c, 13),
          keywords: cellVal(c, 16),
          dup: cellVal(c, 17),
          category: cellVal(c, 19),
          priority: cellVal(c, 20),
        };
      });

      setRssNewsData(all.reverse());
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

      const all = (json.table?.rows ?? []).map((row, idx): RssRow => {
        const c = row.c ?? [];
        const index = Number(cellVal(c, RSS_INDEX_COL)) || idx + 2;

        const stateRaw = getRssStatus(c); // S
        const s = norm(stateRaw);
        const status: RssRow["status"] =
          s === "approved" || s === "posted"
            ? "Approved"
            : s === "rejected"
            ? "Rejected"
            : "Pending";

        return {
          id: `rss-${idx}`,
          index,
          rowNumber: index,
          actualArrayIndex: idx,
          title: cellVal(c, 9),
          contentSnippet: cellVal(c, 11),
          source: cellVal(c, 7),
          link: cellVal(c, 5),
          creator: cellVal(c, 8),
          date: cellVal(c, 3),
          proceedToProduction: stateRaw,
          status,
          timestamp: Date.now() - idx * 1000,
          sheet: "Thumbnail System",
          uid: cellVal(c, 2),
          type: cellVal(c, 12),
          truthScore: cellVal(c, 13),
          keywords: cellVal(c, 16),
          dup: cellVal(c, 17),
          category: cellVal(c, 19),
          priority: cellVal(c, 20),
        };
      });

      setRssData(all.reverse());
    } catch (e) {
      console.error("Error fetching RSS:", e);
      setRssData([]);
    }
  }, [RSS_SHEET_URL]);

  const fetchDentistryData = useCallback(async () => {
    try {
      const res = await fetch(DENTIST_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const rows = (json.table?.rows ?? [])
        .map((row, idx): DentistryRow | null => {
          const c = row.c ?? [];
          const index = Number(cellVal(c, DENTAL_INDEX_COL)) || idx + 2;

          const headline = cellVal(c, 20);
          const caption = cellVal(c, 2);
          const link = cellVal(c, 14);

          const hRaw = cellVal(c, CONTENT_STATUS_COL_H); // H
          const columnHStatus = normalizePublishCell(hRaw);

          const s = norm(columnHStatus);
          const status: DentistryRow["status"] =
            s === "yes" ? "Approved" : s === "no" ? "Rejected" : "Pending";

          if (![headline, caption, link].some(Boolean)) return null;

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

      const all = (json.table?.rows ?? []).map((row, idx): RssDentistryRow => {
        const c = row.c ?? [];
        const index = Number(cellVal(c, RSS_DENTAL_INDEX_COL)) || idx + 2;

        const stateRaw = cellVal(c, RSS_STATUS_COL); // S
        const s = norm(stateRaw);

        return {
          id: `rss-dent-${idx}`,
          index,
          rowNumber: index,
          actualArrayIndex: idx,
          title: cellVal(c, 9),
          contentSnippet: cellVal(c, 11),
          source: cellVal(c, 7),
          link: cellVal(c, 5),
          creator: cellVal(c, 8),
          date: cellVal(c, 3),
          proceedToProduction: stateRaw,
          status:
            s === "approved" || s === "posted"
              ? "Approved"
              : s === "rejected"
              ? "Rejected"
              : "Pending",
          timestamp: Date.now() - idx * 1000,
          sheet: "Dental RSS",
          uid: cellVal(c, 2),
          type: cellVal(c, 12),
          truthScore: cellVal(c, 13),
          keywords: cellVal(c, 16),
          dup: cellVal(c, 17),
          category: cellVal(c, 19),
          priority: cellVal(c, 20),
        };
      });

      setRssDentistryData(all.reverse());
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
  const filterUnprocessedItems = useCallback(
    (data: any[], contentType: string) => {
      return data.filter((item) => {
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
          return (item as NewsRow).status === "Pending";
        }
        if (
          contentType === "rss" ||
          contentType === "rssNews" ||
          contentType === "rssDentistry"
        ) {
          return (item as any).status === "Pending";
        }
        return false;
      });
    },
    [isItemProcessed]
  );

  /** ===== Stats ===== */
  const updateDashboardStats = useCallback(() => {
    let totalCount = 0,
      approvedCount = 0,
      publishedCount = 0;
    let noCount = 0,
      regeneratedCount = 0,
      pendingApprovalCount = 0,
      emptyCount = 0,
      sentForRegenerationCount = 0;

    contentData.forEach((item) => {
      if (item.caption && item.caption.trim() !== "") {
        totalCount++;
        const h = item.columnHStatus;
        const hLower = (h || "").toLowerCase();
        if (h === "YES") {
          approvedCount++;
        } else if (isPublishedStatus(h)) {
          publishedCount++;
        } else {
          if (hLower === "no") {
            noCount++;
            sentForRegenerationCount++;
          } else if (hLower === "regenerated") {
            regeneratedCount++;
            sentForRegenerationCount++;
          } else if (hLower === "pending approval") {
            pendingApprovalCount++;
          } else if (hLower === "") {
            emptyCount++;
          }
        }
      }
    });

    setDashboardStats({
      total: totalCount,
      pending: pendingApprovalCount,
      approved: approvedCount,
      published: publishedCount,
      pendingBreakdown: {
        no: noCount,
        regenerated: regeneratedCount,
        pendingApproval: pendingApprovalCount,
        empty: emptyCount,
      },
    });
    setTrackingStats({
      approved: approvedCount,
      sentForRegeneration: sentForRegenerationCount,
      pendingApproval: pendingApprovalCount,
      published: publishedCount,
    });
  }, [contentData]);

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
