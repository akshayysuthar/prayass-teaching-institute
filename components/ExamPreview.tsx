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
  showAnswers?: boolean;
  selectedFormat: "exam" | "examWithAnswer" | "material" | null;
  setSelectedFormat: (
    format: "exam" | "examWithAnswer" | "material" | null
  ) => void;
}

export function ExamPreview({
  selectedQuestions,
  examStructure,
  onGeneratePdf,
  // isSectionWise,

  selectedFormat,
  setSelectedFormat,
}: ExamPreviewProps) {
  const [showSections, setShowSections] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

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

  const totalSelectedMarks = selectedQuestions.reduce(
    (sum, q) => sum + q.marks,
    0
  );

  const renderImages = (images?: string[]) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-3">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Question image ${index + 1}`}
            className="max-w-[150px] sm:max-w-[200px] h-auto rounded-lg"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center sm:flex-row justify-between  sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Exam Preview
        </h2>
        <Badge variant="outline" className=" text-base py-1 px-3">
          Total Marks: {totalSelectedMarks}
        </Badge>
      </div>

      {!selectedFormat ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Select PDF Format
          </h3>
          <Select
            onValueChange={(value) =>
              setSelectedFormat(value as "exam" | "examWithAnswer" | "material")
            }
          >
            <SelectTrigger className="w-full sm:w-[200px] h-12 text-base">
              <SelectValue placeholder="Choose format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exam" className="text-base py-2">
                Exam Paper
              </SelectItem>
              <SelectItem value="examWithAnswer" className="text-base py-2">
                Exam Paper with Answer
              </SelectItem>
              <SelectItem value="material" className="text-base py-2">
                Material Paper
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <>
          <div className="flex flex-row gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="show-sections"
                checked={showSections}
                onCheckedChange={setShowSections}
              />
              <Label htmlFor="show-sections" className="text-sm font-medium">
                Show Questions
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="show-sections"
                checked={showAnswers}
                onCheckedChange={setShowAnswers}
              />
              <Label htmlFor="show-answer" className="text-sm font-medium">
                Show Answers
              </Label>
            </div>
          </div>

          {showSections ? (
            Object.entries(groupedQuestions).map(
              ([sectionIndex, questions]) => {
                const section =
                  examStructure.sections[Number.parseInt(sectionIndex)];
                return (
                  questions.length > 0 && (
                    <div key={sectionIndex} className="space-y-4">
                      <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                        Section {section.name}: {section.questionType}
                      </h3>
                      <ol className="list-decimal list-inside space-y-4">
                        {questions.map((question) => (
                          <li key={question.id} className="text-base">
                            <span>{question.question}</span>
                            {renderImages(
                              question.question_images || undefined
                            )}
                            {question.type === "MCQ" && question.options && (
                              <ul className="list-none ml-6 mt-2 space-y-1">
                                {Object.entries(question.options).map(
                                  ([key, value]) => (
                                    <li key={key} className="text-sm">
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
                              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
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
                      <div className="flex flex-col sm:flex-row justify-between text-sm text-muted-foreground gap-2">
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
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              Sections and questions hidden
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() =>
                onGeneratePdf(
                  selectedFormat as "exam" | "examWithAnswer" | "material"
                )
              }
              className="h-12 text-base"
            >
              Generate PDF
            </Button>
            {/* <DownloadPDFButton
              onClick={() => {
                setDownloading(true);
                // TODO: implement actual download logic here
                setTimeout(() => setDownloading(false), 1200);
              }}
              loading={downloading}
            /> */}
            <Button
              variant="outline"
              onClick={() => setSelectedFormat(null)}
              className="h-12 text-base"
            >
              Change Format
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
