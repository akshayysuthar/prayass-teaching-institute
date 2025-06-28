"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Content, Subject } from "@/types";

interface ContentSubjectSelectorProps {
  contents: Content[];
  subjects: Subject[];
  selectedContent: Content | null;
  selectedSubject: Subject | null;
  onContentChange: (content: Content | null) => void;
  onSubjectChange: (subject: Subject | null) => void;
  isLoadingContents: boolean;
  isLoadingSubjects: boolean;
}

export function ContentSubjectSelector({
  contents,
  subjects,
  selectedContent,
  selectedSubject,
  onContentChange,
  onSubjectChange,
  isLoadingContents,
  isLoadingSubjects,
}: ContentSubjectSelectorProps) {
  const handleContentChange = (contentId: string) => {
    const content = contents.find((c) => c.id.toString() === contentId);
    onContentChange(content || null);
  };

  const handleSubjectChange = (subjectId: string) => {
    const subject = subjects.find((s) => s.id.toString() === subjectId);
    onSubjectChange(subject || null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Content and Subject</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Select
              value={selectedContent?.id.toString() || ""}
              onValueChange={handleContentChange}
              disabled={isLoadingContents}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingContents ? "Loading..." : "Select content"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {contents.map((content) => (
                  <SelectItem key={content.id} value={content.id.toString()}>
                    {content.name} - Class {content.class} ({content.medium})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={selectedSubject?.id.toString() || ""}
              onValueChange={handleSubjectChange}
              disabled={!selectedContent || isLoadingSubjects}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedContent
                      ? "Select content first"
                      : isLoadingSubjects
                      ? "Loading..."
                      : "Select subject"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.subject_name} - Ch. {subject.chapter_no}:{" "}
                    {subject.chapter_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedContent && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p>
              <strong>Selected Content:</strong> {selectedContent.name}
            </p>
            <p>
              <strong>Board:</strong> {selectedContent.board} |{" "}
              <strong>Medium:</strong> {selectedContent.medium}
            </p>
            <p>
              <strong>Class:</strong> {selectedContent.class} |{" "}
              <strong>Code:</strong> {selectedContent.code}
            </p>
          </div>
        )}

        {selectedSubject && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p>
              <strong>Selected Subject:</strong> {selectedSubject.subject_name}
            </p>
            <p>
              <strong>Chapter:</strong> {selectedSubject.chapter_no} -{" "}
              {selectedSubject.chapter_name}
            </p>
            {selectedSubject.board_weightage && (
              <p>
                <strong>Board Weightage:</strong>{" "}
                {selectedSubject.board_weightage}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
