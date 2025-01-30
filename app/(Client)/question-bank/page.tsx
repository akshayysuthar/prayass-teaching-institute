"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestionList } from "@/components/QuestionList";
import { QuestionFilters } from "@/components/QuestionFilters";
import type { Question, Content, Subject } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { Loading } from "@/components/Loading";

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: "",
    contentId: "",
    subjectId: "",
    type: "",
    marks: "",
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user } = useUser();

  const isAdmin =
    user?.emailAddresses[0]?.emailAddress === "prayasteachingacademy@gmail.com";

  const fetchQuestions = useCallback(
    async (loadMore = false) => {
      setLoading(true);
      try {
        let query = supabase
          .from("questions")
          .select(
            `
          *,
          contents:content_id(id, name),
          subjects:subject_id(id, subject_name, chapter_name, chapter_no)
        `
          )
          .order("created_at", { ascending: false })
          .range(page * 20, (page + 1) * 20 - 1);

        if (filters.searchTerm) {
          query = query.or(
            `question.ilike.%${filters.searchTerm}%,question_gu.ilike.%${filters.searchTerm}%`
          );
        }
        if (filters.contentId) {
          query = query.eq("content_id", filters.contentId);
        }
        if (filters.subjectId) {
          query = query.eq("subject_id", filters.subjectId);
        }
        if (filters.type && filters.type !== "all") {
          query = query.eq("type", filters.type);
        }
        if (filters.marks && filters.marks !== "all") {
          query = query.eq("marks", Number.parseInt(filters.marks));
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedQuestions = data?.map((q) => ({
          ...q,
          content_name: q.contents?.name,
          subject_name: q.subjects?.subject_name,
          chapter_name: q.subjects?.chapter_name,
          chapter_no: q.subjects?.chapter_no,
        }));

        if (loadMore) {
          setQuestions((prev) => [...prev, ...(formattedQuestions || [])]);
        } else {
          setQuestions(formattedQuestions || []);
        }

        setHasMore(data?.length === 20);
        if (loadMore) {
          setPage((prev) => prev + 1);
        }
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
    },
    [filters, page, toast]
  );

  const fetchContentsAndSubjects = useCallback(async () => {
    try {
      const [contentsResponse, subjectsResponse] = await Promise.all([
        supabase.from("contents").select("*"),
        supabase.from("subjects").select("*"),
      ]);

      if (contentsResponse.error) throw contentsResponse.error;
      if (subjectsResponse.error) throw subjectsResponse.error;

      setContents(contentsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
    } catch (error) {
      console.error("Error fetching contents and subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contents and subjects. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchQuestions();
    fetchContentsAndSubjects();
  }, [fetchQuestions, fetchContentsAndSubjects]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(0);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    fetchQuestions(true);
  };

  if (loading && page === 0) {
    return <Loading title="Loading questions..." />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Question Bank</h1>
      <QuestionFilters
        onFilterChange={handleFilterChange}
        contents={contents}
        subjects={subjects}
      />
      {loading && page === 0 ? (
        <p>Loading questions...</p>
      ) : (
        <QuestionList
          questions={questions}
          onQuestionUpdated={() => fetchQuestions()}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isAdmin={isAdmin}
          contents={contents}
          subjects={subjects}
        />
      )}
    </div>
  );
}
