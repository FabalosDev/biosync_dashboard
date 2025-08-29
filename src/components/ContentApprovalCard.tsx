// src/components/ContentApprovalCard.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { webhookService } from "@/services/webhookService";

type ContentType =
  | "content"
  | "news"
  | "rss"
  | "rssNews"
  | "rssDentistry"
  | "dentistry";

interface ContentApprovalCardProps {
  item: any;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
  contentType?: ContentType;
  buttonState?: "approved" | "rejected" | null;
  onUndo?: (item: any) => void;
}

export const ContentApprovalCard = ({
  item,
  onApprove,
  onReject,
  contentType = "content",
  buttonState = null,
  onUndo,
}: ContentApprovalCardProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
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
        action: "approve",
        contentType,
        sheet: item.sheet,
        row: item.rowNumber || item.row,
        title: item.title || "",
        caption: item.caption || "",
      };

      await webhookService.sendWebhookRequest(
        webhookUrls.approve,
        requestBody,
        "approve"
      );

      toast({
        title: "Content Approved",
        description: "Approved and sent for scheduling/production.",
      });

      onApprove(item);
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    setIsRejecting(true);

    try {
      const webhookUrls = webhookService.getWebhookUrls(contentType);
      const requestBody: any = {
        action: "reject",
        contentType,
        sheet: item.sheet,
        row: item.rowNumber || item.row,
        title: item.title || "",
        caption: item.caption || "",
      };

      await webhookService.sendWebhookRequest(
        webhookUrls.reject,
        requestBody,
        "reject"
      );

      toast({
        title: "Content Rejected",
        description: "Marked as rejected and not sent for production.",
      });

      onReject(item);
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getActionStatusMessage = () => {
    if (buttonState === "approved") return "Approved and sent for scheduling";
    if (buttonState === "rejected") return "Rejected, not sent for production";
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(item.status)} text-white`}>
            {item.status}
          </Badge>
          {(item.rowNumber || item.row) && (
            <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600">
              Row: {item.rowNumber || item.row}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {item.title && (
          <div className="mb-3">
            <Label className="text-xs">TITLE</Label>
            <p className="font-semibold">{item.title}</p>
          </div>
        )}
        {item.caption && (
          <div className="mb-3">
            <Label className="text-xs">CAPTION</Label>
            <p>{item.caption}</p>
          </div>
        )}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 underline"
          >
            View Article
          </a>
        )}

        {/* Action buttons */}
        {item.status === "Pending" && !buttonState && (
          <div className="flex gap-2 mt-4">
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
              onClick={handleReject}
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
  );
};
