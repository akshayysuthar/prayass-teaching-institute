import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
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
  const [selectedContent, setSelectedContent] = useState<Content | null>(
    initialContent
  );

  const handleContentChange = (value: string) => {
    const content = contents.find((c) => c.id.toString() === value);
    if (content) {
      setSelectedContent(content);
      onSelectContent(content);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="content"
          className="flex items-center text-gray-700 dark:text-gray-300"
        >
          <BookOpen className="mr-2 h-4 w-4" /> Select The Subject
        </Label>
        <Select
          onValueChange={handleContentChange}
          value={selectedContent?.id.toString()}
        >
          <SelectTrigger id="content" className="w-full min-h-12">
            <SelectValue placeholder="Choose a subject" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {contents.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No subjects available
              </div>
            ) : (
              contents.map((content) => (
                <SelectItem key={content.id} value={content.id.toString()}>
                  {content.name} - Class {content.class} - {content.board} -{" "}
                  {content.medium} Medium - {content.note}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
