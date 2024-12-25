import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { Question } from "@/types";

interface QuestionFormProps {
  currentQuestion: Partial<Question>;
  handleQuestionChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "answer"
  ) => void;
  handleAddOption: () => void;
  handleOptionChange: (key: string, value: string) => void;
  handleReviewStatusChange: (isReviewed: boolean) => void;
  questionType: string;
}

export function QuestionForm({
  currentQuestion,
  handleQuestionChange,
  handleImageUpload,
  handleAddOption,
  handleOptionChange,
  handleReviewStatusChange,
  questionType,
}: QuestionFormProps) {
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-3  gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            name="question"
            value={currentQuestion.question || ""}
            onChange={handleQuestionChange}
            required
            ref={questionInputRef}
            className="w-full"
          />
          <div className="flex items-center space-x-2 mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "question")}
              className="hidden"
              id="questionImageUpload"
            />
            <Button
              type="button"
              onClick={() =>
                document.getElementById("questionImageUpload")?.click()
              }
            >
              Add Image
            </Button>
          </div>
          {currentQuestion.question_images &&
            currentQuestion.question_images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentQuestion.question_images.map((img, index) => (
                  <Image
                    width={100}
                    height={100}
                    key={index}
                    src={img}
                    alt={`Question image ${index + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                ))}
              </div>
            )}
        </div>
        {questionType === "MCQs" && (
          <div>
            <Label>Options</Label>
            <div className="grid gap-2">
              {Object.entries(currentQuestion.options || {}).map(
                ([key, value]) => (
                  <Input
                    key={key}
                    value={value}
                    onChange={(e) => handleOptionChange(key, e.target.value)}
                    placeholder={`Option ${key}`}
                    className="w-full"
                  />
                )
              )}
            </div>
            <Button type="button" onClick={handleAddOption} className="mt-2">
              Add Option
            </Button>
          </div>
        )}
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="answer">Answer</Label>
          <Textarea
            id="answer"
            name="answer"
            value={(currentQuestion.answer as string) || ""}
            onChange={handleQuestionChange}
            required
            ref={answerInputRef}
            className="w-full"
          />
          <div className="flex items-center space-x-2 mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "answer")}
              className="hidden"
              id="answerImageUpload"
            />
            <Button
              type="button"
              onClick={() =>
                document.getElementById("answerImageUpload")?.click()
              }
            >
              Add Image
            </Button>
          </div>
          {currentQuestion.answer_images &&
            currentQuestion.answer_images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentQuestion.answer_images.map((img, index) => (
                  <Image
                    width={100}
                    height={100}
                    key={index}
                    src={img}
                    alt={`Answer image ${index + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                ))}
              </div>
            )}
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
            className="grid grid-cols-2 justify-center gap-2"
          >
            {[1, 2, 3, 4].map((mark) => (
              <div key={mark} className="flex items-center space-x-2">
                <RadioGroupItem value={mark.toString()} id={`mark-${mark}`} />
                <Label htmlFor={`mark-${mark}`}>{mark}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() =>
              handleReviewStatusChange(!currentQuestion.isReviewed)
            }
          >
            {currentQuestion.isReviewed
              ? "Unmark as Reviewed"
              : "Mark as Reviewed"}
          </Button>
        </div>
      </div>
    </div>
  );
}
