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
import { QuestionSelector } from "@/components/QuestionSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function GenerateExamPage() {
  // Step 1: Content Selection
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // Step 2: Paper Marks
  const [totalPaperMarks, setTotalPaperMarks] = useState<number>(100);

  // Step 4: Section Definition
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

  // Current section being edited
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(
    null
  );

  // Other state
  const [isLoading, setIsLoading] = useState(true);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
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

  // Handle content selection
  const handleContentSelect = useCallback(
    (content: Content) => {
      if (content.id !== selectedContent?.id) {
        setSelectedContent(content);
        setSelectedQuestions([]);
        setSelectedChapters([]);
        fetchSubjects(content.id);
        fetchQuestions(content.id);

        // Reset exam structure when content changes
        setExamStructure({
          totalMarks: totalPaperMarks,
          sections: [],
        });
      }
    },
    [selectedContent, fetchSubjects, fetchQuestions, totalPaperMarks]
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

  // Handle section selection for question assignment
  const handleSectionSelect = useCallback((index: number) => {
    setCurrentSectionIndex(index);
  }, []);

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

  // Set step directly (for clickable navigation)
  const setStep = useCallback(
    (step: number) => {
      // Validate if we can go to this step
      if (step > 1 && !selectedContent) {
        toast({
          title: "Required Step",
          description: "Please select a content first.",
          variant: "destructive",
        });
        return;
      }

      if (step > 3 && examStructure.sections.length === 0) {
        toast({
          title: "Required Step",
          description: "Please define at least one section first.",
          variant: "destructive",
        });
        return;
      }

      setCurrentStep(step);
    },
    [selectedContent, examStructure.sections.length, toast]
  );

  // Loading state
  if (isLoading && !contents.length) {
    return <Loading title="Loading exam generation..." />;
  }

  // Calculate remaining marks
  const assignedMarks = examStructure.sections.reduce(
    (sum, section) => sum + section.totalMarks,
    0
  );
  const remainingMarks = totalPaperMarks - assignedMarks;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Exam</h1>

      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                currentStep === step
                  ? "bg-primary text-white"
                  : currentStep > step
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setStep(step)}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          <span>Content</span>
          <span>Marks</span>
          <span>Sections</span>
          <span>Questions</span>
          <span>Preview</span>
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
            {selectedContent && (
              <Button onClick={() => setStep(2)}>Next</Button>
            )}
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
            <div className="flex space-x-4">
              <Button onClick={() => setStep(1)} variant="outline">
                Previous
              </Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 3: Section Definition */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Define Exam Sections
            </h2>
            <div className="flex justify-between items-center">
              <p className="text-lg">Total Paper Marks: {totalPaperMarks}</p>
              <Badge variant={remainingMarks >= 0 ? "outline" : "destructive"}>
                Remaining Marks: {remainingMarks}
              </Badge>
            </div>

            <ExamStructureForm
              examStructure={examStructure}
              onExamStructureChange={handleExamStructureChange}
              totalPaperMarks={totalPaperMarks}
              allowCustomQuestionTypes={true}
            />

            <div className="flex space-x-4">
              <Button onClick={() => setStep(2)} variant="outline">
                Previous
              </Button>
              {examStructure.sections.length > 0 && (
                <Button onClick={() => setStep(4)}>Next</Button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Question Selection */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 4: Select Questions</h2>

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

            {/* Section selector */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                First, Select a Section to Add Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examStructure.sections.map((section, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer ${
                      currentSectionIndex === index
                        ? "border-2 border-primary"
                        : ""
                    }`}
                    onClick={() => handleSectionSelect(index)}
                  >
                    <CardContent className="p-4">
                      <h4 className="text-lg font-medium">
                        Section {section.name}
                      </h4>
                      <p>
                        <strong>Title:</strong> {section.questionType}
                      </p>
                      <p>
                        <strong>Marks Per Question:</strong>{" "}
                        {section.marksPerQuestion}
                      </p>
                      <p>
                        <strong>Total Questions:</strong>{" "}
                        {section.totalQuestions}
                      </p>
                      <p>
                        <strong>Total Marks:</strong> {section.totalMarks}
                      </p>

                      {/* Show how many questions are selected for this section */}
                      <Badge className="mt-2">
                        {
                          selectedQuestions.filter((q) => q.sectionId === index)
                            .length
                        }{" "}
                        questions selected
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Question selector - show all questions, but only allow selection if a section is selected */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">
                Then, Select Questions for the Selected Section
              </h3>
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
                showAllQuestions={true}
              />
            </div>

            <div className="flex space-x-4">
              <Button onClick={() => setStep(3)} variant="outline">
                Previous
              </Button>
              {selectedQuestions.length > 0 && (
                <Button onClick={() => setStep(5)}>Next</Button>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Preview and Generate */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              Step 5: Preview and Generate
            </h2>

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
                instituteName="Your Institute Name"
                standard={selectedContent?.class.toString() || ""}
                studentName="Student Name"
                subject={selectedContent?.name || ""}
                chapters={selectedChapters.map((ch) => ch.name).join(", ")}
                teacherName="Teacher Name"
                isSectionWise={true}
              />
            )}

            <Button onClick={() => setStep(4)} variant="outline">
              Previous
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
