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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AddQuestionForm() {
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionId, setQuestionId] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  const generateQuestionId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        [name]: value,
      };
      return updatedQuestions;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        [name]: value,
      };
      return updatedQuestions;
    });
  };

  const handleOptionChange = (option: string, value: string) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        options: {
          ...updatedQuestions[currentQuestionIndex].options,
          [option]: value,
        },
      };
      return updatedQuestions;
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "answer"
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedImages = await Promise.all(
        Array.from(e.target.files).map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { data, error } = await supabase.storage
            .from("question-images")
            .upload(fileName, file);

          if (error) {
            console.error("Error uploading image:", error);
            return null;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("question-images").getPublicUrl(fileName);

          return publicUrl;
        })
      );

      const validImages = uploadedImages.filter(
        (url): url is string => url !== null
      );

      setQuestions((prevQuestions) => {
        const updatedQuestions = [...prevQuestions];
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          [type === "question" ? "questionImages" : "answerImages"]: [
            ...(updatedQuestions[currentQuestionIndex][
              type === "question" ? "questionImages" : "answerImages"
            ] || []),
            ...validImages,
          ],
        };
        return updatedQuestions;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("questions").upsert(
        questions.map((q) => ({
          id: q.id,
          class: q.class,
          subject: q.subject,
          book_name: q.bookName,
          board: q.board,
          Ch: q.Ch,
          chapterName: q.chapterName,
          section: q.section,
          type: q.type,
          question: q.question,
          question_images: q.questionImages,
          answer: q.answer,
          answer_images: q.answerImages,
          marks: q.marks,
          is_reviewed: q.isReviewed === "true",
          reviewed_by: q.reviewedBy,
          last_updated: q.lastUpdated,
          options: q.options,
        }))
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: `${questions.length} question(s) uploaded successfully!`,
      });

      setQuestions([]);
      setCurrentQuestionIndex(0);
      setJsonInput("");
      fetchUploadedQuestions();
    } catch (error) {
      console.error("Error adding/updating questions:", error);
      toast({
        title: "Error",
        description: "Failed to upload questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchQuestion = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setQuestions([
          {
            ...data,
            isReviewed: data.is_reviewed ? "true" : "false",
            bookName: data.book_name,
            chapterName: data.chapter_name,
            questionImages: data.question_images || [],
            answerImages: data.answer_images || [],
            selectionCount: data.selection_count,
          },
        ]);
        setCurrentQuestionIndex(0);
      } else {
        toast({
          title: "Not Found",
          description: "Question not found.",
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

  const processJsonInput = () => {
    try {
      const parsedQuestions = JSON.parse(jsonInput);
      if (Array.isArray(parsedQuestions)) {
        const processedQuestions = parsedQuestions.map((q) => ({
          ...q,
          id: generateQuestionId(),
          reviewedBy: q.reviewedBy || "System",
          selectionCount: q.selectionCount || 0,
          lastUpdated: q.lastUpdated || new Date().toISOString(),
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

  const fetchUploadedQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setUploadedQuestions(data || []);
    } catch (error) {
      console.error("Error fetching uploaded questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUploadedQuestions();
  }, []);

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
  const marksOptions = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-8">
      <div className="col-span-2">
        <Label htmlFor="questionId">Question ID (for editing)</Label>
        <div className="flex space-x-2">
          <Input
            id="questionId"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            placeholder="Enter question ID to edit"
          />
          <Button type="button" onClick={() => fetchQuestion(questionId)}>
            Fetch
          </Button>
        </div>
      </div>

      <div className="col-span-2">
        <Label htmlFor="jsonInput">JSON Input (for bulk data entry)</Label>
        <Textarea
          id="jsonInput"
          value={jsonInput}
          onChange={handleJsonInputChange}
          placeholder="Paste JSON data here"
          rows={10}
        />
        <Button type="button" onClick={processJsonInput} className="mt-2">
          Process JSON
        </Button>
      </div>

      {questions.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="col-span-2">
            <Label>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Label>
            <div className="flex space-x-2 mt-2">
              <Button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                type="button"
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

          <div>
            <Label htmlFor="id">Question ID</Label>
            <Input
              id="id"
              name="id"
              value={questions[currentQuestionIndex]?.id || ""}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="class">Class</Label>
            <Select
              name="class"
              onValueChange={(value) => handleSelectChange("class", value)}
              value={questions[currentQuestionIndex]?.class?.toString()}
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
            <Label htmlFor="board">Board</Label>
            <Select
              name="board"
              onValueChange={(value) => handleSelectChange("board", value)}
              value={questions[currentQuestionIndex]?.board}
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
            <Label htmlFor="subject">Subject</Label>
            <Select
              name="subject"
              onValueChange={(value) => handleSelectChange("subject", value)}
              value={questions[currentQuestionIndex]?.subject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions[
                  questions[currentQuestionIndex]
                    ?.class as keyof typeof subjectOptions
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
              value={questions[currentQuestionIndex]?.bookName || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="Ch">Chapter</Label>
            <Input
              id="Ch"
              name="Ch"
              value={questions[currentQuestionIndex]?.Ch || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="chapterName">Chapter Name</Label>
            <Input
              id="chapterName"
              name="chapterName"
              value={questions[currentQuestionIndex]?.chapterName || ""}
              onChange={handleInputChange}
              required
            />
          </div>
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
          <div className="col-span-2">
            <Label htmlFor="type">Question Type</Label>
            <Select
              name="type"
              onValueChange={(value) => handleSelectChange("type", value)}
              value={questions[currentQuestionIndex]?.type}
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
          <div className="col-span-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              name="question"
              value={questions[currentQuestionIndex]?.question || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="col-span-2">
            <Label>Question Images</Label>
            <Input
              type="file"
              onChange={(e) => handleImageUpload(e, "question")}
              accept="image/*"
              multiple
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {questions[currentQuestionIndex]?.questionImages?.map(
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
          </div>
          <div className="col-span-2">
            <Label>Answer Images</Label>
            <Input
              type="file"
              onChange={(e) => handleImageUpload(e, "answer")}
              accept="image/*"
              multiple
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {questions[currentQuestionIndex]?.answerImages?.map(
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
          </div>
          {questions[currentQuestionIndex]?.type === "MCQs" && (
            <div className="col-span-2">
              <Label>Options</Label>
              {["A", "B", "C", "D"].map((option) => (
                <Input
                  key={option}
                  placeholder={`Option ${option}`}
                  value={
                    questions[currentQuestionIndex]?.options?.[option] || ""
                  }
                  onChange={(e) => handleOptionChange(option, e.target.value)}
                  className="mt-2"
                />
              ))}
            </div>
          )}
          <div className="col-span-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              name="answer"
              value={(questions[currentQuestionIndex]?.answer as string) || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label>Marks</Label>
            <RadioGroup
              onValueChange={(value) => handleSelectChange("marks", value)}
              value={questions[currentQuestionIndex]?.marks?.toString()}
              className="flex space-x-2"
            >
              {marksOptions.map((mark) => (
                <div key={mark} className="flex items-center space-x-1">
                  <RadioGroupItem value={mark.toString()} id={`mark-${mark}`} />
                  <Label htmlFor={`mark-${mark}`}>{mark}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="isReviewed">Is Reviewed</Label>
            <Select
              name="isReviewed"
              onValueChange={(value) => handleSelectChange("isReviewed", value)}
              value={questions[currentQuestionIndex]?.isReviewed}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reviewedBy">Reviewed By</Label>
            <Input
              id="reviewedBy"
              name="reviewedBy"
              value={questions[currentQuestionIndex]?.reviewedBy || ""}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          <div className="col-span-2 flex justify-between">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload Questions"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recently Uploaded Questions</h2>
        <div className="space-y-4">
          {uploadedQuestions.map((q) => (
            <div key={q.id} className="border p-4 rounded">
              <h3 className="font-bold">{q.question}</h3>
              <p>
                Answer:{" "}
                {typeof q.answer === "string"
                  ? q.answer
                  : JSON.stringify(q.answer)}
              </p>
              <p>
                Class: {q.class}, Subject: {q.subject}, Chapter: {q.Ch}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
