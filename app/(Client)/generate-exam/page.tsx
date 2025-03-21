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
import { QuestionSelector } from "@/components/QuestionTypeSelector"; // Assuming typo; should be QuestionSelector
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function GenerateExamPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [totalPaperMarks, setTotalPaperMarks] = useState<number>(100);
  const [examStructure, setExamStructure] = useState<ExamStructure>({
    totalMarks: 100,
    sections: [],
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
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [studentName, setStudentName] = useState<string>(""); // New state for student name
  const [fontSize, setFontSize] = useState<number>(11); // New state for font size, default 11pt

  const { toast } = useToast();

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

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        setExamStructure({ totalMarks: totalPaperMarks, sections: [] });
        fetchSubjects(content.id);
        fetchQuestions(content.id);
      }
    },
    [selectedContent, fetchSubjects, fetchQuestions, totalPaperMarks]
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

  const handleGeneratePdf = useCallback(() => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Select at least one question to generate the PDF.",
        variant: "destructive",
      });
      return;
    }
    setShowPdfDownload(true);
  }, [selectedQuestions, toast]);

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
      setCurrentStep(step);
    },
    [selectedContent, examStructure.sections, toast]
  );

  const assignedMarks = examStructure.sections.reduce(
    (sum, section) => sum + section.totalMarks,
    0
  );
  const remainingMarks = totalPaperMarks - assignedMarks;
  const progress = (currentStep / 4) * 100;

  const contentSelectionStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">1. Select Content</h2>
      <ClassSelector
        contents={contents}
        onSelectContent={handleContentSelect}
        initialContent={selectedContent}
      />
      {selectedContent && (
        <Button onClick={() => setStep(2)} className="w-full sm:w-full">
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
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {examStructure.sections.length > 0 && (
          <Button onClick={() => setStep(3)} className="w-full sm:w-auto">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <h2 className="text-2xl font-semibold">2. Define Exam Structure</h2>
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paperMarks">Total Paper Marks</Label>
              <Input
                id="paperMarks"
                type="number"
                min="1"
                max="100"
                value={totalPaperMarks}
                onChange={(e) =>
                  handlePaperMarksChange(Number.parseInt(e.target.value) || 1)
                }
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Badge
                variant={remainingMarks >= 0 ? "outline" : "destructive"}
                className="w-full justify-center"
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
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {selectedQuestions.length > 0 && (
          <Button onClick={() => setStep(4)} className="w-full sm:w-auto">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <h2 className="text-2xl font-semibold">3. Select Questions</h2>
      {selectedContent && subjects.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-3">Available Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {subjects
                .sort((a, b) => a.chapter_no - b.chapter_no)
                .map((subject) => (
                  <Badge
                    key={subject.id}
                    variant="secondary"
                    className="text-sm"
                  >
                    Ch {subject.chapter_no} - {subject.chapter_name}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-medium">Select a Section</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examStructure.sections.map((section, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  currentSectionIndex === index
                    ? "border-2 border-primary shadow-md"
                    : "hover:shadow-sm"
                }`}
                onClick={() => handleSectionSelect(index)}
              >
                <CardContent className="p-4">
                  <h4 className="text-lg font-medium">
                    Section {section.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {section.questionType}
                  </p>
                  <p className="text-sm">
                    Marks/Question: {section.marksPerQuestion}
                  </p>
                  <p className="text-sm">
                    Total Questions: {section.totalQuestions}
                  </p>
                  <p className="text-sm">Total Marks: {section.totalMarks}</p>
                  <Badge variant="outline" className="mt-2">
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
        onNext={selectedQuestions.length > 0 ? () => setStep(4) : undefined}
        onPrevious={() => setStep(2)}
      />
    </div>
  );

  const previewAndGenerateStep = (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">4. Preview and Generate</h2>
      <Button
        onClick={() => setStep(3)}
        variant="outline"
        className="w-full sm:w-auto"
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
      {/* Student Name Input */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Label htmlFor="studentName" className="text-sm font-medium">
          Student Name (Optional)
        </Label>
        <Input
          id="studentName"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Enter student name"
          className="w-full sm:w-64"
        />
      </div>
      {/* Font Size Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Label className="text-sm font-medium">Font Size: {fontSize}pt</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFontSize((prev) => Math.max(8, prev - 1))} // Min 8pt
            className="w-10"
          >
            -
          </Button>
          <Button
            variant="outline"
            onClick={() => setFontSize((prev) => Math.min(16, prev + 1))} // Max 16pt
            className="w-10"
          >
            +
          </Button>
        </div>
      </div>
      <ExamPreview
        selectedQuestions={selectedQuestions}
        examStructure={examStructure}
        onGeneratePdf={handleGeneratePdf}
        isSectionWise={true}
      />
      {showPdfDownload && (
        <PdfDownload
          selectedQuestions={selectedQuestions}
          examStructure={examStructure}
          instituteName={siteConfig.name}
          standard={selectedContent?.class.toString() || ""}
          studentName={studentName} // Pass student name
          subject={selectedContent?.name || ""}
          chapters={selectedChapters.map((ch) => ch.chapterNo).join(", ")} // Pass chapter numbers
          teacherName={""}
          isSectionWise={true}
          fontSize={fontSize} // Pass font size
        />
      )}
    </div>
  );

  if (isLoading && !contents.length) {
    return <Loading title="Loading exam generation..." />;
  }

  return (
    <div className="container mx-auto p-2 sm:p-2 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Generate Exam Paper</h1>
        <Progress value={progress} className="w-full" />
        <nav className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span
            className={currentStep === 1 ? "font-semibold text-primary" : ""}
          >
            1. Content
          </span>
          <span
            className={currentStep === 2 ? "font-semibold text-primary" : ""}
          >
            2. Structure
          </span>
          <span
            className={currentStep === 3 ? "font-semibold text-primary" : ""}
          >
            3. Questions
          </span>
          <span
            className={currentStep === 4 ? "font-semibold text-primary" : ""}
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
