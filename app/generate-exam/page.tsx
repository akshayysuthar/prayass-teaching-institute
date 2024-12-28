"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { SubjectSelector } from "@/components/SubjectSelector";
import { ChapterSelector } from "@/components/ChapterSelector";
import { ExamPreview } from "@/components/ExamPreview";
import { PdfDownload } from "@/components/PdfDownload";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { Content, Subject, Question, SelectedChapter } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function GenerateExamPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const { toast } = useToast();


  // console.log(contents);
  // console.log(subjects);
  // console.log(questions);
  

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

  const fetchSubjects = async (contentId: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("content_id", contentId);
      if (error) throw error;
      setSubjects(data);
    } catch (error) {
      setError("Failed to fetch subjects");
      toast({
        title: "Error",
        description: "Failed to fetch subjects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (subjectId: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("subject_id", subjectId);
      if (error) throw error;
      setQuestions(data);
    } catch (error) {
      setError("Failed to fetch questions");
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSelect = (content: Content) => {
    if (content.id !== selectedContent?.id) {
      setSelectedContent(content);
      setSelectedSubject(null);
      setSelectedQuestions([]);
      setSelectedChapters([]);
      fetchSubjects(content.id);
    }
  };

  const handleSubjectSelect = (subjectId: string) => {
    if (subjectId !== selectedSubject?.id.toString()) {
      const subject = subjects.find(s => s.id.toString() === subjectId);
      setSelectedSubject(subject || null);
      setSelectedQuestions([]);
      setSelectedChapters([]);
      if (subject) {
        fetchQuestions(subject.id);
      }
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
        description: "Please select at least one question before generating the PDF.",
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
          <SubjectSelector
            subjects={subjects}
            onSelectSubject={handleSubjectSelect}
            initialSubject={selectedSubject?.id.toString()}
          />
        )}
        {selectedSubject && (
          <ChapterSelector
            questions={questions}
            onSelectQuestions={handleQuestionSelect}
            onSelectChapters={handleChapterSelect}
          />
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
            subject={selectedSubject?.subject_name || ""}
            chapters={selectedChapters.map(ch => ch.name).join(", ")}
            teacherName="Teacher Name"
          />
        )}
      </div>
    </div>
  );
}

