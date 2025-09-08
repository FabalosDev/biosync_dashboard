import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";

export interface RssCompletionPayload {
  kind: "rss";
  intent: "reject" | "keep_draft";
  newCategory?: string;
  articleTitle?: string;
  articleHeadline?: string;
}

interface RssCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RssCompletionPayload) => void;
}

export const RssCompletionDialog = ({
  isOpen,
  onClose,
  onSubmit,
}: RssCompletionDialogProps) => {
  const [newCategory, setNewCategory] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleHeadline, setArticleHeadline] = useState("");

  const trimmedCategory = newCategory.trim();
  const trimmedTitle = articleTitle.trim();
  const trimmedHeadline = articleHeadline.trim();

  const hasAnyInput = useMemo(
    () => !!(trimmedCategory || trimmedTitle || trimmedHeadline),
    [trimmedCategory, trimmedTitle, trimmedHeadline]
  );

  const handleSubmit = () => {
    onSubmit({
      kind: "rss",
      intent: hasAnyInput ? "keep_draft" : "reject",
      ...(hasAnyInput && {
        newCategory: trimmedCategory,
        articleTitle: trimmedTitle,
        articleHeadline: trimmedHeadline,
      }),
    });

    // reset + close
    setNewCategory("");
    setArticleTitle("");
    setArticleHeadline("");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete RSS Details</DialogTitle>
          <DialogDescription>
            Leave all fields blank to <strong>Reject</strong>. Fill in any field
            to <strong>Keep as Draft</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rssCategory">Category</Label>
            <Input
              id="rssCategory"
              placeholder="e.g., Public Health"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rssTitle">Article Title</Label>
            <Input
              id="rssTitle"
              placeholder="Full article title…"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rssHeadline">Article Text</Label>
            <Input
              id="rssHeadline"
              placeholder="Social-friendly headline…"
              value={articleHeadline}
              onChange={(e) => setArticleHeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {hasAnyInput ? "Keep as Draft" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
