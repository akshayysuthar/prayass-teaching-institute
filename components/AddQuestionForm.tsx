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
  const [recentEntries, setRecentEntries] = useState<Record<string, Partial<Question>[]>>({});
  const [metadata, setMetadata] = useState({
    contentId: "",
    subjectId: "",
    sectionTitle: "",
    type: "",
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    id: "",
    question: "",
    questionImages: [],
    answer: "",
    answerImages: [],
    marks: 1,
    selectionCount: 0,
    isReviewed: false,
    reviewedBy: "",
  });
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchRecentEntries();
    }
  }, [user]);

  const fetchRecentEntries = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching recent entries:", error);
    } else {
      const entriesBySubject: Record<string, Partial<Question>[]> = {};
      data?.forEach((question) => {
        if (!entriesBySubject[question.subject_id]) {
          entriesBySubject[question.subject_id] = [];
        }
        if (entriesBySubject[question.subject_id].length < 5) {
          entriesBySubject[question.subject_id].push(question);
        }
      });
      setRecentEntries(entriesBySubject);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      reviewedBy: isReviewed ? user?.fullName || "Current User" : "",
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
        [`${type}Images`]: [...(prev[`${type}Images`] || []), publicUrl],
      }));
    }
  };

  const handleSaveQuestion = async () => {
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
      const questionToSave = {
        ...metadata,
        ...currentQuestion,
        createdBy: user.id,
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

      fetchRecentEntries();

      setCurrentQuestion({
        id: "",
        question: "",
        questionImages: [],
        answer: "",
        answerImages: [],
        marks: 1,
        selectionCount: 0,
        isReviewed: false,
        reviewedBy: "",
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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit questions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const questionToUpdate = {
        ...metadata,
        ...currentQuestion,
        lastEditedBy: user.id,
      };
      console.log("Updating question:", questionToUpdate);

      const { data, error } = await supabase
        .from("questions")
        .update(questionToUpdate)
        .eq('id', questionToUpdate.id)
        .select();

      if (error) throw error;

      console.log("Question updated successfully:", data);

      toast({
        title: "Success",
        description: "Question updated successfully!",
      });

      fetchRecentEntries();

      setCurrentQuestion({
        id: "",
        question: "",
        questionImages: [],
        answer: "",
        answerImages: [],
        marks: 1,
        selectionCount: 0,
        isReviewed: false,
        reviewedBy: "",
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
          contentId: data.subject_id,
          subjectId: data.subject_id,
          sectionTitle: data.section_title,
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

  if (!user) {
    return <div>Please log in to access this form.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md">
        <h2 className="text-2xl font-bold">{isEditing ? "Edit Question" : "Add New Question"}</h2>
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
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON data here"
              rows={10}
            />
            <Button onClick={() => {/* Implement JSON processing logic */}} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Process JSON"}
            </Button>
          </div>
        ) : (
          <>
            <MetadataForm metadata={metadata} handleMetadataChange={handleMetadataChange} />
            <QuestionForm
              currentQuestion={currentQuestion}
              handleQuestionChange={handleQuestionChange}
              handleImageUpload={handleImageUpload}
              handleReviewStatusChange={handleReviewStatusChange}
              isSubmitting={isSubmitting}
              questionType={metadata.type}
            />
            <div className="flex justify-between items-center">
              <Button onClick={() => {
                setCurrentQuestion({
                  id: "",
                  question: "",
                  questionImages: [],
                  answer: "",
                  answerImages: [],
                  marks: 1,
                  selectionCount: 0,
                  isReviewed: false,
                  reviewedBy: "",
                });
                setIsEditing(false);
              }}>
                Clear Form
              </Button>
              <Button onClick={isEditing ? handleEditQuestion : handleSaveQuestion} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (isEditing ? "Update Question" : "Add Question")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

