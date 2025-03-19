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
import { QuestionTypeSelector } from "@/components/QuestionTypeSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function GenerateExamPage() {
  // Step 1: Content Selection
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // Step 2: Paper Marks
  const [totalPaperMarks, setTotalPaperMarks] = useState<number>(100);

  // Step 3: Generation Method
  const [generationMode, setGenerationMode] = useState<"auto" | "manual">(
    "manual"
  );

  // Step 4: Paper Type
  const [isSectionWise, setIsSectionWise] = useState<boolean>(true);

  // Step 5 & 6: Section Definition and Question Selection
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [examStructure, setExamStructure] = useState<ExamStructure>({
    totalMarks: 100,
    sections: [],
  });

  // Other state
  const [isLoading, setIsLoading] = useState(true);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { toast } = useToast();

  // Fetch contents (subjects)
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

  // Fetch subjects for selected content
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

  // Fetch questions for selected content
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

        // Extract unique question types
        const types = [
          ...new Set(data.map((q: Question) => q.type || "General")),
        ].filter(Boolean);

        setQuestionTypes(types);

        // Create initial exam structure if section-wise
        if (isSectionWise) {
          createInitialExamStructure(types, totalPaperMarks);
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
    [toast, isSectionWise, totalPaperMarks]
  );

  // Create initial exam structure based on question types
  const createInitialExamStructure = useCallback(
    (types: string[], totalMarks: number) => {
      if (types.length === 0) return;

      // Calculate marks per section
      const marksPerSection = Math.floor(totalMarks / types.length);

      // Create sections
      const sections = types.map((type, index) => {
        // Determine default marks per question based on type
        let marksPerQuestion = 1;
        if (type.includes("2 Marks")) marksPerQuestion = 2;
        if (type.includes("3 Marks")) marksPerQuestion = 3;
        if (type.includes("5 Marks")) marksPerQuestion = 5;

        const totalQuestions = Math.floor(marksPerSection / marksPerQuestion);

        return {
          name: String.fromCharCode(65 + index), // A, B, C, etc.
          questionType: type,
          totalMarks: marksPerSection,
          marksPerQuestion: marksPerQuestion,
          totalQuestions: totalQuestions,
        };
      });

      setExamStructure({
        totalMarks: totalMarks,
        sections: sections,
      });
    },
    []
  );

  // Handle content selection
  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        fetchSubjects(content.id);
        fetchQuestions(content.id);
        setCurrentStep(2); // Move to next step
      }
    },
    [selectedContent, fetchSubjects, fetchQuestions]
  );

  // Handle paper marks change
  const handlePaperMarksChange = useCallback((marks: number) => {
    setTotalPaperMarks(marks);

    // Update exam structure total marks
    setExamStructure((prev) => ({
      ...prev,
      totalMarks: marks,
    }));
  }, []);

  // Handle question selection
  const handleQuestionSelect = useCallback((questions: Question[]) => {
    setSelectedQuestions(questions);
  }, []);

  // Handle chapter selection
  const handleChapterSelect = useCallback((chapters: SelectedChapter[]) => {
    setSelectedChapters(chapters);
  }, []);

  // Handle exam structure change
  const handleExamStructureChange = useCallback(
    (newStructure: ExamStructure) => {
      setExamStructure(newStructure);
    },
    []
  );

  // Handle PDF generation
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

  // Handle auto-generation
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

  // Move to next step
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, []);

  // Move to previous step
  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Loading state
  if (isLoading && !contents.length) {
    return <Loading title="Loading exam generation..." />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Exam</h1>

      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === step
                  ? "bg-primary text-white"
                  : currentStep > step
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          <span>Content</span>
          <span>Marks</span>
          <span>Method</span>
          <span>Type</span>
          <span>Sections</span>
          <span>Questions</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Content Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 1: Select Content</h2>
            <ClassSelector
              contents={contents}
              onSelectContent={handleContentSelect}
              initialContent={selectedContent}
            />
          </div>
        )}

        {/* Step 2: Paper Marks */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 2: Set Paper Marks</h2>
            <div className="max-w-md">
              <Label htmlFor="paperMarks">Total Paper Marks (1-100)</Label>
              <Input
                id="paperMarks"
                type="number"
                min="1"
                max="100"
                value={totalPaperMarks}
                onChange={(e) =>
                  handlePaperMarksChange(Number.parseInt(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <Button onClick={goToNextStep}>Next</Button>
          </div>
        )}

        {/* Step 3: Generation Method */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Choose Generation Method
            </h2>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manualGeneration"
                  name="generationMethod"
                  value="manual"
                  checked={generationMode === "manual"}
                  onChange={() => setGenerationMode("manual")}
                />
                <label htmlFor="manualGeneration">Manual Generation</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="autoGeneration"
                  name="generationMethod"
                  value="auto"
                  checked={generationMode === "auto"}
                  onChange={() => setGenerationMode("auto")}
                  disabled={true} // Auto method not available yet
                />
                <label htmlFor="autoGeneration" className="text-gray-400">
                  Auto Generation (Coming Soon)
                </label>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button onClick={goToPrevStep} variant="outline">
                Previous
              </Button>
              <Button onClick={goToNextStep}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 4: Paper Type */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 4: Choose Paper Type</h2>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="sectionWise"
                  name="paperType"
                  value="sectionWise"
                  checked={isSectionWise}
                  onChange={() => setIsSectionWise(true)}
                />
                <label htmlFor="sectionWise">Section Wise</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="nonSectionWise"
                  name="paperType"
                  value="nonSectionWise"
                  checked={!isSectionWise}
                  onChange={() => setIsSectionWise(false)}
                />
                <label htmlFor="nonSectionWise">Non-Section Wise</label>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button onClick={goToPrevStep} variant="outline">
                Previous
              </Button>
              <Button onClick={goToNextStep}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 5: Section Definition */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 5: Define Exam Structure
            </h2>
            {isSectionWise ? (
              <ExamStructureForm
                examStructure={examStructure}
                onExamStructureChange={handleExamStructureChange}
                questionTypes={questionTypes}
              />
            ) : (
              <div className="p-4 border rounded-md">
                <p>
                  Non-section wise paper selected. All questions will be
                  presented sequentially.
                </p>
                <p className="font-medium mt-2">
                  Total Paper Marks: {totalPaperMarks}
                </p>
              </div>
            )}
            <div className="flex space-x-4">
              <Button onClick={goToPrevStep} variant="outline">
                Previous
              </Button>
              <Button onClick={goToNextStep}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 6: Question Selection */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 6: Select Questions</h2>

            {selectedContent && subjects.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Available Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Badge
                        key={subject.id}
                        variant="outline"
                        className="text-sm"
                      >
                        {subject.subject_name} - Ch. {subject.chapter_no}:{" "}
                        {subject.chapter_name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <QuestionTypeSelector
              questions={questions}
              onSelectQuestions={handleQuestionSelect}
              onSelectChapters={handleChapterSelect}
              examStructure={examStructure}
              onExamStructureChange={handleExamStructureChange}
              isSectionWise={isSectionWise}
              totalPaperMarks={totalPaperMarks}
            />

            {selectedQuestions.length > 0 && (
              <ExamPreview
                selectedQuestions={selectedQuestions}
                examStructure={examStructure}
                onGeneratePdf={handleGeneratePdf}
                isSectionWise={isSectionWise}
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
                isSectionWise={isSectionWise}
              />
            )}

            <Button onClick={goToPrevStep} variant="outline">
              Previous
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
