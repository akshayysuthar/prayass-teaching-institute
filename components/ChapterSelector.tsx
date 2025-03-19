"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import type { Question, SelectedChapter, ExamStructure } from "@/types";
import { supabase } from "@/utils/supabase/client";

interface ChapterSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: SelectedChapter[]) => void;
  examStructure: ExamStructure;
  onExamStructureChange: (newStructure: ExamStructure) => void;
  isSectionWise: boolean;
  totalMarks: number;
  remainingMarks: number;
}

export function ChapterSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
  onExamStructureChange,
  isSectionWise,
  totalMarks,
  remainingMarks,
}: ChapterSelectorProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [chapterNames, setChapterNames] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchChapterNames = async () => {
      const subjectIds = [...new Set(questions.map((q) => q.subject_id))];
      const { data, error } = await supabase
        .from("subjects")
        .select("id, chapter_name")
        .in("id", subjectIds);

      if (error) {
        console.error("Error fetching chapter names:", error);
        return;
      }

      const chapterNameMap = data.reduce((acc, subject) => {
        acc[subject.id] = subject.chapter_name;
        return acc;
      }, {});

      setChapterNames(chapterNameMap);
    };

    fetchChapterNames();
  }, [questions]);

  // Group questions by chapter
  const groupedQuestions = useMemo(() => {
    const grouped: { [key: string]: Question[] } = {};
    questions.forEach((q) => {
      const chapterId = q.subject_id.toString();
      if (!grouped[chapterId]) {
        grouped[chapterId] = [];
      }
      grouped[chapterId].push(q);
    });
    return grouped;
  }, [questions]);

  const handleQuestionChange = useCallback(
    (question: Question) => {
      setSelectedQuestions((prev) => {
        const isSelected = prev.some((q: Question) => q.id === question.id);

        // If deselecting, just remove the question
        if (isSelected) {
          const updated = prev.filter((q: Question) => q.id !== question.id);
          onSelectQuestions(updated);
          return updated;
        }

        // If selecting, check if we have enough remaining marks
        if (remainingMarks < question.marks) {
          alert(
            `Not enough remaining marks. You need ${question.marks} marks but only have ${remainingMarks} left.`
          );
          return prev;
        }

        // If this is a new question type and we're using section-wise, add a new section
        if (isSectionWise) {
          const questionType = question.type || "Other";
          const existingSection = examStructure.sections.find(
            (s) => s.questionType === questionType
          );

          if (!existingSection) {
            const newSectionName = String.fromCharCode(
              65 + examStructure.sections.length
            );
            const newSection = {
              name: newSectionName,
              questionType: questionType,
              totalMarks: question.marks * 5, // Default to 5 questions of this type
              marksPerQuestion: question.marks,
              totalQuestions: 5,
            };

            // Update the exam structure with the new section
            const updatedExamStructure = {
              ...examStructure,
              totalMarks: examStructure.totalMarks + newSection.totalMarks,
              sections: [...examStructure.sections, newSection],
            };

            // Call the onExamStructureChange prop to update the parent component
            onExamStructureChange(updatedExamStructure);
          }
        }

        // Add the question to the selected questions
        const updated = [...prev, question];
        onSelectQuestions(updated);
        return updated;
      });
    },
    [
      examStructure,
      onExamStructureChange,
      onSelectQuestions,
      remainingMarks,
      isSectionWise,
    ]
  );

  useEffect(() => {
    const uniqueChapters = Array.from(
      new Set(selectedQuestions.map((q: Question) => q.subject_id))
    ).map((subjectId) => ({
      id: subjectId,
      name: chapterNames[subjectId] || subjectId,
    }));
    onSelectChapters(uniqueChapters);
  }, [selectedQuestions, onSelectChapters, chapterNames]);

  const handleReset = useCallback(() => {
    setSelectedQuestions([]);
    onSelectQuestions([]);
  }, [onSelectQuestions]);

  const renderImages = useCallback((images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imageArray.map((img, index) => (
          <Image
            key={index}
            src={img || "/placeholder.svg"}
            alt={`Question image ${index + 1}`}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-3 mt-2">
          <Badge variant="secondary" className="mr-1">
            Selected Questions: {selectedQuestions.length}
          </Badge>
          <Badge variant="secondary" className="mr-1">
            Total Marks:{" "}
            {selectedQuestions.reduce((sum, q) => sum + q.marks, 0)}
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

      <div className="space-y-2">
        {Object.entries(groupedQuestions).map(
          ([chapterId, chapterQuestions]) => (
            <Accordion type="single" collapsible key={chapterId}>
              <AccordionItem value={`chapter-${chapterId}`}>
                <AccordionTrigger>
                  <h3 className="text-lg font-bold">
                    Chapter: {chapterNames[chapterId] || chapterId} (
                    {chapterQuestions.length} questions)
                  </h3>
                </AccordionTrigger>
                <AccordionContent>
                  {chapterQuestions.map((question) => (
                    <div
                      className="flex items-start space-x-3 mb-4"
                      key={question.id}
                    >
                      <Checkbox
                        id={`question-${question.id}`}
                        checked={selectedQuestions.some(
                          (q: Question) => q.id === question.id
                        )}
                        onCheckedChange={() => handleQuestionChange(question)}
                      />
                      <Label
                        htmlFor={`question-${question.id}`}
                        className="flex flex-col space-y-2"
                      >
                        <span>
                          {question.question} ({question.marks} marks)
                        </span>
                        {renderImages(question.question_images || undefined)}
                        <span className="text-sm text-gray-500">
                          Type: {question.type || "General"}
                        </span>
                      </Label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )
        )}
      </div>
    </div>
  );
}
