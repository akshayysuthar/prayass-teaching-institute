"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export interface ExamHistoryItem {
  id: string;
  contentId: number;
  contentName: string;
  standard: string;
  medium: string;
  semester: string;
  totalQuestions: number;
  totalMarks: number;
  selectedQuestionIds: number[];
  timestamp: number;
  chapters?: string;
}

export function useExamHistory() {
  const { toast } = useToast();

  const saveExamToHistory = (
    exam: Omit<ExamHistoryItem, "id" | "timestamp">
  ) => {
    try {
      // Get existing history
      const historyJson = localStorage.getItem("examHistory");
      const history: ExamHistoryItem[] = historyJson
        ? JSON.parse(historyJson)
        : [];

      // Create new history item
      const newItem: ExamHistoryItem = {
        ...exam,
        id: `exam_${Date.now()}`,
        timestamp: Date.now(),
      };

      // Add to beginning of array and limit to 10 items
      const updatedHistory = [newItem, ...history].slice(0, 10);

      // Save back to localStorage
      localStorage.setItem("examHistory", JSON.stringify(updatedHistory));

      toast({
        title: "Exam saved to history",
        description: "You can access this exam again from the home page",
        variant: "default",
      });

      return newItem.id;
    } catch (error) {
      console.error("Failed to save exam to history:", error);
      toast({
        title: "Error",
        description: "Failed to save exam to history",
        variant: "destructive",
      });
      return null;
    }
  };

  const getExamHistory = (): ExamHistoryItem[] => {
    try {
      const historyJson = localStorage.getItem("examHistory");
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error("Failed to get exam history:", error);
      return [];
    }
  };

  const clearExamHistory = () => {
    try {
      localStorage.removeItem("examHistory");
      toast({
        title: "History cleared",
        description: "Your exam history has been cleared",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to clear exam history:", error);
      toast({
        title: "Error",
        description: "Failed to clear exam history",
        variant: "destructive",
      });
    }
  };

  const removeExamFromHistory = (id: string) => {
    try {
      const historyJson = localStorage.getItem("examHistory");
      const history: ExamHistoryItem[] = historyJson
        ? JSON.parse(historyJson)
        : [];

      const updatedHistory = history.filter((item) => item.id !== id);
      localStorage.setItem("examHistory", JSON.stringify(updatedHistory));

      toast({
        title: "Exam removed",
        description: "The exam has been removed from your history",
        variant: "default",
      });

      return updatedHistory;
    } catch (error) {
      console.error("Failed to remove exam from history:", error);
      toast({
        title: "Error",
        description: "Failed to remove exam from history",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    saveExamToHistory,
    getExamHistory,
    clearExamHistory,
    removeExamFromHistory,
  };
}

export function ExamHistory() {
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const { getExamHistory, removeExamFromHistory, clearExamHistory } =
    useExamHistory();

  useEffect(() => {
    setHistory(getExamHistory());
  }, []);

  const handleRemoveExam = (id: string) => {
    const updatedHistory = removeExamFromHistory(id);
    if (updatedHistory) {
      setHistory(updatedHistory);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-600">Recent Exams</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={clearExamHistory}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear History
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((exam) => (
          <Card
            key={exam.id}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader className="bg-blue-50 pb-2">
              <CardTitle className="text-blue-600">
                {exam.contentName}
              </CardTitle>
              <CardDescription className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(exam.timestamp, { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    Class {exam.standard}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    {exam.medium}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    Sem {exam.semester}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Questions:</span>{" "}
                  {exam.totalQuestions}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Marks:</span>{" "}
                  {exam.totalMarks}
                </p>
                {exam.chapters && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Chapters:</span>{" "}
                    {exam.chapters}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveExam(exam.id)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link
                  href={`/generate-exam?contentId=${exam.contentId}&historyId=${exam.id}`}
                >
                  Regenerate <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
