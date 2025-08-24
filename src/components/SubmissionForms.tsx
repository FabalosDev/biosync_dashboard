import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Send, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  Link
} from "lucide-react";

interface SubmissionFormsProps {
  onProgressStart: () => void;
}

export const SubmissionForms = ({ onProgressStart }: SubmissionFormsProps) => {
  const { toast } = useToast();
  const [textContent, setTextContent] = useState("");
  const [sourceLinks, setSourceLinks] = useState("");
  const [submitLink, setSubmitLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isTextSubmitting, setIsTextSubmitting] = useState(false);
  const [isImageSubmitting, setIsImageSubmitting] = useState(false);
  const [isLinkSubmitting, setIsLinkSubmitting] = useState(false);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter text content",
        variant: "destructive",
      });
      return;
    }

    setIsTextSubmitting(true);
    onProgressStart();
    
    try {
      const response = await fetch("https://biohackyourself.app.n8n.cloud/webhook/biohackyourselftext", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: textContent,
          sourceLinks: sourceLinks 
        }),
      });

      if (response.ok) {
        toast({
          title: "Text Submitted",
          description: "Your text has been submitted for AI processing",
        });
        setTextContent("");
        setSourceLinks("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit text content",
        variant: "destructive",
      });
    }
    setIsTextSubmitting(false);
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    setIsImageSubmitting(true);
    onProgressStart();
    
    const formData = new FormData();
    formData.append("image", imageFile);
    if (sourceLinks.trim()) {
      formData.append("sourceLinks", sourceLinks);
    }

    try {
      const response = await fetch("https://biohackyourself.app.n8n.cloud/webhook/images", {
        method: "POST",
        body: formData,
      });

      toast({
        title: "Image Submitted",
        description: "Your image has been submitted for AI processing",
      });
      setImageFile(null);
      setSourceLinks("");
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit image",
        variant: "destructive",
      });
    }
    setIsImageSubmitting(false);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a link",
        variant: "destructive",
      });
      return;
    }

    setIsLinkSubmitting(true);
    
    try {
      const response = await fetch("https://biohackyourself.app.n8n.cloud/webhook/submitlinks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          link: submitLink
        }),
      });

      if (response.ok) {
        toast({
          title: "Link Submitted",
          description: "Your link has been submitted for processing",
        });
        setSubmitLink("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit link",
        variant: "destructive",
      });
    }
    setIsLinkSubmitting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Submit Links - First Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Submit Links</span>
          </CardTitle>
          <CardDescription>
            Submit links for content processing and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div>
              <Label htmlFor="submit-link">Link URL</Label>
              <Input
                id="submit-link"
                type="url"
                placeholder="https://example.com"
                value={submitLink}
                onChange={(e) => setSubmitLink(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLinkSubmitting}
              className="w-full"
            >
              {isLinkSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Link
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Text Submission - Second Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Submit Text Content</span>
          </CardTitle>
          <CardDescription>
            Submit text content for AI processing and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                placeholder="Enter your text content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="source-links">Source Links</Label>
              <Textarea
                id="source-links"
                placeholder="Enter source links (Instagram, websites, etc.)..."
                value={sourceLinks}
                onChange={(e) => setSourceLinks(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isTextSubmitting}
              className="w-full"
            >
              {isTextSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Text
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Image Submission - Third Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5" />
            <span>Submit Image Content</span>
          </CardTitle>
          <CardDescription>
            Upload images for AI processing and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="image-upload">Image File</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-2">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                      Click to upload
                    </Label>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  {imageFile && (
                    <p className="text-sm text-green-600">Selected: {imageFile.name}</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="image-source-links">Source Links</Label>
              <Textarea
                id="image-source-links"
                placeholder="Enter source links (Instagram, websites, etc.)..."
                value={sourceLinks}
                onChange={(e) => setSourceLinks(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isImageSubmitting}
              className="w-full"
            >
              {isImageSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
