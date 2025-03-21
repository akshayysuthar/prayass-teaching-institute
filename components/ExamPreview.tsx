"use client";

import { Button } from "@/components/ui/button";
import type { Question, ExamStructure } from "@/types";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

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
  // isSectionWise,
}: ExamPreviewProps) {
  // Group questions by their section ID
  const groupedQuestions = useMemo(() => {
    const grouped: Record<number, Question[]> = {};

    // Initialize groups based on exam structure
    examStructure.sections.forEach((section, index) => {
      grouped[index] = [];
    });

    // Add questions to their respective groups
    selectedQuestions.forEach((question) => {
      const sectionId =
        question.sectionId !== undefined ? question.sectionId : 0;

      // If this section doesn't exist yet, create it
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }

      grouped[sectionId].push(question);
    });

    return grouped;
  }, [selectedQuestions, examStructure]);

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
      {Object.entries(groupedQuestions).map(([sectionIndex, questions]) => {
        const section = examStructure.sections[Number.parseInt(sectionIndex)];

        return (
          questions.length > 0 && (
            <div key={sectionIndex} className="space-y-4">
              <h3 className="text-xl font-semibold">
                Section {section.name}: {section.questionType}
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

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Questions: {questions.length}/{section.totalQuestions}
                </span>
                <span>
                  Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}/
                  {section.totalMarks}
                </span>
              </div>
            </div>
          )
        );
      })}

      <Button onClick={onGeneratePdf}>Generate PDF</Button>
    </div>
  );
}
