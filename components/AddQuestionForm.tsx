"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetadataForm } from "./MetadataForm";
import { QuestionForm } from "./QuestionForm";
import { useUser } from "@clerk/nextjs";

export function AddQuestionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    {
      question: "",
      question_gu: "",
      question_images: [],
      question_images_gu: [],
      answer: "",
      answer_gu: "",
      answer_images: [],
      answer_images_gu: [],
      marks: 1,
      created_by: undefined, // Ensures it's not null
    },
  ]);
  const [metadata, setMetadata] = useState({
    content_id: "",
    subject_id: "",
    sectionTitle: "",
    type: "",
  });
  const [selectedContentMedium, setSelectedContentMedium] =
    useState<string>("");
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchRecentEntries();
    }
  }, [user]);

  useEffect(() => {
    if (metadata.content_id) {
      fetchContentMedium(metadata.content_id);
    }
  }, [metadata.content_id]);

  const fetchRecentEntries = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching recent entries:", error);
    }
  };

  const fetchContentMedium = async (contentId: string) => {
    const { data, error } = await supabase
      .from("contents")
      .select("medium")
      .eq("id", contentId)
      .single();
    if (error) {
      console.error("Error fetching content medium:", error);
    } else {
      setSelectedContentMedium(data.medium);
    }
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = {
        ...newQuestions[index],
        [name]: name === "marks" ? Number.parseInt(value, 10) : value,
      };
      return newQuestions;
    });
  };

  const handleSaveQuestions = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save questions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const questionsToSave = questions.map((question) => ({
        ...metadata,
        ...question,
        created_by: user?.fullName ?? undefined, // Fix for TypeScript error
        content_id: metadata.content_id
          ? Number.parseInt(metadata.content_id, 10)
          : null,
        subject_id: metadata.subject_id
          ? Number.parseInt(metadata.subject_id, 10)
          : null,
        marks: question.marks || 1,
      }));

      const { error } = await supabase
        .from("questions")
        .insert(questionsToSave)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${questions.length} question(s) saved successfully!`,
      });

      resetFormState();
    } catch (error) {
      console.error("Error saving questions:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to save questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        created_by: user?.fullName ?? undefined, // Fix for TypeScript error
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetFormState = () => {
    setQuestions([
      {
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        created_by: undefined, // Fix for TypeScript error
      },
    ]);
  };

  if (!user) {
    return <div>Please log in to access this form.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md">
        <h2 className="text-2xl font-bold">Add New Questions</h2>
        <MetadataForm
          metadata={metadata}
          handleMetadataChange={handleMetadataChange}
        />
        {questions.map((question, index) => (
          <div key={index} className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Question {index + 1}</h3>
            <QuestionForm
              currentQuestion={question}
              handleQuestionChange={(e) => handleQuestionChange(index, e)}
              isSubmitting={isSubmitting}
              questionType={metadata.type}
              removeQuestion={() => removeQuestion(index)}
              selectedContentMedium={selectedContentMedium}
            />
          </div>
        ))}
        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
          <Button onClick={addNewQuestion} variant="outline">
            Add Another Question
          </Button>
          <Button onClick={resetFormState} variant="secondary">
            Clear All
          </Button>
          <Button
            onClick={handleSaveQuestions}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            variant="default"
          >
            {isSubmitting ? "Saving..." : "Save All Questions"}
          </Button>
        </div>
      </div>
    </div>
  );
}
