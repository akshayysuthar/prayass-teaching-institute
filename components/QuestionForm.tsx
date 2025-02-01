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
  // isSubmitting,
  // questionType,
  removeQuestion,
  selectedContentMedium,
  emptyFields,
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

  const renderInputField = (
    field: string,
    label: string,
    language: "en" | "gu"
  ) => {
    const isHidden = language === "gu" && selectedContentMedium !== "Both";
    if (isHidden) return null;

    const isRequired = language === "en" || selectedContentMedium === "Both";

    const handlePaste = async (
      e: React.ClipboardEvent<HTMLTextAreaElement>
    ) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const compressedFile = await compressImage(file);
            handleImageUpload(
              [compressedFile],
              field as "question" | "answer",
              language
            );
          }
        }
      }
    };

    return (
      <div className="space-y-2">
        <Label
          htmlFor={`${field}-${language}`}
          className="text-lg font-semibold"
        >
          {label} ({language === "en" ? "English" : "Gujarati"})
          {isRequired && emptyFields[field] && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        <div
          className={`relative ${
            dragActive ? "border-2 border-dashed border-blue-400" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) =>
            handleDrop(e, field as "question" | "answer", language)
          }
        >
          <Textarea
            id={`${field}-${language}`}
            name={field}
            value={currentQuestion[field] || ""}
            onChange={handleQuestionChange}
            onPaste={handlePaste}
            className={`min-h-[150px] pr-10 ${
              isRequired && emptyFields[field] ? "border-red-500" : ""
            }`}
            placeholder={`Type your ${field} here or drag and drop an image...`}
            required={isRequired}
          />
          <label className="absolute top-2 right-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                handleFileSelect(e, field as "question" | "answer", language)
              }
            />
            <Paperclip className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </label>
        </div>
        {renderImagePreviews(field, language)}
      </div>
    );
  };

  const renderImagePreviews = (field: string, language: "en" | "gu") => {
    const imageField = `${field}_images${
      language === "gu" ? "_gu" : ""
    }` as keyof Question;
    const images = currentQuestion[imageField] as string[] | undefined;

    if (images && images.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {images.map((img, index) => (
            <ImagePreview
              key={index}
              src={img || "/placeholder.svg"}
              alt={`${field.charAt(0).toUpperCase() + field.slice(1)} image ${
                index + 1
              }`}
              onRemove={() =>
                handleImageRemove(
                  index,
                  field as "question" | "answer",
                  language
                )
              }
            />
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderInputField("question", "Question", "en")}
        {renderInputField("answer", "Answer", "en")}
        {selectedContentMedium === "Both" && (
          <>
            {renderInputField("question_gu", "Question", "gu")}
            {renderInputField("answer_gu", "Answer", "gu")}
          </>
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

        <div className="flex justify-end">
          <Button onClick={removeQuestion} variant="destructive">
            Remove Question
          </Button>
        </div>
      </div>
    </div>
  );
}
