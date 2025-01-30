import type { Content, Subject } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ContentSubjectSelectorProps {
  contents: Content[];
  subjects: Subject[];
  selectedContent: Content | null;
  selectedSubject: Subject | null;
  onContentChange: (content: Content) => void;
  onSubjectChange: (subject: Subject) => void;
}

export function ContentSubjectSelector({
  contents,
  subjects,
  selectedContent,
  selectedSubject,
  onContentChange,
  onSubjectChange,
}: ContentSubjectSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <Label htmlFor="content">Content</Label>
        <Select
          value={selectedContent?.id.toString()}
          onValueChange={(value) => {
            const content = contents.find((c) => c.id.toString() === value);
            if (content) onContentChange(content);
          }}
        >
          <SelectTrigger id="content">
            <SelectValue placeholder="Select Content" />
          </SelectTrigger>
          <SelectContent>
            {contents.map((content) => (
              <SelectItem key={content.id} value={content.id.toString()}>
                {content.name} - Class {content.class} - {content.board} -{" "}
                {content.medium}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Select
          value={selectedSubject?.id.toString()}
          onValueChange={(value) => {
            const subject = subjects.find(
              (s: Subject) => s.id.toString() === value
            );
            if (subject) onSubjectChange(subject);
          }}
          disabled={!selectedContent}
        >
          <SelectTrigger id="subject">
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id.toString()}>
                {subject.subject_name} - Chapter {subject.chapter_no}:{" "}
                {subject.chapter_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
