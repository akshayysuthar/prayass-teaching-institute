"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  RotateCcw,
  BookOpen,
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
  onGeneratePdf?: () => void;
  onResetForm?: () => void;
  onToggleAnswers?: () => void;
  canGoNext: boolean;
  canGeneratePdf: boolean;
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
  onToggleAnswers,
  canGeneratePdf,
}: MobileBottomNavProps) {
  const handleClearQuestions = useCallback(() => {
    onClearQuestions();
  }, [onClearQuestions]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 md:hidden z-50">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge
            variant="outline"
            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm py-1 px-2"
          >
            Step {currentStep}/{totalSteps}
          </Badge>
          {selectedQuestionsCount > 0 && (
            <Badge
              variant="outline"
              className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm py-1 px-2"
            >
              {selectedQuestionsCount} Questions
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

        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            className="h-12 text-base"
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            className="h-12 text-base"
            disabled={currentStep === totalSteps}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {currentStep === 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearQuestions}
              className="h-12 text-base"
              disabled={selectedQuestionsCount === 0}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}

          {currentStep === 3 && onGeneratePdf && (
            <Button
              variant="default"
              size="sm"
              onClick={onGeneratePdf}
              className="h-12 text-base bg-blue-600 hover:bg-blue-700"
              disabled={!canGeneratePdf}
            >
              <Download className="h-5 w-5" />
            </Button>
          )}

          {onResetForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetForm}
              className="h-12 text-base"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}

          {currentStep === 3 && onToggleAnswers && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAnswers}
              className="h-12 text-base"
            >
              <BookOpen className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
