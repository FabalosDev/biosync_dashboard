// src/components/ContentApprovalCard.tsx
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { RejectionDialog } from "./RejectionDialog";
import { useToast } from "@/hooks/use-toast";
import { postWebhook } from "@/services/webhookService";
import { getDupInfoFromItem } from "@/utils/dup";
import { ContentEditDialog } from "./ContentEditDialog";
import { RssCompletionDialog } from "./RssCompletionDialog";

type ContentType =
  | "content"
  | "regenerated"
  | "news"
  | "rssNews"
  | "rss"
  | "rssMedia"
  | "dentistry"
  | "rssDentistry";

interface ContentApprovalCardProps {
  item: any;
  onApprove: (item: any) => void;
  onReject: (
    item: any,
    feedback?: string,
    imageQuery?: string,
    headlineImprovements?: string,
    captionImprovements?: string
  ) => void;
  showRejectionDialog?: boolean;
  contentType?: ContentType;
  buttonState?: "approved" | "rejected" | null;
  onUndo?: (item: any) => void;
  onDelete?: (item: any) => void;
  showDeleteButton?: boolean;
}

/* ---------- tiny helpers ---------- */
const looksLikeUrl = (s?: string) =>
  typeof s === "string" && /^(https?:\/\/|data:image\/)/i.test(s.trim());
const norm = (v: any) => (typeof v === "string" ? v.trim() : "");
const asUrl = (v: any) => {
  const n = norm(v);
  return n && looksLikeUrl(n) ? n : "";
};
const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => typeof v === "string" && v.trim() !== "")?.trim() ?? "";

const pickCaption = (it: any) =>
  firstNonEmpty(
    it.caption,
    it.caption_generated,
    it.generatedCaption,
    it.captionText,
    it.aiCaption,
    it.generated_caption,
    it.Caption
  );

const pickHeadline = (it: any) =>
  firstNonEmpty(
    it.headline,
    it.generatedHeadline,
    it.headline_generated,
    it.title,
    it.articleTitle
  );

const pickImageUrl = (it: any): string => {
  const candidates = [
    it.regeneratedImage,
    it.generatedImage,
    it.finalImage,
    it.final_image_url,
    it.imageUrl,
    it.image_url,
    it.mediaUrl,
    it.media_url,
    it.primaryImage,
    it.primary_image,
    it.thumbnail,
    it.Image,
    it.AI_Image_URL,
    it.photo,
    it.picture,
    it.image,
    it.imageGenerated,
    it.image_generated,
  ];
  for (const c of candidates) {
    const url = asUrl(c);
    if (url) return url;
  }
  const gen = String(
    it.imageGenerated ?? it.image_generated ?? ""
  ).toUpperCase();
  if (gen === "YES" || gen === "TRUE") {
    const fb =
      asUrl(it.finalImage) ||
      asUrl(it.regeneratedImage) ||
      asUrl(it.imageUrl) ||
      asUrl(it.generatedImage);
    if (fb) return fb;
  }
  return "";
};

const statusToBadge = (status?: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-500";
    case "Approved":
      return "bg-green-500";
    case "Rejected":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

/** Map UI tab → exact sheet/tab name */
function sheetNameFor(contentType: string, item: any) {
  const t = String(contentType || "");
  if (t === "rssNews") return "HNN RSS";
  if (t === "rssDentistry") return "Dental RSS";
  if (t === "rss" || t === "rssMedia") return "Thumbnail System";
  if (t === "news") return "HEALTH NEWS USA- THUMBNAILS";
  if (t === "dentistry") return "DENTAL";
  return item?.sheet || "text/image"; // content / regenerated
}

/** What the webhook expects */
function contentTypeForWebhook(ct: string) {
  const x = String(ct || "").trim();
  if (x === "rssNews") return "rssNews";
  if (x === "rssDentistry") return "rssDentistry";
  if (x === "rss" || x === "rssMedia") return "rss"; // normalize media rss → "rss"
  if (x === "regenerated") return "content";
  return x; // "content" | "news" | "dentistry"
}

/** Optional router key for n8n (if you branch in your flow) */
function routeKey(contentType: string, sheet?: string) {
  const ct = String(contentType || "");
  if (
    ct === "rssNews" ||
    ct === "rssDentistry" ||
    ct === "rss" ||
    ct === "rssMedia"
  )
    return "rss";
  if (ct === "content" || ct === "regenerated") return "content";
  if (ct === "news") return "news";
  if (ct === "dentistry") return "dentistry";

  const s = String(sheet || "");
  if (/HNN RSS/i.test(s)) return "rssNews";
  if (/Dental RSS/i.test(s)) return "rssDentistry";
  if (/Thumbnail System/i.test(s)) return "rss";
  return "content";
}

/** Build webhook payload — uses INDEX column if valid, with strong fallbacks */
function buildWebhookPayload(
  action: "approve" | "reject",
  contentType: string,
  item: any
) {
  const uiType = String(contentType || "").trim();

  // Normalize type (service + route)
  const serviceType =
    uiType === "rssNews"
      ? "rssNews"
      : uiType === "rssDentistry"
      ? "rssDentistry"
      : uiType === "rss" || uiType === "rssMedia"
      ? "rss"
      : uiType === "regenerated"
      ? "content"
      : uiType;

  const route =
    uiType === "rss" || uiType === "rssMedia"
      ? "rssMedia"
      : uiType === "rssNews"
      ? "rssNews"
      : uiType === "rssDentistry"
      ? "rssDentistry"
      : serviceType;

  const sheet =
    route === "rssMedia"
      ? "Thumbnail System"
      : item?.sheet ||
        (serviceType === "news"
          ? "HEALTH NEWS USA- THUMBNAILS"
          : serviceType === "dentistry"
          ? "DENTAL"
          : serviceType === "rssNews"
          ? "HNN RSS"
          : serviceType === "rssDentistry"
          ? "Dental RSS"
          : "text/image");

  // Preferred row = INDEX col shown in UI (must be >=2)
  const toInt = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };
  let row =
    toInt(item?.index) ||
    toInt(item?.rowNumber) ||
    toInt(item?.row) ||
    (item?.actualArrayIndex != null ? toInt(item.actualArrayIndex) + 2 : NaN);

  if (!Number.isFinite(row) || row < 2) row = NaN;

  // Extra lookup keys for backend fallback (pick only stable identifiers)
  const lookup = {
    uid: item?.uid || item?.id || "",
    link:
      item?.link ||
      item?.articleLink ||
      item?.url ||
      item?.sourceLink ||
      item?.source ||
      "",
    title: item?.title || item?.headline || item?.articleTitle || "",
    index: Number.isFinite(toInt(item?.index))
      ? String(toInt(item?.index))
      : "",
  };

  // Minimal content bits
  const content = {
    title: lookup.title,
    caption: item?.caption || "",
    snippet: item?.contentSnippet || "",
  };

  return {
    action,
    contentType: serviceType,
    route,
    sheet,
    // send both the numeric row (if valid) and lookup keys
    row: Number.isFinite(row) ? row : null,
    lookup, // ← let n8n find the row by value if row fails
    // keep legacy fields for compatibility
    index: toInt(item?.index) || 0,
    fallbackRow: toInt(item?.rowNumber) || 0,
    uid: lookup.uid,
    id: item?.id ?? "",
    link: lookup.link,
    ...content,

    // ✅ New fields from reject/edit dialog
    agencyHeader: item?.agencyHeader || "", // override "UNK" if provided
    newHeadline: item?.newHeadline || "",
    newImageUrl: item?.newImageUrl || "",
    newCaption: item?.newCaption || "",

    // reject extras (handlers will fill later)
    feedback: item?.feedback || "",
    image_query: "",
    headline_improvements: "",
    caption_improvements: "",

    // debug
    __debug: {
      uiType,
      serviceType,
      route,
      computedRow: row,
      hadIndex: !!item?.index,
      sheet,
    },
  };
}
/* ---------- component ---------- */
export const ContentApprovalCard = ({
  item,
  onApprove,
  onReject,
  showRejectionDialog = true,
  contentType = "content",
  buttonState = null,
  onUndo,
  onDelete,
  showDeleteButton = false,
}: ContentApprovalCardProps) => {
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const dupInfo = useMemo(() => getDupInfoFromItem(item), [item]);
  // under other useState hooks:
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [rssDialogOpen, setRssDialogOpen] = useState(false);

  const isRSS =
    contentType === "rss" ||
    contentType === "rssNews" ||
    contentType === "rssDentistry" ||
    contentType === "rssMedia";

  const link = useMemo(
    () =>
      firstNonEmpty(
        item.link,
        item.articleLink,
        item.url,
        item.sourceLink,
        item.source
      ),
    [item]
  );

  const imageUrl = useMemo(
    () => (isRSS ? "" : pickImageUrl(item)),
    [item, isRSS]
  );
  const captionText = useMemo(
    () => (isRSS ? "" : pickCaption(item)),
    [item, isRSS]
  );
  const headlineText = useMemo(
    () => (isRSS ? "" : pickHeadline(item)),
    [item, isRSS]
  );

  useEffect(() => {
    // keep for debug if needed
  }, [imageUrl, item, contentType]);

  const handleApprove = async () => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const payload = buildWebhookPayload("approve", contentType, item);

      // NEW: payagan kung may valid row OR may lookup(uid/link)
      const hasValidRow =
        Number.isFinite(payload.row as number) && (payload.row as number) >= 2;
      const hasLookup =
        !!payload.lookup?.uid ||
        !!payload.lookup?.link ||
        !!payload.lookup?.index;

      if (!hasValidRow && !hasLookup) {
        throw new Error(
          `No row or lookup keys. dbg={index:${item?.index}, rowNumber:${item?.rowNumber}, actualArrayIndex:${item?.actualArrayIndex}}`
        );
      }

      await postWebhook(payload);

      toast({
        title: "Approved",
        description:
          contentType === "content" || contentType === "regenerated"
            ? "Approved and sent for scheduling"
            : "Sent for production",
      });
      onApprove(item);
    } catch (err: any) {
      console.error("Approval error:", err);
      toast({
        title: "Approval Failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // when ContentEditDialog submits
  const handleContentDialogSubmit = (payload: {
    kind: "content";
    captionMode: "gpt" | "user";
    thumbnailChange: "headline" | "image" | "both";
    newHeadline?: string;
    newImageUrl?: string;
    newCaption?: string;
  }) => {
    // Reuse existing handleReject signature by packing fields
    // feedback: short summary string for auditing
    const summary = `Caption:${payload.captionMode} | Thumb:${payload.thumbnailChange}`;
    const imageQuery = ""; // not used in new flow; keep empty
    const headlineImprovements = payload.newHeadline || "";
    const captionImprovements = payload.newCaption || "";

    // You ALSO likely want to send newImageUrl explicitly. We'll stash it in feedback tail for now,
    // AND add it to webhook payload via a custom field (see below).
    handleReject(
      `${summary}${
        payload.newImageUrl ? ` | ImgURL:${payload.newImageUrl}` : ""
      }`,
      imageQuery,
      headlineImprovements,
      captionImprovements
    );
  };

  // when RssCompletionDialog submits
  const handleRssDialogSubmit = (payload: {
    kind: "rss";
    newCategory: string;
    articleTitle: string;
    articleHeadline: string;
  }) => {
    // Map into existing reject fields (keeps your n8n flow backwards compatible)
    const feedback = `RSS Complete -> Category:${payload.newCategory}`;
    const imageQuery = "";
    const headlineImprovements = payload.articleHeadline;
    const captionImprovements = payload.articleTitle;

    handleReject(
      feedback,
      imageQuery,
      headlineImprovements,
      captionImprovements
    );
  };

  const handleReject = async (
    feedback?: string,
    imageQuery?: string,
    headlineImprovements?: string,
    captionImprovements?: string
  ) => {
    if (isRejecting) return;
    setIsRejecting(true);
    try {
      const payload = buildWebhookPayload("reject", contentType, item);
      payload.feedback = feedback || "";
      payload.image_query = imageQuery || "";
      if (feedback && /ImgURL:/.test(feedback)) {
        // extract URL if we embedded it in the summary
        const m = feedback.match(/ImgURL:([^\s]+)$/);
        if (m?.[1]) (payload as any).new_image_url = m[1];
      }

      payload.headline_improvements = headlineImprovements || "";
      payload.caption_improvements = captionImprovements || "";

      // NEW
      const hasValidRow =
        Number.isFinite(payload.row as number) && (payload.row as number) >= 2;
      const hasLookup =
        !!payload.lookup?.uid ||
        !!payload.lookup?.link ||
        !!payload.lookup?.index;

      if (!hasValidRow && !hasLookup) {
        throw new Error(
          `No row or lookup keys. dbg={index:${item?.index}, rowNumber:${item?.rowNumber}, actualArrayIndex:${item?.actualArrayIndex}}`
        );
      }

      await postWebhook(payload);

      toast({
        title: "Rejected",
        description:
          contentType === "content" || contentType === "regenerated"
            ? "Sent for regeneration"
            : "Rejected, not sent for production",
      });
      onReject(
        item,
        feedback,
        imageQuery,
        headlineImprovements,
        captionImprovements
      );
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast({
        title: "Rejection Failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Which tabs should open a dialog on Reject?
  const CT_NEEDS_DIALOG = new Set<string>([
    "content",
    "regenerated",
    "news",
    "dentistry",
    "rssNews",
    "rssDentistry",
    "rss",
    "rssMedia",
  ]);

  function needsRejectDialog(ct?: string) {
    return CT_NEEDS_DIALOG.has(String(ct || "").trim());
  }

  const onRejectClick = () => {
    // Content-like types use ContentEditDialog; RSS-like use RssCompletionDialog
    const ct = String(contentType || "");
    if (
      ct === "content" ||
      ct === "regenerated" ||
      ct === "news" ||
      ct === "dentistry"
    ) {
      setContentDialogOpen(true);
    } else {
      setRssDialogOpen(true);
    }
  };

  // Minimal rejected card (non-content types)
  if (
    buttonState === "rejected" &&
    contentType !== "content" &&
    contentType !== "regenerated"
  ) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 bg-red-50 border-red-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500 text-white">Rejected</Badge>
              <span className="text-sm text-red-700 font-medium">
                Not sent for production
              </span>
              {item.index && (
                <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-600">
                  Row: {item.index}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onUndo && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 hover:bg-blue-50"
                  onClick={() => onUndo(item)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Undo
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded((v) => !v)}
                className="text-gray-600"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isExpanded && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 truncate">
                {firstNonEmpty(
                  item.title,
                  item.articleTitle,
                  "Rejected content"
                )}
              </p>
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              {firstNonEmpty(item.title, item.articleTitle) && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    TITLE
                  </Label>
                  <p className="text-lg font-semibold mt-1 leading-tight">
                    {firstNonEmpty(item.title, item.articleTitle)}
                  </p>
                </div>
              )}

              {item.contentSnippet && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    CONTENT
                  </Label>
                  <p className="text-sm mt-1 leading-relaxed">
                    {item.contentSnippet}
                  </p>
                </div>
              )}

              {item.articleText && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    ARTICLE TEXT
                  </Label>
                  <p className="text-sm mt-1 leading-relaxed">
                    {String(item.articleText).substring(0, 300)}…
                  </p>
                </div>
              )}

              {item.source && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    SOURCE
                  </Label>
                  <p className="text-sm mt-1">{item.source}</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${statusToBadge(item.status)} text-white`}>
                {item.status ?? "Unknown"}
              </Badge>

              {item.index && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600">
                  Row: {item.index}
                </span>
              )}

              {item.uid && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600">
                  ID: {item.uid}
                </span>
              )}

              {contentType === "regenerated" && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600">
                  Regenerated
                </span>
              )}

              {item.inputText &&
                String(item.inputText).includes("https://") && (
                  <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                    Link Generated
                  </span>
                )}

              {item.priority && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Priority: {item.priority}
                </span>
              )}

              {item.truthScore !== undefined && item.truthScore !== "" && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Truth:{" "}
                  {(() => {
                    const num = Number(item.truthScore);
                    if (!isNaN(num))
                      return `${Math.round(num <= 1 ? num * 100 : num)}%`;
                    return String(item.truthScore);
                  })()}
                </span>
              )}

              {item.category && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Category: {item.category}
                </span>
              )}

              {item.keywords && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Keywords: {item.keywords}
                </span>
              )}

              <span
                className={`text-xs px-2 py-1 rounded ${
                  dupInfo.tag === "YES"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
                title={dupInfo.reason || "No duplicate markers"}
              >
                Is Dup? {dupInfo.tag}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isRSS ? (
            <div className="space-y-4">
              {firstNonEmpty(item.title, item.articleTitle) && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    TITLE
                  </Label>
                  <p className="text-lg font-semibold mt-1 leading-tight">
                    {firstNonEmpty(item.title, item.articleTitle)}
                  </p>
                </div>
              )}

              {item.contentSnippet && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    CONTENT
                  </Label>
                  <p className="text-sm mt-1 leading-relaxed">
                    {item.contentSnippet}
                  </p>
                </div>
              )}

              {link && (
                <div className="mt-2">
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Open source
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {(imageUrl || captionText || headlineText) && (
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="md:w-2/5 flex-shrink-0">
                    {imageUrl && (
                      <>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                          {contentType === "regenerated"
                            ? "REGENERATED IMAGE (Column L)"
                            : "AI-GENERATED IMAGE"}
                        </Label>
                        <div className="aspect-[4/5] w-full max-w-[300px] mx-auto md:mx-0">
                          <img
                            src={imageUrl}
                            alt={
                              contentType === "regenerated"
                                ? "Regenerated content"
                                : "AI Generated content"
                            }
                            className="w-full h-full object-cover rounded-md shadow-sm border"
                            loading="lazy"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="md:w-3/5 flex flex-col">
                    {headlineText && (
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                          HEADLINE
                        </Label>
                        <div className="h-full">
                          <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                            {headlineText}
                          </pre>
                          <br />
                        </div>
                      </div>
                    )}

                    {captionText && (
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                          {contentType === "regenerated"
                            ? "CAPTION (Column C)"
                            : "CAPTION GENERATED"}
                        </Label>
                        <div className="h-full">
                          <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                            {captionText}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {link && (
                <div className="mt-4">
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    View Article
                  </a>
                </div>
              )}

              {!(imageUrl || captionText || headlineText) && (
                <div className="space-y-4">
                  {firstNonEmpty(item.title, item.articleTitle) && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        TITLE
                      </Label>
                      <p className="text-lg font-semibold mt-1 leading-tight">
                        {firstNonEmpty(item.title, item.articleTitle)}
                      </p>
                    </div>
                  )}

                  {item.contentSnippet && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        CONTENT
                      </Label>
                      <p className="text-sm mt-1 leading-relaxed">
                        {item.contentSnippet}
                      </p>
                    </div>
                  )}

                  {item.articleText && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        ARTICLE TEXT
                      </Label>
                      <p className="text-sm mt-1 leading-relaxed">
                        {String(item.articleText).substring(0, 300)}…
                      </p>
                    </div>
                  )}

                  {item.source && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Domain
                      </Label>
                      <p className="text-sm mt-1">{item.source}</p>
                    </div>
                  )}

                  {firstNonEmpty(item.pubDate, item.pubdate) && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        PUBLICATION
                      </Label>
                      <p className="text-sm mt-1">
                        {firstNonEmpty(item.pubDate, item.pubdate)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          {(() => {
            const status = String(item?.status || "").toLowerCase();
            const isPendingLike =
              !status ||
              status.includes("pending") ||
              status.includes("queue") ||
              status.includes("review");
            const showButtons = isPendingLike && !buttonState;
            if (!showButtons) return null;

            return (
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50 flex-1"
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {isApproving ? "Approving..." : "Approve"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
                  onClick={onRejectClick}
                  disabled={isRejecting || isApproving}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {isRejecting ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* CONTENT edit dialog */}
      <ContentEditDialog
        isOpen={contentDialogOpen}
        onClose={() => setContentDialogOpen(false)}
        onSubmit={(p) => {
          handleContentDialogSubmit(p);
          setContentDialogOpen(false);
        }}
      />

      {/* RSS completion dialog */}
      <RssCompletionDialog
        isOpen={rssDialogOpen}
        onClose={() => setRssDialogOpen(false)}
        onSubmit={(p) => {
          handleRssDialogSubmit(p);
          setRssDialogOpen(false);
        }}
      />
    </>
  );
};
