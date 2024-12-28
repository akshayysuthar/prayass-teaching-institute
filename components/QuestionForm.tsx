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
  handleReviewStatusChange: (isReviewed: boolean) => void;
  isSubmitting: boolean;
  questionType: string;
}

export function QuestionForm({
  currentQuestion,
  handleQuestionChange,
  handleImageUpload,
  handleReviewStatusChange,
}: QuestionFormProps) {
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <div className="grid grid-cols-4 items-center justify-between space-x-2">
          <Textarea
            className="col-span-4"
            id="question"
            name="question"
            value={currentQuestion.question || ""}
            onChange={handleQuestionChange}
            required
            ref={questionInputRef}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "question")}
            className="hidden"
            id="questionImageUpload"
          />
          <Button
            type="button"
            className="col-span-1"
            onClick={() =>
              document.getElementById("questionImageUpload")?.click()
            }
          >
            Add Image
          </Button>
          {currentQuestion.question_images &&
            currentQuestion.question_images.length > 0 && (
              <div className="mt-2 col-span-3 flex flex-wrap gap-2">
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
      </div>
      <div>
        <Label htmlFor="answer">Answer</Label>
        <div className="grid grid-cols-4 items-center justify-between space-x-2">
          <Textarea
            id="answer"
            name="answer"
            className="col-span-4"
            value={(currentQuestion.answer as string) || ""}
            onChange={handleQuestionChange}
            required
            ref={answerInputRef}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "answer")}
            className="hidden"
            id="answerImageUpload"
          />
          <Button
            type="button"
            className="col-span-1"
            onClick={() =>
              document.getElementById("answerImageUpload")?.click()
            }
          >
            Add Image
          </Button>
          {currentQuestion.answer_images &&
            currentQuestion.answer_images.length > 0 && (
              <div className="mt-2 col-span-3 flex flex-wrap gap-2">
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
