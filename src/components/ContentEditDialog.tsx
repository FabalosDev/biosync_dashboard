import { useState, useMemo, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CaptionMode = "keep" | "gpt" | "user";
type ThumbChange = "keep" | "headline" | "image" | "both";

export interface ContentEditPayload {
  kind: "content";
  intent: "reject" | "edit";
  captionMode: CaptionMode;
  thumbnailChange: ThumbChange;
  newHeadline?: string;
  newImageUrl?: string;
  newCaption?: string;
  /** ✅ New: editor override for agency header (e.g., CDC, NIH, VA). */
  agencyHeader?: string;
}

interface ContentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ContentEditPayload) => void;

  initialHeadline?: string;
  initialImageUrl?: string;
  initialCaption?: string;

  /** ✅ New: prefill the detected agency header (may be "UNK") */
  initialAgencyHeader?: string; // e.g., "CDC", "NIH", "VA", "HHS", "GOV"
}

const QUICK_AGENCIES = [
  "CDC",
  "NIH",
  "FDA",
  "HHS",
  "VA",
  "CMS",
  "HRSA",
  "OSHA",
  "DEA",
  "GOV",
];

export const ContentEditDialog = ({
  isOpen,
  onClose,
  onSubmit,
  initialHeadline = "",
  initialImageUrl = "",
  initialCaption = "",
  initialAgencyHeader = "",
}: ContentEditDialogProps) => {
  const [captionMode, setCaptionMode] = useState<CaptionMode>("keep");
  const [thumbnailChange, setThumbnailChange] = useState<ThumbChange>("keep");

  const [newHeadline, setNewHeadline] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState(initialCaption);

  /** ✅ New: agency header override */
  const [agencyHeader, setAgencyHeader] = useState(initialAgencyHeader || "");

  useEffect(() => {
    if (isOpen) {
      setCaptionMode("keep");
      setThumbnailChange("keep");
      setNewHeadline("");
      setNewImageUrl("");
      setNewCaption(initialCaption || "");
      setAgencyHeader(initialAgencyHeader || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    const v = (s || "").trim();
    if (!v) return false;
    try {
      const u = new URL(v);
      return !!u.protocol && !!u.host;
    } catch {
      return false;
    }
  };

  const hasCaptionChange =
    captionMode === "gpt" ||
    (captionMode === "user" && newCaption.trim() !== "");
  const hasHeadlineChange = needsHeadline && newHeadline.trim() !== "";
  const hasImageChange = needsImage && isValidUrl(newImageUrl.trim());

  const intent: ContentEditPayload["intent"] =
    hasCaptionChange || hasHeadlineChange || hasImageChange ? "edit" : "reject";

  const handleSubmit = () => {
    const payload: ContentEditPayload = {
      kind: "content",
      intent,
      captionMode,
      thumbnailChange,
      newHeadline: hasHeadlineChange ? newHeadline.trim() : undefined,
      newImageUrl: hasImageChange ? newImageUrl.trim() : undefined,
      newCaption:
        captionMode === "user" ? newCaption.trim() || undefined : undefined,
      /** ✅ include agencyHeader if editor typed something (including changing UNK) */
      agencyHeader: agencyHeader.trim() || undefined,
    };

    onSubmit(payload);
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
          <DialogTitle>Content Edits (optional)</DialogTitle>
          <DialogDescription>
            Choose what you want to change. Leave everything as-is to{" "}
            <strong>Reject</strong>. Any change →{" "}
            <strong>Keep &amp; Edit</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ✅ New: Agency Header override */}
          <div className="space-y-2">
            <Label htmlFor="agencyHeader">Agency Header</Label>
            <Input
              id="agencyHeader"
              placeholder='e.g., CDC, NIH, FDA, HHS (avoid "UNK")'
              value={agencyHeader}
              onChange={(e) => setAgencyHeader(e.target.value.toUpperCase())}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_AGENCIES.map((a) => (
                <Button
                  key={a}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2 py-1"
                  onClick={() => setAgencyHeader(a)}
                >
                  {a}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              If detection shows <code>UNK</code>, set the correct agency here
              so the thumbnail banner is accurate.
            </p>
          </div>

          {/* Caption section */}
          <div className="space-y-2">
            <Label>Caption</Label>
            <RadioGroup
              value={captionMode}
              onValueChange={(v: CaptionMode) => setCaptionMode(v)}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="cap-keep" value="keep" />
                <Label htmlFor="cap-keep" className="cursor-pointer">
                  Keep as is
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="cap-gpt" value="gpt" />
                <Label htmlFor="cap-gpt" className="cursor-pointer">
                  Regenerate (GPT)
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="cap-user" value="user" />
                <Label htmlFor="cap-user" className="cursor-pointer">
                  User Input
                </Label>
              </div>
            </RadioGroup>

            {needsCaption && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newCaption">New Caption</Label>
                <Textarea
                  id="newCaption"
                  placeholder="Edit the caption…"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Thumbnail section */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <RadioGroup
              value={thumbnailChange}
              onValueChange={(v: ThumbChange) => setThumbnailChange(v)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-keep" value="keep" />
                <Label htmlFor="th-keep" className="cursor-pointer">
                  Thumbnail OK (keep)
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-headline" value="headline" />
                <Label htmlFor="th-headline" className="cursor-pointer">
                  Headline change only
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-image" value="image" />
                <Label htmlFor="th-image" className="cursor-pointer">
                  Image only
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem id="th-both" value="both" />
                <Label htmlFor="th-both" className="cursor-pointer">
                  Both (headline &amp; image)
                </Label>
              </div>
            </RadioGroup>

            {(thumbnailChange === "headline" || thumbnailChange === "both") && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newHeadline">New Headline (optional)</Label>
                <Input
                  id="newHeadline"
                  placeholder={initialHeadline || "Enter the new headline…"}
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                />
              </div>
            )}

            {(thumbnailChange === "image" || thumbnailChange === "both") && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newImageUrl">New Image URL (optional)</Label>
                <Input
                  id="newImageUrl"
                  placeholder={initialImageUrl || "https://…"}
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
          <Button onClick={handleSubmit}>
            {intent === "edit" ? "Keep & Submit Edits" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
