"use client";

import { useState, useEffect } from "react";
import { ContentSubjectSelector } from "@/components/ContentSubjectSelector";
import { BilingualQuestionList } from "@/components/BilingualQuestionList";
import type { Question, Content, Subject } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { Loading } from "@/components/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function BilingualQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{
    chapter_no: number;
    chapter_name: string;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUser();

  console.log(selectedChapter);

  useEffect(() => {
    if (user) {
      fetchContents();
    }
  }, [user]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error("Error fetching contents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (contentId: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select(
          "id, subject_name, chapter_no, chapter_name, content_id, board_weightage, created_at"
        )
        .eq("content_id", contentId)
        .order("chapter_no", { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subjects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (contentId: number, subjectId: number) => {
    setLoading(true);
    try {
      let query = supabase
        .from("questions")
        .select("*")
        .eq("content_id", contentId)
        .eq("subject_id", subjectId)
        .order("section_title", { ascending: true });

      if (selectedType !== "all") {
        query = query.eq("type", selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: Content) => {
    setSelectedContent(content);
    setSelectedSubject(null);
    setSelectedChapter(null);
    fetchSubjects(content.id);
  };

  const handleSubjectChange = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedChapter({
      chapter_no: subject.chapter_no,
      chapter_name: subject.chapter_name,
    });
    if (selectedContent) {
      fetchQuestions(selectedContent.id, subject.id);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (selectedContent && selectedSubject) {
      fetchQuestions(selectedContent.id, selectedSubject.id);
    }
  };

  const handleQuestionAdded = () => {
    if (selectedContent && selectedSubject) {
      fetchQuestions(selectedContent.id, selectedSubject.id);
    }
  };

  const handleQuestionUpdated = () => {
    if (selectedContent && selectedSubject) {
      fetchQuestions(selectedContent.id, selectedSubject.id);
    }
  };

  const handleQuestionRemoved = () => {
    if (selectedContent && selectedSubject) {
      fetchQuestions(selectedContent.id, selectedSubject.id);
    }
  };

  if (loading && !contents.length) {
    return <Loading title="Loading bilingual questions..." />;
  }

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">
        Bilingual Questions (English & Gujarati)
      </h1>
      <ContentSubjectSelector
        contents={contents}
        subjects={subjects}
        selectedContent={selectedContent}
        selectedSubject={selectedSubject}
        onContentChange={handleContentChange}
        onSubjectChange={handleSubjectChange}
      />
      {selectedContent && selectedSubject && (
        <>
          <div className="mb-4">
            <Label htmlFor="questionType">Filter by Question Type</Label>
            <Select onValueChange={handleTypeChange} value={selectedType}>
              <SelectTrigger id="questionType">
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="Short Answer">Short Answer</SelectItem>
                <SelectItem value="Long Answer">Long Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <BilingualQuestionList
            subject={{ id: selectedSubject.id, question_count: questions.length }}
            questions={questions}
            onQuestionAdded={handleQuestionAdded}
            onQuestionUpdated={handleQuestionUpdated}
            onQuestionRemoved={handleQuestionRemoved}
            totalQuestions={0}
          />
        </>
      )}
    </div>
  );
}
