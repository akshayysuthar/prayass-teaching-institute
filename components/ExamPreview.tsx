"use client";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import type { Question, ExamStructure } from "@/types";
import { useMemo } from "react";

interface ExamPreviewProps {
  selectedQuestions: Question[];
  examStructure: ExamStructure;
  onGeneratePdf: () => void;
  isSectionWise: boolean;
}

export function ExamPreview({
  selectedQuestions,
  examStructure,
  onGeneratePdf,
  isSectionWise,
}: ExamPreviewProps) {
  // Group questions by their section type if section-wise
  const groupedQuestions = useMemo(() => {
    if (!isSectionWise) {
      return { "All Questions": selectedQuestions };
    }

    const grouped: Record<string, Question[]> = {};

    // Initialize groups based on exam structure
    examStructure.sections.forEach((section) => {
      grouped[section.questionType] = [];
    });

    // Add questions to their respective groups
    selectedQuestions.forEach((question) => {
      const questionType = question.type || "Other";

      // If this section doesn't exist yet, create it
      if (!grouped[questionType]) {
        grouped[questionType] = [];
      }

      grouped[questionType].push(question);
    });

    return grouped;
  }, [selectedQuestions, examStructure, isSectionWise]);

  // Get section name from exam structure
  const getSectionName = (questionType: string) => {
    if (!isSectionWise) return "";

    const section = examStructure.sections.find(
      (s) => s.questionType === questionType
    );
    return section ? section.name : "?";
  };

  // Calculate total marks
  const totalSelectedMarks = selectedQuestions.reduce(
    (sum, q) => sum + q.marks,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exam Preview</h2>
        <Badge variant="outline" className="text-lg">
          Total Marks: {totalSelectedMarks}
        </Badge>
      </div>

      {/* Display each section */}
      {Object.entries(groupedQuestions).map(
        ([sectionType, questions]) =>
          questions.length > 0 && (
            <div key={sectionType} className="space-y-4">
              <h3 className="text-xl font-semibold">
                {isSectionWise
                  ? `Section ${getSectionName(sectionType)} (${sectionType})`
                  : sectionType}
              </h3>
              <ol className="list-decimal list-inside space-y-4">
                {questions.map((question) => (
                  <li key={question.id} className="text-lg">
                    {question.question}
                    {question.type === "MCQ" && question.options && (
                      <ul className="list-none ml-6 mt-2">
                        {Object.entries(question.options).map(
                          ([key, value]) => (
                            <li key={key}>
                              {key}) {value}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                    <span className="text-sm text-gray-500 ml-2">
                      ({question.marks} marks)
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )
      )}

      <Button onClick={onGeneratePdf}>Generate PDF</Button>
    </div>
  );
}
