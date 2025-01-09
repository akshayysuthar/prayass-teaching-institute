"use client";

import { useState, useEffect, SetStateAction } from "react";
import { QuestionList } from "@/components/QuestionList";
import { QuestionFilters } from "@/components/QuestionFilters";
import { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: "",
    type: "",
    subject: "",
    marks: "",
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async (loadMore = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1);

      if (filters.searchTerm) {
        query = query.ilike("question", `%${filters.searchTerm}%`);
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.subject) {
        query = query.eq("subject_id", filters.subject);
      }
      if (filters.marks) {
        query = query.eq("marks", parseInt(filters.marks));
      }

      const { data, error } = await query;

      if (error) throw error;

      if (loadMore) {
        setQuestions((prev) => [...prev, ...data]);
      } else {
        setQuestions(data);
      }

      setHasMore(data.length === 20);
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
  };

  const handleFilterChange = (
    newFilters: SetStateAction<{
      searchTerm: string;
      type: string;
      subject: string;
      marks: string;
    }>
  ) => {
    setFilters(newFilters);
    setPage(0);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    fetchQuestions(true);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Question Bank</h1>
      <QuestionFilters onFilterChange={handleFilterChange} />
      {loading && page === 0 ? (
        <p>Loading questions...</p>
      ) : (
        <QuestionList
          questions={questions}
          onQuestionUpdated={() => fetchQuestions()}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
