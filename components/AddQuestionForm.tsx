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
  const [question, setQuestion] = useState<Partial<Question>>({
    id: "",
    class: 6,
    subject: "",
    bookName: "",
    board: "",
    Ch: "",
    chapterName: "",
    name: "",
    type: "",
    question: "",
    questionImages: [],
    answer: "",
    answerImages: [],
    marks: 1,
    isReviewed: "false",
    reviewedBy: "",
    lastUpdated: new Date().toISOString(),
    options: {},
    selectionCount: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const generateQuestionId = () => {
    return Math.random().toString().slice(2, 12);
  };

  useEffect(() => {
    setQuestion((prev) => ({ ...prev, id: generateQuestionId() }));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (option: string, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: { ...prev.options, [option]: value },
    }));
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

      setQuestion((prev) => ({
        ...prev,
        [type === "question" ? "questionImages" : "answerImages"]: [
          ...(prev[type === "question" ? "questionImages" : "answerImages"] ||
            []),
          ...validImages,
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
          id: question.id,
          class: question.class,
          subject: question.subject,
          book_name: question.bookName,
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
          selection_count: 0,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully!",
      });

      // Reset only specific fields
      setQuestion((prev) => ({
        ...prev,
        id: generateQuestionId(),
        question: "",
        questionImages: [],
        answer: "",
        answerImages: [],
        options: {},
      }));
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuestion((prev) => ({
      ...prev,
      id: generateQuestionId(),
      question: "",
      questionImages: [],
      answer: "",
      answerImages: [],
      options: {},
    }));
    toast({
      title: "Form Reset",
      description: "The form has been partially reset.",
    });
  };

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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4"
    >
      <div>
        <Label htmlFor="id">Question ID</Label>
        <Input id="id" name="id" value={question.id} readOnly />
      </div>
      <div>
        <Label htmlFor="class">Class</Label>
        <Select
          name="class"
          onValueChange={(value) => handleSelectChange("class", value)}
          value={question.class?.toString()}
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
          value={question.board}
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
          value={question.subject}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjectOptions[question.class as keyof typeof subjectOptions]?.map(
              (subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
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
      <div className="col-span-2">
        <Label htmlFor="type">Section Type</Label>
        <Select
          name="type"
          onValueChange={(value) => handleSelectChange("type", value)}
          value={question.type}
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
          value={question.question}
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
          {question.questionImages?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Question image ${index + 1}`}
              className="w-24 h-24 object-cover"
            />
          ))}
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
          {question.answerImages?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Answer image ${index + 1}`}
              className="w-24 h-24 object-cover"
            />
          ))}
        </div>
      </div>
      {question.type === "MCQs" && (
        <div className="col-span-2">
          <Label>Options</Label>
          {["A", "B", "C", "D"].map((option) => (
            <Input
              key={option}
              placeholder={`Option ${option}`}
              value={question.options?.[option] || ""}
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
          value={question.answer as string}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <Label>Marks</Label>
        <RadioGroup
          onValueChange={(value) => handleSelectChange("marks", value)}
          value={question.marks?.toString()}
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
      <div className="col-span-2 mx-5 items-center flex justify-start gap-5">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding Question..." : "Add Question"}
        </Button>
        <Button type="button" onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>
    </form>
  );
}
