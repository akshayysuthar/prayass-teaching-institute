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
}

export function ChapterSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
  onExamStructureChange,
}: ChapterSelectorProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [chapterNames, setChapterNames] = useState<{ [key: string]: string }>(
    {}
  );
  const [visibleQuestions, setVisibleQuestions] = useState<number>(20);

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

      const chapterNameMap = data.reduce<{ [key: string]: string }>(
        (acc, subject) => {
          acc[subject.id] = subject.chapter_name;
          return acc;
        },
        {}
      );

      setChapterNames(chapterNameMap);
    };

    fetchChapterNames();
  }, [questions]);

  const groupedQuestions = useMemo(() => {
    const grouped: { [key: string]: Question[] } = {};
    questions.forEach((q) => {
      const type = q.sectionTitle || "Other";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(q);
    });
    return grouped;
  }, [questions]);

  const sortedQuestionTypes = useMemo(() => {
    return Object.keys(groupedQuestions).sort((a, b) => {
      const indexA = examStructure.sections.findIndex(
        (s) => s.questionType === a
      );
      const indexB = examStructure.sections.findIndex(
        (s) => s.questionType === b
      );
      return indexA - indexB;
    });
  }, [groupedQuestions, examStructure]);

  const isQuestionSelectable = useCallback(
    (question: Question) => {
      // Find if there's an existing section for this question type
      const section = examStructure.sections.find(
        (s) => s.questionType === question.sectionTitle
      );

      // If there's no section for this question type, it's always selectable
      if (!section) return true;

      // If there is a section, check if we've reached the mark limit
      const selectedQuestionsOfType = selectedQuestions.filter(
        (q: Question) => q.sectionTitle === question.sectionTitle
      );
      const totalMarksOfType = selectedQuestionsOfType.reduce(
        (sum, q) => sum + q.marks,
        0
      );
      return totalMarksOfType < section.totalMarks;
    },
    [selectedQuestions, examStructure]
  );

  const handleQuestionChange = useCallback(
    (question: Question) => {
      setSelectedQuestions((prev) => {
        const isSelected = prev.some((q: Question) => q.id === question.id);

        // If deselecting, just remove the question
        if (isSelected) {
          return prev.filter((q: Question) => q.id !== question.id);
        }

        // If selecting, check if we need to add a new section
        const questionType = question.sectionTitle || "Other";
        const existingSection = examStructure.sections.find(
          (s) => s.questionType === questionType
        );

        // If this is a new question type, add a new section to the exam structure
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

        // Add the question to the selected questions
        return [...prev, question];
      });
    },
    [examStructure, onExamStructureChange]
  );

  useEffect(() => {
    onSelectQuestions(selectedQuestions);
  }, [selectedQuestions, onSelectQuestions]);

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
  }, []);

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

  const loadMoreQuestions = useCallback(() => {
    setVisibleQuestions((prev) => prev + 20);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <h2 className="col-span-4 text-xl font-bold text-center">
          Select Questions
        </h2>
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
        {sortedQuestionTypes.map((questionType) => (
          <Accordion type="single" collapsible key={questionType}>
            <AccordionItem value={`type-${questionType}`}>
              <AccordionTrigger>
                <h3 className="text-lg font-bold">{questionType} Questions</h3>
              </AccordionTrigger>
              <AccordionContent>
                {groupedQuestions[questionType]
                  .slice(0, visibleQuestions)
                  .map((question) => (
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
                        disabled={!isQuestionSelectable(question)}
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
                          Chapter: {question.chapter_no}.{" "}
                          {chapterNames[question.subject_id] || "Unknown"}
                        </span>
                      </Label>
                    </div>
                  ))}
                {groupedQuestions[questionType].length > visibleQuestions && (
                  <div className="text-center mt-4">
                    <Button onClick={loadMoreQuestions}>More Questions</Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
