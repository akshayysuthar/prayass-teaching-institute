"use client";

import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { Question, ExamStructure, ExamSection } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface QuestionSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters?: (chapters: any[]) => void;
  examStructure: ExamStructure;
  onExamStructureChange?: (newStructure: ExamStructure) => void;
  
  currentSection: ExamSection | null;
  currentSectionIndex: number | null;
  selectedQuestions: Question[];
  showAllQuestions?: boolean;
}

export function QuestionSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
  onExamStructureChange,
  currentSection,
  currentSectionIndex,
  selectedQuestions,
  showAllQuestions = false,
}: QuestionSelectorProps) {
  const [chapterNames, setChapterNames] = useState<{ [key: string]: string }>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

  // Fetch chapter names
  useEffect(() => {
    const fetchChapterNames = async () => {
      const subjectIds = [...new Set(questions.map((q) => q.subject_id))];
      const { data, error } = await supabase
        .from("subjects")
        .select("id, chapter_name")
        .in("id", subjectIds);

      if (error) {
        console.error("Error fetching chapter names:", error);
        return;
      }

      const chapterNameMap = data.reduce<{ [key: string]: string }>((acc, subject) => {
        acc[subject.id] = subject.chapter_name;
        return acc;
      }, {});

      setChapterNames(chapterNameMap);
    };

    fetchChapterNames();
  }, [questions]);

  // Group questions by chapter
  const groupedQuestions = useMemo(() => {
    const grouped: { [key: string]: Question[] } = {};

    // Filter questions by search term
    const filteredQuestions = questions.filter((q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredQuestions.forEach((q) => {
      const chapterId = q.subject_id.toString();
      if (!grouped[chapterId]) {
        grouped[chapterId] = [];
      }
      grouped[chapterId].push(q);
    });

    return grouped;
  }, [questions, searchTerm]);

  // Get questions already selected for this section
  const sectionQuestions = useMemo(() => {
    return selectedQuestions.filter((q) => q.sectionId === currentSectionIndex);
  }, [selectedQuestions, currentSectionIndex]);

  // Calculate remaining questions and marks for this section
  const remainingQuestions = currentSection
    ? currentSection.totalQuestions - sectionQuestions.length
    : 0;
  const usedMarks = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);
  const remainingMarks = currentSection
    ? currentSection.totalMarks - usedMarks
    : 0;

  // Handle question selection
  const handleQuestionChange = (question: Question) => {
    // If no section is selected, show a message
    if (currentSectionIndex === null || !currentSection) {
      alert("Please select a section first before selecting questions.");
      return;
    }

    // Check if question is already selected in any section
    const isSelectedInAnySection = selectedQuestions.some(
      (q) => q.id === question.id
    );

    // If already selected in this section, remove it
    if (
      isSelectedInAnySection &&
      selectedQuestions.some(
        (q) => q.id === question.id && q.sectionId === currentSectionIndex
      )
    ) {
      const updatedQuestions = selectedQuestions.filter(
        (q) => !(q.id === question.id && q.sectionId === currentSectionIndex)
      );
      onSelectQuestions(updatedQuestions);
      return;
    }

    // If already selected in another section, show warning
    if (isSelectedInAnySection) {
      alert(
        "This question is already selected in another section. Please deselect it there first."
      );
      return;
    }

    // Check if we have enough remaining marks and questions
    if (remainingQuestions <= 0) {
      alert(
        `You've already selected the maximum number of questions (${currentSection.totalQuestions}) for this section.`
      );
      return;
    }

    if (question.marks > remainingMarks) {
      alert(
        `Not enough remaining marks. This question needs ${question.marks} marks but you only have ${remainingMarks} left.`
      );
      return;
    }

    // Check if marks per question matches
    if (question.marks !== currentSection.marksPerQuestion) {
      alert(
        `This question is worth ${question.marks} marks, but this section requires questions worth ${currentSection.marksPerQuestion} marks each.`
      );
      return;
    }

    // Add the question with section ID
    const questionWithSection = {
      ...question,
      sectionId: currentSectionIndex,
    };

    onSelectQuestions([...selectedQuestions, questionWithSection]);
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // Render images for questions
  const renderImages = (images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imageArray.map((img, index) => (
          <Image
            key={index}
            src={img || "/placeholder.svg"}
            alt={`Question image ${index + 1}`}
            width={200}
            height={200}
            className="object-contain"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Select Questions for Section {currentSection?.name}:{" "}
          {currentSection?.questionType}
        </h3>
        <div className="flex space-x-2">
          <Badge variant="outline">
            Questions: {sectionQuestions.length}/
            {currentSection?.totalQuestions}
          </Badge>
          <Badge variant="outline">
            Marks: {usedMarks}/{currentSection?.totalMarks}
          </Badge>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {Object.entries(groupedQuestions).map(
          ([chapterId, chapterQuestions]) => (
            <Accordion
              type="single"
              collapsible
              key={chapterId}
              value={expandedChapters.includes(chapterId) ? chapterId : ""}
            >
              <AccordionItem value={chapterId}>
                <AccordionTrigger onClick={() => toggleChapter(chapterId)}>
                  <h3 className="text-lg font-bold">
                    Chapter: {chapterNames[chapterId] || chapterId} (
                    {chapterQuestions.length} questions)
                  </h3>
                </AccordionTrigger>
                <AccordionContent>
                  {chapterQuestions
                    .filter((question) => {
                      // If showing all questions or no section is selected, show all
                      if (showAllQuestions && currentSectionIndex === null) {
                        return true;
                      }
                      // If a section is selected, filter by marks per question
                      return (
                        currentSection &&
                        question.marks === currentSection.marksPerQuestion
                      );
                    })
                    .map((question) => (
                      <div
                        className="flex items-start space-x-3 mb-4"
                        key={question.id}
                      >
                        <Checkbox
                          id={`question-${question.id}-section-${currentSectionIndex}`}
                          checked={selectedQuestions.some(
                            (q) =>
                              q.id === question.id &&
                              q.sectionId === currentSectionIndex
                          )}
                          onCheckedChange={() => handleQuestionChange(question)}
                          disabled={currentSectionIndex === null}
                        />
                        <Label
                          htmlFor={`question-${question.id}-section-${currentSectionIndex}`}
                          className={`flex flex-col space-y-2 ${
                            currentSectionIndex === null ? "opacity-70" : ""
                          }`}
                        >
                          <span>
                            {question.question} ({question.marks} marks)
                          </span>
                          {renderImages(question.question_images || undefined)}
                          <span className="text-sm text-gray-500">
                            Type: {question.type || "General"}
                          </span>
                        </Label>
                      </div>
                    ))}

                  {currentSectionIndex !== null &&
                    chapterQuestions.filter(
                      (q) => q.marks === currentSection?.marksPerQuestion
                    ).length === 0 && (
                      <p className="text-muted-foreground italic">
                        No questions with {currentSection?.marksPerQuestion}{" "}
                        marks in this chapter.
                      </p>
                    )}

                  {currentSectionIndex === null && (
                    <p className="text-muted-foreground italic">
                      Please select a section first to enable question
                      selection.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )
        )}

        {Object.keys(groupedQuestions).length === 0 && (
          <div className="text-center p-6 border border-dashed rounded-md">
            <p>No questions found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
