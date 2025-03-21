"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { Question, ExamStructure, ExamSection } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SelectedChapter {
  id: string;
  name: string;
}

interface QuestionSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: SelectedChapter[]) => void;
  examStructure: ExamStructure;
  onExamStructureChange: (newStructure: ExamStructure) => void;
  currentSection: ExamSection | null;
  currentSectionIndex: number | null;
  selectedQuestions: Question[];
  showAllQuestions: boolean;
}

export function QuestionSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
  onExamStructureChange,
  currentSection,
  currentSectionIndex,
  selectedQuestions,
  showAllQuestions,
}: QuestionSelectorProps) {
  const [chapterNames, setChapterNames] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"chapter" | "type">("chapter");
  const { toast } = useToast();

  // Fetch chapter names with error handling and memoized callback
  const fetchChapterNames = useCallback(async () => {
    try {
      const subjectIds = [...new Set(questions.map((q) => q.subject_id))];
      if (subjectIds.length === 0) return;

      const { data, error } = await supabase
        .from("subjects")
        .select("id, chapter_name")
        .in("id", subjectIds);

      if (error) throw new Error(`Failed to fetch chapters: ${error.message}`);

      const chapterNameMap = data.reduce(
        (acc: Record<string, string>, { id, chapter_name }) => {
          acc[id] = chapter_name;
          return acc;
        },
        {}
      );

      setChapterNames(chapterNameMap);

      const availableChapters = data.map(({ id, chapter_name }) => ({
        id,
        name: chapter_name,
      }));
      onSelectChapters(availableChapters);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load chapter names. Please try again.",
        variant: "destructive",
      });
    }
  }, [questions, onSelectChapters, toast]);

  useEffect(() => {
    fetchChapterNames();
  }, [fetchChapterNames]);

  // Memoized question filtering
  const filteredQuestions = useMemo(() => {
    if (showAllQuestions) return questions;
    const lowerSearch = searchTerm.toLowerCase();
    return questions.filter((q) =>
      q.question.toLowerCase().includes(lowerSearch)
    );
  }, [questions, searchTerm, showAllQuestions]);

  // Memoized grouping functions
  const groupedQuestions = useMemo(() => {
    return filteredQuestions.reduce((acc: Record<string, Question[]>, q) => {
      const chapterId = q.subject_id.toString();
      acc[chapterId] = acc[chapterId] || [];
      acc[chapterId].push(q);
      return acc;
    }, {});
  }, [filteredQuestions]);

  const groupedByType = useMemo(() => {
    return filteredQuestions.reduce((acc: Record<string, Question[]>, q) => {
      const type = q.type || "Other";
      acc[type] = acc[type] || [];
      acc[type].push(q);
      return acc;
    }, {});
  }, [filteredQuestions]);

  const sectionQuestions = useMemo(() => {
    return selectedQuestions.filter((q) => q.sectionId === currentSectionIndex);
  }, [selectedQuestions, currentSectionIndex]);

  const { remainingQuestions, usedMarks, remainingMarks } = useMemo(() => {
    if (!currentSection)
      return { remainingQuestions: 0, usedMarks: 0, remainingMarks: 0 };
    const used = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);
    return {
      remainingQuestions:
        currentSection.totalQuestions - sectionQuestions.length,
      usedMarks: used,
      remainingMarks: currentSection.totalMarks - used,
    };
  }, [currentSection, sectionQuestions]);

  // Handle question selection with validation
  const handleQuestionChange = useCallback(
    (question: Question) => {
      if (currentSectionIndex === null || !currentSection) {
        toast({
          title: "No Section Selected",
          description: "Please select a section before adding questions.",
          variant: "destructive",
        });
        return;
      }

      const isSelected = selectedQuestions.some((q) => q.id === question.id);
      const isInCurrentSection = selectedQuestions.some(
        (q) => q.id === question.id && q.sectionId === currentSectionIndex
      );

      if (isInCurrentSection) {
        const updatedQuestions = selectedQuestions.filter(
          (q) => !(q.id === question.id && q.sectionId === currentSectionIndex)
        );
        onSelectQuestions(updatedQuestions);
        return;
      }

      if (isSelected) {
        toast({
          title: "Question Already Used",
          description:
            "This question is in another section. Remove it there first.",
          variant: "destructive",
        });
        return;
      }

      if (remainingQuestions <= 0) {
        toast({
          title: "Section Full",
          description: `Maximum questions (${currentSection.totalQuestions}) reached.`,
          variant: "destructive",
        });
        return;
      }

      if (remainingMarks < question.marks) {
        toast({
          title: "Marks Exceeded",
          description: `Not enough marks left (${remainingMarks}) for this question (${question.marks}).`,
          variant: "destructive",
        });
        return;
      }

      const questionWithSection = {
        ...question,
        sectionId: currentSectionIndex,
      };
      const updatedQuestions = [...selectedQuestions, questionWithSection];
      onSelectQuestions(updatedQuestions);

      // Update exam structure (example: could track selected questions per section)
      const updatedSections = examStructure.sections.map((section, idx) =>
        idx === currentSectionIndex
          ? {
              ...section,
              selectedQuestionIds: updatedQuestions
                .filter((q) => q.sectionId === idx)
                .map((q) => q.id),
            }
          : section
      );
      onExamStructureChange({ ...examStructure, sections: updatedSections });
    },
    [
      currentSection,
      currentSectionIndex,
      selectedQuestions,
      remainingQuestions,
      remainingMarks,
      onSelectQuestions,
      examStructure,
      onExamStructureChange,
      toast,
    ]
  );

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  }, []);

  const toggleType = useCallback((type: string) => {
    setExpandedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const renderImages = useCallback((images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imageArray.map((img, idx) => (
          <Image
            key={idx}
            src={img || "/placeholder.svg"}
            alt={`Question image ${idx + 1}`}
            width={200}
            height={200}
            className="object-contain"
          />
        ))}
      </div>
    );
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {currentSection
            ? `Section ${currentSection.name}: ${currentSection.questionType}`
            : "Select a Section"}
        </h3>
        {currentSection && (
          <div className="flex gap-2">
            <Badge variant="outline">
              Questions: {sectionQuestions.length}/
              {currentSection.totalQuestions}
            </Badge>
            <Badge variant="outline">
              Marks: {usedMarks}/{currentSection.totalMarks}
            </Badge>
          </div>
        )}
      </header>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={showAllQuestions}
        />
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as "chapter" | "type")}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="chapter">Chapter View</TabsTrigger>
          <TabsTrigger value="type">Type View</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === "chapter" ? (
        <div className="space-y-2">
          {Object.entries(groupedQuestions).map(
            ([chapterId, chapterQuestions]) => (
              <Accordion
                type="single"
                collapsible
                key={chapterId}
                value={expandedChapters.includes(chapterId) ? chapterId : ""}
              >
                <AccordionItem value={chapterId}>
                  <AccordionTrigger onClick={() => toggleChapter(chapterId)}>
                    <h4 className="text-lg font-bold">
                      {chapterNames[chapterId] || `Chapter ${chapterId}`} (
                      {chapterQuestions.length})
                    </h4>
                  </AccordionTrigger>
                  <AccordionContent>
                    {chapterQuestions.map((question) => (
                      <div
                        className="flex items-start gap-3 mb-4"
                        key={question.id}
                      >
                        <Checkbox
                          id={`q-${question.id}-s-${currentSectionIndex}`}
                          checked={sectionQuestions.some(
                            (q) => q.id === question.id
                          )}
                          onCheckedChange={() => handleQuestionChange(question)}
                          disabled={currentSectionIndex === null}
                        />
                        <Label
                          htmlFor={`q-${question.id}-s-${currentSectionIndex}`}
                          className={`flex flex-col gap-2 ${
                            currentSectionIndex === null ? "opacity-50" : ""
                          }`}
                        >
                          <span>
                            {question.question} ({question.marks} marks)
                          </span>
                          {renderImages(question.question_images || undefined)}
                          <span className="text-sm text-muted-foreground">
                            Type: {question.type || "General"}
                          </span>
                        </Label>
                      </div>
                    ))}
                    {!currentSection && (
                      <p className="text-muted-foreground italic">
                        Select a section to enable question selection.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedByType).map(([type, typeQuestions]) => (
            <Accordion
              type="single"
              collapsible
              key={type}
              value={expandedTypes.includes(type) ? type : ""}
            >
              <AccordionItem value={type}>
                <AccordionTrigger onClick={() => toggleType(type)}>
                  <h4 className="text-lg font-bold">
                    {type} ({typeQuestions.length})
                  </h4>
                </AccordionTrigger>
                <AccordionContent>
                  {typeQuestions.map((question) => (
                    <div
                      className="flex items-start gap-3 mb-4"
                      key={question.id}
                    >
                      <Checkbox
                        id={`qt-${question.id}-s-${currentSectionIndex}`}
                        checked={sectionQuestions.some(
                          (q) => q.id === question.id
                        )}
                        onCheckedChange={() => handleQuestionChange(question)}
                        disabled={currentSectionIndex === null}
                      />
                      <Label
                        htmlFor={`qt-${question.id}-s-${currentSectionIndex}`}
                        className={`flex flex-col gap-2 ${
                          currentSectionIndex === null ? "opacity-50" : ""
                        }`}
                      >
                        <span>
                          {question.question} ({question.marks} marks)
                        </span>
                        {renderImages(question.question_images || undefined)}
                        <span className="text-sm text-muted-foreground">
                          Chapter:{" "}
                          {chapterNames[question.subject_id] ||
                            question.subject_id}
                        </span>
                      </Label>
                    </div>
                  ))}
                  {!currentSection && (
                    <p className="text-muted-foreground italic">
                      Select a section to enable question selection.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      )}

      {filteredQuestions.length === 0 && (
        <div className="text-center p-6 border border-dashed rounded-md">
          <p className="text-muted-foreground">
            No questions match your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
