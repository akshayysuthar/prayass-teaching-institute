"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetadataForm } from "./MetadataForm";
import { QuestionForm } from "./QuestionForm";
import { useUser } from "@clerk/nextjs";

export function AddQuestionForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [recentEntries, setRecentEntries] = useState<Partial<Question>[]>([]);
  const { user } = useUser();
  const [metadata, setMetadata] = useState({
    class: "",
    subject: "",
    bookName: "",
    board: "",
    chapterNo: "",
    chapterName: "",
    section: "",
    type: "",
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    id: "",
    isReviewed: false,
    reviewedBy: user?.fullName || undefined,
    question: "",
    question_images: [],
    answer: "",
    answer_images: [],
    options: {},
    marks: 1,
    imageUploadPending: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching recent entries:", error);
    } else {
      setRecentEntries(data || []);
    }
  };

  const generateSixDigitId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: name === "class" ? parseInt(value, 10) : value,
    }));
  };

  const handleQuestionChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCurrentQuestion((prev) => ({
      ...prev,
      [name]: name === "marks" ? parseInt(value, 10) : value,
    }));
  };

  const handleReviewStatusChange = (isReviewed: boolean) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      isReviewed,
      reviewedBy: user?.fullName || undefined,
    }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "answer"
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-images").getPublicUrl(fileName);

      setCurrentQuestion((prev) => ({
        ...prev,
        [`${type}_images`]: [...(prev[`${type}_images`] || []), publicUrl],
      }));

      // Add placeholder to the input
      const inputField = type === "question" ? "question" : "answer";
      setCurrentQuestion((prev) => ({
        ...prev,
        [inputField]: `${prev[inputField]} [img${
          (prev[`${type}_images`]?.length || 0) + 1
        }]`,
      }));
    }
  };

  const handleAddOption = () => {
    const optionKey = String.fromCharCode(
      65 + Object.keys(currentQuestion.options || {}).length
    );
    setCurrentQuestion((prev) => ({
      ...prev,
      options: { ...(prev.options || {}), [optionKey]: "" },
    }));
  };

  const handleOptionChange = (key: string, value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: { ...(prev.options || {}), [key]: value },
    }));
  };

  const handleSaveQuestion = async () => {
    setIsSubmitting(true);
    try {
      const questionToSave = {
        ...metadata,
        ...currentQuestion,
        id: currentQuestion.id || generateSixDigitId(),
      };
      console.log("Saving question:", questionToSave);

      const { data, error } = await supabase
        .from("questions")
        .insert([questionToSave])
        .select();

      if (error) throw error;

      console.log("Question saved successfully:", data);

      toast({
        title: "Success",
        description: "Question saved successfully!",
      });

      // Update recent entries
      fetchRecentEntries();

      // Clear the form
      setCurrentQuestion({
        id: "",
        isReviewed: false,
        reviewedBy: user?.fullName || undefined,
        question: "",
        question_images: [],
        answer: "",
        answer_images: [],
        options: {},
        marks: 1,
        imageUploadPending: false,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description: "Failed to save question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = async () => {
    setIsSubmitting(true);
    try {
      const questionToUpdate = {
        ...metadata,
        ...currentQuestion,
      };
      console.log("Updating question:", questionToUpdate);

      const { data, error } = await supabase
        .from("questions")
        .update(questionToUpdate)
        .eq("id", questionToUpdate.id)
        .select();

      if (error) throw error;

      console.log("Question updated successfully:", data);

      toast({
        title: "Success",
        description: "Question updated successfully!",
      });

      // Update recent entries
      fetchRecentEntries();

      // Clear the form
      setCurrentQuestion({
        id: "",
        isReviewed: false,
        reviewedBy: user?.fullName || undefined,
        question: "",
        question_images: [],
        answer: "",
        answer_images: [],
        options: {},
        marks: 1,
        imageUploadPending: false,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchQuestion = async () => {
    if (!currentQuestion.id) {
      toast({
        title: "Error",
        description: "Please enter a question ID to fetch.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", currentQuestion.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentQuestion(data);
        setMetadata({
          class: data.class,
          subject: data.subject,
          bookName: data.bookName,
          board: data.board,
          chapterNo: data.chapterNo,
          chapterName: data.chapterName,
          section: data.section,
          type: data.type,
        });
        setIsEditing(true);
        toast({
          title: "Success",
          description: "Question fetched successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "No question found with the given ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      toast({
        title: "Error",
        description: "Failed to fetch question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  const processJsonInput = async () => {
    try {
      const parsedQuestions = JSON.parse(jsonInput);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Invalid JSON format. Expected an array of questions.");
      }

      const processedQuestions = parsedQuestions.map((q) => ({
        ...metadata,
        ...q,
        id: generateSixDigitId(),
        isReviewed: false,
        reviewedBy: user?.fullName || undefined,
        question_images: q.question_images || [],
        answer_images: q.answer_images || [],
      }));

      setIsSubmitting(true);

      for (const question of processedQuestions) {
        const { error } = await supabase.from("questions").insert([question]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Processed and saved ${processedQuestions.length} questions from JSON input.`,
      });

      // Update recent entries
      fetchRecentEntries();

      // Clear the JSON input
      setJsonInput("");
      setShowJsonInput(false);
    } catch (error) {
      console.error("Error processing JSON input:", error);
      toast({
        title: "Error",
        description:
          "Failed to process JSON input. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseBoilerplate = (entry: Partial<Question>) => {
    setCurrentQuestion({
      ...entry,
      id: "",
      question_images: [],
      answer_images: [],
      imageUploadPending: false,
    });
    setMetadata({
      class: entry.class?.toString() || "",
      subject: entry.subject || "",
      bookName: entry.bookName || "",
      board: entry.board || "",
      chapterNo: entry.chapterNo || "",
      chapterName: entry.chapterName || "",
      section: entry.section || "",
      type: entry.type || "",
    });
  };

  const toggleImageUploadPending = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      imageUploadPending: !prev.imageUploadPending,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md">
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Question" : "Add New Question"}
        </h2>
        <div className="flex justify-between items-center">
          <Button onClick={() => setShowJsonInput(!showJsonInput)}>
            {showJsonInput ? "Single Question Entry" : "Bulk JSON Entry"}
          </Button>
          {!isEditing && !showJsonInput && (
            <div className="flex items-center space-x-2">
              <Input
                id="id"
                name="id"
                value={currentQuestion.id || ""}
                onChange={handleQuestionChange}
                placeholder="Enter question ID to edit"
              />
              <Button onClick={handleFetchQuestion}>Fetch Question</Button>
            </div>
          )}
        </div>
        {showJsonInput ? (
          <div className="space-y-4">
            <Label htmlFor="jsonInput">JSON Input (for bulk data entry)</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder="Paste JSON data here"
              rows={10}
            />
            <Button onClick={processJsonInput} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Process JSON"}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Recent Entries (Boilerplate)
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentEntries.map((entry) => (
                  <Button
                    key={entry.id}
                    onClick={() => handleUseBoilerplate(entry)}
                    variant="outline"
                  >
                    {entry.class} - {entry.subject} - {entry.board}
                  </Button>
                ))}
              </div>
            </div>
            <MetadataForm
              metadata={metadata}
              handleMetadataChange={handleMetadataChange}
            />
            <QuestionForm
              currentQuestion={currentQuestion}
              handleQuestionChange={handleQuestionChange}
              handleImageUpload={handleImageUpload}
              handleAddOption={handleAddOption}
              handleOptionChange={handleOptionChange}
              handleReviewStatusChange={handleReviewStatusChange}
              isSubmitting={isSubmitting}
              questionType={metadata.type}
            />
            <div className="flex justify-between items-center">
              <Button onClick={toggleImageUploadPending}>
                {currentQuestion.imageUploadPending
                  ? "Image Upload Complete"
                  : "Mark Image Upload Pending"}
              </Button>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setCurrentQuestion({
                      id: "",
                      isReviewed: false,
                      reviewedBy: user?.fullName || undefined,
                      question: "",
                      question_images: [],
                      answer: "",
                      answer_images: [],
                      options: {},
                      marks: 1,
                      imageUploadPending: false,
                    });
                    setIsEditing(false);
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  onClick={isEditing ? handleEditQuestion : handleSaveQuestion}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                    ? "Update Question"
                    : "Add Question"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
