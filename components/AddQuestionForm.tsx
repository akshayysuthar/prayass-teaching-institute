"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export function AddQuestionForm() {
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);
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
    reviewedBy: "Current User",
    question: "",
    question_images: [],
    answer: "",
    answer_images: [],
    options: {},
    marks: 0,
  });
  const { toast } = useToast();
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
      setCurrentQuestion(questions[currentQuestionIndex - 1]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setCurrentQuestion(questions[currentQuestionIndex + 1]);
    }
  };

  const processJsonInput = () => {
    try {
      const parsedQuestions = JSON.parse(jsonInput);
      if (Array.isArray(parsedQuestions)) {
        const processedQuestions = parsedQuestions.map((q) => ({
          ...q,
          ...metadata,
          id: Math.random().toString(36).substr(2, 9),
          isReviewed: false,
          reviewedBy: "Current User",
          questionImages: [],
          answerImages: [],
        }));
        setQuestions((prev) => [...prev, ...processedQuestions]);
        setCurrentQuestionIndex(0);
        setCurrentQuestion(processedQuestions[0]);
        toast({
          title: "Success",
          description: `Processed ${processedQuestions.length} questions from JSON input.`,
        });
      } else if (typeof parsedQuestions === "object") {
        const processedQuestion = {
          ...parsedQuestions,
          ...metadata,
          id: Math.random().toString(36).substr(2, 9),
          isReviewed: false,
          reviewedBy: "Current User",
          questionImages: [],
          answerImages: [],
        };
        setQuestions((prev) => [...prev, processedQuestion]);
        setCurrentQuestionIndex(0);
        setCurrentQuestion(processedQuestion);
        toast({
          title: "Success",
          description: `Processed 1 question from JSON input.`,
        });
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (error) {
      console.error("Error processing JSON input:", error);
      toast({
        title: "Error",
        description: "Failed to process JSON input. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleReviewStatusChange = (isReviewed: boolean) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      isReviewed,
      reviewedBy: isReviewed ? "Current User" : "System",
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

      // Add placeholder to the input
      const inputRef = type === "question" ? questionInputRef : answerInputRef;
      if (inputRef.current) {
        const cursorPosition = inputRef.current.selectionStart;
        const textBeforeCursor = inputRef.current.value.substring(
          0,
          cursorPosition
        );
        const textAfterCursor =
          inputRef.current.value.substring(cursorPosition);
        const newText = `${textBeforeCursor}[img${
          (currentQuestion[`${type}Images`]?.length || 0) + 1
        }]${textAfterCursor}`;

        setCurrentQuestion((prev) => ({
          ...prev,
          [type]: newText,
        }));

        // Set cursor position after the inserted placeholder
        setTimeout(() => {
          inputRef.current!.selectionStart = inputRef.current!.selectionEnd =
            cursorPosition + 5;
          inputRef.current!.focus();
        }, 0);
      }
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
      };
      console.log("Saving question:", questionToSave);

      const { error } = await supabase.from("questions").upsert(questionToSave);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question saved successfully!",
      });

      // Add the current question to the questions array if it's new
      if (!questions.some((q) => q.id === currentQuestion.id)) {
        setQuestions((prev) => [...prev, currentQuestion]);
      } else {
        // Update the question in the questions array
        setQuestions((prev) =>
          prev.map((q) => (q.id === currentQuestion.id ? currentQuestion : q))
        );
      }

      // Clear the current question form for a new entry
      setCurrentQuestion({
        id: Math.random().toString(36).substr(2, 9),
        isReviewed: false,
        reviewedBy: "Current User",
        question: "",
        questionImages: [],
        answer: "",
        answerImages: [],
        options: {},
        marks: 0,
      });
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

  const handleEditQuestion = (id: string) => {
    const questionToEdit = questions.find((q) => q.id === id);
    if (questionToEdit) {
      setCurrentQuestion(questionToEdit);
    }
  };

  const handleAddMoreQuestions = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        isReviewed: false,
        reviewedBy: "Current User",
        question: "",
        questionImages: [],
        answer: "",
        answerImages: [],
        options: {},
        marks: 0,
      },
    ]);
    setCurrentQuestionIndex(questions.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePreviousQuestion();
      } else if (e.key === "ArrowRight") {
        handleNextQuestion();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleSaveQuestion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentQuestionIndex, questions]);

  const classOptions = [6, 7, 8, 9, 10];
  const boardOptions = ["CBSE", "GSEB"];
  const subjectOptions = {
    6: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Gujarati",
      "Sanskrit",
    ],
    7: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Gujarati",
      "Sanskrit",
    ],
    8: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Gujarati",
      "Sanskrit",
    ],
    9: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Gujarati",
      "Sanskrit",
    ],
    10: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Gujarati",
      "Sanskrit",
    ],
  };
  const questionTypes = [
    "MCQs",
    "Short Answer",
    "Long Answer",
    "One Line",
    "One Word",
    "True or False",
  ];

  return (
    <div className="space-y-8 grid grid-cols-1 lg:grid-cols-2  items-baseline gap-3 ">
      <div className="space-y-4 col-span-1 border p-4 rounded-md">
        <div>
          <div className="space-y-4">
            <Button onClick={() => setShowJsonInput(!showJsonInput)}>
              {showJsonInput ? "Hide JSON Input" : "Show JSON Input"}
            </Button>
            {showJsonInput && (
              <>
                <Label htmlFor="jsonInput">
                  JSON Input (for bulk data entry)
                </Label>
                <Textarea
                  id="jsonInput"
                  value={jsonInput}
                  onChange={handleJsonInputChange}
                  placeholder="Paste JSON data here"
                  rows={10}
                />
                <Button onClick={processJsonInput}>Process JSON</Button>
              </>
            )}
          </div>
          <h3 className="text-lg font-semibold">
            Metadata (applies to all questions in this chapter)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class">Class</Label>
              <Select
                name="class"
                onValueChange={(value) =>
                  handleMetadataChange({
                    target: { name: "class", value },
                  } as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((classNum) => (
                    <SelectItem key={classNum} value={classNum.toString()}>
                      {classNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select
                name="subject"
                onValueChange={(value) =>
                  handleMetadataChange({
                    target: { name: "subject", value },
                  } as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions[
                    metadata.class as unknown as keyof typeof subjectOptions
                  ]?.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bookName">Book Name</Label>
              <Input
                id="bookName"
                name="bookName"
                value={metadata.bookName}
                onChange={handleMetadataChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="board">Board</Label>
              <Select
                name="board"
                onValueChange={(value) =>
                  handleMetadataChange({
                    target: { name: "board", value },
                  } as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  {boardOptions.map((board) => (
                    <SelectItem key={board} value={board}>
                      {board}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="chapterNo">Chapter Number</Label>
              <Input
                id="chapterNo"
                name="chapterNo"
                value={metadata.chapterNo}
                onChange={handleMetadataChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="chapterName">Chapter Name</Label>
              <Input
                id="chapterName"
                name="chapterName"
                value={metadata.chapterName}
                onChange={handleMetadataChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                name="section"
                value={metadata.section}
                onChange={handleMetadataChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Question Type</Label>
              <Input
                id="type"
                name="type"
                value={metadata.type}
                onChange={handleMetadataChange}
                required
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="space-y-4 col-span-1 border p-4 rounded-md">
          <h3 className="text-lg font-semibold">Add/Edit Question</h3>
          <div className="flex justify-between items-center">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="space-y-4 grid grid-cols-1 items-center gap-2">
            <div>
              <Label htmlFor="question">Question</Label>
              <div className="grid grid-cols-4 items-center justify-between space-x-2">
                <Textarea
                  className="col-span-4"
                  id="question"
                  name="question"
                  value={currentQuestion.question || ""}
                  onChange={handleQuestionChange}
                  required
                  ref={questionInputRef}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "question")}
                  className="hidden"
                  id="questionImageUpload"
                />
                <Button
                  type="button"
                  className="col-span-1"
                  onClick={() =>
                    document.getElementById("questionImageUpload")?.click()
                  }
                >
                  Add Image
                </Button>
                {currentQuestion.questionImages &&
                  currentQuestion.questionImages.length > 0 && (
                    <div className="mt-2 col-span-3 flex flex-wrap gap-2">
                      {currentQuestion.questionImages.map((img, index) => (
                        <Image
                          width={100}
                          height={100}
                          key={index}
                          src={img}
                          alt={`Question image ${index + 1}`}
                          className="w-24 h-24 object-cover"
                        />
                      ))}
                    </div>
                  )}
              </div>
            </div>
            {metadata.type === "MCQs" && (
              <div>
                <Label>Options</Label>
                {Object.entries(currentQuestion.options || {}).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 mt-2">
                      <Input
                        value={value}
                        onChange={(e) =>
                          handleOptionChange(key, e.target.value)
                        }
                        placeholder={`Option ${key}`}
                      />
                    </div>
                  )
                )}
                <Button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2"
                >
                  Add Option
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="answer">Answer</Label>
              <div className="grid grid-cols-4 items-center justify-between space-x-2">
                <Textarea
                  id="answer"
                  name="answer"
                  className="col-span-4"
                  value={(currentQuestion.answer as string) || ""}
                  onChange={handleQuestionChange}
                  required
                  ref={answerInputRef}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "answer")}
                  className="hidden"
                  id="answerImageUpload"
                />
                <Button
                  type="button"
                  className="col-span-1"
                  onClick={() =>
                    document.getElementById("answerImageUpload")?.click()
                  }
                >
                  Add Image
                </Button>
                {currentQuestion.answerImages &&
                  currentQuestion.answerImages.length > 0 && (
                    <div className="mt-2 col-span-3 flex flex-wrap gap-2">
                      {currentQuestion.answerImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Answer image ${index + 1}`}
                          className="w-24 h-24 object-cover"
                        />
                      ))}
                    </div>
                  )}
              </div>
            </div>
            <div>
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                name="marks"
                type="number"
                value={currentQuestion.marks || ""}
                onChange={handleQuestionChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() =>
                  handleReviewStatusChange(!currentQuestion.isReviewed)
                }
              >
                {currentQuestion.isReviewed
                  ? "Unmark as Reviewed"
                  : "Mark as Reviewed"}
              </Button>
            </div>
            <div>
              <div className="space-y-4 col-span-1 border p-4 rounded-md">
                <h3 className="text-lg font-semibold">Add/Edit Question</h3>
                <div className="space-y-4 grid grid-cols-1 items-center gap-2">
                  {/* Existing question form code */}
                  <Button onClick={handleSaveQuestion} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Question"}
                  </Button>
                  <div className="flex justify-between">
                    <Button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4 border p-4 rounded-md">
          <h3 className="text-lg font-semibold">Saved Questions</h3>
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="flex justify-between items-center"
            >
              <span>
                {index + 1}. {question.question}
              </span>
              <Button
                onClick={() => question.id && handleEditQuestion(question.id)}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleAddMoreQuestions}>Add More Questions</Button>
    </div>
  );
}
