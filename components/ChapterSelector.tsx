import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Question, SelectedChapter } from "@/types";
import { supabase } from "@/utils/supabase/client";

interface ChapterSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: SelectedChapter[]) => void;
}

export function ChapterSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
}: ChapterSelectorProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const chapters = useMemo(() => {
    const chapterMap = new Map<string, { id: string; name: string }>();
    questions.forEach((q) => {
      if (!chapterMap.has(q.Ch)) {
        chapterMap.set(q.Ch, { id: q.Ch, name: q.chapterName });
      }
    });
    return Array.from(chapterMap.values());
  }, [questions]);

  const handleChapterChange = useCallback((chapter: string) => {
    setSelectedChapterId(chapter);
  }, []);

  const updateQuestionSelectionCount = useCallback(
    async (questionId: string, increment: boolean) => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("selectionCount")
          .eq("id", questionId)
          .single();

        if (error) throw error;

        const currentCount = data?.selectionCount || 0;
        const newCount = increment
          ? currentCount + 1
          : Math.max(0, currentCount - 1);

        const { error: updateError } = await supabase
          .from("questions")
          .update({ selectionCount: newCount })
          .eq("id", questionId);

        if (updateError) throw updateError;

        // Update the local state
        setSelectedQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, selectionCount: newCount } : q
          )
        );
      } catch (error) {
        console.error("Error updating question selection count:", error);
      }
    },
    []
  );

  const handleQuestionChange = useCallback(
    (question: Question) => {
      setSelectedQuestions((prev) => {
        const isSelected = prev.some((q) => q.id === question.id);
        const updated = isSelected
          ? prev.filter((q) => q.id !== question.id)
          : [...prev, question];
        updateQuestionSelectionCount(question.id, !isSelected);
        return updated;
      });
    },
    [updateQuestionSelectionCount]
  );

  useEffect(() => {
    onSelectQuestions(selectedQuestions);
  }, [selectedQuestions, onSelectQuestions]);

  useEffect(() => {
    const uniqueChapters = Array.from(
      new Set(selectedQuestions.map((q) => q.Ch))
    ).map((ch) => ({ id: ch, name: ch }));
    onSelectChapters(uniqueChapters);
  }, [selectedQuestions, onSelectChapters]);

  const handleReset = useCallback(() => {
    setSelectedQuestions([]);
    onSelectQuestions([]);
    onSelectChapters([]);
  }, [onSelectQuestions, onSelectChapters]);

  const renderImages = useCallback((images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imageArray.map((img, index) => (
          <Image
            key={index}
            src={img}
            alt={`Question image ${index + 1}`}
            width={200}
            height={200}
            className="object-contain"
          />
        ))}
      </div>
    );
  }, []);

  const groupQuestionsByType = useCallback((chapterQuestions: Question[]) => {
    const groupedQuestions: { [key: string]: Question[] } = {};
    chapterQuestions.forEach((question) => {
      if (!groupedQuestions[question.type]) {
        groupedQuestions[question.type] = [];
      }
      groupedQuestions[question.type].push(question);
    });
    return groupedQuestions;
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 items-center justify-center">
        <h2 className="col-span-4 text-xl font-bold text-center">
          Select Chapter
        </h2>
        <div className="col-span-3 mt-2">
          <Badge variant="secondary" className="mr-1">
            Selected Questions: {selectedQuestions.length}
          </Badge>
          <Badge variant="secondary" className="mr-1">
            Selected Chapters:{" "}
            {Array.from(new Set(selectedQuestions.map((q) => q.Ch))).length}
          </Badge>
        </div>
        <div className="col-span-1 flex justify-center items-center">
          <Button
            disabled={selectedQuestions.length === 0}
            onClick={handleReset}
            variant="destructive"
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter) => (
          <div key={chapter.id}>
            <button
              className={`text-blue-600 hover:underline ${
                selectedQuestions.some((q) => q.Ch === chapter.id)
                  ? "font-bold"
                  : ""
              }`}
              onClick={() => handleChapterChange(chapter.id)}
            >
              Chapter {chapter.id} - {chapter.name}
            </button>
            {selectedChapterId === chapter.id && (
              <Accordion type="multiple" className="w-full mt-4">
                {Object.entries(
                  groupQuestionsByType(
                    questions.filter((q) => q.Ch === chapter.id)
                  )
                ).map(([type, typeQuestions]) => (
                  <AccordionItem
                    value={`${chapter.id}-${type}`}
                    key={`${chapter.id}-${type}`}
                  >
                    <AccordionTrigger>{type}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {typeQuestions.map((question) => (
                          <div
                            key={`question-${question.id}`}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={`question-${question.id}`}
                              checked={selectedQuestions.some(
                                (q) => q.id === question.id
                              )}
                              onCheckedChange={() =>
                                handleQuestionChange(question)
                              }
                            />
                            <Label
                              htmlFor={`question-${question.id}`}
                              className="flex flex-col space-y-2"
                            >
                              <span>
                                {question.question} ({question.marks} marks)
                              </span>
                              {renderImages(question.questionImages)}
                              {question.isReviewed && (
                                <Badge variant="secondary">Reviewed</Badge>
                              )}
                              <span className="text-sm text-gray-500">
                                Selected {question.selectionCount || 0} times
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
