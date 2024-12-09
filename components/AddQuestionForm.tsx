"use client";

import { useState } from "react";
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

export function AddQuestionForm() {
  const [question, setQuestion] = useState<Partial<Question>>({
    class: 0,
    subject: "",
    board: "",
    Ch: "",
    chapterName: "",
    name: "",
    type: "",
    question: "",
    questionImages: [],
    answer: "",
    answerImages: [],
    marks: 0,
    isReviewed: "false",
    reviewedBy: "",
    lastUpdated: new Date().toISOString(),
    options: {},
    bookName: "",
  });
  const [imageType, setImageType] = useState<"question" | "answer">("question");
  const [optionCount, setOptionCount] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: { ...prev.options, [`option${index + 1}`]: value },
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("question-images")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading image:", error);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-images").getPublicUrl(fileName);

      setQuestion((prev) => ({
        ...prev,
        [imageType === "question" ? "questionImages" : "answerImages"]: [
          ...(prev[
            imageType === "question" ? "questionImages" : "answerImages"
          ] || []),
          publicUrl,
        ],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("questions").insert([
        {
          class: question.class,
          subject: question.subject,
          board: question.board,
          Ch: question.Ch,
          chapter_name: question.chapterName,
          name: question.name,
          type: question.type,
          question: question.question,
          question_images: question.questionImages,
          answer: question.answer,
          answer_images: question.answerImages,
          marks: question.marks,
          is_reviewed: question.isReviewed === "true",
          reviewed_by: question.reviewedBy,
          last_updated: question.lastUpdated,
          options: question.options,
          book_name: question.bookName,
        },
      ]);

      if (error) throw error;

      alert("Question added successfully!");
      // Reset the form
      setQuestion({
        class: 0,
        subject: "",
        board: "",
        Ch: "",
        chapterName: "",
        name: "",
        type: "",
        question: "",
        questionImages: [],
        answer: "",
        answerImages: [],
        marks: 0,
        isReviewed: "false",
        reviewedBy: "",
        lastUpdated: new Date().toISOString(),
        options: {},
        bookName: "",
      });
      setOptionCount(4);
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="class">Class</Label>
        <Input
          id="class"
          name="class"
          type="number"
          value={question.class}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          value={question.subject}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="board">Board</Label>
        <Input
          id="board"
          name="board"
          value={question.board}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="Ch">Chapter ID</Label>
        <Input
          id="Ch"
          name="Ch"
          value={question.Ch}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="chapterName">Chapter Name</Label>
        <Input
          id="chapterName"
          name="chapterName"
          value={question.chapterName}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">Question Name</Label>
        <Input
          id="name"
          name="name"
          value={question.name}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Question Type</Label>
        <Select
          name="type"
          onValueChange={(value) => handleSelectChange("type", value)}
          value={question.type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
            <SelectItem value="short-answer">Short Answer</SelectItem>
            <SelectItem value="long-answer">Long Answer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          name="question"
          value={question.question}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label>Question Images</Label>
        <RadioGroup
          value={imageType}
          onValueChange={(value: string) =>
            setImageType(value as "question" | "answer")
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="question" id="question-image" />
            <Label htmlFor="question-image">Question Image</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="answer" id="answer-image" />
            <Label htmlFor="answer-image">Answer Image</Label>
          </div>
        </RadioGroup>
        <Input type="file" onChange={handleImageUpload} accept="image/*" />
      </div>
      {question.type === "multiple-choice" && (
        <div>
          <Label>Options</Label>
          {Array.from({ length: optionCount }).map((_, index) => (
            <Input
              key={index}
              placeholder={`Option ${index + 1}`}
              value={question.options?.[`option${index + 1}`] || ""}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="mt-2"
            />
          ))}
          <Button
            type="button"
            onClick={() => setOptionCount((prev) => prev + 1)}
            className="mt-2"
          >
            Add Option
          </Button>
        </div>
      )}
      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          name="answer"
          value={question.answer as string}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="marks">Marks</Label>
        <Input
          id="marks"
          name="marks"
          type="number"
          value={question.marks}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="isReviewed">Is Reviewed</Label>
        <Select
          name="isReviewed"
          onValueChange={(value) => handleSelectChange("isReviewed", value)}
          value={question.isReviewed}
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
          value={question.reviewedBy}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="bookName">Book Name</Label>
        <Input
          id="bookName"
          name="bookName"
          value={question.bookName}
          onChange={handleInputChange}
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding Question..." : "Add Question"}
      </Button>
    </form>
  );
}
