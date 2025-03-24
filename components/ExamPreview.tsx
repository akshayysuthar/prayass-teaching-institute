"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Question, ExamStructure } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ExamPreviewProps {
  selectedQuestions: Question[];
  examStructure: ExamStructure;
  onGeneratePdf: (format: "exam" | "examWithAnswer" | "material") => void;
  isSectionWise: boolean;
}

export function ExamPreview({
  selectedQuestions,
  examStructure,
  onGeneratePdf,
  // isSectionWise,
}: ExamPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showSections, setShowSections] = useState(true);

  // Group questions by section ID
  const groupedQuestions = useMemo(() => {
    const grouped: Record<number, Question[]> = {};
    examStructure.sections.forEach((_, index) => {
      grouped[index] = [];
    });
    selectedQuestions.forEach((question) => {
      const sectionId =
        question.sectionId !== undefined ? question.sectionId : 0;
      if (!grouped[sectionId]) grouped[sectionId] = [];
      grouped[sectionId].push(question);
    });
    return grouped;
  }, [selectedQuestions, examStructure]);

  // Calculate total marks
  const totalSelectedMarks = selectedQuestions.reduce(
    (sum, q) => sum + q.marks,
    0
  );

  // // Format chapters
  // const formatChapters = () => {
  //   // Assuming subject_id represents chapter number; adjust if it's different
  //   const chapterNos = [
  //     ...new Set(selectedQuestions.map((q) => q.subject_id)),
  //   ].sort((a, b) => a - b);
  //   if (chapterNos.length === 0) return "N/A";
  //   if (chapterNos.length === 1) return `${chapterNos[0]}`;
  //   const isConsecutive = chapterNos.every(
  //     (n, i) => i === 0 || n === chapterNos[i - 1] + 1
  //   );
  //   return isConsecutive
  //     ? `${chapterNos[0]} to ${chapterNos[chapterNos.length - 1]}`
  //     : chapterNos.join(", ");
  // };

  // const chaptersDisplay = formatChapters();

  // Simple image rendering function
  const renderImages = (images?: string[]) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Question image ${index + 1}`}
            className="max-w-[200px] h-auto rounded-md"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Exam Preview</h2>
        <Badge variant="outline" className="text-lg">
          Total Marks: {totalSelectedMarks}
        </Badge>
      </div>

      {/* Format Selection */}
      {!selectedFormat ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select PDF Format</h3>
          <Select onValueChange={(value) => setSelectedFormat(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Choose format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exam">Exam Paper</SelectItem>
              <SelectItem value="examWithAnswer">
                Exam Paper with Answer
              </SelectItem>
              <SelectItem value="material">Material Paper</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <>
          {/* Toggles */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="show-answers"
                checked={showAnswers}
                onCheckedChange={setShowAnswers}
              />
              <Label htmlFor="show-answers">Show Answers</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-sections"
                checked={showSections}
                onCheckedChange={setShowSections}
              />
              <Label htmlFor="show-sections">Show Sections</Label>
            </div>
          </div>

          {/* Preview Content */}
          {showSections ? (
            Object.entries(groupedQuestions).map(
              ([sectionIndex, questions]) => {
                const section =
                  examStructure.sections[Number.parseInt(sectionIndex)];
                return (
                  questions.length > 0 && (
                    <div key={sectionIndex} className="space-y-4">
                      <h3 className="text-xl font-semibold">
                        Section {section.name}: {section.questionType}
                      </h3>
                      <ol className="list-decimal list-inside space-y-4">
                        {questions.map((question) => (
                          <li key={question.id} className="text-lg">
                            <span>{question.question}</span>
                            {renderImages(
                              question.question_images || undefined
                            )}
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
                            {showAnswers && question.answer && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>Answer:</strong>{" "}
                                <span>
                                  {typeof question.answer === "string"
                                    ? question.answer
                                    : JSON.stringify(question.answer)}
                                </span>
                                {renderImages(
                                  question.answer_images || undefined
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          Questions: {questions.length}/{section.totalQuestions}
                        </span>
                        <span>
                          Marks:{" "}
                          {questions.reduce((sum, q) => sum + q.marks, 0)}/
                          {section.totalMarks}
                        </span>
                      </div>
                    </div>
                  )
                );
              }
            )
          ) : (
            <div className="text-center text-gray-500">
              Sections and questions hidden
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={() =>
                onGeneratePdf(
                  selectedFormat as "exam" | "examWithAnswer" | "material"
                )
              }
            >
              Generate PDF
            </Button>
            <Button variant="outline" onClick={() => setSelectedFormat(null)}>
              Change Format
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
