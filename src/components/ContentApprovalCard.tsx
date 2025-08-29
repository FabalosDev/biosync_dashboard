// src/components/ContentApprovalCard.tsx
import { useState, useMemo } from "react";
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
import { RejectionDialog } from "./RejectionDialog";
import { useToast } from "@/hooks/use-toast";
import { webhookService } from "@/services/webhookService";

/** Keep your existing union so the rest of the app compiles */
type ContentType =
  | "content"
  | "regenerated"
  | "news"
  | "rssNews"
  | "rss"
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

const firstNonEmpty = (...vals: (string | undefined)[]) =>
  vals.find((v) => typeof v === "string" && v.trim() !== "") ?? "";

/** Build approve payload by content type */
function buildApproveBody(contentType: ContentType, item: any) {
  const body: Record<string, any> = {
    sheet: item.sheet,
    row: item.rowNumber || item.row,
    status: "YES",
  };

  // shared
  if (item.caption) body.caption = item.caption;
  const title = firstNonEmpty(item.title, item.articleTitle, item.headline);

  switch (contentType) {
    case "content":
    case "regenerated":
      // keep default sheet as item.sheet
      break;
    case "news":
      body.title = title;
      // sheet: from item.sheet ("HEALTH NEWS USA- THUMBNAILS")
      break;
    case "rssNews":
      body.title = title;
      body.sheet = "HNN RSS";
      break;
    case "rss":
      body.title = title;
      body.sheet = "Thumbnail System";
      break;
    case "dentistry":
      body.title = title;
      body.sheet = "DENTAL";
      break;
    case "rssDentistry":
      body.title = title;
      body.sheet = "Dental RSS";
      break;
  }

  return body;
}

/** Build reject payload by content type */
function buildRejectBody(
  contentType: ContentType,
  item: any,
  extra?: {
    feedback?: string;
    imageQuery?: string;
    headlineImprovements?: string;
    captionImprovements?: string;
  }
) {
  const body: Record<string, any> = {
    sheet: item.sheet,
    row: item.rowNumber || item.row,
    status: "NO",
  };

  const title = firstNonEmpty(item.title, item.articleTitle, item.headline);
  if (item.caption) body.caption = item.caption;

  if (contentType === "content" || contentType === "regenerated") {
    body.feedback = extra?.feedback ?? "";
    body.image_query = extra?.imageQuery ?? "";
    body.headline_improvements = extra?.headlineImprovements ?? "";
    body.caption_improvements = extra?.captionImprovements ?? "";
  }

  switch (contentType) {
    case "news":
      body.title = title;
      break;
    case "rssNews":
      body.title = title;
      body.sheet = "HNN RSS";
      break;
    case "rss":
      body.title = title;
      body.sheet = "Thumbnail System";
      break;
    case "dentistry":
      body.title = title;
      body.sheet = "DENTAL";
      break;
    case "rssDentistry":
      body.title = title;
      body.sheet = "Dental RSS";
      break;
  }

  return body;
}

export const ContentApprovalCard = ({
  item,
  onApprove,
  onReject,
  showRejectionDialog = false,
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

  const actionMessage = useMemo(() => {
    if (buttonState === "approved") {
      return contentType === "content" || contentType === "regenerated"
        ? "Approved and sent for scheduling"
        : "Sent for production";
    }
    if (buttonState === "rejected") {
      return contentType === "content" || contentType === "regenerated"
        ? "Sent for regeneration"
        : "Rejected, not sent for production";
    }
    return null;
  }, [buttonState, contentType]);

  const handleApprove = async () => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const { approve } = webhookService.getWebhookUrls(contentType);
      const body = buildApproveBody(contentType, item);

      await webhookService.sendWebhookRequest(approve, body, "approve");

      toast({
        title: "Content Approved",
        description:
          contentType === "content" || contentType === "regenerated"
            ? "Approved and sent for scheduling"
            : "Sent for production",
      });

      onApprove(item);
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: `Failed to approve content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
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
      const { reject } = webhookService.getWebhookUrls(contentType);
      const body = buildRejectBody(contentType, item, {
        feedback,
        imageQuery,
        headlineImprovements,
        captionImprovements,
      });

      await webhookService.sendWebhookRequest(reject, body, "reject");

      toast({
        title: "Content Rejected",
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
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection Failed",
        description: `Failed to reject content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const openRejectionDialog = () => {
    if (contentType === "content" || contentType === "regenerated") {
      setRejectionDialogOpen(true);
    } else {
      // non-content types can reject immediately
      handleReject();
    }
  };

  /** MINIMAL REJECTED CARD for non-content types */
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
              {(item.rowNumber || item.row) && (
                <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-600">
                  Row: {item.rowNumber || item.row}
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

              {item.articleAuthors && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    AUTHORS
                  </Label>
                  <p className="text-sm mt-1">{item.articleAuthors}</p>
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

              {(item.rowNumber || item.row) && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600">
                  Row: {item.rowNumber || item.row}
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
                    if (!isNaN(num)) {
                      return `${Math.round(num <= 1 ? num * 100 : num)}%`;
                    }
                    return String(item.truthScore);
                  })()}
                </span>
              )}

              {item.category && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Category: {item.category}
                </span>
              )}

              {item.new && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Is New? {item.new}
                </span>
              )}

              {item.keywords && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Keywords: {item.keywords}
                </span>
              )}

              {item.dup && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Is Dup? {item.dup}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Image + text layout */}
          {(item.imageGenerated || item.regeneratedImage) && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="md:w-2/5 flex-shrink-0">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  {contentType === "regenerated"
                    ? "REGENERATED IMAGE (Column L)"
                    : "AI-GENERATED IMAGE"}
                </Label>
                <div className="aspect-[4/5] w-full max-w-[300px] mx-auto md:mx-0">
                  <img
                    src={
                      contentType === "regenerated"
                        ? item.regeneratedImage
                        : item.regeneratedImage || item.imageGenerated
                    }
                    alt={
                      contentType === "regenerated"
                        ? "Regenerated content"
                        : "AI Generated content"
                    }
                    className="w-full h-full object-cover rounded-md shadow-sm border"
                  />
                </div>
              </div>

              <div className="md:w-3/5 flex flex-col">
                {item.headline && (
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      HEADLINE
                    </Label>
                    <div className="h-full">
                      <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                        {item.headline}
                      </pre>
                      <br />
                    </div>
                  </div>
                )}

                {item.caption && (
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {contentType === "regenerated"
                        ? "CAPTION (Column C)"
                        : "CAPTION GENERATED"}
                    </Label>
                    <div className="h-full">
                      <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                        {item.caption}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Link */}
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

          {/* Legacy layout */}
          {!(item.imageGenerated || item.regeneratedImage) && (
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

          {/* Action buttons */}
          {item.status === "Pending" && !buttonState && (
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
                onClick={() =>
                  contentType === "content" || contentType === "regenerated"
                    ? setRejectionDialogOpen(true)
                    : handleReject()
                }
                disabled={isRejecting || isApproving}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}

          {/* Undo / status note */}
          {buttonState && actionMessage && (
            <div className="mt-4 p-3 rounded-md bg-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {actionMessage}
                </p>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content/regenerated only */}
      <RejectionDialog
        isOpen={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        onSubmit={handleReject}
      />
    </>
  );
};
