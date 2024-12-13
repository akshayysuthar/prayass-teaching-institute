"use client";

import { useEffect, useState } from 'react';
import { supabase } from "@/utils/supabase/client";
import { Question } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function UploadedQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);setIsLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Uploaded Questions</h2>
      {questions.map((question) => (
        <div key={question.id} className="border p-4 rounded-md mb-4">
          <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
          {/* <p><strong>Answer:</strong> {question.answer}</p> */}
          <p><strong>Class:</strong> {question.class}</p>
          <p><strong>Subject:</strong> {question.subject}</p>
          <p><strong>Type:</strong> {question.type}</p>
          <p><strong>Marks:</strong> {question.marks}</p>
        </div>
      ))}
    </div>
  );
}

