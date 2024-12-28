"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { ChapterSelector } from "@/components/ChapterSelector";
import { ExamPreview } from "@/components/ExamPreview";
import { PdfDownload } from "@/components/PdfDownload";
import { supabase } from "@/utils/supabase/client";
import { Content, Subject, Question, SelectedChapter } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function GenerateExamPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
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
  };

  const fetchSubjectsAndQuestions = async (contentId: number) => {
    setIsLoading(true);
    try {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("content_id", contentId);
      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .in(
          "subject_id",
          subjectsData.map((subject: Subject) => subject.id)
        );
      if (questionsError) throw questionsError;
      setQuestions(questionsData);
    } catch (error) {
      setError("Failed to fetch subjects and questions");
      toast({
        title: "Error",
        description:
          "Failed to fetch subjects and questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSelect = (content: Content) => {
    if (content.id !== selectedContent?.id) {
      setSelectedContent(content);
      setSelectedQuestions([]);
      setSelectedChapters([]);
      fetchSubjectsAndQuestions(content.id);
    }
  };

  const handleQuestionSelect = useCallback((questions: Question[]) => {
    setSelectedQuestions(questions);
  }, []);

  const handleChapterSelect = useCallback((chapters: SelectedChapter[]) => {
    setSelectedChapters(chapters);
  }, []);

  const handleGeneratePdf = () => {
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
  };

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
          <div>
            {subjects.map((subject) => (
              <div key={subject.id}>
                <h2 className="text-xl font-bold mb-2">
                  {subject.subject_name} (Content ID: {selectedContent?.id})
                </h2>
                <ChapterSelector
                  questions={questions.filter(
                    (q) => q.subject_id === subject.id
                  )}
                  subject={subject}
                  onSelectQuestions={handleQuestionSelect}
                  onSelectChapters={handleChapterSelect}
                />
              </div>
            ))}
          </div>
        )}
        {selectedQuestions.length > 0 && (
          <ExamPreview
            selectedQuestions={selectedQuestions}
            onGeneratePdf={handleGeneratePdf}
          />
        )}
        {showPdfDownload && (
          <PdfDownload
            selectedQuestions={selectedQuestions}
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
