"use client";

import type React from "react";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, X } from "lucide-react";
import Image from "next/image";
import type { Question } from "@/types";

interface QuestionFormProps {
  currentQuestion: Partial<Question>;
  handleQuestionChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleImageUpload: (
    files: File[],
    type: "question" | "answer",
    language: "en" | "gu"
  ) => void;
  handleImageRemove: (
    imageIndex: number,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => void;
  handlePasteImage: (
    e: React.ClipboardEvent,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => void;
  handleUpdateMarks: (increment: boolean) => void;
  isSubmitting: boolean;
  questionType: string;
  removeQuestion: () => void;
  selectedContentMedium: string;
  emptyFields: Record<string, boolean>;
}

export function QuestionForm({
  currentQuestion,
  handleQuestionChange,
  handleImageUpload,
  handleImageRemove,
  handlePasteImage,
  handleUpdateMarks,
  isSubmitting,
  questionType,
  removeQuestion,
  selectedContentMedium,
  emptyFields,
}: QuestionFormProps) {
  const [showGujarati] = useState(
    selectedContentMedium === "Gujarati" || selectedContentMedium === "Both"
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(Array.from(files), type, language);
      e.target.value = ""; // Reset the input
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={removeQuestion}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          disabled={isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Remove Question
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label
            htmlFor="question"
            className={`text-foreground ${
              emptyFields.question ? "text-red-500" : ""
            }`}
          >
            Question (English) {emptyFields.question && "*Required"}
          </Label>
          <Textarea
            id="question"
            name="question"
            value={currentQuestion.question || ""}
            onChange={handleQuestionChange}
            onPaste={(e) => handlePasteImage(e, "question", "en")}
            className={`mt-1 text-foreground ${
              emptyFields.question ? "border-red-500" : ""
            }`}
            rows={3}
            disabled={isSubmitting}
            placeholder={
              questionType === "MCQ"
                ? "Enter question with options (A) Option 1 (B) Option 2..."
                : "Enter question"
            }
          />
          <div className="mt-2">
            <Label htmlFor="question-image" className="text-foreground">
              Upload Image (English)
            </Label>
            <Input
              id="question-image"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "question", "en")}
              className="mt-1 text-foreground"
              disabled={isSubmitting}
              multiple
            />
          </div>
          {Array.isArray(currentQuestion.question_images) &&
            currentQuestion.question_images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentQuestion.question_images.map((url, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={url || "/placeholder.svg"}
                      alt={`Question image ${index + 1}`}
                      width={100}
                      height={100}
                      className="object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index, "question", "en")}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>

        {showGujarati && (
          <div>
            <Label
              htmlFor="question_gu"
              className={`text-foreground ${
                emptyFields.question_gu ? "text-red-500" : ""
              }`}
            >
              Question (Gujarati) {emptyFields.question_gu && "*Required"}
            </Label>
            <Textarea
              id="question_gu"
              name="question_gu"
              value={currentQuestion.question_gu || ""}
              onChange={handleQuestionChange}
              onPaste={(e) => handlePasteImage(e, "question", "gu")}
              className={`mt-1 text-foreground ${
                emptyFields.question_gu ? "border-red-500" : ""
              }`}
              rows={3}
              disabled={isSubmitting}
              placeholder={
                questionType === "MCQ"
                  ? "Enter question with options (A) Option 1 (B) Option 2..."
                  : "Enter question"
              }
            />
            <div className="mt-2">
              <Label htmlFor="question-image-gu" className="text-foreground">
                Upload Image (Gujarati)
              </Label>
              <Input
                id="question-image-gu"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "question", "gu")}
                className="mt-1 text-foreground"
                disabled={isSubmitting}
                multiple
              />
            </div>
            {Array.isArray(currentQuestion.question_images_gu) &&
              currentQuestion.question_images_gu.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentQuestion.question_images_gu.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url || "/placeholder.svg"}
                        alt={`Question image (Gujarati) ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleImageRemove(index, "question", "gu")
                        }
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        <div>
          <Label
            htmlFor="answer"
            className={`text-foreground ${
              emptyFields.answer ? "text-red-500" : ""
            }`}
          >
            Answer (English) {emptyFields.answer && "*Required"}
          </Label>
          <Textarea
            id="answer"
            name="answer"
            value={
              typeof currentQuestion.answer === "object"
                ? JSON.stringify(currentQuestion.answer)
                : currentQuestion.answer || ""
            }
            onChange={handleQuestionChange}
            onPaste={(e) => handlePasteImage(e, "answer", "en")}
            className={`mt-1 text-foreground ${
              emptyFields.answer ? "border-red-500" : ""
            }`}
            rows={3}
            disabled={isSubmitting}
          />
          <div className="mt-2">
            <Label htmlFor="answer-image" className="text-foreground">
              Upload Image (English)
            </Label>
            <Input
              id="answer-image"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "answer", "en")}
              className="mt-1 text-foreground"
              disabled={isSubmitting}
              multiple
            />
          </div>
          {Array.isArray(currentQuestion.answer_images) &&
            currentQuestion.answer_images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentQuestion.answer_images.map((url, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={url || "/placeholder.svg"}
                      alt={`Answer image ${index + 1}`}
                      width={100}
                      height={100}
                      className="object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index, "answer", "en")}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>

        {showGujarati && (
          <div>
            <Label
              htmlFor="answer_gu"
              className={`text-foreground ${
                emptyFields.answer_gu ? "text-red-500" : ""
              }`}
            >
              Answer (Gujarati) {emptyFields.answer_gu && "*Required"}
            </Label>
            <Textarea
              id="answer_gu"
              name="answer_gu"
              value={
                typeof currentQuestion.answer_gu === "object"
                  ? JSON.stringify(currentQuestion.answer_gu)
                  : currentQuestion.answer_gu || ""
              }
              onChange={handleQuestionChange}
              onPaste={(e) => handlePasteImage(e, "answer", "gu")}
              className={`mt-1 text-foreground ${
                emptyFields.answer_gu ? "border-red-500" : ""
              }`}
              rows={3}
              disabled={isSubmitting}
            />
            <div className="mt-2">
              <Label htmlFor="answer-image-gu" className="text-foreground">
                Upload Image (Gujarati)
              </Label>
              <Input
                id="answer-image-gu"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "answer", "gu")}
                className="mt-1 text-foreground"
                disabled={isSubmitting}
                multiple
              />
            </div>
            {Array.isArray(currentQuestion.answer_images_gu) &&
              currentQuestion.answer_images_gu.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentQuestion.answer_images_gu.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url || "/placeholder.svg"}
                        alt={`Answer image (Gujarati) ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index, "answer", "gu")}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        <div>
          <Label htmlFor="marks" className="text-foreground">
            Marks
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleUpdateMarks(false)}
              disabled={isSubmitting || (currentQuestion.marks || 1) <= 1}
              className="h-8 w-8 rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="marks"
              name="marks"
              type="number"
              min={1}
              max={10}
              value={currentQuestion.marks || 1}
              onChange={handleQuestionChange}
              className="w-16 text-center text-foreground"
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleUpdateMarks(true)}
              disabled={isSubmitting || (currentQuestion.marks || 1) >= 5}
              className="h-8 w-8 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
