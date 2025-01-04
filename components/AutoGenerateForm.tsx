import React from "react";
import { Button } from "@/components/ui/button";
import { Question, ExamStructure } from "@/types";

interface AutoGenerateFormProps {
  questions: Question[];
  examStructure: ExamStructure;
  onAutoGenerate: (selectedQuestions: Question[]) => void;
}

export function AutoGenerateForm({
  questions,
  examStructure,
  onAutoGenerate,
}: AutoGenerateFormProps) {
  const autoGenerateExam = () => {
    const selectedQuestions: Question[] = [];

    examStructure.sections.forEach((section) => {
      const sectionQuestions = questions.filter(
        (q) => q.section_title === section.questionType
      );
      const shuffledQuestions = [...sectionQuestions].sort(
        () => Math.random() - 0.5
      );

      let currentMarks = 0;
      for (const question of shuffledQuestions) {
        if (currentMarks + question.marks <= section.totalMarks) {
          selectedQuestions.push(question);
          currentMarks += question.marks;
        }
        if (currentMarks === section.totalMarks) break;
      }
    });

    onAutoGenerate(selectedQuestions);
  };

  return (
    <div className="space-y-4">
      <p>
        Click the button below to automatically generate an exam based on the
        current exam structure.
      </p>
      <Button onClick={autoGenerateExam}>Auto Generate Exam</Button>
    </div>
  );
}
