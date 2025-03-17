"use client";

import { Button } from "@/components/ui/button";
import type { Question, ExamStructure } from "@/types";
import { useMemo } from "react";

interface ExamPreviewProps {
  selectedQuestions: Question[];
  examStructure: ExamStructure;
  onGeneratePdf: () => void;
}

export function ExamPreview({
  selectedQuestions,
  examStructure,
  onGeneratePdf,
}: ExamPreviewProps) {
  // Group questions by their section type
  const groupedQuestions = useMemo(() => {
    const grouped: Record<string, Question[]> = {};

    // Initialize groups based on exam structure
    examStructure.sections.forEach((section) => {
      grouped[section.questionType] = [];
    });

    // Add questions to their respective groups
    selectedQuestions.forEach((question) => {
      const sectionType = question.section_title || "Other";

      // If this section doesn't exist yet, create it
      if (!grouped[sectionType]) {
        grouped[sectionType] = [];
      }

      grouped[sectionType].push(question);
    });

    return grouped;
  }, [selectedQuestions, examStructure]);

  // Get section names from exam structure
  const getSectionName = (questionType: string) => {
    const section = examStructure.sections.find(
      (s) => s.questionType === questionType
    );
    return section ? section.name : "?";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Exam Preview</h2>

      {/* Display total marks */}
      <div className="text-lg font-medium mb-4">
        Total Selected Marks:{" "}
        {selectedQuestions.reduce((sum, q) => sum + q.marks, 0)}
      </div>

      {/* Display each section */}
      {Object.entries(groupedQuestions).map(
        ([sectionType, questions]) =>
          questions.length > 0 && (
            <div key={sectionType} className="space-y-4">
              <h3 className="text-xl font-semibold">
                Section {getSectionName(sectionType)} ({sectionType})
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
