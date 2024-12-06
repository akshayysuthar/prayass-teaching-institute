import React, { useState, useEffect, useCallback } from "react";
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
import { Question, ChapterSelectorProps } from "@/types";

interface ChapterSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
}

export function ChapterSelector({
  questions,
  onSelectQuestions,
}: ChapterSelectorProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const chapters = Array.from(new Set(questions.map((q: Question) => q.Ch)));

  const handleChapterChange = useCallback((chapterId: string) => {
    console.log(`Selected chapter: ${chapterId}`);
    setSelectedChapterId(chapterId);
  }, []);

  const handleQuestionChange = useCallback((question: Question) => {
    setSelectedQuestions((prev) => {
      const isSelected = prev.some((q) => q.id === question.id);
      const updated = isSelected
        ? prev.filter((q) => q.id !== question.id)
        : [...prev, question];
      console.log(
        `${isSelected ? "Deselected" : "Selected"} question: ${question.id}`
      );
      return updated;
    });
  }, []);

  useEffect(() => {
    onSelectQuestions(selectedQuestions);
  }, [selectedQuestions, onSelectQuestions]);

  const handleReset = useCallback(() => {
    console.log("Reset selected questions");
    setSelectedQuestions([]);
    onSelectQuestions([]);
    localStorage.removeItem("selectedQuestions");
  }, [onSelectQuestions]);

  const renderImages = (images?: string | string[]) => {
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
  };

  const groupQuestionsByType = (chapterQuestions: Question[]) => {
    const groupedQuestions: { [key: string]: Question[] } = {};
    chapterQuestions.forEach((question) => {
      if (!groupedQuestions[question.type]) {
        groupedQuestions[question.type] = [];
      }
      groupedQuestions[question.type].push(question);
    });
    return groupedQuestions;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label>Select Chapter</Label>
        <div>
          <Badge variant="secondary" className="mr-2">
            Selected Questions: {selectedQuestions.length}
          </Badge>
          <Button onClick={handleReset} variant="destructive" size="sm">
            Reset
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {chapters.map((chapter: string) => (
          <div key={chapter}>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => handleChapterChange(chapter)}
            >
              {chapter}
            </button>
            {selectedChapterId === chapter && (
              <Accordion type="multiple" className="w-full mt-4">
                {Object.entries(
                  groupQuestionsByType(
                    questions.filter((q) => q.Ch === chapter)
                  )
                ).map(([type, typeQuestions]) => (
                  <AccordionItem
                    value={`${chapter}-${type}`}
                    key={`${chapter}-${type}`}
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
                              <span>{question.question}</span>
                              {renderImages(question.questionImages)}
                              {question.isReviewed === true && (
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
