"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Search,
  Check,
  X,
  Minus,
  Plus,
  BookOpen,
  Tag,
  CheckSquare,
  List,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";

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
      if (subjectIds.length === 0) {
        setChapterData({});
        onSelectChapters([]);
        return;
      }

      const { data, error } = await supabase
        .from("subjects")
        .select("id, chapter_name, chapter_no, status")
        .in("id", subjectIds);

      if (error) throw new Error(`Failed to fetch subjects: ${error.message}`);

      if (!data || data.length === 0) {
        setChapterData({});
        onSelectChapters([]);
        return;
      }

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
      console.error("Error fetching chapter names:", error);
      toast({
        title: "Error",
        description: "Failed to load chapters.",
        variant: "destructive",
      });
      setChapterData({});
      onSelectChapters([]);
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
    // Step 1: Group questions by chapter (subject_id)
    const groupedByChapter = filteredQuestions.reduce(
      (
        acc: Record<
          string,
          {
            typeSectionTitle: Record<
              string,
              {
                type: string;
                sectionTitle: string;
                marks: Record<string, Question[]>;
              }
            >;
          }
        >,
        q
      ) => {
        const chapterId = q.subject_id.toString();
        acc[chapterId] = acc[chapterId] || { typeSectionTitle: {} };

        // Step 2: Create a unique key for the combination of Type and SectionTitle
        const typeKey = q.type || "Other";
        const sectionTitleKey = getSectionTitle(q);
        const typeSectionTitleKey = `${typeKey}||${sectionTitleKey}`; // Unique key to avoid duplicates

        // Step 3: Group by the Type-SectionTitle combination
        acc[chapterId].typeSectionTitle[typeSectionTitleKey] = acc[chapterId]
          .typeSectionTitle[typeSectionTitleKey] || {
          type: typeKey,
          sectionTitle: sectionTitleKey,
          marks: {},
        };

        // Step 4: Within each Type-SectionTitle group, group by Marks
        const markKey = `${q.marks}`;
        acc[chapterId].typeSectionTitle[typeSectionTitleKey].marks[markKey] =
          acc[chapterId].typeSectionTitle[typeSectionTitleKey].marks[markKey] ||
          [];
        acc[chapterId].typeSectionTitle[typeSectionTitleKey].marks[
          markKey
        ].push(q);

        return acc;
      },
      {}
    );

    // Step 5: Sort chapters by chapterNo and questions within each group by marks
    return Object.fromEntries(
      Object.entries(groupedByChapter)
        .sort(
          ([a], [b]) =>
            (chapterData[a]?.chapterNo || 0) - (chapterData[b]?.chapterNo || 0)
        )
        .map(([chapterId, groups]) => [
          chapterId,
          {
            // Step 6: Prepare data for rendering under Type, Marks, and SectionTitle accordions
            types: Object.values(groups.typeSectionTitle).reduce(
              (acc, { type, marks }) => {
                acc[type] = acc[type] || [];
                Object.values(marks).forEach((questions) => {
                  acc[type].push(...questions);
                });
                return acc;
              },
              {} as Record<string, Question[]>
            ),
            marks: Object.values(groups.typeSectionTitle).reduce(
              (acc, { marks }) => {
                Object.entries(marks).forEach(([mark, questions]) => {
                  acc[mark] = acc[mark] || [];
                  acc[mark].push(...questions);
                });
                return acc;
              },
              {} as Record<string, Question[]>
            ),
            sectionTitles: Object.values(groups.typeSectionTitle).reduce(
              (acc, { sectionTitle, marks }) => {
                acc[sectionTitle] = acc[sectionTitle] || [];
                Object.values(marks).forEach((questions) => {
                  acc[sectionTitle].push(...questions);
                });
                return acc;
              },
              {} as Record<string, Question[]>
            ),
          },
        ])
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

    try {
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
              onError={(e) => {
                // Fallback to placeholder on error
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error rendering images:", error);
      return null;
    }
  }, []);

  // 1. Update the question rendering to support dark mode
  const renderQuestion = (question: Question) => {
    const isSelected = selectedQuestions.some((q) => q.id === question.id);
    const sectionTitle = getSectionTitle(question);

    return (
      <div
        className={cn(
          "flex items-start gap-3 border-b pb-1 p-2 mt-1 rounded-lg last:border-b-0 transition-colors",
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/30 text-foreground"
            : "hover:bg-gray-50 dark:hover:bg-gray-800"
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
            <span className="text-xs text-muted-foreground flex items-center">
              <Tag className="mr-1 h-3 w-3" />
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

  const getGroupTitle = (
    groupKey: string,
    groupType: "marks" | "sectionTitles",
    count: number
  ) => {
    if (groupType === "marks") {
      return (
        <div className="flex items-center">
          <Tag className="mr-2 h-4 w-4" />
          {groupKey} Mark{Number(groupKey) !== 1 ? "s" : ""} ({count})
        </div>
      );
    }
    return (
      <div className="flex items-center">
        <List className="mr-2 h-4 w-4" />
        {groupKey} ({count})
      </div>
    );
  };

  // 2. Update the accordion items to support dark mode
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
              value={
                expandedChapters.includes(chapterId) ? chapterId : undefined
              }
              onValueChange={() => toggleChapter(chapterId)}
              className="border rounded-md bg-background dark:border-gray-700"
            >
              <AccordionItem value={chapterId}>
                <AccordionTrigger className="text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {/* Display chapter number and name with total question count */}
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-base font-medium truncate">
                      Ch. {chapterData[chapterId]?.chapterNo || "N/A"}:{" "}
                      {chapterData[chapterId]?.name || "Unknown Chapter"} (
                      {Object.values(groups.sectionTitles).flat().length})
                    </h4>
                    {chapterData[chapterId]?.status ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  {loadedChapters.includes(chapterId) ? (
                    <div className="space-y-4">
                      {/* Group by Marks */}
                      <Accordion type="multiple" className="space-y-2">
                        {Object.entries(groups.marks)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([key, questions]) => {
                            const itemValue = `${chapterId}-marks-${key}`;
                            return (
                              <AccordionItem value={itemValue} key={key}>
                                <AccordionTrigger className="text-sm py-2 px-2 rounded-lg hover:bg-accent/50">
                                  {getGroupTitle(
                                    key,
                                    "marks",
                                    questions.length
                                  )}
                                </AccordionTrigger>
                                <AccordionContent className="px-2 py-1">
                                  {questions.map(renderQuestion)}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                      </Accordion>

                      {/* Group by Section Title */}
                      <Accordion type="multiple" className="space-y-2">
                        {Object.entries(groups.sectionTitles)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([key, questions]) => {
                            const itemValue = `${chapterId}-sectionTitles-${key}`;
                            return (
                              <AccordionItem value={itemValue} key={key}>
                                <AccordionTrigger className="text-sm py-2 px-2 rounded-lg hover:bg-accent/50">
                                  {getGroupTitle(
                                    key,
                                    "sectionTitles",
                                    questions.length
                                  )}
                                </AccordionTrigger>
                                <AccordionContent className="px-2 py-1">
                                  {questions.map(renderQuestion)}
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
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
            <CheckSquare className="mr-2 h-4 w-4" />
            Selected Questions ({selectedQuestions.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((mark) => {
              const count = selectedQuestions.filter(
                (q) => q.marks === mark
              ).length;
              if (count === 0) return null;
              return (
                <Badge
                  key={mark}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
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
