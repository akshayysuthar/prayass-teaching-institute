"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestionList } from "@/components/QuestionList";
import { QuestionFilters } from "@/components/QuestionFilters";
import { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { siteConfig } from "@/config/site";

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
  const { user } = useUser();

  const isAdmin =
    siteConfig.adminEmail.includes(user?.emailAddresses[0]?.emailAddress || "");

  const fetchQuestions = useCallback(
    async (loadMore = false) => {
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
        if (filters.type && filters.type !== "all") {
          query = query.eq("type", filters.type);
        }
        if (filters.subject && filters.subject !== "all") {
          query = query.eq("subject_id", filters.subject);
        }
        if (filters.marks && filters.marks !== "all") {
          query = query.eq("marks", parseInt(filters.marks));
        }

        const { data, error } = await query;

        if (error) throw error;

        if (loadMore) {
          setQuestions((prev) => [...prev, ...(data || [])]);
        } else {
          setQuestions(data || []);
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

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleFilterChange = (newFilters: typeof filters) => {
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
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
