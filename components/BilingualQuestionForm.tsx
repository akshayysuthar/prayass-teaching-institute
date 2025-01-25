"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { BilingualQuestionFormFields } from "./BilingualQuestionFormFields";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BilingualQuestionFormProps {
  contentId: number;
  subjectId: number;
  chapterNo?: number;
  chapterName?: string;
  onQuestionAdded: () => void;
}

export function BilingualQuestionForm({
  contentId,
  subjectId,
  chapterNo,
  chapterName,
  onQuestionAdded,
}: BilingualQuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<Partial<Question>>({
    question: "",
    question_gu: "",
    question_images: [],
    question_images_gu: [],
    answer: "",
    answer_gu: "",
    answer_images: [],
    answer_images_gu: [],
    marks: 1,
    selection_count: 0,
    is_reviewed: false,
    reviewed_by: "",
    type: "",
    section_title: "",
  });
  const { toast } = useToast();
  const { user } = useUser();

  const handleQuestionChange = (
    language: "en" | "gu",
    field: string,
    value: string | number | boolean
  ) => {
    setQuestion((prev) => ({
      ...prev,
      [language === "en" ? field : `${field}_gu`]: value,
    }));
  };

  const handleImageUpload = async (
    language: "en" | "gu",
    type: "question" | "answer",
    files: File[]
  ) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-images").getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    setQuestion((prev) => ({
      ...prev,
      [`${type}_images${language === "gu" ? "_gu" : ""}`]: [
        ...((prev[
          `${type}_images${language === "gu" ? "_gu" : ""}`
        ] as string[]) || []),
        ...uploadedUrls,
      ],
      [language === "en" ? type : `${type}_gu`]: `${
        prev[language === "en" ? type : `${type}_gu`] || ""
      } [img${uploadedUrls.length}]`,
    }));
  };

  const handleImageRemove = (
    language: "en" | "gu",
    type: "question" | "answer",
    imageIndex: number
  ) => {
    setQuestion((prev) => {
      const fieldName = `${type}_images${language === "gu" ? "_gu" : ""}`;
      const images = prev[fieldName] as string[];
      const newImages = images.filter((_, index) => index !== imageIndex);
      return {
        ...prev,
        [fieldName]: newImages,
        [language === "en" ? type : `${type}_gu`]: (
          prev[language === "en" ? type : `${type}_gu`] as string
        )
          .replace(`[img${imageIndex + 1}]`, "")
          .trim(),
      };
    });
  };

  const handleSaveQuestion = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save questions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const questionToSave = {
        ...question,
        content_id: contentId,
        subject_id: subjectId,
        chapter_no: chapterNo,
        chapter_name: chapterName,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("questions")
        .insert([questionToSave])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bilingual question saved successfully!",
      });

      // Reset the form state
      setQuestion({
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        selection_count: 0,
        is_reviewed: false,
        reviewed_by: "",
        type: "",
        section_title: "",
      });

      onQuestionAdded();
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to save question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md">
        <h2 className="text-2xl font-bold">Add New Bilingual Question</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BilingualQuestionFormFields
            question={question}
            language="en"
            onQuestionChange={(field, value) =>
              handleQuestionChange("en", field, value)
            }
            onImageUpload={(type, files) =>
              handleImageUpload("en", type, files)
            }
            onImageRemove={(type, imageIndex) =>
              handleImageRemove("en", type, imageIndex)
            }
            allowImageUpload={false}
          />
          <BilingualQuestionFormFields
            question={question}
            language="gu"
            onQuestionChange={(field, value) =>
              handleQuestionChange("gu", field, value)
            }
            onImageUpload={(type, files) =>
              handleImageUpload("gu", type, files)
            }
            onImageRemove={(type, imageIndex) =>
              handleImageRemove("gu", type, imageIndex)
            }
            allowImageUpload={false}
          />
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="section_title">Section Title</Label>
            <Input
              id="section_title"
              value={question.section_title || ''}
              onChange={(e) =>
                handleQuestionChange("en", "section_title", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="type">Question Type</Label>
            <Select
              value={question.type || ''}
              onValueChange={(value) =>
                handleQuestionChange("en", "type", value)
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="Short Answer">Short Answer</SelectItem>
                <SelectItem value="Long Answer">Long Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              type="number"
              value={question.marks}
              onChange={(e) =>
                handleQuestionChange(
                  "en",
                  "marks",
                  Number.parseInt(e.target.value, 10)
                )
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor="question_gu">Question (Gujarati)</Label>
          <Textarea
            id="question_gu"
            value={question.question_gu}
            onChange={(e) =>
              handleQuestionChange("gu", "question", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="answer_gu">Answer (Gujarati)</Label>
          <Textarea
            id="answer_gu"
            value={question.answer_gu as string}
            onChange={(e) =>
              handleQuestionChange("gu", "answer", e.target.value)
            }
            className="mt-1"
          />
        </div>
        <Button
          onClick={handleSaveQuestion}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : "Save Question"}
        </Button>
      </div>
    </div>
  );
}
