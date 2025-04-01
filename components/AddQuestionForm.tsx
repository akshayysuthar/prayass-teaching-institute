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
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching recent entries:", error);
    } else {
      const entriesBySubject: Record<string, Partial<Question>[]> = {};
      data?.forEach((question) => {
        if (!entriesBySubject[question.subject_id]) {
          entriesBySubject[question.subject_id] = [];
        }
        if (entriesBySubject[question.subject_id].length < 5) {
          entriesBySubject[question.subject_id].push(question);
        }
      });
      //setRecentEntries(entriesBySubject);
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
    } catch (error) {
      console.error("Error fetching content details:", error);
    }
  };

  const fetchSuggestionsBySubject = async (subjectId: string) => {
    try {
      // Fetch unique section titles for this subject
      const { data: sectionData, error: sectionError } = await supabase
        .from("questions")
        .select("sectionTitle, section_title")
        .eq("subject_id", subjectId)
        .not("sectionTitle", "is", null)
        .limit(50);

      if (sectionError) throw sectionError;

      // Fetch unique question types for this subject
      const { data: typeData, error: typeError } = await supabase
        .from("questions")
        .select("type")
        .eq("subject_id", subjectId)
        .not("type", "is", null)
        .limit(50);

      if (typeError) throw typeError;

      // Process section titles (handle both sectionTitle and section_title fields)
      const sectionTitles = new Set<string>();
      sectionData.forEach((item) => {
        if (item.sectionTitle) sectionTitles.add(item.sectionTitle);
        if (item.section_title) sectionTitles.add(item.section_title);
      });

      // Process question types
      const types = new Set<string>();
      typeData.forEach((item) => {
        if (item.type) types.add(item.type);
      });

      // Add default types if none found
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

  const checkRequiredFields = (question: Partial<Question>) => {
    const requiredFields = ["question", "answer"];

    if (
      selectedContentMedium === "Gujarati" ||
      selectedContentMedium === "Both"
    ) {
      requiredFields.push("question_gu", "answer_gu");
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

    const emptyFieldsByQuestion = questions.map(checkRequiredFields);
    const isValid = emptyFieldsByQuestion.every(
      (fields) => !Object.values(fields).some(Boolean)
    );

    if (!isValid) {
      const emptyFields = emptyFieldsByQuestion.flatMap((fields, index) =>
        Object.entries(fields)
          .filter(([isEmpty]) => isEmpty)
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

      // Reset the form state
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
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
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
    // Keep the metadata to make it easier to add multiple questions
    // setMetadata({
    //   content_id: "",
    //   subject_id: "",
    //   section_title: "",
    //   type: "",
    // });
  };

  if (!user) {
    return (
      <div className="text-foreground">Please log in to access this form.</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border p-4 rounded-md bg-background">
        <h2 className="text-2xl font-bold text-foreground">
          Add New Questions
        </h2>
        <h3 className="text-lg font-semibold text-foreground/80">
          Instructions: Based on the selected content&apos;s medium, you&apos;ll
          see different input fields: - For English medium: Only English
          question and answer fields will be shown. - For Gujarati medium: Both
          English and Gujarati fields will be displayed. English inputs are
          always required. Gujarati inputs are required when the medium is
          Gujarati.
        </h3>

        <MetadataForm
          metadata={metadata}
          handleMetadataChange={handleMetadataChange}
          sectionTitleSuggestions={sectionTitleSuggestions}
          typeSuggestions={typeSuggestions}
        />

        {selectedContent && (
          <Card className="bg-background border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-foreground">
                Selected Content Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
          <div key={index} className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Question {index + 1}
            </h3>
            <QuestionForm
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
              isSubmitting={isSubmitting}
              questionType={metadata.type}
              removeQuestion={() => removeQuestion(index)}
              selectedContentMedium={selectedContentMedium}
              emptyFields={checkRequiredFields(question)}
            />
          </div>
        ))}
        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
          <Button onClick={addNewQuestion} variant="outline">
            Add Another Question
          </Button>
          <Button onClick={resetFormState} variant="destructive">
            Clear All
          </Button>
          <Button
            onClick={handleSaveQuestions}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            variant="outline"
          >
            {isSubmitting ? "Saving..." : "Save All Questions"}
          </Button>
        </div>
      </div>
    </div>
  );
}
