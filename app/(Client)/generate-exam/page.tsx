"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { ChapterSelector } from "@/components/ChapterSelector";
import { ExamStructureForm } from "@/components/ExamStructureForm";
import { ExamPreview } from "@/components/ExamPreview";
import { PdfDownload } from "@/components/PdfDownload";
import { AutoGenerateForm } from "@/components/AutoGenerateForm";
// import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/utils/supabase/client";
import { Content, Question, SelectedChapter, ExamStructure } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function GenerateExamPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [examStructure, setExamStructure] = useState<ExamStructure>({
    totalMarks: 100,
    sections: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [generationMode, setGenerationMode] = useState<"auto" | "manual">(
    "manual"
  );
  //const [questionTypes, setQuestionTypes] = useState<string[]>([]); //Removed as per update 3
  const { toast } = useToast();

  console.log(generationMode);

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data);
    } catch (error) {
      setError("Failed to fetch contents");
      toast({
        title: "Error",
        description: "Failed to fetch contents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

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
        const types = [...new Set(data.map((q: Question) => q.section_title))];
        const dynamicSections = types
          .filter((t): t is string => t !== null)
          .map((type, index) => ({
            name: String.fromCharCode(65 + index), // A, B, C, etc.
            questionType: type,
            totalMarks: 20, // Default value, can be adjusted
            marksPerQuestion: 0, // Default value, can be adjusted
            totalQuestions: 0, // Default value, can be adjusted
          }));
        setExamStructure({
          totalMarks: dynamicSections.reduce(
            (sum, section) => sum + section.totalMarks,
            0
          ),
          sections: dynamicSections,
        });
        //setQuestionTypes(types.filter((t): t is string => t !== null)); //Removed as per update 3
      } catch (error) {
        setError("Failed to fetch questions");
        toast({
          title: "Error",
          description:
            (error as Error).message ||
            "Failed to fetch questions. Please try again.",
          variant: "destructive",
        });
        // toast({
        //   title: "Error",
        //   description: "Failed to fetch questions. Please try again.",
        //   variant: "destructive",
        // });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        fetchQuestions(content.id);
      }
    },
    [selectedContent, fetchQuestions]
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
      // toast({
      //   title: "Error",
      //   description:
      //     "Please select at least one question before generating the PDF.",
      //   variant: "destructive",
      // });
      toast({
        title: "Error",
        description:
          // (error as Error).message ||
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Exam</h1>
      <div className="space-y-4">
        <ClassSelector
          contents={contents}
          onSelectContent={handleContentSelect}
          initialContent={selectedContent}
        />
        {selectedContent && (
          <>
            <ExamStructureForm
              examStructure={examStructure}
              onExamStructureChange={handleExamStructureChange}
              //questionTypes={questionTypes} //Removed as per update 3
            />
            <Tabs
              defaultValue="manual"
              onValueChange={(value) =>
                setGenerationMode(value as "auto" | "manual")
              }
            >
              <TabsList>
                <TabsTrigger value="manual">Manual Generate</TabsTrigger>
                <TabsTrigger value="auto">Auto Generate</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <ChapterSelector
                  questions={questions}
                  onSelectQuestions={handleQuestionSelect}
                  onSelectChapters={handleChapterSelect}
                  examStructure={examStructure}
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
