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
import { Question, SelectedChapter, ExamStructure } from "@/types";
import { supabase } from "@/utils/supabase/client";

interface ChapterSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: SelectedChapter[]) => void;
  examStructure: ExamStructure;
}

export function ChapterSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
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

      const chapterNameMap = data.reduce((acc: { [key: string]: string }, subject: { id: string; chapter_name: string }) => {
        acc[subject.id] = subject.chapter_name;
        return acc;
      }, {});

      setChapterNames(chapterNameMap);
    };

    fetchChapterNames();
  }, [questions]);

  const groupedQuestions = useMemo(() => {
    const grouped: { [key: string]: Question[] } = {};
    questions.forEach((q) => {
      const type = q.section_title || "Other";
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

  const handleQuestionChange = useCallback((question: Question) => {
    setSelectedQuestions((prev) => {
      const isSelected = prev.some((q: Question) => q.id === question.id);
      const updated = isSelected
        ? prev.filter((q: Question) => q.id !== question.id)
        : [...prev, question];
      return updated;
    });
  }, []);

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

  const isQuestionSelectable = useCallback(
    (question: Question) => {
      const section = examStructure.sections.find(
        (s) => s.questionType === question.section_title
      );
      if (!section) return false;

      const selectedQuestionsOfType = selectedQuestions.filter(
        (q: Question) => q.section_title === question.section_title
      );
      const totalMarksOfType = selectedQuestionsOfType.reduce(
        (sum, q) => sum + q.marks,
        0
      );
      return totalMarksOfType < section.totalMarks;
    },
    [selectedQuestions, examStructure]
  );

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
                {groupedQuestions[questionType].map((question) => (
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
                        Chapter:{" "}
                        {chapterNames[question.subject_id] || "Unknown"}
                      </span>
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
