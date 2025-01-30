"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "./ImagePreview";
import { compressImage } from "@/utils/imageCompression";
import type { Question } from "@/types";
import { Paperclip, Minus, Plus } from "lucide-react";

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
    index: number,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => void;
  handleReviewStatusChange: (isReviewed: boolean) => void;
  isSubmitting: boolean;
  questionType: string;
  removeQuestion: () => void;
  selectedContentMedium: string;
}

export function QuestionForm({
  currentQuestion,
  handleQuestionChange,
  handleImageUpload,
  handleImageRemove,
  handleReviewStatusChange,
  // isSubmitting,
  // questionType,
  removeQuestion,
  selectedContentMedium,
}: QuestionFormProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (
      e: React.DragEvent,
      type: "question" | "answer",
      language: "en" | "gu"
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const compressedFiles = await Promise.all(imageFiles.map(compressImage));
      handleImageUpload(compressedFiles, type, language);
    },
    [handleImageUpload]
  );

  const handleFileSelect = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      type: "question" | "answer",
      language: "en" | "gu"
    ) => {
      const files = Array.from(e.target.files || []);
      const compressedFiles = await Promise.all(files.map(compressImage));
      handleImageUpload(compressedFiles, type, language);
      e.target.value = ""; // Reset input
    },
    [handleImageUpload]
  );

  const handleMarksChange = (increment: number) => {
    const currentMarks = currentQuestion.marks || 1;
    const newMarks = Math.max(1, Math.min(5, currentMarks + increment));
    handleQuestionChange({
      target: { name: "marks", value: newMarks.toString() },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const showGujaratiFields =
    selectedContentMedium === "Gujarati" || selectedContentMedium === "Both";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* English Question Section */}
        <div className="space-y-4">
          <div className="relative">
            <Label htmlFor="question" className="text-lg font-semibold">
              Question (English)
            </Label>
            <div
              className={`relative mt-2 ${
                dragActive ? "border-primary" : "border-input"
              }`}
              onDragEnter={(e) => handleDrag(e)}
              onDragLeave={(e) => handleDrag(e)}
              onDragOver={(e) => handleDrag(e)}
              onDrop={(e) => handleDrop(e, "question", "en")}
            >
              <label className="absolute top-2 right-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "question", "en")}
                />
                <Paperclip className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </label>
              <Textarea
                id="question"
                name="question"
                value={currentQuestion.question || ""}
                onChange={handleQuestionChange}
                className="min-h-[150px] pr-10"
                placeholder="Type your question here..."
                required
                onPaste={async (e) => {
                  const items = e.clipboardData.items;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                      e.preventDefault();
                      const file = items[i].getAsFile();
                      if (file) {
                        const compressedFile = await compressImage(file);
                        handleImageUpload([compressedFile], "question", "en");
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          {currentQuestion.question_images &&
            currentQuestion.question_images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {currentQuestion.question_images.map((img, index) => (
                  <ImagePreview
                    key={index}
                    src={img || "/placeholder.svg"}
                    alt={`Question image ${index + 1}`}
                    onRemove={() => handleImageRemove(index, "question", "en")}
                  />
                ))}
              </div>
            )}
        </div>

        {/* Gujarati Question Section */}
        {showGujaratiFields && (
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="question_gu" className="text-lg font-semibold">
                Question (Gujarati)
              </Label>
              <div
                className={`relative mt-2 ${
                  dragActive ? "border-primary" : "border-input"
                }`}
                onDragEnter={(e) => handleDrag(e)}
                onDragLeave={(e) => handleDrag(e)}
                onDragOver={(e) => handleDrag(e)}
                onDrop={(e) => handleDrop(e, "question", "gu")}
              >
                <label className="absolute top-2 right-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "question", "gu")}
                  />
                  <Paperclip className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </label>
                <Textarea
                  id="question_gu"
                  name="question_gu"
                  value={currentQuestion.question_gu || ""}
                  onChange={handleQuestionChange}
                  className="min-h-[150px] pr-10"
                  placeholder="અહીં તમારો પ્રશ્ન ટાઇપ કરો..."
                  required={selectedContentMedium !== "Gujarati"}
                  onPaste={async (e) => {
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf("image") !== -1) {
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        if (file) {
                          const compressedFile = await compressImage(file);
                          handleImageUpload([compressedFile], "question", "gu");
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            {currentQuestion.question_images_gu &&
              currentQuestion.question_images_gu.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {currentQuestion.question_images_gu.map((img, index) => (
                    <ImagePreview
                      key={index}
                      src={img || "/placeholder.svg"}
                      alt={`Question image (Gujarati) ${index + 1}`}
                      onRemove={() =>
                        handleImageRemove(index, "question", "gu")
                      }
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Answer Sections - Following the same pattern */}
        <div className="space-y-4">
          <div className="relative">
            <Label htmlFor="answer" className="text-lg font-semibold">
              Answer (English)
            </Label>
            <div
              className={`relative mt-2 ${
                dragActive ? "border-primary" : "border-input"
              }`}
              onDragEnter={(e) => handleDrag(e)}
              onDragLeave={(e) => handleDrag(e)}
              onDragOver={(e) => handleDrag(e)}
              onDrop={(e) => handleDrop(e, "answer", "en")}
            >
              <label className="absolute top-2 right-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "answer", "en")}
                />
                <Paperclip className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </label>
              <Textarea
                id="answer"
                name="answer"
                value={(currentQuestion.answer as string) || ""}
                onChange={handleQuestionChange}
                className="min-h-[150px] pr-10"
                placeholder="Type your answer here..."
                required
                onPaste={async (e) => {
                  const items = e.clipboardData.items;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                      e.preventDefault();
                      const file = items[i].getAsFile();
                      if (file) {
                        const compressedFile = await compressImage(file);
                        handleImageUpload([compressedFile], "answer", "en");
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          {currentQuestion.answer_images &&
            currentQuestion.answer_images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {currentQuestion.answer_images.map((img, index) => (
                  <ImagePreview
                    key={index}
                    src={img || "/placeholder.svg"}
                    alt={`Answer image ${index + 1}`}
                    onRemove={() => handleImageRemove(index, "answer", "en")}
                  />
                ))}
              </div>
            )}
        </div>

        {showGujaratiFields && (
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="answer_gu" className="text-lg font-semibold">
                Answer (Gujarati)
              </Label>
              <div
                className={`relative mt-2 ${
                  dragActive ? "border-primary" : "border-input"
                }`}
                onDragEnter={(e) => handleDrag(e)}
                onDragLeave={(e) => handleDrag(e)}
                onDragOver={(e) => handleDrag(e)}
                onDrop={(e) => handleDrop(e, "answer", "gu")}
              >
                <label className="absolute top-2 right-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "answer", "gu")}
                  />
                  <Paperclip className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </label>
                <Textarea
                  id="answer_gu"
                  name="answer_gu"
                  value={(currentQuestion.answer_gu as string) || ""}
                  onChange={handleQuestionChange}
                  className="min-h-[150px] pr-10"
                  placeholder="અહીં તમારો જવાબ ટાઇપ કરો..."
                  required={selectedContentMedium !== "Gujarati"}
                  onPaste={async (e) => {
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf("image") !== -1) {
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        if (file) {
                          const compressedFile = await compressImage(file);
                          handleImageUpload([compressedFile], "answer", "gu");
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            {currentQuestion.answer_images_gu &&
              currentQuestion.answer_images_gu.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {currentQuestion.answer_images_gu.map((img, index) => (
                    <ImagePreview
                      key={index}
                      src={img || "/placeholder.svg"}
                      alt={`Answer image (Gujarati) ${index + 1}`}
                      onRemove={() => handleImageRemove(index, "answer", "gu")}
                    />
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="marks" className="text-lg font-semibold">
            Marks
          </Label>
          <div className="flex items-center space-x-2 mt-2">
            <Button
              type="button"
              onClick={() => handleMarksChange(-1)}
              disabled={currentQuestion.marks === 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium w-8 text-center">
              {currentQuestion.marks}
            </span>
            <Button
              type="button"
              onClick={() => handleMarksChange(1)}
              disabled={currentQuestion.marks === 5}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            onClick={() =>
              handleReviewStatusChange(!currentQuestion.is_reviewed)
            }
          >
            {currentQuestion.is_reviewed
              ? "Unmark as Reviewed"
              : "Mark as Reviewed"}
          </Button>
          <Button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to remove this question?")
              ) {
                removeQuestion();
              }
            }}
            variant="destructive"
          >
            Remove Question
          </Button>
        </div>
      </div>
    </div>
  );
}
