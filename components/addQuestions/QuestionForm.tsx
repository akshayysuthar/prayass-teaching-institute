"use client";

import type React from "react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Minus, X } from "lucide-react";
import Image from "next/image";
// import type { Question } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface ImageWithSize {
  url: string;
  size: "inline" | "small" | "medium" | "large";
}

interface QuestionFormProps {
  currentQuestion: Partial<{
    question: string;
    question_gu: string;
    question_images: ImageWithSize[];
    question_images_gu: ImageWithSize[];
    answer: string;
    answer_gu: string;
    answer_images: ImageWithSize[];
    answer_images_gu: ImageWithSize[];
    marks: number;
    sectionTitle: string;
    type: string;
  }>;
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
  onToggleGujarati: (show: boolean) => void;
  isSubmitting: boolean;
  questionType: string;
  removeQuestion: () => void;
  selectedContentMedium: string;
  emptyFields: Record<string, boolean>;
  handleImageSizeChange: (
    type: "question" | "answer",
    imageIndex: number,
    newSize: "inline" | "small" | "medium" | "large"
  ) => void;
  copySectionTitle?: () => void;
  copyType?: () => void;
  questionNumber: number;
  fixQuestionAndAnswer?: () => void;
}

// Add image size options
const IMAGE_SIZE_OPTIONS = [
  { value: "inline", label: "Inline" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function QuestionForm({
  currentQuestion,
  handleQuestionChange,
  handleImageUpload,
  handleImageRemove,
  handlePasteImage,
  handleUpdateMarks,
  onToggleGujarati,
  isSubmitting,
  questionType,
  removeQuestion,
  selectedContentMedium,
  emptyFields,
  handleImageSizeChange,
  copySectionTitle,
  copyType,
  questionNumber,
  fixQuestionAndAnswer,
}: QuestionFormProps) {
  const [showGujarati, setShowGujarati] = useState(
    selectedContentMedium === "Gujarati" || selectedContentMedium === "Both"
  );

  const handleToggleGujarati = (checked: boolean) => {
    setShowGujarati(checked);
    onToggleGujarati(checked);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(Array.from(files), type, language);
      e.target.value = "";
    }
  };

  return (
    <Card className="bg-background border shadow-sm">
      <CardContent className="p-1 sm:p-4 space-y-2 sm:space-y-6">
        {/* Question Number */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-base sm:text-lg text-foreground">Question {questionNumber}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeQuestion}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Remove
          </Button>
        </div>
        {/* Section Title and Type Inputs */}
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 items-center w-full">
          <div className="flex-1 w-full">
            <Label htmlFor="sectionTitle" className="text-foreground text-xs sm:text-sm">
              Section Title
            </Label>
            <div className="flex flex-row gap-1 items-center w-full">
              <Input
                id="sectionTitle"
                name="sectionTitle"
                value={currentQuestion.sectionTitle || ""}
                onChange={handleQuestionChange}
                placeholder="Section Title"
                className="w-full text-foreground border-input py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm"
                disabled={isSubmitting}
              />
              {copySectionTitle && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={copySectionTitle}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  title="Copy from previous"
                >
                  &#x2398;
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 w-full">
            <Label htmlFor="type" className="text-foreground text-xs sm:text-sm">
              Question Type
            </Label>
            <div className="flex flex-row gap-1 items-center w-full">
              <Input
                id="type"
                name="type"
                value={currentQuestion.type || ""}
                onChange={handleQuestionChange}
                placeholder="Question Type"
                className="w-full text-foreground border-input py-1 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm"
                disabled={isSubmitting}
              />
              {copyType && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={copyType}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  title="Copy from previous"
                >
                  &#x2398;
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Question</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeQuestion}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Remove
          </Button>
        </div> */}

        {/* English Fields */}
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="question"
              className={`text-foreground ${
                emptyFields.question ? "text-red-500" : ""
              }`}
            >
              Question {emptyFields.question && "*Required"}
            </Label>
            <div className="flex flex-row gap-1 items-center w-full">
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
              {fixQuestionAndAnswer && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fixQuestionAndAnswer}
                  className="h-7 w-20 sm:h-8 sm:w-24 text-xs"
                  title="Move answer to answer field"
                  disabled={isSubmitting}
                >
                  Fix it
                </Button>
              )}
            </div>
            <div className="mt-2">
              <Label htmlFor="question-image" className="text-foreground">
                Upload Image
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
                  {currentQuestion.question_images.map((img, index) => (
                    <div
                      key={index}
                      className="relative flex flex-col items-center"
                    >
                      <Image
                        src={img.url || "/placeholder.svg"}
                        alt={`Question image ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover rounded-md"
                      />
                      <select
                        className="mt-1 text-xs border rounded"
                        value={img.size}
                        onChange={(e) =>
                          handleImageSizeChange(
                            "question",
                            index,
                            e.target.value as
                              | "inline"
                              | "small"
                              | "medium"
                              | "large"
                          )
                        }
                        disabled={isSubmitting}
                      >
                        {IMAGE_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          handleImageRemove(index, "question", "en")
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

          <div>
            <Label
              htmlFor="answer"
              className={`text-foreground ${
                emptyFields.answer ? "text-red-500" : ""
              }`}
            >
              Answer {emptyFields.answer && "*Required"}
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
                Upload Image
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
                  {currentQuestion.answer_images.map((img, index) => (
                    <div
                      key={index}
                      className="relative flex flex-col items-center"
                    >
                      <Image
                        src={img.url || "/placeholder.svg"}
                        alt={`Answer image ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover rounded-md"
                      />
                      <select
                        className="mt-1 text-xs border rounded"
                        value={img.size}
                        onChange={(e) =>
                          handleImageSizeChange(
                            "question",
                            index,
                            e.target.value as
                              | "inline"
                              | "small"
                              | "medium"
                              | "large"
                          )
                        }
                        disabled={isSubmitting}
                      >
                        {IMAGE_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
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
        </div>

        {/* Gujarati Toggle and Fields */}
        {(selectedContentMedium === "Gujarati" ||
          selectedContentMedium === "Both") && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="gujarati-toggle"
                checked={showGujarati}
                onCheckedChange={handleToggleGujarati}
                disabled={isSubmitting}
              />
              <Label htmlFor="gujarati-toggle" className="text-foreground">
                Include Gujarati Translation
              </Label>
            </div>

            {showGujarati && (
              <div className="space-y-4">
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
                    <Label
                      htmlFor="question-image-gu"
                      className="text-foreground"
                    >
                      Upload Image
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
                        {currentQuestion.question_images_gu.map(
                          (img, index) => (
                            <div
                              key={index}
                              className="relative flex flex-col items-center"
                            >
                              <Image
                                src={img.url || "/placeholder.svg"}
                                alt={`Question image (Gujarati) ${index + 1}`}
                                width={100}
                                height={100}
                                className="object-cover rounded-md"
                              />
                              <select
                                className="mt-1 text-xs border rounded"
                                value={img.size}
                                onChange={(e) =>
                                  handleImageSizeChange(
                                    "question",
                                    index,
                                    e.target.value as
                                      | "inline"
                                      | "small"
                                      | "medium"
                                      | "large"
                                  )
                                }
                                disabled={isSubmitting}
                              >
                                {IMAGE_SIZE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
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
                          )
                        )}
                      </div>
                    )}
                </div>

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
                    <Label
                      htmlFor="answer-image-gu"
                      className="text-foreground"
                    >
                      Upload Image
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
                        {currentQuestion.answer_images_gu.map((img, index) => (
                          <div
                            key={index}
                            className="relative flex flex-col items-center"
                          >
                            <Image
                              src={img.url || "/placeholder.svg"}
                              alt={`Answer image (Gujarati) ${index + 1}`}
                              width={100}
                              height={100}
                              className="object-cover rounded-md"
                            />
                            <select
                              className="mt-1 text-xs border rounded"
                              value={img.size}
                              onChange={(e) =>
                                handleImageSizeChange(
                                  "answer",
                                  index,
                                  e.target.value as
                                    | "inline"
                                    | "small"
                                    | "medium"
                                    | "large"
                                )
                              }
                              disabled={isSubmitting}
                            >
                              {IMAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                handleImageRemove(index, "answer", "gu")
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
      </CardContent>
    </Card>
  );
}
