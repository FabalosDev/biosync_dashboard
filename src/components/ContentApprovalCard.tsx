// src/components/ContentApprovalCard.tsx
// One-file, cleaned, and fixed version
// - No RejectionDialog
// - Dialog overrides are merged into payload
// - If newImageUrl is present → use it; GPT image won't run
// - isPureReject only true when everything is truly kept

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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postWebhook } from "@/services/webhookService";
import { getDupInfoFromItem } from "@/utils/dup";
import { ContentEditDialog } from "./ContentEditDialog";
import { RssCompletionDialog } from "./RssCompletionDialog";
import { captionLen, captionClass } from "@/utils/text";

// -----------------------------
// Types
// -----------------------------

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
  contentType?: ContentType;
  buttonState?: "approved" | "rejected" | null;
  onUndo?: (item: any) => void;
  onDelete?: (item: any) => void;
  showDeleteButton?: boolean;
}

type CaptionMode = "keep" | "gpt" | "user";
type ThumbChange = "keep" | "headline" | "image" | "both";

type EditOverrides = {
  captionMode?: CaptionMode;
  thumbnailChange?: ThumbChange;
  newHeadline?: string;
  newImageUrl?: string;
  newCaption?: string;
  agencyHeader?: string;
};

// -----------------------------
// Tiny helpers
// -----------------------------

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

// -----------------------------
// Payload builder
// -----------------------------

function buildWebhookPayload(
  action: "approve" | "reject",
  contentType: string,
  item: any
) {
  const toInt = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };
  const nonEmpty = (s?: string) => (s || "").trim() !== "";

  // ---------- normalize type ----------
  const uiType = String(contentType || "").trim();
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

  // ---------- row + lookup ----------
  let row =
    toInt(item?.index) ||
    toInt(item?.rowNumber) ||
    toInt(item?.row) ||
    (item?.actualArrayIndex != null ? toInt(item.actualArrayIndex) + 2 : NaN);
  if (!Number.isFinite(row) || row < 2) row = NaN;

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

  // ---------- RSS + edit inputs ----------
  const newCategory = String(item?.newCategory || "").trim();
  const articleTitle = String(item?.articleTitle || "").trim();
  const articleHeadline = String(item?.articleHeadline || "").trim();

  const newHeadline = String(
    item?.newHeadline ??
      item?.reword ?? // for news
      articleHeadline ?? // for rss
      ""
  ).trim();

  const existingHeadline = String(
    item?.thumbHeadline ??
      item?.headline ??
      item?.reword ?? // news fallback
      item?.title ??
      articleTitle ?? // rss fallback
      ""
  ).trim();

  const newImageUrl = String(item?.newImageUrl || "").trim();
  const newCaption = String(item?.newCaption || "").trim();
  const agencyHeaderUI = String(item?.agencyHeader || "")
    .trim()
    .toUpperCase();

  // ---------- routing flags ----------
  const captionMode = (item?.captionMode as string) || "keep";
  const thumbnailChange = (item?.thumbnailChange as string) || "keep";

  const hasAgencyOverride = nonEmpty(agencyHeaderUI);
  const hasUserHeadline = nonEmpty(newHeadline);
  const hasUserImage = nonEmpty(newImageUrl);

  let doCaptionGPT = captionMode === "gpt";
  let doCaptionSaveUser = captionMode === "user" && nonEmpty(newCaption);

  let doBannerbear = false;
  let doGPTImage = false;

  switch (thumbnailChange) {
    case "keep":
      if (hasAgencyOverride) doBannerbear = true;
      break;
    case "headline":
      doBannerbear = true;
      break;
    case "image":
      if (hasUserImage) doBannerbear = true;
      else doGPTImage = true;
      break;
    case "both":
      if (hasUserHeadline && hasUserImage) doBannerbear = true;
      else if (hasUserHeadline && !hasUserImage) doGPTImage = true;
      else if (!hasUserHeadline && hasUserImage) doBannerbear = true;
      else doGPTImage = true;
      break;
  }

  const isPureReject =
    captionMode === "keep" && thumbnailChange === "keep" && !hasAgencyOverride;

  // ---------- resolved ----------
  const resolvedHeadline = hasUserHeadline ? newHeadline : existingHeadline;
  const resolvedImageUrl = hasUserImage ? newImageUrl : "";
  const resolvedAgencyHeader = hasAgencyOverride
    ? agencyHeaderUI
    : String(
        item?.agency_header ||
          item?.agencyHeaderDetected ||
          item?.display_agency ||
          ""
      )
        .trim()
        .toUpperCase();

  // ---------- final payload ----------
  return {
    action,
    contentType: serviceType,
    route,
    sheet,
    row: Number.isFinite(row) ? row : null,
    lookup,
    index: toInt(item?.index) || 0,
    fallbackRow: toInt(item?.rowNumber) || 0,
    uid: lookup.uid,
    id: item?.id ?? "",
    link: lookup.link,

    // overwrite title with resolved headline
    title: resolvedHeadline || lookup.title,

    // normal edit fields
    captionMode,
    thumbnailChange,
    agencyHeader: agencyHeaderUI,
    newHeadline,
    newImageUrl,
    newCaption,

    // ✅ RSS fields
    newCategory,
    articleTitle,
    articleHeadline,

    // routing flags
    doCaptionGPT,
    doCaptionSaveUser,
    doBannerbear,
    doGPTImage,
    isPureReject,

    // resolved values
    resolvedHeadline,
    resolvedImageUrl,
    resolvedAgencyHeader,

    // optional feedback fields
    feedback: item?.feedback || "",
    image_query: item?.image_query || "",
    headline_improvements: item?.headline_improvements || "",
    caption_improvements: item?.caption_improvements || "",

    __debug: {
      uiType,
      serviceType,
      route,
      computedRow: row,
      hadIndex: !!item?.index,
      sheet,
      detectedAgencyHdr: resolvedAgencyHeader,
    },
  };
}
// -----------------------------
// Component
// -----------------------------

export const ContentApprovalCard = ({
  item,
  onApprove,
  onReject,
  contentType = "content",
  buttonState = null,
  onUndo,
  onDelete,
  showDeleteButton = false,
}: ContentApprovalCardProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const dupInfo = useMemo(() => getDupInfoFromItem(item), [item]);

  // Dialog state
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

      // Allow if there's a valid row OR lookup(uid/link/index)
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
    intent: "reject" | "edit";
    captionMode: CaptionMode;
    thumbnailChange: ThumbChange;
    newHeadline?: string;
    newImageUrl?: string;
    newCaption?: string;
    agencyHeader?: string;
  }) => {
    const summary = `Caption:${payload.captionMode} | Thumb:${payload.thumbnailChange}`;
    const imageQuery = "";
    const headlineImprovements = payload.newHeadline || "";
    const captionImprovements = payload.newCaption || "";

    // Normalize & coerce: if user typed a URL but left radio on keep → treat as image change
    const trimmedUrl = (payload.newImageUrl || "").trim();
    const normalizedThumb: ThumbChange =
      trimmedUrl &&
      (payload.thumbnailChange === "keep" || !payload.thumbnailChange)
        ? "image"
        : payload.thumbnailChange;

    const overrides: EditOverrides = {
      captionMode: payload.captionMode,
      thumbnailChange: normalizedThumb,
      newHeadline: (payload.newHeadline || "").trim() || undefined,
      newImageUrl: trimmedUrl || undefined,
      newCaption: (payload.newCaption || "").trim() || undefined,
      agencyHeader:
        (payload.agencyHeader || "").trim().toUpperCase() || undefined,
    };

    handleReject(
      `${summary}${trimmedUrl ? ` | ImgURL:${trimmedUrl}` : ""}`,
      imageQuery,
      headlineImprovements,
      captionImprovements,
      overrides
    );
  };

  // when RssCompletionDialog submits
  const handleRssDialogSubmit = (p: {
    kind: "rss";
    newCategory: string;
    articleTitle: string;
    articleHeadline: string;
  }) => {
    const overrides = {
      newCategory: p.newCategory?.trim() || undefined,
      articleTitle: p.articleTitle?.trim() || undefined,
      articleHeadline: p.articleHeadline?.trim() || undefined,
    };

    // Do NOT stuff category into feedback anymore
    handleReject(
      "", // feedback
      "", // imageQuery
      p.articleHeadline || "",
      p.articleTitle || "",
      overrides // <<< pass overrides so builder sees them
    );
  };

  const handleReject = async (
    feedback?: string,
    imageQuery?: string,
    headlineImprovements?: string,
    captionImprovements?: string,
    overrides?: EditOverrides
  ) => {
    if (isRejecting) return;
    setIsRejecting(true);
    try {
      // Merge dialog overrides into item so payload sees the edits
      const itemForPayload = overrides ? { ...item, ...overrides } : item;
      const payload = buildWebhookPayload(
        "reject",
        contentType,
        itemForPayload
      );

      payload.feedback = feedback || "";
      payload.image_query = imageQuery || "";
      if (feedback && /ImgURL:([^\s]+)$/.test(feedback)) {
        const m = feedback.match(/ImgURL:([^\s]+)$/);
        if (m?.[1]) (payload as any).new_image_url = m[1];
      }
      payload.headline_improvements = headlineImprovements || "";
      payload.caption_improvements = captionImprovements || "";

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

  const onRejectClick = () => {
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

              {(() => {
                const len = captionLen(item.caption); // change to your exact field name from Sheets
                return len > 0 ? (
                  <span
                    className={`text-xs px-2 py-1 rounded ${captionClass(
                      len,
                      2000,
                      1800
                    )}`}
                    title="IG hard limit: 2200. Using 2000 as safe cap."
                  >
                    Caption: {len}/2000
                  </span>
                ) : null;
              })()}

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
