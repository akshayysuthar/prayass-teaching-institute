"use client";

import { useState, useEffect } from "react";
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

export function AddQuestionForm() {
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [metadata, setMetadata] = useState({
    class: "",
    subject: "",
    bookName: "",
    board: "",
    Ch: "",
    chapterName: "",
  });
  const { toast } = useToast();

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: name === "class" ? parseInt(value, 10) : value,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        [name]:
          name === "marks" || name === "class"
            ? value === ""
              ? null
              : parseInt(value, 10)
            : value,
      };
      return updatedQuestions;
    });
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
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
          reviewedBy: "System",
          lastUpdated: new Date().toISOString(),
          selectionCount: 0,
          questionImages: [],
          answerImages: [],
        }));
        setQuestions(processedQuestions);
        setCurrentQuestionIndex(0);
        toast({
          title: "Success",
          description: `Processed ${processedQuestions.length} questions from JSON input.`,
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
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        isReviewed,
        reviewedBy: isReviewed ? "Current User" : "System",
        lastUpdated: new Date().toISOString(),
      };
      return updatedQuestions;
    });
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

      setQuestions((prevQuestions) => {
        const updatedQuestions = [...prevQuestions];
        const imageField =
          type === "question" ? "questionImages" : "answerImages";
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          [imageField]: [
            ...(updatedQuestions[currentQuestionIndex][imageField] || []),
            publicUrl,
          ],
        };
        return updatedQuestions;
      });
    }
  };

  const handleUploadQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion.isReviewed) {
      toast({
        title: "Error",
        description: "Please review the question before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting question:", currentQuestion);

      const { error } = await supabase.from("questions").upsert({
        id: currentQuestion.id,
        class: metadata.class ? parseInt(metadata.class, 10) : null,
        subject: metadata.subject,
        book_name: metadata.bookName,
        board: metadata.board,
        Ch: metadata.Ch,
        chapterName: metadata.chapterName,
        section: currentQuestion.section,
        type: currentQuestion.type,
        question: currentQuestion.question,
        question_images: currentQuestion.questionImages,
        answer: currentQuestion.answer,
        answer_images: currentQuestion.answerImages,
        marks: currentQuestion.marks
          ? parseInt(currentQuestion.marks.toString(), 10)
          : null,
        is_reviewed: currentQuestion.isReviewed,
        reviewed_by: currentQuestion.reviewedBy,
        last_updated: currentQuestion.lastUpdated,
        selectionCount: currentQuestion.selectionCount || 0,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question uploaded successfully!",
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Clear the form after uploading all questions
        setQuestions([]);
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error("Error uploading question:", error);
      toast({
        title: "Error",
        description: "Failed to upload question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertImagePlaceholder = (field: "question" | "answer") => {
    const textarea = document.getElementById(field) as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, cursorPos);
      const textAfter = textarea.value.substring(cursorPos);
      const newText = `${textBefore}[img${
        (questions[currentQuestionIndex][`${field}Images`]?.length || 0) + 1
      }]${textAfter}`;

      setQuestions((prevQuestions) => {
        const updatedQuestions = [...prevQuestions];
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          [field]: newText,
        };
        return updatedQuestions;
      });

      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 5;
        textarea.focus();
      }, 0);
    }
  };

  const addNewQuestion = () => {
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      {
        ...metadata,
        id: Math.random().toString(36).substr(2, 9),
        isReviewed: false,
        reviewedBy: "System",
        lastUpdated: new Date().toISOString(),
        selectionCount: 0,
        questionImages: [],
        answerImages: [],
        class: parseInt(metadata.class, 10),
      },
    ]);
    setCurrentQuestionIndex(questions.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      // Ctrl + Enter to review and upload
      if (e.key === "Enter") {
        e.preventDefault(); // Prevents form submission
        handleReviewStatusChange(true);
        handleUploadQuestion();
      }
      // Ctrl + Left Arrow to go to previous question
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
      }
      // Ctrl + Right Arrow to go to next question
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentQuestionIndex((prev) =>
          Math.min(questions.length - 1, prev + 1)
        );
      }
    }
  };

  // Add key event listener when component mounts and remove on unmount
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [questions, currentQuestionIndex]); // Dependencies for when questions or currentQuestionIndex change

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
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md">
        <h3 className="text-lg font-semibold">
          Metadata (applies to all questions)
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
            <Label htmlFor="Ch">Chapter</Label>
            <Input
              id="Ch"
              name="Ch"
              value={metadata.Ch}
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
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="jsonMode"
            checked={isJsonMode}
            onCheckedChange={setIsJsonMode}
          />
          <Label htmlFor="jsonMode">Use JSON Input</Label>
        </div>

        {isJsonMode ? (
          <>
            <Label htmlFor="jsonInput">JSON Input (for bulk data entry)</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder="Paste JSON data here"
              rows={10}
            />
            <Button onClick={processJsonInput}>Process JSON</Button>
          </>
        ) : (
          <Button onClick={addNewQuestion}>Add New Question</Button>
        )}
      </div>

      {!isJsonMode && questions.length > 0 && (
        <div className="space-y-4 border p-4 rounded-md">
          <h3 className="text-lg font-semibold">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                name="section"
                value={questions[currentQuestionIndex]?.section || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Question Type</Label>
              <Select
                name="type"
                onValueChange={(value) =>
                  handleInputChange({ target: { name: "type", value } } as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="question">Question</Label>
              <div className="flex items-center space-x-2">
                <Textarea
                  id="question"
                  name="question"
                  value={questions[currentQuestionIndex]?.question || ""}
                  onChange={handleInputChange}
                  required
                />
                <Button
                  type="button"
                  onClick={() => insertImagePlaceholder("question")}
                >
                  Add Image
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="questionImage">Question Image</Label>
              <Input
                id="questionImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "question")}
              />
              {questions[currentQuestionIndex]?.questionImages && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {questions[currentQuestionIndex].questionImages.map(
                    (img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Question image ${index + 1}`}
                        className="w-24 h-24 object-cover"
                      />
                    )
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="answer">Answer</Label>
              <div className="flex items-center space-x-2">
                <Textarea
                  id="answer"
                  name="answer"
                  value={
                    (questions[currentQuestionIndex]?.answer as string) || ""
                  }
                  onChange={handleInputChange}
                  required
                />
                <Button
                  type="button"
                  onClick={() => insertImagePlaceholder("answer")}
                >
                  Add Image
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="answerImage">Answer Image</Label>
              <Input
                id="answerImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "answer")}
              />
              {questions[currentQuestionIndex]?.answerImages && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {questions[currentQuestionIndex].answerImages.map(
                    (img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Answer image ${index + 1}`}
                        className="w-24 h-24 object-cover"
                      />
                    )
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                name="marks"
                type="number"
                value={questions[currentQuestionIndex]?.marks ?? ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex justify-between">
              <Button
                onClick={() => {
                  // Mark the question as reviewed
                  const updatedQuestion = {
                    ...questions[currentQuestionIndex],
                    isReviewed: true,
                  };

                  // Update the question array (if needed, set this to the state)
                  setQuestions((prevQuestions) => {
                    const updatedQuestions = [...prevQuestions];
                    updatedQuestions[currentQuestionIndex] = updatedQuestion;
                    return updatedQuestions;
                  });

                  // Upload the question after marking it as reviewed
                  handleUploadQuestion();
                }}
              >
                {isSubmitting ? "Uploading..." : "Mark as Reviewed & Upload"}
              </Button>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
