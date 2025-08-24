
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface RejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string, imageQuery: string, headlineImprovements: string, captionImprovements: string) => void;
}

export const RejectionDialog = ({ isOpen, onClose, onSubmit }: RejectionDialogProps) => {
  const [feedback, setFeedback] = useState("");
  const [imageQuery, setImageQuery] = useState("");
  const [headlineImprovements, setHeadlineImprovements] = useState("");
  const [captionImprovements, setCaptionImprovements] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [exactIssue, setExactIssue] = useState("");

  const rejectionReasons = [
    "Image not apt to the content",
    "Incorrect Caption - regenerate caption",
    "Incorrect information",
    "Rephrase Headlines"
  ];

  const handleReasonClick = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== "Others") {
      setFeedback(reason);
      setCustomReason("");
    } else {
      setFeedback("");
    }
  };

  const handleCustomReasonChange = (value: string) => {
    setCustomReason(value);
    if (selectedReason === "Others") {
      setFeedback(`Others - ${value}`);
    }
  };

  const handleSubmit = () => {
    const finalFeedback = selectedReason === "Others" ? `Others - ${customReason}` : selectedReason;
    const fullFeedback = exactIssue ? `${finalFeedback} - ${exactIssue}` : finalFeedback;
    
    onSubmit(fullFeedback, imageQuery, headlineImprovements, captionImprovements);
    
    // Reset form
    setFeedback("");
    setImageQuery("");
    setHeadlineImprovements("");
    setCaptionImprovements("");
    setSelectedReason("");
    setCustomReason("");
    setExactIssue("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rejection Feedback</DialogTitle>
          <DialogDescription>
            Please select a reason for rejection and provide detailed feedback for regeneration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for rejection</Label>
            <div className="grid grid-cols-1 gap-2">
              {rejectionReasons.map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  variant={selectedReason === reason ? "default" : "outline"}
                  className="h-auto p-3 text-sm text-left justify-start"
                  onClick={() => handleReasonClick(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
            
            {selectedReason && (
              <div className="mt-3">
                <Label htmlFor="exactIssue">Exact issue (optional)</Label>
                <Textarea
                  id="exactIssue"
                  placeholder="Describe the specific issue in detail..."
                  value={exactIssue}
                  onChange={(e) => setExactIssue(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageQuery">Image query to replace</Label>
            <Input
              id="imageQuery"
              placeholder="Enter search terms for a better image..."
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headlineImprovements">What can be better with headlines</Label>
            <Textarea
              id="headlineImprovements"
              placeholder="Suggest improvements for the headlines..."
              value={headlineImprovements}
              onChange={(e) => setHeadlineImprovements(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="captionImprovements">What can be better with caption</Label>
            <Textarea
              id="captionImprovements"
              placeholder="Suggest improvements for the caption..."
              value={captionImprovements}
              onChange={(e) => setCaptionImprovements(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedReason}>
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
