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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // shadcn radio
import { cn } from "@/lib/utils"; // optional helper if you have it

/* =======================
   Content Edit Dialog
   ======================= */

type CaptionMode = "gpt" | "user";
type ThumbChange = "headline" | "image" | "both";

export interface ContentEditPayload {
  kind: "content";
  captionMode: CaptionMode;
  thumbnailChange: ThumbChange;
  newHeadline?: string;
  newImageUrl?: string;
  newCaption?: string;
}

interface ContentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ContentEditPayload) => void;
}

export const ContentEditDialog = ({
  isOpen,
  onClose,
  onSubmit,
}: ContentEditDialogProps) => {
  const [captionMode, setCaptionMode] = useState<CaptionMode>("gpt");
  const [thumbnailChange, setThumbnailChange] =
    useState<ThumbChange>("headline");
  const [newHeadline, setNewHeadline] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");

  const needsHeadline = useMemo(
    () => thumbnailChange === "headline" || thumbnailChange === "both",
    [thumbnailChange]
  );
  const needsImage = useMemo(
    () => thumbnailChange === "image" || thumbnailChange === "both",
    [thumbnailChange]
  );
  const needsCaption = useMemo(() => captionMode === "user", [captionMode]);

  const isValidUrl = (s: string) => {
    if (!s.trim()) return false;
    try {
      const u = new URL(s.trim());
      return !!u.protocol && !!u.host;
    } catch {
      return false;
    }
  };

  const canSubmit = useMemo(() => {
    if (needsHeadline && newHeadline.trim() === "") return false;
    if (needsImage && !isValidUrl(newImageUrl)) return false;
    if (needsCaption && newCaption.trim() === "") return false;
    return true;
  }, [
    needsHeadline,
    newHeadline,
    needsImage,
    newImageUrl,
    needsCaption,
    newCaption,
  ]);

  const handleSubmit = () => {
    const payload: ContentEditPayload = {
      kind: "content",
      captionMode,
      thumbnailChange,
      newHeadline: needsHeadline ? newHeadline.trim() : undefined,
      newImageUrl: needsImage ? newImageUrl.trim() : undefined,
      newCaption: needsCaption ? newCaption.trim() : undefined,
    };
    onSubmit(payload);
    // reset
    setCaptionMode("gpt");
    setThumbnailChange("headline");
    setNewHeadline("");
    setNewImageUrl("");
    setNewCaption("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Content Edits</DialogTitle>
          <DialogDescription>
            Choose how you want to update the caption and thumbnail, then
            provide any new values.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Caption mode */}
          <div className="space-y-2">
            <Label>Caption</Label>
            <RadioGroup
              value={captionMode}
              onValueChange={(v: CaptionMode) => setCaptionMode(v)}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="cap-gpt" value="gpt" />
                <Label htmlFor="cap-gpt" className="cursor-pointer">
                  Generate by GPT
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="cap-user" value="user" />
                <Label htmlFor="cap-user" className="cursor-pointer">
                  User Input
                </Label>
              </div>
            </RadioGroup>

            {captionMode === "user" && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newCaption">New Caption</Label>
                <Textarea
                  id="newCaption"
                  placeholder="Write the exact caption…"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Thumbnail changes */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <RadioGroup
              value={thumbnailChange}
              onValueChange={(v: ThumbChange) => setThumbnailChange(v)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-headline" value="headline" />
                <Label htmlFor="th-headline" className="cursor-pointer">
                  Headline Change Only
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-image" value="image" />
                <Label htmlFor="th-image" className="cursor-pointer">
                  Image Only
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-both" value="both" />
                <Label htmlFor="th-both" className="cursor-pointer">
                  Both
                </Label>
              </div>
            </RadioGroup>

            {needsHeadline && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newHeadline">New Headline</Label>
                <Input
                  id="newHeadline"
                  placeholder="Enter the new headline…"
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                />
              </div>
            )}

            {needsImage && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newImageUrl">New Image URL</Label>
                <Input
                  id="newImageUrl"
                  placeholder="https://…"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                {newImageUrl && !isValidUrl(newImageUrl) && (
                  <p className="text-xs text-red-500">
                    Please enter a valid URL.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* =======================
   RSS Completion Dialog
   ======================= */

export interface RssCompletionPayload {
  kind: "rss";
  newCategory: string;
  articleTitle: string;
  articleHeadline: string;
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

  const canSubmit = useMemo(() => {
    return (
      newCategory.trim() !== "" &&
      articleTitle.trim() !== "" &&
      articleHeadline.trim() !== ""
    );
  }, [newCategory, articleTitle, articleHeadline]);

  const handleSubmit = () => {
    const payload: RssCompletionPayload = {
      kind: "rss",
      newCategory: newCategory.trim(),
      articleTitle: articleTitle.trim(),
      articleHeadline: articleHeadline.trim(),
    };
    onSubmit(payload);
    // reset + close
    setNewCategory("");
    setArticleTitle("");
    setArticleHeadline("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete RSS Details</DialogTitle>
          <DialogDescription>
            RSS has incomplete information. Please provide the missing fields.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rssCategory">New Category</Label>
            <Input
              id="rssCategory"
              placeholder="e.g., Public Health, Longevity, AI in Medicine"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rssArticleTitle">Article Title</Label>
            <Input
              id="rssArticleTitle"
              placeholder="Full article title…"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rssArticleHeadline">Article Headline</Label>
            <Input
              id="rssArticleHeadline"
              placeholder="Short, social-friendly headline…"
              value={articleHeadline}
              onChange={(e) => setArticleHeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
