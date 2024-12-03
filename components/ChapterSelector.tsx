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
import { Question, Chapter, ChapterSelectorProps } from "@/types";

export function ChapterSelector({
  questionBankData,
  onSelectQuestions,
}: ChapterSelectorProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const handleChapterChange = useCallback((chapterId: string) => {
    console.log(`Selected chapter: ${chapterId}`);
    setSelectedChapterId(chapterId);
  }, []);

  const handleQuestionChange = useCallback(
    (question: Question, chapter: Chapter) => {
      setSelectedQuestions((prev) => {
        const isSelected = prev.some((q) => q.id === question.id);
        const updated = isSelected
          ? prev.filter((q) => q.id !== question.id)
          : [
              ...prev,
              { ...question, chapterId: chapter.id, chapterName: chapter.name },
            ];
        console.log(
          `${isSelected ? "Deselected" : "Selected"} question: ${question.id}`
        );
        return updated;
      });
    },
    []
  );

  useEffect(() => {
    onSelectQuestions(selectedQuestions);
  }, [selectedQuestions, onSelectQuestions]);

  const handleReset = useCallback(() => {
    console.log("Reset selected questions");
    setSelectedQuestions([]);
    onSelectQuestions([]);
    localStorage.removeItem("selectedQuestions");
  }, [onSelectQuestions]);

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
        {questionBankData.map((chapter) => (
          <div key={chapter.id}>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => handleChapterChange(chapter.id)}
            >
              {chapter.Ch} - {chapter.name}
            </button>
            {selectedChapterId === chapter.id && (
              <Accordion type="single" collapsible className="w-full mt-4">
                {chapter.sections.map((section) => (
                  <AccordionItem key={section.type} value={section.type}>
                    <AccordionTrigger>{section.type}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {section.questions.map((question) => (
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
                                handleQuestionChange(question, chapter)
                              }
                            />
                            <Label
                              htmlFor={`question-${question.id}`}
                              className="grid grid-cols-3 space-y-2"
                            >
                              <span className="col-span-2">
                                {question.question}
                              </span>
                              {question.isReviewed && (
                                <Badge
                                  className="col-span-1"
                                  variant="secondary"
                                >
                                  Reviewed
                                </Badge>
                              )}
                              {question.questionImages &&
                                question.questionImages.length > 0 && (
                                  <div className="flex flex-wrap gap-2 col-span-2">
                                    {question.questionImages.map(
                                      (img, index) => (
                                        <Image
                                          key={index}
                                          src={img}
                                          alt={`Question image ${index + 1}`}
                                          width={150}
                                          height={100}
                                          className="object-contain"
                                        />
                                      )
                                    )}
                                  </div>
                                )}
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
