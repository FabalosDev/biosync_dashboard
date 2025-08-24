import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { RejectionDialog } from "./RejectionDialog";
import { useToast } from "@/hooks/use-toast";
import { webhookService } from "@/services/webhookService";

interface ContentApprovalCardProps {
  item: any;
  onApprove: (item: any) => void;
  onReject: (item: any, feedback?: string, imageQuery?: string, headlineImprovements?: string, captionImprovements?: string) => void;
  showRejectionDialog?: boolean;
  contentType?: string;
  buttonState?: 'approved' | 'rejected' | null;
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
  showDeleteButton = false
}: ContentApprovalCardProps) => {
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-500";
      case "Approved": return "bg-green-500";
      case "Rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleApprove = async () => {
    if (isApproving) {
      console.log('🛑 Approve already in progress, ignoring click');
      return;
    }

    setIsApproving(true);
    
    try {
      const webhookUrls = webhookService.getWebhookUrls(contentType);
      let requestBody: any = {
        sheet: item.sheet,
        row: item.rowNumber || item.row,
        status: 'YES'
      };

      // Add specific fields based on content type
      if (contentType === "news") {
        requestBody.title = item.title || '';
      } else if (contentType === "journals") {
        requestBody.title = item.articleTitle || '';
      } else if (contentType === "rss") {
        requestBody.title = item.title || '';
        requestBody.sheet = "RSS";
      } else if ((contentType === "content" || contentType === "regenerated") && item.caption) {
        requestBody.caption = item.caption;
      }

      await webhookService.sendWebhookRequest(webhookUrls.approve, requestBody, 'approve');

      if (contentType === "content" || contentType === "regenerated") {
        toast({
          title: "Content Approved",
          description: "Approved and sent for scheduling",
        });
      } else {
        toast({
          title: "Content Approved", 
          description: "Sent for production",
        });
      }
      
      onApprove(item);
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: `Failed to approve content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (feedback?: string, imageQuery?: string, headlineImprovements?: string, captionImprovements?: string) => {
    if (isRejecting) {
      console.log('🛑 Reject already in progress, ignoring click');
      return;
    }

    setIsRejecting(true);
    
    try {
      const webhookUrls = webhookService.getWebhookUrls(contentType);
      let requestBody: any = {
        sheet: item.sheet,
        row: item.rowNumber || item.row,
        status: 'NO'
      };

      // Content review type should send feedback, image_query and status NO
      if (contentType === "content" || contentType === "regenerated") {
        requestBody.feedback = feedback || '';
        requestBody.image_query = imageQuery || '';
        requestBody.headline_improvements = headlineImprovements || '';
        requestBody.caption_improvements = captionImprovements || '';
        if (item.caption) {
          requestBody.caption = item.caption;
        }
      } else {
        // For news, journals, and rss - send status NO and title
        if (contentType === "news") {
          requestBody.title = item.title || '';
        } else if (contentType === "journals") {
          requestBody.title = item.articleTitle || '';
        } else if (contentType === "rss") {
          requestBody.title = item.title || '';
          requestBody.sheet = "RSS";
        }
      }

      await webhookService.sendWebhookRequest(webhookUrls.reject, requestBody, 'reject');

      if (contentType === "content" || contentType === "regenerated") {
        toast({
          title: "Content Rejected",
          description: "Sent for regeneration",
        });
      } else {
        toast({
          title: "Content Rejected",
          description: "Rejected, not sent for production",
        });
      }
      
      onReject(item, feedback, imageQuery, headlineImprovements, captionImprovements);
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: `Failed to reject content: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    if (buttonState === 'approved') {
      return (contentType === "content" || contentType === "regenerated") ? "Approved and sent for scheduling" : "Sent for production";
    }
    if (buttonState === 'rejected') {
      return (contentType === "content" || contentType === "regenerated") ? "Sent for regeneration" : "Rejected, not sent for production";
    }
    return null;
  };

  // Show minimized view for rejected items in news, journals, and rss
  if (buttonState === 'rejected' && contentType !== 'content' && contentType !== 'regenerated') {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 bg-red-50 border-red-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500 text-white">
                Rejected
              </Badge>
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
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                  <Label className="text-xs font-medium text-muted-foreground">TITLE</Label>
                  <p className="text-lg font-semibold mt-1 leading-tight">{item.title || item.articleTitle}</p>
                </div>
              )}

              {item.contentSnippet && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">CONTENT</Label>
                  <p className="text-sm mt-1 leading-relaxed">{item.contentSnippet}</p>
                </div>
              )}

              {item.articleText && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">ARTICLE TEXT</Label>
                  <p className="text-sm mt-1 leading-relaxed">{item.articleText.substring(0, 300)}...</p>
                </div>
              )}

              {item.articleAuthors && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">AUTHORS</Label>
                  <p className="text-sm mt-1">{item.articleAuthors}</p>
                </div>
              )}

              {item.source && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">SOURCE</Label>
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
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(item.status)} text-white`}>
                {item.status}
              </Badge>
              {(item.rowNumber || item.row) && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                  Row: {item.rowNumber || item.row}
                </span>
              )}
              {contentType === "regenerated" && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600">
                  Regenerated
                </span>
              )}
              {item.inputText && item.inputText.includes('https://') && (
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600">
                  Link Generated
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Content review items with 2-column layout */}
          {(item.imageGenerated || item.regeneratedImage || item.caption) && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Left Column - Image (40%) */}
              {(item.imageGenerated || item.regeneratedImage) && (
                <div className="md:w-2/5 flex-shrink-0">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {contentType === "regenerated" ? "REGENERATED IMAGE (Column L)" : "AI-GENERATED IMAGE"}
                  </Label>
                  <div className="aspect-[4/5] w-full max-w-[300px] mx-auto md:mx-0">
                    <img 
                      src={contentType === "regenerated" ? item.regeneratedImage : (item.regeneratedImage || item.imageGenerated)} 
                      alt={contentType === "regenerated" ? "Regenerated content" : "AI Generated content"} 
                      className="w-full h-full object-cover rounded-md shadow-sm border"
                      onError={(e) => {
                        console.log("Image failed to load:", contentType === "regenerated" ? item.regeneratedImage : (item.regeneratedImage || item.imageGenerated));
                      }}
                      onLoad={() => {
                        console.log("Image loaded successfully:", contentType === "regenerated" ? item.regeneratedImage : (item.regeneratedImage || item.imageGenerated));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Right Column - Caption only (60%) */}
              <div className="md:w-3/5 flex flex-col">
                {item.caption && (
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {contentType === "regenerated" ? "CAPTION (Column C)" : "CAPTION GENERATED"}
                    </Label>
                    <div className="h-full">
                      <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans overflow-wrap-break-word">{item.caption}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legacy content layout for other item types */}
          {!(item.imageGenerated || item.regeneratedImage || item.caption) && (
            <div className="space-y-4">
              {(item.title || item.articleTitle) && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">TITLE</Label>
                  <p className="text-lg font-semibold mt-1 leading-tight">{item.title || item.articleTitle}</p>
                </div>
              )}

              {item.contentSnippet && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">CONTENT</Label>
                  <p className="text-sm mt-1 leading-relaxed">{item.contentSnippet}</p>
                </div>
              )}

              {item.articleText && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">ARTICLE TEXT</Label>
                  <p className="text-sm mt-1 leading-relaxed">{item.articleText.substring(0, 300)}...</p>
                </div>
              )}

              {item.articleAuthors && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">AUTHORS</Label>
                  <p className="text-sm mt-1">{item.articleAuthors}</p>
                </div>
              )}

              {item.source && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">SOURCE</Label>
                  <p className="text-sm mt-1">{item.source}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons or Status Message */}
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

          {/* Status Message with Undo Option */}
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
