"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Save,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MobileBottomNavProps {
  currentStep: number;
  totalSteps: number;
  selectedQuestionsCount: number;
  totalMarks: number;
  onPrevious: () => void;
  onNext: () => void;
  onClearQuestions: () => void;
  onGeneratePdf?: () => void;
  onSaveToHistory?: () => void;
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
  onSaveToHistory,
  canGoNext,
  canGeneratePdf,
}: MobileBottomNavProps) {
  const { toast } = useToast();

  const handleClearQuestions = useCallback(() => {
    if (selectedQuestionsCount === 0) {
      toast({
        title: "No questions selected",
        description: "There are no questions to clear.",
      });
      return;
    }

    onClearQuestions();
  }, [selectedQuestionsCount, onClearQuestions, toast]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 md:hidden z-50">
      <div className="flex flex-col gap-2">
        {/* Summary Row */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            >
              Step {currentStep}/{totalSteps}
            </Badge>
            {selectedQuestionsCount > 0 && (
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              >
                {selectedQuestionsCount} Questions
              </Badge>
            )}
            {totalMarks > 0 && (
              <Badge
                variant="outline"
                className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                {totalMarks} Marks
              </Badge>
            )}
          </div>
          {currentStep === 2 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearQuestions}
              className="h-8 px-2"
              disabled={selectedQuestionsCount === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Row */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            className="h-10"
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          {currentStep === 3 && canGeneratePdf && onGeneratePdf && (
            <div className="flex gap-2">
              {onSaveToHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveToHistory}
                  className="h-10"
                >
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={onGeneratePdf}
                className="h-10 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
            </div>
          )}

          {currentStep < totalSteps && (
            <Button
              variant="default"
              size="sm"
              onClick={onNext}
              className="h-10 bg-blue-600 hover:bg-blue-700"
              disabled={!canGoNext}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
