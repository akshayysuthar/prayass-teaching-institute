"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { ExamStructureForm } from "@/components/ExamStructureForm";
import { ExamPreview } from "@/components/ExamPreview";
import { PdfDownload } from "@/components/PdfDownload";
import { AutoGenerateForm } from "@/components/AutoGenerateForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/utils/supabase/client";
import type {
  Content,
  Question,
  SelectedChapter,
  ExamStructure,
  Subject,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionTypeSelector } from "@/components/QuestionTypeSelector";

const initialExamStructure: ExamStructure = {
  totalMarks: 100,
  sections: [
    {
      name: "A",
      questionType: "MCQ",
      totalMarks: 20,
      marksPerQuestion: 1,
      totalQuestions: 20,
    },
    {
      name: "B",
      questionType: "1 Mark",
      totalMarks: 20,
      marksPerQuestion: 1,
      totalQuestions: 20,
    },
    {
      name: "C",
      questionType: "2 Marks",
      totalMarks: 20,
      marksPerQuestion: 2,
      totalQuestions: 10,
    },
    {
      name: "D",
      questionType: "3 Marks",
      totalMarks: 20,
      marksPerQuestion: 3,
      totalQuestions: 6,
    },
    {
      name: "E",
      questionType: "5 Marks",
      totalMarks: 20,
      marksPerQuestion: 5,
      totalQuestions: 4,
    },
  ],
};

export default function GenerateExamPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [examStructure, setExamStructure] =
    useState<ExamStructure>(initialExamStructure);
  const [isLoading, setIsLoading] = useState(true);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [generationMode, setGenerationMode] = useState<"auto" | "manual">(
    "manual"
  );
  const { toast } = useToast();
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contents. Please try again.",
        variant: "destructive",
      });
      console.error("Error details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const fetchSubjects = useCallback(
    async (contentId: number) => {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .eq("content_id", contentId);

        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch subjects. Please try again.",
          variant: "destructive",
        });
        console.error("Error details:", error);
      }
    },
    [toast]
  );

  const fetchQuestions = useCallback(
    async (contentId: number) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("content_id", contentId);
        if (error) throw error;
        setQuestions(data);

        // Extract unique question types and create dynamic exam structure
        const types = [
          ...new Set(data.map((q: Question) => q.type || 'General')),
        ];

        setQuestionTypes(types);

        if (types.length > 0) {
          const dynamicSections = types.map((type, index) => {
            // Get all questions of this type to determine default marks per question
            const questionsOfType = data.filter(
              (q) => q.section_title === type
            );
            const mostCommonMarks = getMostCommonMarks(questionsOfType);

            // Determine default marks per question based on type or most common value
            const marksPerQuestion = mostCommonMarks || 1;

            // Set reasonable defaults based on marks per question
            const totalQuestions =
              marksPerQuestion <= 1
                ? 20
                : marksPerQuestion <= 2
                ? 10
                : marksPerQuestion <= 3
                ? 7
                : 5;

            const totalMarks = marksPerQuestion * totalQuestions;

            return {
              name: String.fromCharCode(65 + index), // A, B, C, etc.
              questionType: type,
              totalMarks: totalMarks,
              marksPerQuestion: marksPerQuestion,
              totalQuestions: totalQuestions,
            };
          });

          setExamStructure({
            totalMarks: dynamicSections.reduce(
              (sum, section) => sum + section.totalMarks,
              0
            ),
            sections: dynamicSections,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch questions. Please try again.",
          variant: "destructive",
        });
        console.error("Error details:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Helper function to get the most common marks value in a set of questions
  const getMostCommonMarks = (questions: Question[]): number => {
    if (!questions.length) return 1;

    const marksCounts = questions.reduce((acc, q) => {
      acc[q.marks] = (acc[q.marks] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    let mostCommonMarks = 1;
    let highestCount = 0;

    Object.entries(marksCounts).forEach(([marks, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostCommonMarks = Number(marks);
      }
    });

    return mostCommonMarks;
  };

  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        fetchSubjects(content.id);
        fetchQuestions(content.id);
      }
    },
    [selectedContent, fetchSubjects, fetchQuestions]
  );

  const handleQuestionSelect = useCallback((questions: Question[]) => {
    setSelectedQuestions(questions);
  }, []);

  const handleChapterSelect = useCallback((chapters: SelectedChapter[]) => {
    setSelectedChapters(chapters);
  }, []);

  const handleExamStructureChange = useCallback(
    (newStructure: ExamStructure) => {
      setExamStructure(newStructure);
    },
    []
  );

  const handleGeneratePdf = useCallback(() => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "Error",
        description:
          "Please select at least one question before generating the PDF.",
        variant: "destructive",
      });
      return;
    }
    setShowPdfDownload(true);
  }, [selectedQuestions, toast]);

  const handleAutoGenerate = useCallback(
    (autoGeneratedQuestions: Question[]) => {
      setSelectedQuestions(autoGeneratedQuestions);
      toast({
        title: "Success",
        description: "Exam paper auto-generated successfully!",
      });
    },
    [toast]
  );

  if (isLoading && !contents.length) {
    return <Loading title="Loading exam generation..." />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Exam</h1>
      <div className="space-y-6">
        <ClassSelector
          contents={contents}
          onSelectContent={handleContentSelect}
          initialContent={selectedContent}
        />

        {selectedContent && subjects.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Available Subjects</h2>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge key={subject.id} variant="outline" className="text-sm">
                    {subject.subject_name} - Ch. {subject.chapter_no}:{" "}
                    {subject.chapter_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedContent && (
          <>
            <ExamStructureForm
              examStructure={examStructure}
              onExamStructureChange={handleExamStructureChange}
              questionTypes={questionTypes} // Pass question types here
            />
            <Tabs
              value={generationMode}
              onValueChange={(value) =>
                setGenerationMode(value as "auto" | "manual")
              }
            >
              <TabsList>
                <TabsTrigger value="manual">Manual Generate</TabsTrigger>
                <TabsTrigger value="auto">Auto Generate</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <QuestionTypeSelector
                  questions={questions}
                  onSelectQuestions={handleQuestionSelect}
                  onSelectChapters={handleChapterSelect}
                  examStructure={examStructure}
                  onExamStructureChange={handleExamStructureChange}
                />
              </TabsContent>
              <TabsContent value="auto">
                <AutoGenerateForm
                  questions={questions}
                  examStructure={examStructure}
                  onAutoGenerate={handleAutoGenerate}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
        {selectedQuestions.length > 0 && (
          <ExamPreview
            selectedQuestions={selectedQuestions}
            examStructure={examStructure}
            onGeneratePdf={handleGeneratePdf}
          />
        )}
        {showPdfDownload && (
          <PdfDownload
            selectedQuestions={selectedQuestions}
            examStructure={examStructure}
            instituteName="Your Institute Name"
            standard={selectedContent?.class.toString() || ""}
            studentName="Student Name"
            subject={selectedContent?.name || ""}
            chapters={selectedChapters.map((ch) => ch.name).join(", ")}
            teacherName="Teacher Name"
          />
        )}
      </div>
    </div>
  );
}
