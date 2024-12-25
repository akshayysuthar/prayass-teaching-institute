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
  const [processedQuestions, setProcessedQuestions] = useState<
    Partial<Question>[]
  >([]);
  const [isVerified, setIsVerified] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  useEffect(() => {
    const savedCurrentQuestion = localStorage.getItem("currentQuestion");
    const savedMetadata = localStorage.getItem("metadata");
    if (savedCurrentQuestion)
      setCurrentQuestion(JSON.parse(savedCurrentQuestion));
    if (savedMetadata) setMetadata(JSON.parse(savedMetadata));
  }, []);

  useEffect(() => {
    localStorage.setItem("currentQuestion", JSON.stringify(currentQuestion));
    localStorage.setItem("metadata", JSON.stringify(metadata));
  }, [currentQuestion, metadata]);

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
        // Remove or update any fields that do not exist in the database schema
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
      localStorage.removeItem("currentQuestion");
      localStorage.removeItem("metadata");
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

      const questionsToProcess = parsedQuestions.map((q) => ({
        ...metadata,
        ...q,
        id: generateSixDigitId(),
        isReviewed: false,
        reviewedBy: user?.fullName || undefined,
        question_images: q.question_images || [],
        answer_images: q.answer_images || [],
      }));

      setProcessedQuestions(questionsToProcess);
      setIsVerified(false);
      setCurrentIndex(0);

      // Set metadata and current question for the first question in the array
      if (questionsToProcess.length > 0) {
        const firstQuestion = questionsToProcess[0];
        setMetadata({
          class: firstQuestion.class?.toString() || "",
          subject: firstQuestion.subject || "",
          bookName: firstQuestion.bookName || "",
          board: firstQuestion.board || "",
          chapterNo: firstQuestion.chapterNo || "",
          chapterName: firstQuestion.chapterName || "",
          section: firstQuestion.section || "",
          type: firstQuestion.type || "",
        });
        setCurrentQuestion(firstQuestion);
      }

      toast({
        title: "Success",
        description: `Parsed ${questionsToProcess.length} questions. Please verify before uploading.`,
      });
    } catch (error) {
      console.error("Error processing JSON input:", error);
      toast({
        title: "Error",
        description:
          "Failed to process JSON input. Please check the format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadVerifiedQuestions = async () => {
    setIsSubmitting(true);
    try {
      for (const question of processedQuestions) {
        const { error } = await supabase.from("questions").insert([question]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Uploaded ${processedQuestions.length} verified questions.`,
      });

      // Update recent entries
      fetchRecentEntries();

      // Clear the JSON input and processed questions
      setJsonInput("");
      setProcessedQuestions([]);
      setShowJsonInput(false);
    } catch (error) {
      console.error("Error uploading verified questions:", error);
      toast({
        title: "Error",
        description: "Failed to upload verified questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < processedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentQuestion(processedQuestions[currentIndex + 1]);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentQuestion(processedQuestions[currentIndex - 1]);
    }
  };

  const handleUpdateCurrentQuestion = (updatedQuestion: Partial<Question>) => {
    setProcessedQuestions((prev) =>
      prev.map((q, index) => (index === currentIndex ? updatedQuestion : q))
    );
    setCurrentQuestion(updatedQuestion);
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
            {processedQuestions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Processed Questions:</h3>
                <div className="flex justify-between items-center mb-4">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentIndex === 0}
                  >
                    Previous
                  </Button>
                  <span>
                    Question {currentIndex + 1} of {processedQuestions.length}
                  </span>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentIndex === processedQuestions.length - 1}
                  >
                    Next
                  </Button>
                </div>
                <MetadataForm
                  metadata={metadata}
                  handleMetadataChange={handleMetadataChange}
                />
                <QuestionForm
                  currentQuestion={currentQuestion}
                  handleQuestionChange={(e) =>
                    handleUpdateCurrentQuestion({
                      ...currentQuestion,
                      [e.target.name]: e.target.value,
                    })
                  }
                  handleImageUpload={handleImageUpload}
                  handleAddOption={handleAddOption}
                  handleOptionChange={(key, value) =>
                    handleUpdateCurrentQuestion({
                      ...currentQuestion,
                      options: {
                        ...currentQuestion.options,
                        [key]: value,
                      },
                    })
                  }
                  handleReviewStatusChange={(isReviewed) =>
                    handleUpdateCurrentQuestion({
                      ...currentQuestion,
                      isReviewed,
                    })
                  }
                  questionType={metadata.type}
                />
                <Button
                  onClick={() => setIsVerified(true)}
                  className="mt-2"
                  variant="outline"
                >
                  Verify Data
                </Button>
                {isVerified && (
                  <Button
                    onClick={handleUploadVerifiedQuestions}
                    disabled={isSubmitting}
                    className="mt-2"
                  >
                    {isSubmitting ? "Uploading..." : "Upload Verified Data"}
                  </Button>
                )}
              </div>
            )}
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
              questionType={metadata.type}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center justify-center gap-3">
              <Button variant={"outline"} onClick={toggleImageUploadPending}>
                {currentQuestion.imageUploadPending
                  ? "Image Upload Complete"
                  : "Image Upload Pending"}
              </Button>

              <Button
                className="bg-green-500 hover:bg-green-600/55"
                variant={"secondary"}
                onClick={isEditing ? handleEditQuestion : handleSaveQuestion}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Update Question"
                  : "Add Question"}
              </Button>

              <Button
                className="mt-5"
                variant={"destructive"}
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
                  localStorage.removeItem("currentQuestion");
                  localStorage.removeItem("metadata");
                }}
              >
                Clear Form
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
