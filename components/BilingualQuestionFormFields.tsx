import type { Question } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { X } from "lucide-react";

interface BilingualQuestionFormFieldsProps {
  question: Partial<Question>;
  language: "en" | "gu";
  onQuestionChange: (field: string, value: string | number | boolean) => void;
  onImageUpload: (type: "question" | "answer", files: File[]) => void;
  onImageRemove: (type: "question" | "answer", imageIndex: number) => void;
  allowImageUpload: boolean;
}

export function BilingualQuestionFormFields({
  question,
  language,
  onQuestionChange,
  onImageUpload,
  onImageRemove,
  allowImageUpload,
}: BilingualQuestionFormFieldsProps) {
  const languageSuffix = language === "gu" ? "_gu" : "";

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`question${languageSuffix}`}>
          Question ({language === "en" ? "English" : "Gujarati"})
        </Label>
        <Textarea
          id={`question${languageSuffix}`}
          value={question[`question${languageSuffix}`] as string}
          onChange={(e) => onQuestionChange("question", e.target.value)}
          className="mt-1"
        />
        {allowImageUpload && (
          <div className="mt-2">
            <Label htmlFor={`question_images${languageSuffix}`}>
              Question Images
            </Label>
            <Input
              id={`question_images${languageSuffix}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                onImageUpload("question", Array.from(e.target.files || []))
              }
              className="mt-1"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {(
                (question[`question_images${languageSuffix}`] as string[]) || []
              ).map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Question image ${index + 1}`}
                    width={100}
                    height={100}
                    className="object-cover"
                  />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    onClick={() => onImageRemove("question", index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor={`answer${languageSuffix}`}>
          Answer ({language === "en" ? "English" : "Gujarati"})
        </Label>
        <Textarea
          id={`answer${languageSuffix}`}
          value={question[`answer${languageSuffix}`] as string}
          onChange={(e) => onQuestionChange("answer", e.target.value)}
          className="mt-1"
        />
        {allowImageUpload && (
          <div className="mt-2">
            <Label htmlFor={`answer_images${languageSuffix}`}>
              Answer Images
            </Label>
            <Input
              id={`answer_images${languageSuffix}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                onImageUpload("answer", Array.from(e.target.files || []))
              }
              className="mt-1"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {(
                (question[`answer_images${languageSuffix}`] as string[]) || []
              ).map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Answer image ${index + 1}`}
                    width={100}
                    height={100}
                    className="object-cover"
                  />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    onClick={() => onImageRemove("answer", index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {language === "en" && (
        <div>
          <Label htmlFor="marks">Marks</Label>
          <Input
            id="marks"
            type="number"
            value={question.marks}
            onChange={(e) =>
              onQuestionChange("marks", Number.parseInt(e.target.value, 10))
            }
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
