import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Content, Subject } from "@/types";

interface QuestionFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  contents: Content[];
  subjects: Subject[];
}

interface FilterState {
  searchTerm: string;
  contentId: string;
  subjectId: string;
  type: string;
  marks: string;
}

export function QuestionFilters({
  onFilterChange,
  contents,
  subjects,
}: QuestionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    contentId: "",
    subjectId: "",
    type: "all",
    marks: "all",
  });
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const types = [...new Set(subjects.map((subject) => subject.type))].filter(
      Boolean
    );
    setQuestionTypes(types as string[]);
  }, [subjects]);

  useEffect(() => {
    if (filters.contentId) {
      const contentSubjects = subjects.filter(
        (subject) => subject.content_id.toString() === filters.contentId
      );
      setFilteredSubjects(contentSubjects);
    } else {
      setFilteredSubjects([]);
    }
  }, [filters.contentId, subjects]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (key === "contentId") {
      newFilters.subjectId = "";
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search questions..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Select
          onValueChange={(value) => handleFilterChange("contentId", value)}
          value={filters.contentId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select content" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Contents</SelectItem>
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
          onValueChange={(value) => handleFilterChange("subjectId", value)}
          value={filters.subjectId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Subjects</SelectItem>
            {filteredSubjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id.toString()}>
                {subject.subject_name} - Ch. {subject.chapter_no}:{" "}
                {subject.chapter_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="type">Question Type</Label>
        <Select
          onValueChange={(value) => handleFilterChange("type", value)}
          value={filters.type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {questionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="marks">Marks</Label>
        <Select
          onValueChange={(value) => handleFilterChange("marks", value)}
          value={filters.marks}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select marks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Marks</SelectItem>
            {[1, 2, 3, 4, 5].map((mark) => (
              <SelectItem key={mark} value={mark.toString()}>
                {mark}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
