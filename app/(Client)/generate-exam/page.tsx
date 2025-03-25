"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { ExamStructureForm } from "@/components/ExamStructureForm";
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
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useUser } from "@clerk/nextjs";

export default function GenerateExamPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [totalPaperMarks, setTotalPaperMarks] = useState<number>(100);
  const [examStructure, setExamStructure] = useState<ExamStructure>({
    subject: null,
    totalMarks: 100,
    sections: [
      {
        name: "A",
        questionType: "MCQ",
        totalQuestions: 5,
        marksPerQuestion: 2,
        totalMarks: 10,
      },
    ],
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(
    null
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

  const { user } = useUser();
  const { toast } = useToast();
  const isBrowser = typeof window !== "undefined";

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data);
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
  }, [toast]);

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
        setQuestions(data);
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
      const savedStructure = localStorage.getItem("examStructure");
      if (savedStructure) setExamStructure(JSON.parse(savedStructure));

      const savedQuestions = localStorage.getItem("selectedQuestions");
      if (savedQuestions) setSelectedQuestions(JSON.parse(savedQuestions));

      const savedStep = localStorage.getItem("currentStep");
      if (savedStep) setCurrentStep(Number(savedStep));

      const savedContent = localStorage.getItem("selectedContent");
      if (savedContent) {
        const content = JSON.parse(savedContent);
        setSelectedContent(content);
        fetchSubjects(content.id);
        fetchQuestions(content.id);
      }
    }
    fetchContents();
  }, [fetchContents, fetchSubjects, fetchQuestions, isBrowser]);

  // Save state to localStorage on change
  useEffect(() => {
    if (isBrowser) {
      localStorage.setItem("examStructure", JSON.stringify(examStructure));
      localStorage.setItem(
        "selectedQuestions",
        JSON.stringify(selectedQuestions)
      );
      localStorage.setItem("currentStep", currentStep.toString());
      if (selectedContent) {
        localStorage.setItem(
          "selectedContent",
          JSON.stringify(selectedContent)
        );
      }
    }
  }, [
    examStructure,
    selectedQuestions,
    currentStep,
    selectedContent,
    isBrowser,
  ]);

  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        setExamStructure({
          subject: content.name,
          totalMarks: totalPaperMarks,
          sections: examStructure.sections,
        });
        fetchSubjects(content.id);
        fetchQuestions(content.id);
      }
    },
    [
      selectedContent,
      fetchSubjects,
      fetchQuestions,
      totalPaperMarks,
      examStructure.sections,
    ]
  );

  const handlePaperMarksChange = useCallback((marks: number) => {
    const newMarks = Math.max(1, Math.min(100, marks));
    setTotalPaperMarks(newMarks);
    setExamStructure((prev) => ({ ...prev, totalMarks: newMarks }));
  }, []);

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

  const handleSectionSelect = useCallback((index: number) => {
    setCurrentSectionIndex(index);
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
      if (step < 1 || step > 4) return;
      if (step > 1 && !selectedContent) {
        toast({
          title: "Step Required",
          description: "Please select a content first.",
          variant: "destructive",
        });
        return;
      }
      if (step > 2 && examStructure.sections.length === 0) {
        toast({
          title: "Step Required",
          description: "Define at least one section first.",
          variant: "destructive",
        });
        return;
      }
      if (step === 3 && currentSectionIndex === null) setCurrentSectionIndex(0);
      setCurrentStep(step);
    },
    [selectedContent, examStructure.sections, toast, currentSectionIndex]
  );

  const assignedMarks = examStructure.sections.reduce(
    (sum, section) => sum + section.totalMarks,
    0
  );
  const remainingMarks = totalPaperMarks - assignedMarks;
  const progress = (currentStep / 4) * 100;

  const contentSelectionStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-indigo-600">
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const examStructureStep = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {examStructure.sections.length > 0 && (
          <Button
            onClick={() => setStep(3)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-indigo-600">
        2. Define Exam Structure
      </h2>
      <Card className="bg-white shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paperMarks" className="text-gray-700">
                Total Paper Marks
              </Label>
              <Input
                id="paperMarks"
                type="number"
                min="0"
                max="80"
                value={totalPaperMarks}
                onChange={(e) =>
                  handlePaperMarksChange(Number.parseInt(e.target.value) || 1)
                }
                className="mt-1 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <Badge
                variant={remainingMarks >= 0 ? "outline" : "destructive"}
                className={`w-full justify-center ${
                  remainingMarks >= 0 ? "border-indigo-600 text-indigo-600" : ""
                }`}
              >
                Remaining Marks: {remainingMarks}
              </Badge>
            </div>
          </div>
          <ExamStructureForm
            examStructure={examStructure}
            onExamStructureChange={handleExamStructureChange}
            totalPaperMarks={totalPaperMarks}
            allowCustomQuestionTypes={true}
          />
        </CardContent>
      </Card>
    </div>
  );

  const questionSelectionStep = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          onClick={() => setStep(2)}
          variant="outline"
          className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {selectedQuestions.length > 0 && (
          <Button
            onClick={() => setStep(4)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-indigo-600">
        3. Select Questions
      </h2>
      {selectedContent && subjects.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-indigo-600 mb-3">
              Available Subjects
            </h3>
            <div className="flex flex-wrap gap-2">
              {subjects
                .sort((a, b) => a.chapter_no - b.chapter_no)
                .map((subject) => (
                  <Badge
                    key={subject.id}
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-800"
                  >
                    Ch {subject.chapter_no} - {subject.chapter_name}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="bg-white shadow-md">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-medium text-indigo-600">
            Select a Section
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examStructure.sections.map((section, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  currentSectionIndex === index
                    ? "border-2 border-indigo-600 shadow-md"
                    : "hover:shadow-sm border border-gray-200"
                }`}
                onClick={() => handleSectionSelect(index)}
              >
                <CardContent className="p-4">
                  <h4 className="text-lg font-medium text-indigo-600">
                    Section {section.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {section.questionType}
                  </p>
                  <p className="text-sm text-gray-600">
                    Marks/Question: {section.marksPerQuestion}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Questions: {section.totalQuestions}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Marks: {section.totalMarks}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-2 border-indigo-600 text-indigo-600"
                  >
                    {
                      selectedQuestions.filter((q) => q.sectionId === index)
                        .length
                    }{" "}
                    selected
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <QuestionSelector
        questions={questions}
        onSelectQuestions={handleQuestionSelect}
        onSelectChapters={handleChapterSelect}
        examStructure={examStructure}
        onExamStructureChange={handleExamStructureChange}
        currentSection={
          currentSectionIndex !== null
            ? examStructure.sections[currentSectionIndex]
            : null
        }
        currentSectionIndex={currentSectionIndex}
        selectedQuestions={selectedQuestions}
        showAllQuestions={false}
      />
    </div>
  );

  const previewAndGenerateStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-indigo-600">
        4. Preview and Generate
      </h2>
      <Button
        onClick={() => setStep(3)}
        variant="outline"
        className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
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
          className="w-full sm:w-64 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
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
          className="w-full sm:w-64 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div className="space-y-4">
        <Button
          onClick={() => setShowPdfSettings(!showPdfSettings)}
          variant="outline"
          className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center"
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
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
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
    </div>
  );

  if (isLoading && !contents.length)
    return <Loading title="Loading exam generation..." />;

  return (
    <div className="container mx-auto p-2 sm:p-2 max-w-5xl bg-gray-50">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-indigo-600">
          Generate Exam Paper
        </h1>
        <Progress value={progress} className="w-full bg-indigo-200" />
        <nav className="flex justify-between mt-2 text-sm text-gray-600">
          <span
            className={currentStep === 1 ? "font-semibold text-indigo-600" : ""}
          >
            1. Content
          </span>
          <span
            className={currentStep === 2 ? "font-semibold text-indigo-600" : ""}
          >
            2. Structure
          </span>
          <span
            className={currentStep === 3 ? "font-semibold text-indigo-600" : ""}
          >
            3. Questions
          </span>
          <span
            className={currentStep === 4 ? "font-semibold text-indigo-600" : ""}
          >
            4. Preview
          </span>
        </nav>
      </header>
      <main className="space-y-4">
        {currentStep === 1 && contentSelectionStep}
        {currentStep === 2 && examStructureStep}
        {currentStep === 3 && questionSelectionStep}
        {currentStep === 4 && previewAndGenerateStep}
      </main>
    </div>
  );
}
