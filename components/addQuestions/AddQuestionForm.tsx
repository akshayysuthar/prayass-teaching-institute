"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Content } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetadataForm } from "./MetadataForm";
import { QuestionForm } from "./QuestionForm";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ImageSizeType = "inline" | "small" | "medium" | "large";

interface ImageSizes {
  question: ImageSizeType[];
  answer: ImageSizeType[];
}

interface ImageWithSize {
  url: string;
  size: ImageSizeType;
}

interface QuestionType {
  question: string;
  question_gu: string;
  question_images: ImageWithSize[];
  question_images_gu: ImageWithSize[];
  answer: string;
  answer_gu: string;
  answer_images: ImageWithSize[];
  answer_images_gu: ImageWithSize[];
  marks: number;
  created_by: string;
  img_size?: string;
  sectionTitle: string;
  type: string;
}

// type QuestionField = keyof QuestionType;

export function AddQuestionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Partial<QuestionType>[]>([
    {
      question: "",
      question_gu: "",
      question_images: [],
      question_images_gu: [],
      answer: "",
      answer_gu: "",
      answer_images: [],
      answer_images_gu: [],
      marks: 1,
      created_by: "",
      sectionTitle: "",
      type: "",
    },
  ]);
  const [gujaratiToggles, setGujaratiToggles] = useState<boolean[]>([false]);
  const [metadata, setMetadata] = useState({
    content_id: "",
    subject_id: "",
    sectionTitle: "",
    type: "",
  });
  const [selectedContentMedium, setSelectedContentMedium] =
    useState<string>("");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  console.log("gujaratiToggles is" + gujaratiToggles);

  useEffect(() => {
    if (user) {
      fetchRecentEntries();
    }
  }, [user]);

  useEffect(() => {
    if (metadata.content_id) {
      fetchContentDetails(metadata.content_id);
    }
  }, [metadata.content_id]);

  useEffect(() => {
    if (metadata.subject_id) {
      fetchSuggestionsBySubject(metadata.subject_id);
    }
  }, [metadata.subject_id]);

  const fetchRecentEntries = async () => {
    const { error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching recent entries:", error);
    }
  };

  const fetchContentDetails = async (contentId: string) => {
    try {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .eq("id", contentId)
        .single();

      if (error) throw error;

      setSelectedContent(data);
      setSelectedContentMedium(data.medium);
      setGujaratiToggles((prev) =>
        prev.map(() => data.medium === "Gujarati" || data.medium === "Both")
      );
    } catch (error) {
      console.error("Error fetching content details:", error);
    }
  };

  const fetchSuggestionsBySubject = async (subjectId: string) => {
    try {
      const { data: sectionData, error: sectionError } = await supabase
        .from("questions")
        .select("sectionTitle, section_title")
        .eq("subject_id", subjectId)
        .not("sectionTitle", "is", null)
        .limit(50);

      if (sectionError) throw sectionError;

      const { data: typeData, error: typeError } = await supabase
        .from("questions")
        .select("type")
        .eq("subject_id", subjectId)
        .not("type", "is", null)
        .limit(50);

      if (typeError) throw typeError;

      const sectionTitles = new Set<string>();
      sectionData.forEach((item) => {
        if (item.sectionTitle) sectionTitles.add(item.sectionTitle);
        if (item.section_title) sectionTitles.add(item.section_title);
      });

      const types = new Set<string>();
      typeData.forEach((item) => {
        if (item.type) types.add(item.type);
      });

      if (types.size === 0) {
        types.add("MCQ");
        types.add("Short Answer");
        types.add("Long Answer");
      }
    } catch (error) {
      console.error("Error fetching suggestions by subject:", error);
    }
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getFieldValue = (
    question: Partial<QuestionType>,
    field: keyof QuestionType
  ) => {
    return question[field];
  };

  const setFieldValue = (
    question: Partial<QuestionType>,
    field: keyof QuestionType,
    value: QuestionType[keyof QuestionType]
  ): Partial<QuestionType> => {
    return {
      ...question,
      [field]: value,
    };
  };

  const handleQuestionChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = setFieldValue(
        newQuestions[index],
        name as keyof QuestionType,
        name === "marks" ? Number.parseInt(value, 10) : value
      );
      return newQuestions;
    });
  };

  const handleImageUpload = async (
    index: number,
    files: File[],
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    const uploadedImages: ImageWithSize[] = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("question-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }

      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("question-images").getPublicUrl(data.path);
        uploadedImages.push({ url: publicUrl, size: "inline" });
      }
    }

    setQuestions((prev) => {
      const newQuestions = [...prev];
      const imageFieldMap: Record<
        "question" | "answer",
        { en: keyof QuestionType; gu: keyof QuestionType }
      > = {
        question: { en: "question_images", gu: "question_images_gu" },
        answer: { en: "answer_images", gu: "answer_images_gu" },
      };
      const textFieldMap: Record<
        "question" | "answer",
        { en: keyof QuestionType; gu: keyof QuestionType }
      > = {
        question: { en: "question", gu: "question_gu" },
        answer: { en: "answer", gu: "answer_gu" },
      };
      const uploadFieldName = imageFieldMap[type][language];
      const uploadTextFieldName = textFieldMap[type][language];
      const currentImages =
        (getFieldValue(
          newQuestions[index],
          uploadFieldName
        ) as ImageWithSize[]) || [];
      const newImages = [...currentImages, ...uploadedImages];

      let updatedQuestion = setFieldValue(
        newQuestions[index],
        uploadFieldName,
        newImages
      );
      updatedQuestion = setFieldValue(
        updatedQuestion,
        uploadTextFieldName,
        `${getFieldValue(updatedQuestion, uploadTextFieldName) || ""} [img${
          newImages.length
        }]`
      );

      newQuestions[index] = updatedQuestion;
      return newQuestions;
    });
  };

  const handleImageRemove = (
    questionIndex: number,
    imageIndex: number,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const imageFieldMap: Record<
        "question" | "answer",
        { en: keyof QuestionType; gu: keyof QuestionType }
      > = {
        question: { en: "question_images", gu: "question_images_gu" },
        answer: { en: "answer_images", gu: "answer_images_gu" },
      };
      const textFieldMap: Record<
        "question" | "answer",
        { en: keyof QuestionType; gu: keyof QuestionType }
      > = {
        question: { en: "question", gu: "question_gu" },
        answer: { en: "answer", gu: "answer_gu" },
      };
      const removeFieldName = imageFieldMap[type][language];
      const removeTextFieldName = textFieldMap[type][language];
      const images =
        (getFieldValue(
          newQuestions[questionIndex],
          removeFieldName
        ) as ImageWithSize[]) || [];
      images.splice(imageIndex, 1);

      let updatedQuestion = setFieldValue(
        newQuestions[questionIndex],
        removeFieldName,
        images
      );
      updatedQuestion = setFieldValue(
        updatedQuestion,
        removeTextFieldName,
        ((getFieldValue(updatedQuestion, removeTextFieldName) as string) || "")
          .replace(`[img${imageIndex + 1}]`, "")
          .trim()
      );

      newQuestions[questionIndex] = updatedQuestion;
      return newQuestions;
    });
  };

  const handlePasteImage = async (
    index: number,
    e: React.ClipboardEvent,
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await handleImageUpload(index, [file], type, language);
        }
      }
    }
  };

  const handleUpdateMarks = (index: number, increment: boolean) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const currentMarks = getFieldValue(newQuestions[index], "marks") || 1;
      const newMarks = increment
        ? Math.min(5, (currentMarks as number) + 1)
        : Math.max(1, (currentMarks as number) - 1);
      newQuestions[index] = setFieldValue(
        newQuestions[index],
        "marks",
        newMarks
      );
      return newQuestions;
    });
  };

  const handleToggleGujarati = (index: number, show: boolean) => {
    setGujaratiToggles((prev) => {
      const newToggles = [...prev];
      newToggles[index] = show;
      return newToggles;
    });
  };

  const checkRequiredFields = (
    question: Partial<{
      question: string;
      question_gu: string;
      question_images: ImageWithSize[];
      question_images_gu: ImageWithSize[];
      answer: string;
      answer_gu: string;
      answer_images: ImageWithSize[];
      answer_images_gu: ImageWithSize[];
      marks: number;
      created_by: string;
    }>,
    index: number
  ) => {
    const requiredFields: Array<keyof QuestionType> = ["question", "answer"];
    if (gujaratiToggles[index]) {
      // requiredFields.push("question_gu", "answer_gu");
    }

    return requiredFields.reduce((acc, field) => {
      acc[field] = !getFieldValue(question, field);
      return acc;
    }, {} as Record<keyof QuestionType, boolean>);
  };

  const handleSaveQuestions = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save questions.",
        variant: "destructive",
      });
      return;
    }

    const emptyFieldsByQuestion = questions.map((q, i) =>
      checkRequiredFields(q, i)
    );
    const isValid = emptyFieldsByQuestion.every(
      (fields) => !Object.values(fields).some(Boolean)
    );

    if (!isValid) {
      const emptyFields = emptyFieldsByQuestion.flatMap((fields, index) =>
        Object.entries(fields)
          .filter(([, isEmpty]) => isEmpty)
          .map(([field]) => `Question ${index + 1}: ${field}`)
      );

      toast({
        title: "Error",
        description: `Please fill in all required fields: ${emptyFields.join(
          ", "
        )}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const questionsToSave = questions.map((question) => {
        // Collect sizes in the required format
        const imageSizes: [ImageSizes] = [
          {
            question: (question.question_images || []).map((img) => img.size),
            answer: (question.answer_images || []).map((img) => img.size),
          },
        ];

        return {
          ...metadata,
          ...question,
          created_by: user?.fullName ?? "User Not Login",
          content_id: metadata.content_id
            ? Number.parseInt(metadata.content_id, 10)
            : null,
          subject_id: metadata.subject_id
            ? Number.parseInt(metadata.subject_id, 10)
            : null,
          marks: question.marks || 1,
          question_images:
            question.question_images?.map((img) => img.url) || [],
          answer_images: question.answer_images?.map((img) => img.url) || [],
          img_size: JSON.stringify(imageSizes),
        };
      });

      const { error } = await supabase
        .from("questions")
        .insert(questionsToSave)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${questions.length} question(s) saved successfully!`,
      });

      resetFormState();
    } catch (error) {
      console.error("Error saving questions:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to save questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        created_by: user?.fullName ?? "User Not Login",
        sectionTitle: "",
        type: "",
      },
    ]);
    setGujaratiToggles((prev) => [
      ...prev,
      selectedContentMedium === "Gujarati" || selectedContentMedium === "Both",
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setGujaratiToggles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetFormState = () => {
    setQuestions([
      {
        question: "",
        question_gu: "",
        question_images: [],
        question_images_gu: [],
        answer: "",
        answer_gu: "",
        answer_images: [],
        answer_images_gu: [],
        marks: 1,
        created_by: "",
        sectionTitle: "",
        type: "",
      },
    ]);
    setGujaratiToggles([
      selectedContentMedium === "Gujarati" || selectedContentMedium === "Both",
    ]);
    setMetadata({
      content_id: "",
      subject_id: "",
      sectionTitle: "",
      type: "",
    });
  };

  // Type guard to check if a string is a key of QuestionType
  // function isQuestionTypeKey(key: string): key is keyof QuestionType {
  //   return [
  //     "question",
  //     "question_gu",
  //     "question_images",
  //     "question_images_gu",
  //     "answer",
  //     "answer_gu",
  //     "answer_images",
  //     "answer_images_gu",
  //     "marks",
  //     "created_by",
  //     "img_size",
  //     "sectionTitle",
  //     "type",
  //   ].includes(key);
  // }

  const handleImageSizeChange = (
    index: number,
    type: "question" | "answer",
    imageIndex: number,
    newSize: "inline" | "small" | "medium" | "large"
  ) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const imageFieldMap: Record<"question" | "answer", keyof QuestionType> = {
        question: "question_images",
        answer: "answer_images",
      };
      const fieldName = imageFieldMap[type];
      const images = [
        ...((getFieldValue(
          newQuestions[index],
          fieldName
        ) as ImageWithSize[]) || []),
      ];
      if (images[imageIndex]) {
        images[imageIndex] = { ...images[imageIndex], size: newSize };
        newQuestions[index] = setFieldValue(
          newQuestions[index],
          fieldName,
          images
        );
      }
      return newQuestions;
    });
  };

  // Bulk parser for English and Gujarati Q&A
  function parseBulkQuestions(input: string): Partial<QuestionType>[] {
    // Support both English and Gujarati formats
    // English: Question 1. ... Answer: ...
    // Gujarati: પ્રશ્ન 1. ... ઉત્તરઃ ...
    const blocks = input
      .split(/(?=Question\s*\d+\.|પ્રશ્ન\s*\d+\.)/gi)
      .filter(Boolean);
    return blocks.map((block) => {
      // Try English first
      let match = block.match(
        /Question\s*\d+\.?[\s\S]*?(?:\n|\r|^)\s*Answer\s*[:：]([\s\S]*)/i
      );
      if (match) {
        const qMatch = block.match(
          /Question\s*\d+\.?([\s\S]*?)(?:\n|\r|^)\s*Answer\s*[:：]/i
        );
        return {
          question: qMatch ? qMatch[1].replace(/\s+/g, " ").trim() : "",
          answer: match[1].replace(/\s+/g, " ").trim(),
          question_gu: "",
          answer_gu: "",
          question_images: [],
          answer_images: [],
          question_images_gu: [],
          answer_images_gu: [],
          marks: 1,
          created_by: user?.fullName ?? "User Not Login",
          sectionTitle: metadata.sectionTitle,
          type: metadata.type,
        };
      }
      // Try Gujarati
      match = block.match(
        /પ્રશ્ન\s*\d+\.?([\s\S]*?)(?:\n|\r|^)\s*ઉત્તર[:：](.*)/i
      );
      if (match) {
        return {
          question: "",
          answer: "",
          question_gu: match[1].replace(/\s+/g, " ").trim(),
          answer_gu: match[2].replace(/\s+/g, " ").trim(),
          question_images: [],
          answer_images: [],
          question_images_gu: [],
          answer_images_gu: [],
          marks: 1,
          created_by: user?.fullName ?? "User Not Login",
          sectionTitle: metadata.sectionTitle,
          type: metadata.type,
        };
      }
      // Fallback: treat as question only
      return {
        question: block.replace(/\s+/g, " ").trim(),
        answer: "",
        question_gu: "",
        answer_gu: "",
        question_images: [],
        answer_images: [],
        question_images_gu: [],
        answer_images_gu: [],
        marks: 1,
        created_by: user?.fullName ?? "User Not Login",
        sectionTitle: metadata.sectionTitle,
        type: metadata.type,
      };
    });
  }

  if (!user) {
    return (
      <div className="text-foreground">Please log in to access this form.</div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Bulk Paste Button and Dialog */}
      <Button
        onClick={() => setBulkDialogOpen(true)}
        variant="secondary"
        className="mb-2"
      >
        Bulk Paste Questions
      </Button>
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Paste Questions & Answers</DialogTitle>
          </DialogHeader>
          <Textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={10}
            placeholder={`Paste questions in this format:\n\nQuestion 1. ...\nAnswer: ...\nQuestion 2. ...\nAnswer: ...\n\nOR\n\nપ્રશ્ન 1. ...\nઉત્તરઃ ...`}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                const parsed = parseBulkQuestions(bulkInput);
                if (parsed.length > 0) {
                  setQuestions(parsed);
                  setGujaratiToggles(parsed.map((q) => !!q.question_gu));
                  setBulkDialogOpen(false);
                  setBulkInput("");
                  toast({
                    title: "Bulk questions added!",
                    description: `${parsed.length} questions parsed and filled.`,
                  });
                } else {
                  toast({
                    title: "No questions found",
                    description: "Please check your input format.",
                    variant: "destructive",
                  });
                }
              }}
              variant="default"
            >
              Parse & Fill
            </Button>
            <Button onClick={() => setBulkDialogOpen(false)} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="bg-background border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            Add New Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="border p-4 rounded-md bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground/80 mb-4">
              Metadata
            </h3>
            <MetadataForm
              metadata={metadata}
              handleMetadataChange={handleMetadataChange}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
            />
          </div>

          {selectedContent && (
            <Card className="bg-background border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground">
                  Selected Content Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-foreground">{selectedContent.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Medium
                    </p>
                    <p className="text-foreground">{selectedContent.medium}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Class
                    </p>
                    <p className="text-foreground">{selectedContent.class}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Board
                    </p>
                    <p className="text-foreground">{selectedContent.board}</p>
                  </div>
                </div>
                {selectedContent.semester && (
                  <Badge className="mt-2 bg-primary/10 text-primary">
                    Semester: {selectedContent.semester}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {questions.map((question, index) => (
            <QuestionForm
              key={index}
              currentQuestion={question}
              handleQuestionChange={(e) => handleQuestionChange(index, e)}
              handleImageUpload={(files, type, language) =>
                handleImageUpload(index, files, type, language)
              }
              handleImageRemove={(imageIndex, type, language) =>
                handleImageRemove(index, imageIndex, type, language)
              }
              handlePasteImage={(e, type, language) =>
                handlePasteImage(index, e, type, language)
              }
              handleUpdateMarks={(increment) =>
                handleUpdateMarks(index, increment)
              }
              onToggleGujarati={(show) => handleToggleGujarati(index, show)}
              isSubmitting={isSubmitting}
              questionType={question.type || ""}
              removeQuestion={() => removeQuestion(index)}
              selectedContentMedium={selectedContentMedium}
              emptyFields={checkRequiredFields(question, index)}
              handleImageSizeChange={(type, imageIndex, newSize) =>
                handleImageSizeChange(index, type, imageIndex, newSize)
              }
              copySectionTitle={
                index > 0
                  ? () => {
                      setQuestions((prev) => {
                        const newQuestions = [...prev];
                        newQuestions[index].sectionTitle =
                          newQuestions[index - 1].sectionTitle || "";
                        return newQuestions;
                      });
                    }
                  : undefined
              }
              copyType={
                index > 0
                  ? () => {
                      setQuestions((prev) => {
                        const newQuestions = [...prev];
                        newQuestions[index].type =
                          newQuestions[index - 1].type || "";
                        return newQuestions;
                      });
                    }
                  : undefined
              }
              questionNumber={index + 1}
              fixQuestionAndAnswer={() => {
                setQuestions((prev) => {
                  const newQuestions = [...prev];
                  const q = newQuestions[index].question || "";
                  // Regex: split at first line/para starting with answer keywords (case-insensitive, optional whitespace)
                  const match = q.match(
                    /([\s\S]*?)(?:\n|\r|^)\s*(?:Answer|Ans|answer|ans|ઉત્તરઃ|ઉત્તર)\s*[:：]?(.*)/i
                  );
                  if (match) {
                    // Remove extra internal whitespace for both fields
                    const clean = (str: string) =>
                      str.replace(/\s+/g, " ").trim();
                    const before = clean(match[1]);
                    const after = clean(
                      match[2] + (q.split(match[0])[1] || "")
                    );
                    newQuestions[index].question = before;
                    newQuestions[index].answer = after;
                  }
                  return newQuestions;
                });
              }}
            />
          ))}

          <div className="sticky bottom-0 bg-background py-4 border-t">
            <div className="flex lg:flex-col sm:flex-row gap-4">
              <Button
                onClick={addNewQuestion}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Add Another Question
              </Button>
              <Button
                onClick={handleSaveQuestions}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Saving..." : "Save All Questions"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
