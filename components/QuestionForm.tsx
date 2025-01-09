import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { Question } from "@/types";
import { X } from "lucide-react";

interface QuestionFormProps {
  currentQuestion: Partial<Question>;
  handleQuestionChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleImageUpload: (files: File[], type: "question" | "answer") => void;
  handleImageRemove: (index: number, type: "question" | "answer") => void;
  handleReviewStatusChange: (isReviewed: boolean) => void;
  isSubmitting: boolean;
  questionType: string;
}

export function QuestionForm({
  currentQuestion,
  handleQuestionChange,
  handleImageUpload,
  handleImageRemove,
  handleReviewStatusChange,
}: QuestionFormProps) {
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: "question" | "answer"
  ) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleImageUpload(files, type);
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    type: "question" | "answer"
  ) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleImageUpload(files, type);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <div
          className={`border-2 border-dashed rounded-md p-4 ${
            isDragging ? "border-primary" : "border-gray-300"
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "question")}
        >
          <Textarea
            className="w-full mb-2"
            id="question"
            name="question"
            value={currentQuestion.question || ""}
            onChange={handleQuestionChange}
            required
            ref={questionInputRef}
            onPaste={(e) => handlePaste(e, "question")}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {currentQuestion.question_images &&
              currentQuestion.question_images.map((img, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={img}
                    alt={`Question image ${index + 1}`}
                    width={100}
                    height={100}
                    className="object-cover rounded-md"
                  />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageRemove(index, "question")}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImageUpload(Array.from(e.target.files || []), "question")
            }
            className="mt-2"
            multiple
          />
        </div>
      </div>
      <div>
        <Label htmlFor="answer">Answer</Label>
        <div
          className={`border-2 border-dashed rounded-md p-4 ${
            isDragging ? "border-primary" : "border-gray-300"
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "answer")}
        >
          <Textarea
            id="answer"
            name="answer"
            className="w-full mb-2"
            value={(currentQuestion.answer as string) || ""}
            onChange={handleQuestionChange}
            required
            ref={answerInputRef}
            onPaste={(e) => handlePaste(e, "answer")}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {currentQuestion.answer_images &&
              currentQuestion.answer_images.map((img, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={img}
                    alt={`Answer image ${index + 1}`}
                    width={100}
                    height={100}
                    className="object-cover rounded-md"
                  />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageRemove(index, "answer")}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImageUpload(Array.from(e.target.files || []), "answer")
            }
            className="mt-2"
            multiple
          />
        </div>
      </div>
      <div>
        <Label htmlFor="marks">Marks</Label>
        <RadioGroup
          defaultValue={currentQuestion.marks?.toString() || "1"}
          onValueChange={(value) =>
            handleQuestionChange({
              target: { name: "marks", value },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          className="flex flex-wrap gap-4"
        >
          {[1, 2, 3, 4, 5].map((mark) => (
            <div key={mark} className="flex items-center space-x-2">
              <RadioGroupItem value={mark.toString()} id={`mark-${mark}`} />
              <Label htmlFor={`mark-${mark}`}>{mark}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => handleReviewStatusChange(!currentQuestion.is_reviewed)}
        >
          {currentQuestion.is_reviewed
            ? "Unmark as Reviewed"
            : "Mark as Reviewed"}
        </Button>
      </div>
    </div>
  );
}
