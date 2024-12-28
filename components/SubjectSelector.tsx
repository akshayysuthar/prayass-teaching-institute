import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Subject } from "@/types";

export interface SubjectSelectorProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
  initialSubject?: string | null;
}

export function SubjectSelector({
  subjects,
  onSelectSubject,
  initialSubject,
}: SubjectSelectorProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    initialSubject ?? null
  );

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    onSelectSubject(value);
  };

  // Filter out duplicate subjects
  const uniqueSubjects = subjects.filter(
    (subject, index, self) =>
      index === self.findIndex((s) => s.subject_name === subject.subject_name)
  );

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
          {uniqueSubjects.map((subject: Subject) => (
            <SelectItem key={subject.id} value={subject.id.toString()}>
              {subject.subject_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
