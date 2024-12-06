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
import { Question } from "@/types";

export function AddQuestionForm() {
  const [question, setQuestion] = useState<Partial<Question>>({
    id: "",
    name: "",
    Ch: "",
    class: 0,
    board: "",
    subject: "",
    type: "",
    question: "",
    answer: "",
    marks: 0,
    image: "",
    isReviewed: false,
    ReviewedBy: "",
    lastUpdated: new Date().toISOString(),
    isHaveImg: "false",
    images: "",
    questionImages: [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New question data:", question);
    // Here you would typically send the data to your backend API
    // For now, we'll just log it to the console
    alert("Question added! Check the console for details.");
    // Reset the form
    setQuestion({
      id: "",
      name: "",
      Ch: "",
      class: 0,
      board: "",
      subject: "",
      type: "",
      question: "",
      answer: "",
      marks: 0,
      image: "",
      isReviewed: false,
      ReviewedBy: "",
      lastUpdated: new Date().toISOString(),
      isHaveImg: "false",
      images: "",
      questionImages: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="id">Question ID</Label>
        <Input
          id="id"
          name="id"
          value={question.id}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={question.name}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="Ch">Chapter</Label>
        <Input
          id="Ch"
          name="Ch"
          value={question.Ch}
          onChange={handleInputChange}
          required
        />
      </div>
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
        <Label htmlFor="type">Question Type</Label>
        <Input
          id="type"
          name="type"
          value={question.type}
          onChange={handleInputChange}
          required
        />
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
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          name="answer"
          value={question.answer}
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
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          name="image"
          value={question.image}
          onChange={handleInputChange}
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
        <Label htmlFor="ReviewedBy">Reviewed By</Label>
        <Input
          id="ReviewedBy"
          name="ReviewedBy"
          value={question.ReviewedBy}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="isHaveImg">Has Image</Label>
        <Select
          name="isHaveImg"
          onValueChange={(value) => handleSelectChange("isHaveImg", value)}
          value={question.isHaveImg}
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
      <Button type="submit">Add Question</Button>
    </form>
  );
}
