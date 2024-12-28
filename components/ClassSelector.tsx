import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Content } from "@/types";

type ClassSelectorProps = {
  contents: Content[];
  onSelectContent: (selectedContent: Content) => void;
  initialContent?: Content | null;
};

export function ClassSelector({
  contents,
  onSelectContent,
  initialContent = null,
}: ClassSelectorProps) {
  const [selectedContent, setSelectedContent] = useState<Content | null>(initialContent);

  const handleContentChange = (value: string) => {
    const content = contents.find(c => c.id.toString() === value);
    if (content) {
      setSelectedContent(content);
      onSelectContent(content);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="content">Content</Label>
        <Select
          onValueChange={handleContentChange}
          value={selectedContent?.id.toString()}
        >
          <SelectTrigger id="content">
            <SelectValue placeholder="Select Content" />
          </SelectTrigger>
          <SelectContent>
            {contents.map((content) => (
              <SelectItem key={content.id} value={content.id.toString()}>
                {content.name} - Class {content.class} - {content.board} - {content.medium}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedContent?.class === 9 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Class 9 is currently locked and not available for exam generation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

