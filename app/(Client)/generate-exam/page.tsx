"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  // RotateCcw,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useUser } from "@clerk/nextjs";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ClassSelector } from "@/components/ClassSelector";
import { ExamPreview } from "@/components/ExamPreview";
import { PdfDownload } from "@/components/PdfDownload";

export default function GenerateExamPage() {
  const searchParams = useSearchParams();
  const contentIdParam = searchParams.get("contentId");

  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(() =>
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("selectedContent") || "null")
      : null
  );
  const [totalPaperMarks, setTotalPaperMarks] = useState<number>(100);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>(() =>
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("selectedQuestions") || "[]")
      : []
  );
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
  const [showAnswers, setShowAnswers] = useState(false);

  const { user } = useUser();
  const { toast } = useToast();

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
          question: q.question || "",
          answer: q.answer || {},
          question_images: q.question_images || null,
          answer_images: q.answer_images || null,
          question_gu: q.question_gu || "",
          answer_gu: q.answer_gu || {},
          question_images_gu: q.question_images_gu || null,
          answer_images_gu: q.answer_images_gu || null,
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
    fetchContents();
  }, [fetchContents]);

  useEffect(() => {
    localStorage.setItem(
      "selectedQuestions",
      JSON.stringify(selectedQuestions)
    );
    if (selectedContent) {
      localStorage.setItem("selectedContent", JSON.stringify(selectedContent));
    }
  }, [selectedQuestions, selectedContent]);

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
        totalMarks,
        sections,
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
        toast({
          title: "Content Selected",
          description: `Selected ${content.name} for exam generation.`,
        });
      }
    },
    [selectedContent, fetchSubjects, fetchQuestions, toast]
  );

  const handleQuestionSelect = useCallback((questions: Question[]) => {
    setSelectedQuestions(questions);
  }, []);

  const handleChapterSelect = useCallback((chapters: SelectedChapter[]) => {
    setSelectedChapters(chapters);
  }, []);

  const handleClearQuestions = useCallback(() => {
    setSelectedQuestions([]);
    localStorage.removeItem("selectedQuestions");
    toast({
      title: "Questions Cleared",
      description: "All selected questions have been cleared.",
    });
  }, [toast]);

  const handleResetForm = useCallback(() => {
    setSelectedQuestions([]);
    setSelectedChapters([]);
    setStudentName("");
    setSchoolName("");
    setTestTitle("Unit Test");
    setExamTime("1 hour");
    setChapterNo("");
    localStorage.removeItem("selectedQuestions");
    setCurrentStep(1);
    setSelectedContent(null);
    toast({
      title: "Form Reset",
      description: "All inputs have been reset.",
    });
  }, [toast]);

  const handleGeneratePdf = useCallback(
    (format: "exam" | "examWithAnswer" | "material") => {
      if (!chapterNo.trim()) {
        toast({
          title: "Missing Chapter Number",
          description: "Please enter a chapter number to generate the PDF.",
          variant: "destructive",
        });
        return;
      }
      setPdfFormat(format);
      setShowPdfDownload(true);
      toast({
        title: "PDF Generation Started",
        description: `Generating ${format} PDF...`,
      });
    },
    [chapterNo, toast]
  );

  const handleQuickGeneratePdf = useCallback(() => {
    handleGeneratePdf("exam");
  }, [handleGeneratePdf]);

  const toggleAnswers = useCallback(() => {
    setShowAnswers((prev) => {
      const newState = !prev;
      toast({
        title: newState ? "Answers Shown" : "Answers Hidden",
        description: newState
          ? "Answers are now visible in the preview."
          : "Answers are now hidden in the preview.",
      });
      return newState;
    });
  }, [toast]);

  const setStep = useCallback(
    (step: number) => {
      if (step < 1 || step > 3) return;
      setCurrentStep(step);
      toast({
        title: "Step Changed",
        description: `Moved to step ${step}: ${
          step === 1 ? "Content" : step === 2 ? "Questions" : "Preview"
        }.`,
      });
    },
    [toast]
  );

  const progress = (currentStep / 3) * 100;

  const contentSelectionStep = (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
        <BookOpen className="mr-2 h-6 w-6" /> 1. Select Content
      </h2>
      <ClassSelector
        contents={contents}
        onSelectContent={handleContentSelect}
        initialContent={selectedContent}
      />
      <Button
        onClick={() => setStep(2)}
        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
      >
        Next <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );

  const questionSelectionStep = (
    <div className="space-y-6 pb-20 flex flex-col justify-center max-w-sm lg:max-w-3xl box-border">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="w-full sm:w-auto h-12 text-base border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Previous
        </Button>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleClearQuestions}
            variant="outline"
            className="w-full sm:w-auto h-12 text-base border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 className="mr-2 h-5 w-5" /> Clear Questions
          </Button>
          <Button
            onClick={() => setStep(3)}
            className="w-full sm:w-auto h-12 text-base bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Next <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
        <FileText className="mr-2 h-6 w-6" /> 2. Select Questions
      </h2>

      {selectedContent && subjects.length > 0 && (
        <Card className="shadow-md border-none">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center">
              <BookOpen className="mr-2 h-5 w-5" /> Available Subjects
            </h3>
            <div className="flex flex-wrap gap-2 ">
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
                    } text-sm py-1 px-2 max-w-[150px] truncate`}
                    title={subject.chapter_name}
                  >
                    Ch {subject.chapter_no} - {subject.chapter_name}
                    {subject.status ? (
                      <CheckCircle className="ml-1 h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="ml-1 h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuestions.length > 0 && (
        <Card className="shadow-md mb-4 border-none">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" /> Selected Questions
              Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Questions
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedQuestions.length}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Marks
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {totalPaperMarks}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sections
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {examStructure.sections.length}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Marks Distribution
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((mark) => {
                    const count = selectedQuestions.filter(
                      (q) => q.marks === mark
                    ).length;
                    return count > 0 ? (
                      <Badge
                        key={mark}
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
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

      <div className="w-full overflow-x-auto">
        <QuestionSelector
          questions={questions}
          onSelectQuestions={handleQuestionSelect}
          onSelectChapters={handleChapterSelect}
          selectedQuestions={selectedQuestions}
        />
      </div>
    </div>
  );

  const previewAndGenerateStep = (
    <div className="space-y-6 p-1 pb-20 md:pb-4">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
        <FileText className="mr-2 h-6 w-6" /> 3. Preview and Generate
      </h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => setStep(2)}
          variant="outline"
          className="w-full sm:w-auto h-12 text-base border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Previous
        </Button>
        <Button
          onClick={toggleAnswers}
          variant="outline"
          className="w-full sm:w-auto h-12 text-base border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <BookOpen className="mr-2 h-5 w-5" />{" "}
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </Button>
      </div>

      {examStructure.sections.length === 0 ? (
        <div className="border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/30">
          <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
              No questions selected
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Select questions in the previous step to generate an exam paper.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 space-y-4">
            <Card className="shadow-md border-none">
              <CardContent className="p-4 sm:p-6 space-y-4">
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
                    className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
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
                    className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
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
                    className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
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
                    className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
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
                    className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-700 dark:focus:border-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:w-2/3">
            <Card className="shadow-md border-none">
              <CardContent className="p-4 sm:p-6">
                <ExamPreview
                  selectedQuestions={selectedQuestions}
                  examStructure={examStructure}
                  onGeneratePdf={handleGeneratePdf}
                  isSectionWise={true}
                  showAnswers={showAnswers}
                />
                <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-end">
                  <Button
                    onClick={() => handleGeneratePdf("exam")}
                    className="h-12 text-base bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                    disabled={!chapterNo.trim()}
                  >
                    Generate Exam Paper
                  </Button>
                  <Button
                    onClick={() => handleGeneratePdf("examWithAnswer")}
                    className="h-12 text-base bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                    disabled={!chapterNo.trim()}
                  >
                    Generate with Answers
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400 flex items-center">
          <FileText className="mr-3 h-8 w-8" /> Generate Exam Paper
        </h1>
        <Progress
          value={progress}
          className="w-full h-2 bg-blue-200 dark:bg-blue-900"
        />
        <nav className="flex justify-between mt-3 text-sm text-gray-600 dark:text-gray-400">
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
      <main className="space-y-6">
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
        onGeneratePdf={currentStep === 3 ? handleQuickGeneratePdf : undefined}
        onResetForm={handleResetForm}
        onToggleAnswers={toggleAnswers}
        canGoNext={true}
        canGeneratePdf={currentStep === 3 && chapterNo.trim() !== ""}
      />
    </div>
  );
}
