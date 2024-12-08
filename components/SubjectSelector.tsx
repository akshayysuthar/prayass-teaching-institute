import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SubjectSelectorProps } from "@/types";

export function SubjectSelector({
  subjectData,
  classNumber,
  board,
  medium,
  onSelectSubject,
  initialSubject,
}: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<string[]>([]); // Changed to string[] to store subject names
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    initialSubject
  );

  useEffect(() => {
    const filteredSubjects = subjectData.flatMap((item) => {
      if (item.subject) return [item.subject];
      if (item.subjects) {
        return item.subjects
          .filter(
            (subject) =>
              !subject.mediums ||
              subject.mediums.some((m) => m.language === medium)
          )
          .map((subject) => subject.name);
      }
      return [];
    });
    setSubjects([...new Set(filteredSubjects)]); // Store subject names as strings
  }, [subjectData, classNumber, board, medium]);

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    onSelectSubject(value); // Pass the selected subject name
  };

  return (
    <div>
      <Label htmlFor="subject">Subject</Label>
      <Select
        onValueChange={handleSubjectChange}
        value={selectedSubject || undefined}
      >
        <SelectTrigger id="subject">
          <SelectValue placeholder="Select Subject" />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((subject: string) => (
            <SelectItem key={subject} value={subject}>
              {subject}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
