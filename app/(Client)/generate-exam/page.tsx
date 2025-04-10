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
  AlertCircle,
  Trash2,
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  User,
  Building,
  X,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useUser } from "@clerk/nextjs";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

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
  const [testTitle, setTestTitle] = useState<string>("Unit Test");
  const [examTime, setExamTime] = useState<string>("1 hour");
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [pdfFormat, setPdfFormat] = useState<
    "exam" | "examWithAnswer" | "material" | null
  >(null);
  const [examStructure, setExamStructure] = useState<ExamStructure>({
    subject: null,
    totalMarks: 100,
    sections: [],
  });
  const [chapterNo, setChapterNo] = useState<string>("");

  const { user } = useUser();
  const { toast } = useToast();
  const isBrowser = typeof window !== "undefined";

  console.log(selectedChapters);

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data || []);

      if (contentIdParam && data) {
        const contentId = Number.parseInt(contentIdParam);
        const content = data.find((c) => c.id === contentId);
        if (content) {
          setSelectedContent(content);
          await fetchSubjects(contentId);
          await fetchQuestions(contentId);
          setCurrentStep(2);
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

        const processedQuestions = data.map((q) => ({
          ...q,
          question: q.question || q.question_gu || "",
          answer: q.answer || q.answer_gu || {},
          question_images: q.question_images || q.question_images_gu || null,
          answer_images: q.answer_images || q.answer_images_gu || null,
        }));

        setQuestions(processedQuestions);
        return processedQuestions;
      } catch {
        toast({
          title: "Error",
          description: "Failed to load questions.",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!isBrowser) return;

    const loadInitialData = async () => {
      const savedQuestions = localStorage.getItem("selectedQuestions");
      if (savedQuestions) setSelectedQuestions(JSON.parse(savedQuestions));

      const savedContent = localStorage.getItem("selectedContent");
      const contentId = contentIdParam ? Number.parseInt(contentIdParam) : null;

      if (savedContent && !contentId) {
        const content = JSON.parse(savedContent);
        setSelectedContent(content);
        await fetchSubjects(content.id);
        await fetchQuestions(content.id);
      } else {
        await fetchContents();
      }
    };

    loadInitialData();
  }, [
    searchParams,
    contentIdParam,
    fetchContents,
    fetchQuestions,
    fetchSubjects,
    isBrowser,
  ]);

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

  useEffect(() => {
    if (selectedQuestions.length > 0) {
      const sections = [];

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
        setCurrentStep(2);
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

  const handleClearQuestions = useCallback(() => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "Info",
        description: "No questions are currently selected.",
      });
      return;
    }

    setSelectedQuestions([]);
    localStorage.removeItem("selectedQuestions");
    toast({
      title: "Success",
      description: "All selected questions have been cleared.",
    });
  }, [selectedQuestions, toast]);

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
      if (!chapterNo.trim()) {
        toast({
          title: "Error",
          description: "Chapter number is required.",
          variant: "destructive",
        });
        return;
      }
      setPdfFormat(format);
      setShowPdfDownload(true);
    },
    [selectedQuestions, chapterNo, toast]
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

  const handleQuickGeneratePdf = useCallback(() => {
    handleGeneratePdf("exam");
  }, [handleGeneratePdf]);

  const progress = (currentStep / 3) * 100;

  const contentSelectionStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
        <BookOpen className="mr-2 h-6 w-6" /> 1. Select Content
      </h2>
      <ClassSelector
        contents={contents}
        onSelectContent={handleContentSelect}
        initialContent={selectedContent}
      />
      {selectedContent && (
        <Button
          onClick={() => setStep(2)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const questionSelectionStep = (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleClearQuestions}
            variant="outline"
            className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear Questions
          </Button>
          {selectedQuestions.length > 0 && (
            <Button
              onClick={() => setStep(3)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
        <FileText className="mr-2 h-6 w-6" /> 2. Select Questions
      </h2>

      {selectedContent && subjects.length > 0 && (
        <Card className="shadow-md border-none">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center">
              <BookOpen className="mr-2 h-5 w-5" /> Available Subjects
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
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    Ch {subject.chapter_no} - {subject.chapter_name}
                    {subject.status ? (
                      <CheckCircle className="ml-1 h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="ml-1 h-3 w-3 text-red-600 dark:text-red-400" />
                    )}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuestions.length > 0 && (
        <Card className="shadow-md mb-4 border-none">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" /> Selected Questions
              Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <p className="text-sm font-medium">Total Questions</p>
                <p className="text-xl font-bold">{selectedQuestions.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <p className="text-sm font-medium">Total Marks</p>
                <p className="text-xl font-bold">{totalPaperMarks}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <p className="text-sm font-medium">Sections</p>
                <p className="text-xl font-bold">
                  {examStructure.sections.length}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded col-span-2">
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
                        className="bg-blue-50 dark:bg-blue-900"
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
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
        <FileText className="mr-2 h-6 w-6" /> 3. Preview and Generate
      </h2>
      <Button
        onClick={() => setStep(2)}
        variant="outline"
        className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50"
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
      </Button>

      {examStructure.sections.length === 0 ? (
        <div className="border border-yellow-200 dark:border-yellow-800 p-4 rounded-md flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/30">
          <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
              No questions selected
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Please go back and select questions to generate an exam paper.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar for Inputs */}
          <div className="lg:w-1/3 space-y-4">
            <Card className="shadow-md border-none">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  Exam Details
                </h3>
                <div>
                  <Label
                    htmlFor="chapterNo"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <BookOpen className="mr-2 h-4 w-4" /> Chapter Number
                    (Required)
                  </Label>
                  <Input
                    id="chapterNo"
                    value={chapterNo}
                    onChange={(e) => setChapterNo(e.target.value)}
                    placeholder="Enter chapter number"
                    className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="studentName"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <User className="mr-2 h-4 w-4" /> Student Name (Optional)
                  </Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                    className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="schoolName"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <Building className="mr-2 h-4 w-4" /> School Name (Optional)
                  </Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school name"
                    className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="testTitle"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Test Title
                  </Label>
                  <Input
                    id="testTitle"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Unit Test"
                    className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="examTime"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <Clock className="mr-2 h-4 w-4" /> Exam Time
                  </Label>
                  <Input
                    id="examTime"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    placeholder="1 hour"
                    className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Area with Generate Button */}
          <div className="lg:w-2/3">
            <Card className="shadow-md border-none">
              <CardContent className="p-4">
                <ExamPreview
                  selectedQuestions={selectedQuestions}
                  examStructure={examStructure}
                  onGeneratePdf={handleGeneratePdf}
                  isSectionWise={true}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => handleGeneratePdf("exam")}
                    className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                    disabled={!chapterNo.trim()}
                  >
                    Generate Exam Paper
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
          chapterNumber={chapterNo}
          chapters={chapterNo}
          teacherName={user?.fullName || "User"}
          isSectionWise={true}
          testTitle={testTitle}
          examTime={examTime}
        />
      )}
    </div>
  );

  if (isLoading && !contents.length)
    return <Loading title="Loading exam generation..." />;

  return (
    <div className="container mx-auto p-2 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400 flex items-center">
          <FileText className="mr-3 h-8 w-8" /> Generate Exam Paper
        </h1>
        <Progress
          value={progress}
          className="w-full bg-blue-200 dark:bg-blue-900"
        />
        <nav className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span
            className={
              currentStep === 1
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : ""
            }
          >
            1. Content
          </span>
          <span
            className={
              currentStep === 2
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : ""
            }
          >
            2. Questions
          </span>
          <span
            className={
              currentStep === 3
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : ""
            }
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

      <MobileBottomNav
        currentStep={currentStep}
        totalSteps={3}
        selectedQuestionsCount={selectedQuestions.length}
        totalMarks={totalPaperMarks}
        onPrevious={() => setStep(Math.max(1, currentStep - 1))}
        onNext={() => setStep(Math.min(3, currentStep + 1))}
        onClearQuestions={handleClearQuestions}
        onGeneratePdf={
          currentStep === 3 && examStructure.sections.length > 0
            ? handleQuickGeneratePdf
            : undefined
        }
        canGoNext={
          (currentStep === 1 && selectedContent !== null) ||
          (currentStep === 2 && selectedQuestions.length > 0) ||
          currentStep === 3
        }
        canGeneratePdf={
          currentStep === 3 &&
          examStructure.sections.length > 0 &&
          chapterNo.trim() !== ""
        }
      />
    </div>
  );
}
