import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

/** ===== Types ===== */
type ButtonStatus = "approved" | "rejected" | null;

type ButtonStates = Record<
  string,
  {
    status: ButtonStatus;
    timestamp: number;
  }
>;

// Content (manual/user)
export interface ContentRow {
  id: string;
  rowNumber: number;
  inputText: string; // A
  headline: string; // U
  caption: string; // C
  approval: string; // D
  feedback: string; // E
  imageGenerated: string; // F
  imageQuery: string; // J
  columnHStatus: string; // H (normalized)
  regeneratedImage: string; // K
  status: "Approved" | "Rejected" | "Pending";
  link: string; // O
  priority: string; // P
  truthScore: string; // Q
  category: string; // R
  keywords: string; // S
  dup: string; // T
  uid: string; // M/N
  timestamp: number;
  sheet: "text/image";
  pubDate: string; // AA (26)
}

// News Content (manual)
export interface NewsRow {
  id: string;
  rowNumber: number;
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
  //  columnHStatus?: string; // optional if you want News to rely on H as well
}

// News RSS
export interface RssNewsRow {
  id: string;
  rowNumber: number;
  actualArrayIndex: number;
  title: string; // J
  contentSnippet: string; // L
  source: string; // H
  link: string; // F
  creator: string; // I
  date: string; // D
  proceedToProduction: string; // control cell (varies)
  status: "Approved" | "Rejected" | "Pending";
  timestamp: number;
  sheet: "HNN RSS";
  uid: string; // C
  type: string; // M
  truthScore: string; // N
  keywords: string; // Q
  dup: string; // R
  category: string; // T
  priority: string; // U
}

// Media RSS (general)
export interface RssRow {
  id: string;
  rowNumber: number;
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

/** ===== Dentistry (manual + RSS) ===== */
export interface DentistryRow {
  id: string;
  rowNumber: number;
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
  columnHStatus: string; // normalized Column H
  hCell: string; // raw Column H (for debugging)
}

export interface RssDentistryRow {
  id: string;
  rowNumber: number;
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
  sheet: "DENTISTRY RSS";
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
    pending: 0, // shows ONLY "pending approval"
    approved: 0,
    published: 0,
    pendingBreakdown: {
      no: 0,
      regenerated: 0,
      pendingApproval: 0,
      empty: 0,
    },
  });

  const [trackingStats, setTrackingStats] = useState({
    approved: 0,
    sentForRegeneration: 0,
    pendingApproval: 0,
    published: 0,
  });

  const [buttonStates, setButtonStates] = useState<ButtonStates>({});

  /** ===== Sheet constants & URLs ===== */
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

  /** ===== Helpers ===== */
  const parseGViz = (text: string) => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("Invalid GViz payload");
    return JSON.parse(text.slice(start, end + 1)) as {
      table?: { rows?: Array<{ c?: Array<{ v?: unknown; f?: unknown }> }> };
    };
  };
  // put this helper near your other helpers (cellVal, pickFirst)
  const getRssStatus = (c: Array<{ v?: unknown; f?: unknown }>) => {
    // Column S = index 18
    const raw = String(
      ((c[18] as any)?.f ?? (c[18] as any)?.v ?? "") as string
    ).trim();
    const pretty = raw || "<EMPTY>";
    if (!raw) {
      console.warn("[RSS] Status (col S) is empty on a row", {
        status: pretty,
      });
    }
    return raw;
  };

  // normalize & match the RSS gate value from Column S
  const isRssSuccess = (raw: unknown) => {
    const v = String(raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    return v === "rss_success";
  };

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

  // Create a unique local key per row
  const createItemKey = useCallback(
    (item: { sheet: string; rowNumber?: number; row?: number; id: string }) =>
      `${item.sheet}-${item.rowNumber ?? item.row ?? 0}-${item.id}`,
    []
  );

  const isItemProcessed = useCallback(
    (item: { sheet: string; rowNumber?: number; row?: number; id: string }) => {
      const itemKey = createItemKey(item);
      const status = buttonStates[itemKey]?.status;
      return status !== null && status !== undefined;
    },
    [buttonStates, createItemKey]
  );

  // replace your existing norm with this one
  const norm = (s: unknown) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " "); // spaces, underscores, dashes → single space

  // TEMP (lenient) during testing
  const isPendingApproval = (raw: unknown) => {
    const v = norm(raw);
    return (
      v === "pending approval" ||
      v === "pending" ||
      v === "pending review" ||
      v === "review"
    );
  };
  // LATER (strict):
  // const isPendingApproval = (raw: unknown) => norm(raw) === "pending approval";

  /** ===== Small cell helpers (RSS) ===== */
  const cellVal = (
    c: Array<{ v?: unknown; f?: unknown }>,
    idx: number
  ): string =>
    String(((c[idx] as any)?.f ?? (c[idx] as any)?.v ?? "") as string).trim();

  const pickFirst = (
    c: Array<{ v?: unknown; f?: unknown }>,
    candidates: number[]
  ): string => {
    for (const i of candidates) {
      const v = cellVal(c, i);
      if (v) return v;
    }
    return "";
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
          const hCell = (c[7] ?? {}) as { v?: unknown; f?: unknown };
          const columnHStatus = normalizePublishCell(
            (hCell as any).f ?? (hCell as any).v ?? ""
          );
          return {
            id: `content-${idx}`,
            rowNumber: idx + 2,
            inputText: String(c[0]?.v ?? ""),
            headline: String(c[20]?.v ?? ""),
            caption: String(c[2]?.v ?? ""),
            approval: String(c[3]?.v ?? ""),
            feedback: String(c[4]?.v ?? ""),
            imageGenerated: String(c[5]?.v ?? ""),
            imageQuery: String(c[9]?.v ?? ""),
            columnHStatus,
            regeneratedImage: String(c[10]?.v ?? ""),
            status:
              c[3]?.v === "YES"
                ? "Approved"
                : c[3]?.v === "NO"
                ? "Rejected"
                : "Pending",
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
    }
  }, [CONTENT_SHEET_URL]);

  // src/hooks/useContentManagement.tsx

  const fetchNewsData = useCallback(async () => {
    try {
      const res = await fetch(NEWS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);
      const totalRows = json.table?.rows?.length ?? 0;

      const all = (json.table?.rows ?? [])
        .map((row, idx): NewsRow | null => {
          const c = row.c ?? [];
          const actualRowNumber = totalRows - idx + 1; // ✅ Get status from the "Approval" column (J, index 9)

          const approval = String(c[9]?.v ?? "").trim(); // ✅ Derive status: If "Approval" isn't exactly YES or NO, it's Pending.

          const status: NewsRow["status"] =
            approval.toUpperCase() === "YES"
              ? "Approved"
              : approval.toUpperCase() === "NO"
              ? "Rejected"
              : "Pending"; // ✅ FIXED: Get headline from its actual column.

          // NOTE: I'm assuming the headline is in Column A (index 0).
          // Please change `c[0]` if your headline is in a different column.
          const articleTitle = String(c[0]?.v ?? "");
          const caption = String(c[8]?.v ?? "");

          // Skips empty header/footer rows
          if (!articleTitle && !caption) {
            return null;
          }

          return {
            id: `news-${idx}`,
            rowNumber: actualRowNumber,
            actualArrayIndex: idx,
            articleTitle, // CORRECTED
            caption,
            articleAuthors: String(c[3]?.v ?? ""),
            source: String(c[11]?.v ?? ""),
            link: String(c[1]?.v ?? ""),
            pubDate: String(c[2]?.v ?? ""),
            creator: String(c[3]?.v ?? ""),
            status, // CORRECTED
            timestamp: Date.now() - idx * 1000,
            sheet: "HEALTH NEWS USA- THUMBNAILS",
            imageGenerated: String(c[6]?.v ?? ""),
            approval, // Keep raw value for reference
            keywords: String(c[18]?.v ?? ""),
            priority: String(c[19]?.v ?? ""),
            category: String(c[20]?.v ?? ""),
            truthScore: String(c[21]?.v ?? ""),
            dup: (c[27]?.v ?? "").toString().trim() !== "" ? "YES" : "NO",
          };
        })
        .filter((r): r is NewsRow => r !== null); // Removes any empty rows

      setNewsData(all.slice(-100).reverse());
    } catch (e) {
      console.error("Error fetching news:", e);
    }
  }, [NEWS_SHEET_URL]);

  /** News RSS (HNN RSS) — same logic as other RSS */
  const fetchRssNewsData = useCallback(async () => {
    try {
      const res = await fetch(RSS_NEWS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);
      const totalRows = json.table?.rows?.length ?? 0;

      const all = (json.table?.rows ?? []).map((row, idx): RssNewsRow => {
        const c = row.c ?? [];
        const actualRowNumber = totalRows - idx + 1;

        const title = cellVal(c, 9);
        const contentSnippet = cellVal(c, 11);
        const link = cellVal(c, 5);
        const date = cellVal(c, 3);
        const creator = cellVal(c, 8);
        const source = cellVal(c, 7);

        // Column S (index 18) for Status
        const stateRaw = cellVal(c, 18);
        const state = norm(stateRaw);

        const status: RssNewsRow["status"] =
          state === "approved" || state === "posted"
            ? "Approved"
            : state === "rejected"
            ? "Rejected"
            : "Pending";

        return {
          id: `hnn-${idx}`,
          rowNumber: actualRowNumber,
          actualArrayIndex: idx,

          title,
          contentSnippet,
          source,
          link,
          creator,
          date,

          // store raw Status
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

      setRssNewsData(all.slice(-100).reverse());
    } catch (e) {
      console.error("Error fetching rssNews:", e);
    }
  }, [RSS_NEWS_SHEET_URL]);

  /** Media RSS */
  const fetchRssData = useCallback(async () => {
    try {
      const res = await fetch(RSS_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);
      const totalRows = json.table?.rows?.length ?? 0;

      const all = (json.table?.rows ?? []).map((row, idx): RssRow => {
        const c = row.c ?? [];
        const actualRowNumber = totalRows - idx + 1;

        // Column S (index 18) is the Status written by n8n: RSS_Success, drafted, approved, posted, rejected
        const stateRaw = cellVal(c, 18);
        const state = norm(stateRaw);

        const status: RssRow["status"] =
          state === "approved" || state === "posted"
            ? "Approved"
            : state === "rejected"
            ? "Rejected"
            : "Pending";

        return {
          id: `rss-${idx}`,
          rowNumber: actualRowNumber,
          actualArrayIndex: idx,
          title: cellVal(c, 9),
          contentSnippet: cellVal(c, 11),
          source: cellVal(c, 7),
          link: cellVal(c, 5),
          creator: cellVal(c, 8),
          date: cellVal(c, 3),

          // store the raw Status column S here so filterUnprocessedItems can check 'rss_success'
          proceedToProduction: stateRaw,
          status,

          uid: cellVal(c, 2),
          type: cellVal(c, 12),
          truthScore: cellVal(c, 13),
          keywords: cellVal(c, 16),
          dup: cellVal(c, 17),
          category: cellVal(c, 19),
          priority: cellVal(c, 20),

          timestamp: Date.now() - idx * 1000,
          sheet: "Thumbnail System",
        };
      });

      setRssData(all.slice(-100).reverse());
    } catch (e) {
      console.error("Error fetching RSS:", e);
      setRssData([]);
    }
  }, [RSS_SHEET_URL]);

  /** Dentistry (Column H like Content) */
  const fetchDentistryData = useCallback(async () => {
    try {
      const res = await fetch(DENTIST_SHEET_URL);
      const txt = await res.text();
      const json = parseGViz(txt);

      const rows = json.table?.rows ?? [];
      if (!rows.length) {
        setDentistryData([]);
        return;
      }

      const val = (c: Array<{ v?: unknown; f?: unknown }>, i: number) =>
        String(((c[i] as any)?.f ?? (c[i] as any)?.v ?? "") as string).trim();

      const mapped = rows
        .map((row, idx): DentistryRow | null => {
          const c = row.c ?? [];
          const rowNumber = idx + 2;

          const headline = val(c, 20);
          const caption = val(c, 2);
          const source = val(c, 11);
          const link = val(c, 14);
          const pubDate = val(c, 26);
          const imageGenerated = val(c, 5);
          const keywords = val(c, 18);
          const priority = val(c, 15);
          const category = val(c, 17);
          const truthScore = val(c, 16);
          const dupRaw = val(c, 21);

          // Column H (index 7)
          const hCellObj = (c[7] ?? {}) as { v?: unknown; f?: unknown };
          const rawH = (hCellObj as any).f ?? (hCellObj as any).v ?? "";
          const columnHStatus = normalizePublishCell(rawH);

          // derive status from H
          const hNorm = norm(columnHStatus);
          const status: DentistryRow["status"] =
            hNorm === "yes"
              ? "Approved"
              : hNorm === "no"
              ? "Rejected"
              : "Pending";

          // drop rows that are truly empty (avoid header junk)
          if (
            [
              headline,
              caption,
              link,
              pubDate,
              keywords,
              priority,
              category,
              truthScore,
            ].every((v) => v === "")
          ) {
            return null;
          }

          return {
            id: `dent-${idx}`,
            rowNumber,
            actualArrayIndex: idx,
            headline,
            caption,
            source,
            link,
            pubDate,
            imageGenerated,
            status,
            timestamp: Date.now() - idx * 1000,
            sheet: "DENTAL",
            keywords,
            priority,
            category,
            truthScore,
            dup: dupRaw ? "YES" : "NO",
            columnHStatus,
            hCell: String(rawH ?? ""),
          };
        })
        .filter((r): r is DentistryRow => r !== null)
        .reverse();

      setDentistryData(mapped);
    } catch (e) {
      console.error("Error fetching dentistry:", e);
      setDentistryData([]);
    }
  }, [DENTIST_SHEET_URL]);

  /** Dentistry RSS (now wired) */
  /** Dentistry RSS (now wired to Column S = status) */
  const fetchRssDentistryData = useCallback(async () => {
    try {
      const res = await fetch(RSS_DENTIST_SHEET_URL); // ...sheet=Dental%20RSS
      const txt = await res.text();
      const json = parseGViz(txt);

      const totalRows = json.table?.rows?.length ?? 0;

      const all = (json.table?.rows ?? []).map((row, idx): RssDentistryRow => {
        const c = row.c ?? [];
        const actualRowNumber = totalRows - idx + 1;

        // ✅ Column S (index 18) carries the pipeline status: RSS_Success, drafted, approved, posted, rejected
        const stateRaw = getRssStatus(c); // cellVal(c, 18) wrapped + logs if empty

        return {
          id: `rss-dent-${idx}`,
          rowNumber: actualRowNumber,
          actualArrayIndex: idx,
          title: cellVal(c, 9),
          contentSnippet: cellVal(c, 11),
          source: cellVal(c, 7),
          link: cellVal(c, 5),
          creator: cellVal(c, 8),
          date: cellVal(c, 3),
          proceedToProduction: stateRaw, // used by filters
          status: stateRaw, // mirror (handy in UI)
          timestamp: Date.now() - idx * 1000,
          sheet: "Dental RSS", // exact tab name
          uid: cellVal(c, 2),
          type: cellVal(c, 12),
          truthScore: cellVal(c, 13),
          keywords: cellVal(c, 16),
          dup: cellVal(c, 17),
          category: cellVal(c, 19),
          priority: cellVal(c, 20),
        };
      });

      setRssDentistryData(all.slice(-100).reverse());
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

  /** ===== Filtering (unified & shared) ===== */
  // src/hooks/useContentManagement.tsx

  const filterUnprocessedItems = useCallback(
    (data: any[], contentType: string) => {
      // Added types for clarity
      return data.filter((item) => {
        // This part remains the same
        if (
          isItemProcessed({
            sheet: item.sheet,
            id: item.id,
            rowNumber: item.rowNumber,
          })
        )
          return false; // This part remains the same

        if (contentType === "content" || contentType === "dentistry") {
          return isPendingApproval((item as any).columnHStatus);
        } // ✅ FIXED: Use the correct status logic for news.

        if (contentType === "news") {
          return (item as NewsRow).status === "Pending";
        } // This part for RSS remains the same

        if (
          contentType === "rss" ||
          contentType === "rssNews" ||
          contentType === "rssDentistry"
        ) {
          return isRssSuccess((item as any).proceedToProduction);
        }

        return false;
      });
    },
    [isItemProcessed, isPendingApproval, isRssSuccess] // Updated dependencies
  );

  /** ===== Stats ===== */
  const updateDashboardStats = useCallback(() => {
    let totalCount = 0;
    let approvedCount = 0;
    let publishedCount = 0;
    let noCount = 0;
    let regeneratedCount = 0;
    let pendingApprovalCount = 0;
    let emptyCount = 0;
    let sentForRegenerationCount = 0;

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

    const pendingCount = pendingApprovalCount;

    setDashboardStats({
      total: totalCount,
      pending: pendingCount,
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

  /** ===== Action handlers ===== */
  const setItemState = useCallback(
    (
      item: { sheet: string; rowNumber?: number; row?: number; id: string },
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
    (item: { sheet: string; rowNumber?: number; row?: number; id: string }) => {
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

  // Content/manual/news
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

  // rssNews
  const handleRssNewsApproval = useCallback(
    (item: RssNewsRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleRssNewsRejection = useCallback(
    (item: RssNewsRow) => setItemState(item, "rejected"),
    [setItemState]
  );

  // Media RSS
  const handleRssContentApproval = useCallback(
    (item: RssRow) => setItemState(item, "approved"),
    [setItemState]
  );
  const handleRssContentRejection = useCallback(
    (item: RssRow) => setItemState(item, "rejected"),
    [setItemState]
  );

  // Dentistry (manual + rss)
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
    (item: { sheet: string; rowNumber?: number; row?: number; id: string }) => {
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

  /** ===== Pending lists (memoized) ===== */
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
