"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Question, Content } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetadataForm } from "./MetadataForm";
import { QuestionForm } from "./QuestionForm";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AddQuestionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
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
  const [sectionTitleSuggestions, setSectionTitleSuggestions] = useState<
    string[]
  >([]);
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  console.log(gujaratiToggles);

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

      setSectionTitleSuggestions(Array.from(sectionTitles));
      setTypeSuggestions(Array.from(types));
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

  const handleQuestionChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = {
        ...newQuestions[index],
        [name]: name === "marks" ? Number.parseInt(value, 10) : value,
      };
      return newQuestions;
    });
  };

  const handleImageUpload = async (
    index: number,
    files: File[],
    type: "question" | "answer",
    language: "en" | "gu"
  ) => {
    const uploadedUrls: string[] = [];
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
        uploadedUrls.push(publicUrl);
      }
    }

    setQuestions((prev) => {
      const newQuestions = [...prev];
      const fieldName = `${type}_images${language === "gu" ? "_gu" : ""}`;
      const currentImages = newQuestions[index][fieldName] || [];
      const newImages = [...currentImages, ...uploadedUrls];
      newQuestions[index] = {
        ...newQuestions[index],
        [fieldName]: newImages,
        [`${type}${language === "gu" ? "_gu" : ""}`]: `${
          newQuestions[index][`${type}${language === "gu" ? "_gu" : ""}`] || ""
        } [img${newImages.length}]`,
      };
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
      const fieldName = `${type}_images${language === "gu" ? "_gu" : ""}`;
      const images = newQuestions[questionIndex][fieldName] as string[];
      images.splice(imageIndex, 1);
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        [fieldName]: images,
        [`${type}${language === "gu" ? "_gu" : ""}`]: (
          newQuestions[questionIndex][
            `${type}${language === "gu" ? "_gu" : ""}`
          ] as string
        )
          .replace(`[img${imageIndex + 1}]`, "")
          .trim(),
      };
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
      const currentMarks = newQuestions[index].marks || 1;
      const newMarks = increment
        ? Math.min(5, currentMarks + 1)
        : Math.max(1, currentMarks - 1);
      newQuestions[index] = {
        ...newQuestions[index],
        marks: newMarks,
      };
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

  const checkRequiredFields = (question: Partial<Question>, index: number) => {
    const requiredFields = ["question", "answer"];
    if (gujaratiToggles[index]) {
      // requiredFields.push("question_gu", "answer_gu");
    }

    return requiredFields.reduce((acc, field) => {
      acc[field] = !question[field];
      return acc;
    }, {} as Record<string, boolean>);
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
      const questionsToSave = questions.map((question) => ({
        ...metadata,
        ...question,
        created_by: user.fullName,
        content_id: metadata.content_id
          ? Number.parseInt(metadata.content_id, 10)
          : null,
        subject_id: metadata.subject_id
          ? Number.parseInt(metadata.subject_id, 10)
          : null,
        marks: question.marks || 1,
      }));

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
      },
    ]);
    setGujaratiToggles([
      selectedContentMedium === "Gujarati" || selectedContentMedium === "Both",
    ]);
  };

  if (!user) {
    return (
      <div className="text-foreground">Please log in to access this form.</div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
      <Card className="bg-background border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            Add New Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border p-4 rounded-md bg-muted/50">
            <h3 className="text-lg font-semibold text-foreground/80 mb-4">
              Metadata
            </h3>
            <MetadataForm
              metadata={metadata}
              handleMetadataChange={handleMetadataChange}
              sectionTitleSuggestions={sectionTitleSuggestions}
              typeSuggestions={typeSuggestions}
              selectedClass={selectedClass} // New prop for filter for class
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
              questionType={metadata.type}
              removeQuestion={() => removeQuestion(index)}
              selectedContentMedium={selectedContentMedium}
              emptyFields={checkRequiredFields(question, index)}
            />
          ))}

          <div className="sticky bottom-0 bg-background py-4 border-t">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={addNewQuestion}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Add Another Question
              </Button>
              <Button
                onClick={resetFormState}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Clear All
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
