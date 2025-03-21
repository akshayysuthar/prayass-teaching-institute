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
import type { Question, ExamSection } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuestionSelectorProps {
  questions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  currentSection: ExamSection | null;
  currentSectionIndex: number | null;
  selectedQuestions: Question[];
}

export function QuestionSelector({
  questions,
  onSelectQuestions,
  currentSection,
  currentSectionIndex,
  selectedQuestions,
}: QuestionSelectorProps) {
  const [chapterNames, setChapterNames] = useState<{ [key: string]: string }>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"chapter" | "type">("chapter");
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);

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

      const chapterNameMap = data.reduce(
        (
          acc: { [key: string]: string },
          subject: { id: string; chapter_name: string }
        ) => {
          acc[subject.id] = subject.chapter_name;
          return acc;
        },
        {}
      );

      setChapterNames(chapterNameMap);
    };

    fetchChapterNames();
  }, [questions]);

  const groupedQuestions = useMemo(() => {
    const grouped: { [key: string]: Question[] } = {};
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

  const groupedByType = useMemo(() => {
    const grouped: { [key: string]: Question[] } = {};
    const filteredQuestions = questions.filter((q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredQuestions.forEach((q) => {
      const type = q.type || "Other";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(q);
    });

    return grouped;
  }, [questions, searchTerm]);

  const sectionQuestions = useMemo(() => {
    return selectedQuestions.filter((q) => q.sectionId === currentSectionIndex);
  }, [selectedQuestions, currentSectionIndex]);

  const remainingQuestions = currentSection
    ? currentSection.totalQuestions - sectionQuestions.length
    : 0;
  const usedMarks = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);

  const handleQuestionChange = (question: Question) => {
    if (currentSectionIndex === null || !currentSection) {
      toast({
        title: "Select a Section",
        description:
          "Please select a section first before selecting questions.",
        variant: "destructive",
      });
      return;
    }

    const isSelectedInAnySection = selectedQuestions.some(
      (q) => q.id === question.id
    );

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

    if (isSelectedInAnySection) {
      toast({
        title: "Question Already Selected",
        description:
          "This question is already selected in another section. Please deselect it there first.",
        variant: "destructive",
      });
      return;
    }

    if (remainingQuestions <= 0) {
      toast({
        title: "Section Full",
        description: `You've already selected the maximum number of questions (${currentSection.totalQuestions}) for this section.`,
        variant: "destructive",
      });
      return;
    }

    const questionWithSection = {
      ...question,
      sectionId: currentSectionIndex,
    };

    onSelectQuestions([...selectedQuestions, questionWithSection]);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const toggleType = (type: string) => {
    setExpandedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

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
          {currentSection ? (
            <>
              Select Questions for Section {currentSection.name}:{" "}
              {currentSection.questionType}
            </>
          ) : (
            <>Please select a section first</>
          )}
        </h3>
        {currentSection && (
          <div className="flex space-x-2">
            <Badge variant="outline">
              Questions: {sectionQuestions.length}/
              {currentSection.totalQuestions}
            </Badge>
            <Badge variant="outline">
              Marks: {usedMarks}/{currentSection.totalMarks}
            </Badge>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "chapter" | "type")}
        >
          <TabsList>
            <TabsTrigger value="chapter">Chapter View</TabsTrigger>
            <TabsTrigger value="type">Type View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "chapter" ? (
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
                    {chapterQuestions.map((question) => (
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
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedByType).map(([type, typeQuestions]) => (
            <Accordion
              type="single"
              collapsible
              key={type}
              value={expandedTypes.includes(type) ? type : ""}
            >
              <AccordionItem value={type}>
                <AccordionTrigger onClick={() => toggleType(type)}>
                  <h3 className="text-lg font-bold">
                    Type: {type} ({typeQuestions.length} questions)
                  </h3>
                </AccordionTrigger>
                <AccordionContent>
                  {typeQuestions.map((question) => (
                    <div
                      className="flex items-start space-x-3 mb-4"
                      key={question.id}
                    >
                      <Checkbox
                        id={`question-type-${question.id}-section-${currentSectionIndex}`}
                        checked={selectedQuestions.some(
                          (q) =>
                            q.id === question.id &&
                            q.sectionId === currentSectionIndex
                        )}
                        onCheckedChange={() => handleQuestionChange(question)}
                        disabled={currentSectionIndex === null}
                      />
                      <Label
                        htmlFor={`question-type-${question.id}-section-${currentSectionIndex}`}
                        className={`flex flex-col space-y-2 ${
                          currentSectionIndex === null ? "opacity-70" : ""
                        }`}
                      >
                        <span>
                          {question.question} ({question.marks} marks)
                        </span>
                        {renderImages(question.question_images || undefined)}
                        <span className="text-sm text-gray-500">
                          Chapter:{" "}
                          {chapterNames[question.subject_id] ||
                            question.subject_id}
                        </span>
                      </Label>
                    </div>
                  ))}
                  {currentSectionIndex === null && (
                    <p className="text-muted-foreground italic">
                      Please select a section first to enable question
                      selection.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      )}

      {Object.keys(groupedQuestions).length === 0 && (
        <div className="text-center p-6 border border-dashed rounded-md">
          <p>No questions found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
