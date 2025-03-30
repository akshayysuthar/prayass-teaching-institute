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
import Image from "next/image";
import type { Question } from "@/types";
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
  selectedQuestions: Question[];
}

export function QuestionSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  selectedQuestions,
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
    const lowerSearch = searchTerm.toLowerCase();
    return searchTerm
      ? questions.filter((q) => q.question.toLowerCase().includes(lowerSearch))
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
        const updatedQuestions = selectedQuestions.filter(
          (q) => q.id !== question.id
        );
        onSelectQuestions(updatedQuestions);
      } else {
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
          selectedQuestions.some((q) => q.id === question.id) && "bg-green-100"
        )}
        key={question.id}
      >
        <Checkbox
          id={`q-${question.id}`}
          checked={selectedQuestions.some((q) => q.id === question.id)}
          onCheckedChange={() => handleQuestionChange(question)}
          className="mt-1 w-5 h-5"
        />
        <Label
          htmlFor={`q-${question.id}`}
          className="flex-1 flex flex-col gap-1 text-sm"
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-10 text-sm w-full rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-2 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent animate-pulse opacity-20 pointer-events-none" />
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
                                  {sectionTitle} ({sectionTitleQuestions.length}
                                  )
                                </AccordionTrigger>
                                <AccordionContent className="px-2 py-1">
                                  {sectionTitleQuestions.map(renderQuestion)}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          }
                        )}
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
          <p className="text-sm text-muted-foreground">
            No chapters available.
          </p>
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
