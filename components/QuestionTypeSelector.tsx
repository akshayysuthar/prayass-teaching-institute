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
import type { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SelectedChapter {
  id: string;
  name: string;
  chapterNo: number;
}

interface QuestionSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: SelectedChapter[]) => void;
  selectedQuestions: Question[];
}

export function QuestionSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  selectedQuestions,
}: QuestionSelectorProps) {
  const [chapterData, setChapterData] = useState<
    Record<string, { name: string; chapterNo: number; status: boolean }>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [loadedChapters, setLoadedChapters] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchChapterNames = useCallback(async () => {
    try {
      const subjectIds = [...new Set(questions.map((q) => q.subject_id))];
      if (subjectIds.length === 0) return;

      const { data, error } = await supabase
        .from("subjects")
        .select("id, chapter_name, chapter_no, status")
        .in("id", subjectIds);

      if (error) throw new Error(`Failed to fetch chapters: ${error.message}`);

      const chapterMap = data.reduce(
        (
          acc: Record<
            string,
            { name: string; chapterNo: number; status: boolean }
          >,
          { id, chapter_name, chapter_no, status }
        ) => {
          acc[id] = {
            name: chapter_name,
            chapterNo: chapter_no,
            status: status || false,
          };
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
    const lowerSearch = searchTerm.toLowerCase();
    return searchTerm
      ? questions.filter((q) => {
          const questionText = (
            q.question ||
            q.question_gu ||
            ""
          ).toLowerCase();
          return questionText.includes(lowerSearch);
        })
      : questions;
  }, [questions, searchTerm]);

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

  const handleQuestionChange = useCallback(
    (question: Question) => {
      const isSelected = selectedQuestions.some((q) => q.id === question.id);

      if (isSelected) {
        // Remove question
        const updatedQuestions = selectedQuestions.filter(
          (q) => q.id !== question.id
        );
        onSelectQuestions(updatedQuestions);
      } else {
        // Add question
        onSelectQuestions([...selectedQuestions, question]);
      }
    },
    [selectedQuestions, onSelectQuestions]
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

  const handleUpdateMarks = useCallback(
    async (question: Question, increment: boolean) => {
      const newMarks = increment
        ? Math.min(5, question.marks + 1)
        : Math.max(1, question.marks - 1);

      try {
        const { error } = await supabase
          .from("questions")
          .update({ marks: newMarks })
          .eq("id", question.id);

        if (error) throw error;

        // Update local state if the question is selected
        if (selectedQuestions.some((q) => q.id === question.id)) {
          const updatedQuestions = selectedQuestions.map((q) =>
            q.id === question.id ? { ...q, marks: newMarks } : q
          );
          onSelectQuestions(updatedQuestions);
        }

        toast({
          title: "Marks Updated",
          description: `Question marks updated to ${newMarks}`,
        });
      } catch (error) {
        console.error("Error updating marks:", error);
        toast({
          title: "Error",
          description: "Failed to update question marks",
          variant: "destructive",
        });
      }
    },
    [selectedQuestions, onSelectQuestions, toast]
  );

  const renderImages = useCallback((images?: string | string[] | null) => {
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
    const isSelected = selectedQuestions.some((q) => q.id === question.id);
    const sectionTitle = getSectionTitle(question);

    return (
      <div
        className={cn(
          "flex items-start gap-3 border-b pb-1 p-2 mt-1 rounded-lg last:border-b-0 transition-colors",
          isSelected && "bg-blue-50"
        )}
        key={question.id}
      >
        <Checkbox
          id={`q-${question.id}`}
          checked={isSelected}
          onCheckedChange={() => handleQuestionChange(question)}
          className="mt-1 w-5 h-5"
        />
        <Label
          htmlFor={`q-${question.id}`}
          className="flex-1 flex flex-col gap-1 text-sm"
        >
          <span className="leading-relaxed">
            {question.question || question.question_gu || "No question text"}
          </span>
          {renderImages(
            question.question_images || question.question_images_gu
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {question.type || "General"} - {sectionTitle}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpdateMarks(question, false);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium">
                {question.marks} Marks
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpdateMarks(question, true);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Label>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-10 text-sm w-full rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {Object.entries(groupedQuestions).length > 0 ? (
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
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-medium truncate">
                      Ch. {chapterData[chapterId]?.chapterNo || chapterId}:{" "}
                      {chapterData[chapterId]?.name || `Chapter ${chapterId}`} (
                      {Object.values(groups.marks).flat().length})
                    </h4>
                    {chapterData[chapterId]?.status ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  {loadedChapters.includes(chapterId) ? (
                    <div className="space-y-4">
                      <Accordion
                        type="multiple"
                        value={Object.keys(groups.marks).map(
                          (mark) => `${chapterId}-mark-${mark}`
                        )}
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
          <p className="text-sm text-muted-foreground text-center p-4 border border-dashed rounded-md">
            No questions available for this content.
          </p>
        )}
      </div>

      {filteredQuestions.length === 0 && searchTerm && (
        <div className="text-center p-4 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">
            No questions match your search.
          </p>
        </div>
      )}

      {selectedQuestions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-blue-700 mb-2">
            Selected Questions ({selectedQuestions.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((mark) => {
              const count = selectedQuestions.filter(
                (q) => q.marks === mark
              ).length;
              if (count === 0) return null;
              return (
                <Badge key={mark} className="bg-blue-100 text-blue-800">
                  {mark} mark: {count} (Total: {mark * count})
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
