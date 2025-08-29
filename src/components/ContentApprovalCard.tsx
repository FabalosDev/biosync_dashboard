import { useState } from "react";
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

type ContentType =
  | "content"
  | "regenerated"
  | "news"
  | "rssNews" // renamed from journals
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

  const getStatusColor = (status: string) => {
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

  const handleApprove = async () => {
    if (isApproving) return;
    setIsApproving(true);

    try {
      const webhookUrls = webhookService.getWebhookUrls(contentType);
      const requestBody: any = {
        sheet: item.sheet,
        row: item.rowNumber || item.row,
        status: "YES",
      };

      // APPROVE payload tweaks by type
      if (contentType === "content" || contentType === "regenerated") {
        if (item.caption) requestBody.caption = item.caption;
      } else if (contentType === "news") {
        requestBody.title = item.title || "";
        // sheet stays as item.sheet ("HEALTH NEWS USA- THUMBNAILS")
      } else if (contentType === "rssNews") {
        requestBody.title = item.title || "";
        requestBody.sheet = "HNN RSS";
      } else if (contentType === "rss") {
        requestBody.title = item.title || "";
        requestBody.sheet = "Thumbnail System";
      } else if (contentType === "dentistry") {
        requestBody.title = item.title || "";
        requestBody.sheet = "DENTAL";
      } else if (contentType === "rssDentistry") {
        requestBody.title = item.title || "";
        requestBody.sheet = "Dental RSS";
      }

      await webhookService.sendWebhookRequest(
        webhookUrls.approve,
        requestBody,
        "approve"
      );

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
      const webhookUrls = webhookService.getWebhookUrls(contentType);
      const requestBody: any = {
        sheet: item.sheet,
        row: item.rowNumber || item.row,
        status: "NO",
      };

      // REJECT payload tweaks by type
      if (contentType === "content" || contentType === "regenerated") {
        requestBody.feedback = feedback || "";
        requestBody.image_query = imageQuery || "";
        requestBody.headline_improvements = headlineImprovements || "";
        requestBody.caption_improvements = captionImprovements || "";
        if (item.caption) requestBody.caption = item.caption;
      } else if (contentType === "news") {
        requestBody.title = item.title || "";
      } else if (contentType === "rssNews") {
        requestBody.title = item.title || "";
        requestBody.sheet = "HNN RSS";
      } else if (contentType === "rss") {
        requestBody.title = item.title || "";
        requestBody.sheet = "Thumbnail System";
      } else if (contentType === "dentistry") {
        requestBody.title = item.title || "";
        requestBody.sheet = "DENTAL";
      } else if (contentType === "rssDentistry") {
        requestBody.title = item.title || "";
        requestBody.sheet = "Dental RSS";
      }

      await webhookService.sendWebhookRequest(
        webhookUrls.reject,
        requestBody,
        "reject"
      );

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
      handleReject();
    }
  };

  const getActionStatusMessage = () => {
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
  };

  // Minimized card for rejected items (non-content types)
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
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50"
                onClick={() => onUndo && onUndo(item)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
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
                {item.title || item.articleTitle || "Rejected content"}
              </p>
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              {(item.title || item.articleTitle) && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    TITLE
                  </Label>
                  <p className="text-lg font-semibold mt-1 leading-tight">
                    {item.title || item.articleTitle}
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
                    {item.articleText.substring(0, 300)}...
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
          {/* Top header with status + badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(item.status)} text-white`}>
                {item.status}
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

              {item.inputText && item.inputText.includes("https://") && (
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
                    return item.truthScore;
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
          {/* Image + Caption */}
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
                      <br></br>
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

          {/* Article link */}
          {item.link && (
            <div className="mt-4">
              <Label className="text-xs font-medium text-muted-foreground"></Label>
              <a
                href={
                  item.link ||
                  item.articleLink ||
                  item.url ||
                  item.sourceLink ||
                  item.source
                }
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline"
              >
                View Article
              </a>
            </div>
          )}

          {/* Legacy layout (title, snippet, etc.) */}
          {!(item.imageGenerated || item.regeneratedImage) && (
            <div className="space-y-4">
              {(item.title || item.articleTitle) && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    TITLE
                  </Label>
                  <p className="text-lg font-semibold mt-1 leading-tight">
                    {item.title || item.articleTitle}
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
                    {item.articleText.substring(0, 300)}...
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
                    Domain
                  </Label>
                  <p className="text-sm mt-1">{item.source}</p>
                </div>
              )}
              {(item.pubDate || item.pubdate) && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    PUBLICATION:
                  </Label>
                  <p className="text-sm mt-1">{item.pubDate || item.pubdate}</p>
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
                onClick={openRejectionDialog}
                disabled={isRejecting || isApproving}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}

          {/* Undo state */}
          {buttonState && (
            <div className="mt-4 p-3 rounded-md bg-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {getActionStatusMessage()}
                </p>
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
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RejectionDialog
        isOpen={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        onSubmit={handleReject}
      />
    </>
  );
};
