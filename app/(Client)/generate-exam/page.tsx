"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ClassSelector } from "@/components/ClassSelector";
import { ExamPreview } from "@/components/ExamPreview";
import { PdfDownload } from "@/components/PdfDownload";
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
import { QuestionSelector } from "@/components/QuestionTypeSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useUser } from "@clerk/nextjs";

export default function GenerateExamPage() {
  const searchParams = useSearchParams();
  const contentIdParam = searchParams.get("contentId");

  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [totalPaperMarks, setTotalPaperMarks] = useState<number>(100);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [studentName, setStudentName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(10);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [pdfFormat, setPdfFormat] = useState<
    "exam" | "examWithAnswer" | "material" | null
  >(null);
  const [pagePadding, setPagePadding] = useState<number>(5);
  const [sectionMargin, setSectionMargin] = useState<number>(5);
  const [sectionPadding, setSectionPadding] = useState<number>(5);
  const [questionSpacing, setQuestionSpacing] = useState<number>(10);
  const [questionLeftMargin, setQuestionLeftMargin] = useState<number>(10);
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);
  const [examStructure, setExamStructure] = useState<ExamStructure>({
    subject: null,
    totalMarks: 100,
    sections: [],
  });

  const { user } = useUser();
  const { toast } = useToast();
  const isBrowser = typeof window !== "undefined";

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data);

      // If contentId is provided in URL, select that content
      if (contentIdParam && data) {
        const contentId = parseInt(contentIdParam);
        const content = data.find((c) => c.id === contentId);
        if (content) {
          setSelectedContent(content);
          fetchSubjects(contentId);
          fetchQuestions(contentId);
          setCurrentStep(2); // Skip to question selection
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contents.",
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [toast, contentIdParam]);

  const fetchSubjects = useCallback(
    async (contentId: number) => {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .eq("content_id", contentId);
        if (error) throw error;
        setSubjects(data || []);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load subjects.",
          variant: "destructive",
        });
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

        // Process questions to use question_gu when main question is empty
        const processedQuestions = data.map((q) => ({
          ...q,
          question: q.question || q.question_gu || "",
          answer: q.answer || q.answer_gu || {},
          question_images: q.question_images || q.question_images_gu || null,
          answer_images: q.answer_images || q.answer_images_gu || null,
        }));

        setQuestions(processedQuestions);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load questions.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Load initial state from localStorage only on client-side mount
  useEffect(() => {
    if (isBrowser) {
      const savedQuestions = localStorage.getItem("selectedQuestions");
      if (savedQuestions) setSelectedQuestions(JSON.parse(savedQuestions));

      const savedContent = localStorage.getItem("selectedContent");
      if (savedContent && !contentIdParam) {
        const content = JSON.parse(savedContent);
        setSelectedContent(content);
        fetchSubjects(content.id);
        fetchQuestions(content.id);
      }
    }
    fetchContents();
  }, [fetchContents, fetchSubjects, fetchQuestions, isBrowser, contentIdParam]);

  // Save state to localStorage on change
  useEffect(() => {
    if (isBrowser) {
      localStorage.setItem(
        "selectedQuestions",
        JSON.stringify(selectedQuestions)
      );
      if (selectedContent) {
        localStorage.setItem(
          "selectedContent",
          JSON.stringify(selectedContent)
        );
      }
    }
  }, [selectedQuestions, selectedContent, isBrowser]);

  // Generate exam structure based on selected questions
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      // Group questions by marks
      // const questionsByMarks = selectedQuestions.reduce((acc, q) => {
      //   const marks = q.marks;
      //   if (!acc[marks]) acc[marks] = [];
      //   acc[marks].push(q);
      //   return acc;
      // }, {} as Record<number, Question[]>);

      // Create sections based on marks
      const sections = [];

      // Section A: MCQs and 1 mark questions
      const mcqsAndOneMarks = selectedQuestions.filter(
        (q) => q.type === "MCQ" || q.marks === 1
      );
      if (mcqsAndOneMarks.length > 0) {
        sections.push({
          name: "A",
          questionType: "MCQ/Short Answer",
          totalQuestions: mcqsAndOneMarks.length,
          marksPerQuestion: 1,
          totalMarks: mcqsAndOneMarks.reduce((sum, q) => sum + q.marks, 0),
          questions: mcqsAndOneMarks,
        });
      }

      // Section B: 2 marks questions
      const twoMarksQuestions = selectedQuestions.filter((q) => q.marks === 2);
      if (twoMarksQuestions.length > 0) {
        sections.push({
          name: "B",
          questionType: "Short Answer",
          totalQuestions: twoMarksQuestions.length,
          marksPerQuestion: 2,
          totalMarks: twoMarksQuestions.length * 2,
          questions: twoMarksQuestions,
        });
      }

      // Section C: 3 marks questions
      const threeMarksQuestions = selectedQuestions.filter(
        (q) => q.marks === 3
      );
      if (threeMarksQuestions.length > 0) {
        sections.push({
          name: "C",
          questionType: "Medium Answer",
          totalQuestions: threeMarksQuestions.length,
          marksPerQuestion: 3,
          totalMarks: threeMarksQuestions.length * 3,
          questions: threeMarksQuestions,
        });
      }

      // Section D: 4 marks questions
      const fourMarksQuestions = selectedQuestions.filter((q) => q.marks === 4);
      if (fourMarksQuestions.length > 0) {
        sections.push({
          name: "D",
          questionType: "Long Answer",
          totalQuestions: fourMarksQuestions.length,
          marksPerQuestion: 4,
          totalMarks: fourMarksQuestions.length * 4,
          questions: fourMarksQuestions,
        });
      }

      // Section E: 5 marks questions
      const fiveMarksQuestions = selectedQuestions.filter((q) => q.marks === 5);
      if (fiveMarksQuestions.length > 0) {
        sections.push({
          name: "E",
          questionType: "Long Answer",
          totalQuestions: fiveMarksQuestions.length,
          marksPerQuestion: 5,
          totalMarks: fiveMarksQuestions.length * 5,
          questions: fiveMarksQuestions,
        });
      }

      // Calculate total marks
      const totalMarks = sections.reduce(
        (sum, section) => sum + section.totalMarks,
        0
      );

      setExamStructure({
        subject: selectedContent?.name || null,
        totalMarks: totalMarks,
        sections: sections,
      });

      setTotalPaperMarks(totalMarks);
    } else {
      setExamStructure({
        subject: selectedContent?.name || null,
        totalMarks: 0,
        sections: [],
      });
    }
  }, [selectedQuestions, selectedContent]);

  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        fetchSubjects(content.id);
        fetchQuestions(content.id);
        setCurrentStep(2); // Skip to question selection
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

  const handleGeneratePdf = useCallback(
    (format: "exam" | "examWithAnswer" | "material") => {
      if (selectedQuestions.length === 0) {
        toast({
          title: "Error",
          description: "Select at least one question to generate the PDF.",
          variant: "destructive",
        });
        return;
      }
      setPdfFormat(format);
      setShowPdfDownload(true);
    },
    [selectedQuestions, toast]
  );

  const setStep = useCallback(
    (step: number) => {
      if (step < 1 || step > 3) return;
      if (step > 1 && !selectedContent) {
        toast({
          title: "Step Required",
          description: "Please select a content first.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(step);
    },
    [selectedContent, toast]
  );

  const progress = (currentStep / 3) * 100;

  const contentSelectionStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-blue-600">
        1. Select Content
      </h2>
      <ClassSelector
        contents={contents}
        onSelectContent={handleContentSelect}
        initialContent={selectedContent}
      />
      {selectedContent && (
        <Button
          onClick={() => setStep(2)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const questionSelectionStep = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {selectedQuestions.length > 0 && (
          <Button
            onClick={() => setStep(3)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-blue-600">
        2. Select Questions
      </h2>

      {selectedContent && subjects.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-blue-600 mb-3">
              Available Subjects
            </h3>
            <div className="flex flex-wrap gap-2">
              {subjects
                .sort((a, b) => a.chapter_no - b.chapter_no)
                .map((subject) => (
                  <Badge
                    key={subject.id}
                    variant="secondary"
                    className={`${
                      subject.status
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Ch {subject.chapter_no} - {subject.chapter_name}
                    {subject.status ? (
                      <span className="ml-1 text-green-600">✓</span>
                    ) : (
                      <span className="ml-1 text-red-600">✗</span>
                    )}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuestions.length > 0 && (
        <Card className="bg-white shadow-md mb-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-blue-600 mb-2">
              Selected Questions Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Total Questions</p>
                <p className="text-xl font-bold">{selectedQuestions.length}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Total Marks</p>
                <p className="text-xl font-bold">{totalPaperMarks}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Sections</p>
                <p className="text-xl font-bold">
                  {examStructure.sections.length}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded col-span-2">
                <p className="text-sm font-medium">Marks Distribution</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((mark) => {
                    const count = selectedQuestions.filter(
                      (q) => q.marks === mark
                    ).length;
                    return count > 0 ? (
                      <Badge
                        key={mark}
                        variant="outline"
                        className="bg-blue-50"
                      >
                        {mark} mark: {count}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <QuestionSelector
        questions={questions}
        onSelectQuestions={handleQuestionSelect}
        onSelectChapters={handleChapterSelect}
        selectedQuestions={selectedQuestions}

      />
    </div>
  );

  const previewAndGenerateStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-blue-600">
        3. Preview and Generate
      </h2>
      <Button
        onClick={() => setStep(2)}
        variant="outline"
        className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
      </Button>

      {examStructure.sections.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">
              No questions selected
            </h4>
            <p className="text-sm text-yellow-700">
              Please go back and select questions to generate an exam paper.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Label
          htmlFor="studentName"
          className="text-sm font-medium text-gray-700"
        >
          Student Name (Optional)
        </Label>
        <Input
          id="studentName"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Enter student name"
          className="w-full sm:w-64 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Label
          htmlFor="schoolName"
          className="text-sm font-medium text-gray-700"
        >
          School Name (Optional)
        </Label>
        <Input
          id="schoolName"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="Enter school name"
          className="w-full sm:w-64 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-4">
        <Button
          onClick={() => setShowPdfSettings(!showPdfSettings)}
          variant="outline"
          className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center justify-center"
        >
          {showPdfSettings ? "Hide PDF Settings" : "Show PDF Settings"}
          {showPdfSettings ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>
        {showPdfSettings && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fontSize" className="text-gray-700">
                Font Size (pt)
              </Label>
              <Input
                id="fontSize"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={8}
                max={20}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="pagePadding" className="text-gray-700">
                Page Padding (pt)
              </Label>
              <Input
                id="pagePadding"
                type="number"
                value={pagePadding}
                onChange={(e) => setPagePadding(Number(e.target.value))}
                min={0}
                max={50}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="sectionMargin" className="text-gray-700">
                Section Margin (pt)
              </Label>
              <Input
                id="sectionMargin"
                type="number"
                value={sectionMargin}
                onChange={(e) => setSectionMargin(Number(e.target.value))}
                min={0}
                max={50}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="sectionPadding" className="text-gray-700">
                Section Padding (pt)
              </Label>
              <Input
                id="sectionPadding"
                type="number"
                value={sectionPadding}
                onChange={(e) => setSectionPadding(Number(e.target.value))}
                min={0}
                max={50}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="questionSpacing" className="text-gray-700">
                Question Spacing (pt)
              </Label>
              <Input
                id="questionSpacing"
                type="number"
                value={questionSpacing}
                onChange={(e) => setQuestionSpacing(Number(e.target.value))}
                min={0}
                max={50}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="questionLeftMargin" className="text-gray-700">
                Question Left Margin (pt)
              </Label>
              <Input
                id="questionLeftMargin"
                type="number"
                value={questionLeftMargin}
                onChange={(e) => setQuestionLeftMargin(Number(e.target.value))}
                min={0}
                max={50}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {examStructure.sections.length > 0 && (
        <>
          <ExamPreview
            selectedQuestions={selectedQuestions}
            examStructure={examStructure}
            onGeneratePdf={handleGeneratePdf}
            isSectionWise={true}
          />
          {showPdfDownload && (
            <PdfDownload
              format={pdfFormat!}
              selectedQuestions={selectedQuestions}
              examStructure={examStructure}
              instituteName={siteConfig.name}
              standard={selectedContent?.class.toString() || ""}
              schoolName={schoolName}
              studentName={studentName}
              subject={selectedContent?.name || ""}
              chapters={selectedChapters.map((ch) => ch.chapterNo).join(", ")}
              teacherName={user?.fullName || "User"}
              isSectionWise={true}
              fontSize={fontSize}
              pagePadding={pagePadding}
              sectionMargin={sectionMargin}
              sectionPadding={sectionPadding}
              questionSpacing={questionSpacing}
              questionLeftMargin={questionLeftMargin}
            />
          )}
        </>
      )}
    </div>
  );

  if (isLoading && !contents.length)
    return <Loading title="Loading exam generation..." />;

  return (
    <div className="container mx-auto p-2 sm:p-2 max-w-5xl bg-gray-50">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">
          Generate Exam Paper
        </h1>
        <Progress value={progress} className="w-full bg-blue-200" />
        <nav className="flex justify-between mt-2 text-sm text-gray-600">
          <span
            className={currentStep === 1 ? "font-semibold text-blue-600" : ""}
          >
            1. Content
          </span>
          <span
            className={currentStep === 2 ? "font-semibold text-blue-600" : ""}
          >
            2. Questions
          </span>
          <span
            className={currentStep === 3 ? "font-semibold text-blue-600" : ""}
          >
            3. Preview
          </span>
        </nav>
      </header>
      <main className="space-y-4">
        {currentStep === 1 && contentSelectionStep}
        {currentStep === 2 && questionSelectionStep}
        {currentStep === 3 && previewAndGenerateStep}
      </main>
    </div>
  );
}
