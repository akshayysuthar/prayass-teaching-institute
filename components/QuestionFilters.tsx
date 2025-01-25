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
import { supabase } from "@/utils/supabase/client";

interface QuestionFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  searchTerm: string;
  type: string;
  subject: string;
  marks: string;
}

export function QuestionFilters({ onFilterChange }: QuestionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    type: "all",
    subject: "all",
    marks: "all",
  });
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchQuestionTypes();
    fetchSubjects();
  }, []);

  const fetchQuestionTypes = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("type")
      .not("type", "is", null);
    if (!error && data) {
      const types = [...new Set(data.map((item) => item.type))];
      setQuestionTypes(types);
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("subject_name");
    if (!error && data) {
      const subjectNames = [...new Set(data.map((item) => item.subject_name))];
      setSubjects(subjectNames);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <Label htmlFor="type">Question Type</Label>
        <Select
          onValueChange={(value) => handleFilterChange("type", value)}
          value={filters.type || "all"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {questionTypes.map(
              (type) =>
                type && (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                )
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Select
          onValueChange={(value) => handleFilterChange("subject", value)}
          value={filters.subject}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
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
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
