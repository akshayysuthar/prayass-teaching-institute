"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Question, ExamStructure } from "@/types";
import { ChapterSelector } from "./ChapterSelector";

interface QuestionTypeSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: any[]) => void;
  examStructure: ExamStructure;
  onExamStructureChange: (newStructure: ExamStructure) => void;
}

export function QuestionTypeSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
  onExamStructureChange,
}: QuestionTypeSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [questionsByType, setQuestionsByType] = useState<
    Record<string, Question[]>
  >({});

  useEffect(() => {
    // Group questions by their sectionTitle
    const grouped: Record<string, Question[]> = { all: [...questions] };

    questions.forEach((question) => {
      const type = question.type || "Other";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(question); 
    });

    setQuestionsByType(grouped);

    // Set the default tab to "all" or the first available type
    if (Object.keys(grouped).length > 0 && !grouped[selectedTab]) {
      setSelectedTab("all");
    }
  }, [questions, selectedTab]);

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All Questions</TabsTrigger>
          {Object.keys(questionsByType)
            .filter((type) => type !== "all")
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map((type) => (
              <TabsTrigger key={type} value={type}>
                {type} ({questionsByType[type]?.length || 0})
              </TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="all">
          <ChapterSelector
            questions={questionsByType.all || []}
            onSelectQuestions={onSelectQuestions}
            onSelectChapters={onSelectChapters}
            examStructure={examStructure}
            onExamStructureChange={onExamStructureChange}
          />
        </TabsContent>

        {Object.keys(questionsByType)
          .filter((type) => type !== "all")
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((type) => (
            <TabsContent key={type} value={type}>
              <ChapterSelector
                questions={questionsByType[type] || []}
                onSelectQuestions={onSelectQuestions}
                onSelectChapters={onSelectChapters}
                examStructure={examStructure}
                onExamStructureChange={onExamStructureChange}
              />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
