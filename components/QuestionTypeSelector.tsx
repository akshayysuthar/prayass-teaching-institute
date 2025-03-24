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
import { cn } from "@/lib/utils";

interface SelectedChapter {
  id: string;
  name: string;
  chapterNo: number;
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
  const [chapterData, setChapterData] = useState<
    Record<string, { name: string; chapterNo: number }>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [expandedMarks, setExpandedMarks] = useState<Record<string, string[]>>(
    {}
  );
  const [expandedTypes, setExpandedTypes] = useState<Record<string, string[]>>(
    {}
  );
  const [expandedSectionTitles, setExpandedSectionTitles] = useState<
    Record<string, string[]>
  >({});
  const [loadedChapters, setLoadedChapters] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [viewMode, setViewMode] = useState<"chapter" | "type">("chapter");
  const { toast } = useToast();

  const fetchChapterNames = useCallback(async () => {
    try {
      const subjectIds = [...new Set(questions.map((q) => q.subject_id))];
      if (subjectIds.length === 0) return;

      const { data, error } = await supabase
        .from("subjects")
        .select("id, chapter_name, chapter_no")
        .in("id", subjectIds);

      if (error) throw new Error(`Failed to fetch chapters: ${error.message}`);

      const chapterMap = data.reduce(
        (
          acc: Record<string, { name: string; chapterNo: number }>,
          { id, chapter_name, chapter_no }
        ) => {
          acc[id] = { name: chapter_name, chapterNo: chapter_no };
          return acc;
        },
        {}
      );
      setChapterData(chapterMap);

      const availableChapters = data
        .map(({ id, chapter_name, chapter_no }) => ({
          id: id.toString(),
          name: chapter_name,
          chapterNo: chapter_no,
        }))
        .sort((a, b) => a.chapterNo - b.chapterNo);
      onSelectChapters(availableChapters);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load chapters.",
        variant: "destructive",
      });
    }
  }, [questions, onSelectChapters, toast]);

  useEffect(() => {
    fetchChapterNames();
  }, [fetchChapterNames]);

  const filteredQuestions = useMemo(() => {
    if (showAllQuestions) return questions;
    const lowerSearch = searchTerm.toLowerCase();
    return questions.filter((q) =>
      q.question.toLowerCase().includes(lowerSearch)
    );
  }, [questions, searchTerm, showAllQuestions]);

  /** Utility function to safely get section title */
  const getSectionTitle = (q: Question): string => {
    const qWithSectionTitle = q as {
      sectionTitle?: string;
      section_title?: string;
    };
    return (
      qWithSectionTitle.sectionTitle ||
      qWithSectionTitle.section_title ||
      "Uncategorized"
    );
  };

  const groupedQuestions = useMemo(() => {
    const grouped = filteredQuestions.reduce(
      (
        acc: Record<
          string,
          {
            marks: Record<string, Question[]>;
            types: Record<string, Question[]>;
            sectionTitles: Record<string, Question[]>;
          }
        >,
        q
      ) => {
        const chapterId = q.subject_id.toString();
        acc[chapterId] = acc[chapterId] || {
          marks: {},
          types: {},
          sectionTitles: {},
        };

        const markKey = `${q.marks}`;
        acc[chapterId].marks[markKey] = acc[chapterId].marks[markKey] || [];
        acc[chapterId].marks[markKey].push(q);

        const typeKey = q.type || "Other";
        acc[chapterId].types[typeKey] = acc[chapterId].types[typeKey] || [];
        acc[chapterId].types[typeKey].push(q);

        const sectionTitleKey = getSectionTitle(q);
        acc[chapterId].sectionTitles[sectionTitleKey] =
          acc[chapterId].sectionTitles[sectionTitleKey] || [];
        acc[chapterId].sectionTitles[sectionTitleKey].push(q);

        return acc;
      },
      {}
    );
    return Object.fromEntries(
      Object.entries(grouped).sort(
        ([a], [b]) =>
          (chapterData[a]?.chapterNo || 0) - (chapterData[b]?.chapterNo || 0)
      )
    );
  }, [filteredQuestions, chapterData]);

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

  const { remainingQuestions, usedMarks } = useMemo(() => {
    if (!currentSection) return { remainingQuestions: 0, usedMarks: 0 };
    const used = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);
    return {
      remainingQuestions:
        currentSection.totalQuestions - sectionQuestions.length,
      usedMarks: used,
    };
  }, [currentSection, sectionQuestions]);

  const handleQuestionChange = useCallback(
    (question: Question) => {
      if (currentSectionIndex === null || !currentSection) {
        toast({
          title: "No Section",
          description: "Select a section first.",
          variant: "destructive",
        });
        return;
      }
      const isSelected = selectedQuestions.some((q) => q.id === question.id);
      const isInCurrentSection = sectionQuestions.some(
        (q) => q.id === question.id
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
          title: "Already Selected",
          description: "Remove from other section first.",
          variant: "destructive",
        });
        return;
      }

      if (remainingQuestions <= 0) {
        toast({
          title: "Section Full",
          description: `Max questions: ${currentSection.totalQuestions}.`,
          variant: "destructive",
        });
        return;
      }

      if (currentSection.totalMarks - usedMarks < question.marks) {
        toast({
          title: "Marks Exceeded",
          description: `Only ${
            currentSection.totalMarks - usedMarks
          } marks left.`,
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
      sectionQuestions,
      remainingQuestions,
      usedMarks,
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
    setLoadedChapters((prev) =>
      prev.includes(chapterId) ? prev : [...prev, chapterId]
    );
  }, []);

  const renderImages = useCallback((images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imageArray.map((img, idx) => (
          <Image
            loading="lazy"
            key={idx}
            src={img || "/placeholder.svg"}
            alt={`Question image ${idx + 1}`}
            width={350}
            height={150}
            className="object-contain max-w-full h-auto rounded-md"
          />
        ))}
      </div>
    );
  }, []);

  const renderQuestion = (question: Question) => {
    const sectionTitle = getSectionTitle(question);
    return (
      <div
        className={cn(
          "flex items-start gap-3 border-b pb-1 p-2 mt-1 rounded-lg last:border-b-0 transition-colors",
          sectionQuestions.some((q) => q.id === question.id) && "bg-green-100"
        )}
        key={question.id}
      >
        <Checkbox
          id={`q-${question.id}-s-${currentSectionIndex}`}
          checked={sectionQuestions.some((q) => q.id === question.id)}
          onCheckedChange={() => handleQuestionChange(question)}
          disabled={currentSectionIndex === null}
          className="mt-1 w-5 h-5"
        />
        <Label
          htmlFor={`q-${question.id}-s-${currentSectionIndex}`}
          className={cn(
            "flex-1 flex flex-col gap-1 text-sm",
            currentSectionIndex === null && "opacity-50"
          )}
        >
          <span className="leading-relaxed">
            {question.question}{" "}
            <span className="text-muted-foreground">
              ({question.marks} Marks)
            </span>
          </span>
          {renderImages(question.question_images || undefined)}
          <span className="text-xs text-muted-foreground">
            {question.type || "General"} - {sectionTitle}
          </span>
        </Label>
      </div>
    );
  };

  return (
    <div className="space-y-2 p-1 max-w-full mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold truncate max-w-full">
          {currentSection
            ? `Section ${currentSection.name}: ${currentSection.questionType} (${currentSection.totalMarks} marks)`
            : "Select a Section First"}
        </h3>
        {currentSection && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-sm">
              Q: {sectionQuestions.length}/{currentSection.totalQuestions}
            </Badge>
            <Badge variant="outline" className="text-sm">
              M: {usedMarks}
            </Badge>
          </div>
        )}
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-10 text-sm w-full rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={showAllQuestions}
        />
      </div>

      <div className="space-y-2 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent animate-pulse opacity-20 pointer-events-none" />
        {viewMode === "chapter" ? (
          Object.entries(groupedQuestions).length > 0 ? (
            Object.entries(groupedQuestions).map(([chapterId, groups]) => (
              <Accordion
                type="single"
                collapsible
                key={chapterId}
                value={expandedChapters.includes(chapterId) ? chapterId : ""}
                className="border rounded-md bg-white"
              >
                <AccordionItem value={chapterId}>
                  <AccordionTrigger
                    onClick={() => toggleChapter(chapterId)}
                    className="text-left px-4 py-3 hover:bg-gray-50"
                  >
                    <h4 className="text-base font-medium truncate">
                      Ch. {chapterData[chapterId]?.chapterNo || chapterId}:{" "}
                      {chapterData[chapterId]?.name || `Chapter ${chapterId}`} (
                      {Object.values(groups.marks).flat().length})
                    </h4>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-2">
                    {loadedChapters.includes(chapterId) ? (
                      <div className="space-y-4">
                        <Accordion
                          type="multiple"
                          value={expandedMarks[chapterId] || []}
                          onValueChange={(newValue) =>
                            setExpandedMarks((prev) => ({
                              ...prev,
                              [chapterId]: newValue,
                            }))
                          }
                          className="space-y-2"
                        >
                          {Object.entries(groups.marks)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([mark, markQuestions]) => {
                              const itemValue = `${chapterId}-mark-${mark}`;
                              return (
                                <AccordionItem value={itemValue} key={mark}>
                                  <AccordionTrigger className="text-sm py-2 hover:bg-gray-50">
                                    {mark} Mark{Number(mark) !== 1 ? "s" : ""} (
                                    {markQuestions.length})
                                  </AccordionTrigger>
                                  <AccordionContent className="px-2 py-1">
                                    {markQuestions.map(renderQuestion)}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                        </Accordion>

                        <Accordion
                          type="multiple"
                          value={expandedTypes[chapterId] || []}
                          onValueChange={(newValue) =>
                            setExpandedTypes((prev) => ({
                              ...prev,
                              [chapterId]: newValue,
                            }))
                          }
                          className="space-y-2"
                        >
                          {Object.entries(groups.types).map(
                            ([type, typeQuestions]) => {
                              const itemValue = `${chapterId}-type-${type}`;
                              return (
                                <AccordionItem value={itemValue} key={type}>
                                  <AccordionTrigger className="text-sm py-2 hover:bg-gray-50">
                                    {type} ({typeQuestions.length})
                                  </AccordionTrigger>
                                  <AccordionContent className="px-2 py-1">
                                    {typeQuestions.map(renderQuestion)}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            }
                          )}
                        </Accordion>

                        <Accordion
                          type="multiple"
                          value={expandedSectionTitles[chapterId] || []}
                          onValueChange={(newValue) =>
                            setExpandedSectionTitles((prev) => ({
                              ...prev,
                              [chapterId]: newValue,
                            }))
                          }
                          className="space-y-2"
                        >
                          {Object.entries(groups.sectionTitles).map(
                            ([sectionTitle, sectionTitleQuestions]) => {
                              const itemValue = `${chapterId}-section-${sectionTitle}`;
                              return (
                                <AccordionItem
                                  value={itemValue}
                                  key={sectionTitle}
                                >
                                  <AccordionTrigger className="text-sm py-2 hover:bg-gray-50">
                                    {sectionTitle} (
                                    {sectionTitleQuestions.length})
                                  </AccordionTrigger>
                                  <AccordionContent className="px-2 py-1">
                                    {sectionTitleQuestions.map(renderQuestion)}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            }
                          )}
                        </Accordion>

                        {!currentSection && (
                          <p className="text-sm text-muted-foreground italic">
                            Select a section to choose questions.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Loading questions...
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No chapters available.
            </p>
          )
        ) : Object.entries(groupedByType).length > 0 ? (
          Object.entries(groupedByType).map(([type, typeQuestions]) => (
            <Accordion
              type="single"
              collapsible
              key={type}
              value={expandedTypes["global"]?.includes(type) ? type : ""}
              className="border rounded-md bg-white"
            >
              <AccordionItem value={type}>
                <AccordionTrigger
                  onClick={() =>
                    setExpandedTypes((prev) => ({
                      ...prev,
                      global: prev.global?.includes(type)
                        ? prev.global.filter((t) => t !== type)
                        : [...(prev.global || []), type],
                    }))
                  }
                  className="text-left px-4 py-3 hover:bg-gray-50"
                >
                  <h4 className="text-base font-medium truncate">
                    {type} ({typeQuestions.length})
                  </h4>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  <div className="space-y-3">
                    {typeQuestions.map(renderQuestion)}
                    {!currentSection && (
                      <p className="text-sm text-muted-foreground italic">
                        Select a section to choose questions.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No types available.</p>
        )}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center p-4 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">
            No questions match your search.
          </p>
        </div>
      )}
    </div>
  );
}
