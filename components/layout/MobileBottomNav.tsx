"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  BookOpen,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MobileBottomNavProps {
  currentStep: number;
  totalSteps: number;
  selectedQuestionsCount: number;
  totalMarks: number;
  onPrevious: () => void;
  onNext: () => void;
  onClearQuestions: () => void;
  onGeneratePdf?: (format: "exam" | "examWithAnswer" | "material") => void;
  onDownloadPdf?: () => void;
  onResetForm?: () => void;
  onToggleAnswers?: () => void;
  canGoNext: boolean;
  canGeneratePdf: boolean;
  subject?: string;
  chapterNo?: string;
  summary?: React.ReactNode;
}

export function MobileBottomNav({
  currentStep,
  totalSteps,
  selectedQuestionsCount,
  totalMarks,
  onPrevious,
  onNext,
  onClearQuestions,
  onGeneratePdf,
  onResetForm,
  canGeneratePdf,
  subject,
}: MobileBottomNavProps) {
  const handleClearQuestions = useCallback(() => {
    onClearQuestions();
  }, [onClearQuestions]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-t border-gray-200 dark:border-gray-800 p-3 md:hidden z-50">
      <div className="flex flex-row items-center justify-between w-full">
        {/* Left: Subject, Chapter, Step */}
        <div className="flex flex-col gap-1 items-start">
          {subject && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-700 dark:text-gray-200">
              {subject && (
                <span
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded"
                  title="Subject"
                >
                  <span className="inline-block align-middle">
                    <BookOpen className="inline h-4 w-4 mr-1" />
                  </span>
                  {subject}
                </span>
              )}
            </div>
          )}
          {/* <Badge
            variant="outline"
            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm py-1 px-2 mt-1"
          >
            Step {currentStep}/{totalSteps}
          </Badge> */}
        </div>
        {/* Right: Questions, Marks, Summary */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap gap-2 justify-end">
            {selectedQuestionsCount > 0 && (
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm py-1 px-2"
              >
                {selectedQuestionsCount} Qs
              </Badge>
            )}
            {totalMarks > 0 && (
              <Badge
                variant="outline"
                className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm py-1 px-2"
              >
                {totalMarks} Marks
              </Badge>
            )}
          </div>
          {/* Step 2: Show summary at bottom right */}
          {/* {currentStep === 2 && summary && (
            <div className="text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded p-1 mb-1">
              {summary}
            </div>
          )} */}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-row justify-between items-center gap-6 mt-2 w-full">
        {/* Navigation Buttons (Left) */}
        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            className="h-12 w-16 text-base"
            disabled={currentStep === 1}
            title="Previous"
          >
            <span title="Previous">
              <ChevronLeft className="h-5 w-5" />
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            className="h-12 w-16 text-base"
            disabled={currentStep === totalSteps}
            title="Next"
          >
            <span title="Next">
              <ChevronRight className="h-5 w-5" />
            </span>
          </Button>
        </div>
        {/* Action Buttons (Right) */}
        <div className="flex flex-row gap-2">
          {currentStep === 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearQuestions}
              className="h-12 text-base"
              disabled={selectedQuestionsCount === 0}
              title="Clear Questions"
            >
              <span title="Clear Questions" className="flex items-center gap-1">
                <Trash2 className="h-5 w-5" />
                <span className="font-semibold">Clear</span>
              </span>
            </Button>
          )}
          {currentStep === 3 && onGeneratePdf && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onGeneratePdf("examWithAnswer")}
              className="h-12 text-base bg-blue-600 hover:bg-blue-700"
              disabled={!canGeneratePdf}
              title="Generate PDF"
            >
              <span title="Generate PDF" className="flex items-center gap-1">
                <FileText className="h-5 w-5" />
                <span className="font-bold">Generate</span>
              </span>
            </Button>
          )}

          {onResetForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetForm}
              className="h-12 text-base"
              title="Reset Form"
            >
              <span title="Reset Form">
                <RotateCcw className="h-5 w-5" />
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
