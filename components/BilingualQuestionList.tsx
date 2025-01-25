import { useState, useEffect, useCallback } from "react";
import type { Question } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BilingualQuestionListProps {
  questions: Question[];
  onQuestionAdded: () => void;
  onQuestionUpdated: () => void;
  onQuestionRemoved: () => void;
  totalQuestions: number;
}

const ImagePreview = ({ src, alt }: { src: string; alt: string }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="relative">
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={100}
        height={100}
        className="object-cover cursor-pointer"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      />
      {showPreview && (
        <div className="absolute z-10 top-full left-0 mt-2">
          <Image
            src={src || "/placeholder.svg"}
            alt={alt}
            width={300}
            height={300}
            className="object-contain bg-white border border-gray-200 shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export function BilingualQuestionList({
  questions,
  onQuestionAdded,
  onQuestionUpdated,
  onQuestionRemoved,
  totalQuestions,
}: BilingualQuestionListProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question: "",
    question_gu: "",
    answer: "",
    answer_gu: "",
    marks: 1,
    type: "",
    section_title: "",
    is_reviewed: false,
    question_images: [],
    question_images_gu: [],
    answer_images: [],
    answer_images_gu: [],
  });
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const gujaratiQuestions = questions.filter(
      (q) => q.question_gu && q.question_gu.trim() !== ""
    );
    const percentage = (gujaratiQuestions.length / totalQuestions) * 100;
    setProgress(Math.round(percentage));
  }, [questions, totalQuestions]);

  const renderContent = (content: string, images: string[] | null) => {
    if (!content) return null;
    const parts = content.split(/(\[img\d+\])/g);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[img(\d+)\]/);
      if (imgMatch && images && images[Number.parseInt(imgMatch[1]) - 1]) {
        return (
          <ImagePreview
            key={index}
            src={images[Number.parseInt(imgMatch[1]) - 1] || "/placeholder.svg"}
            alt={`Image ${imgMatch[1]}`}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question.id);
    setEditedQuestion({ ...question });
  };

  const handleEditChange = (
    field: string,
    value: string | number | boolean
  ) => {
    if (editedQuestion) {
      setEditedQuestion({ ...editedQuestion, [field]: value });
    }
  };

  const handleSave = async () => {
    if (editedQuestion) {
      try {
        const { error } = await supabase
          .from("questions")
          .update(editedQuestion)
          .eq("id", editedQuestion.id);
        if (error) throw error;
        setEditingQuestion(null);
        setEditedQuestion(null);
        onQuestionUpdated();
        toast({
          title: "Success",
          description: "Question updated successfully!",
        });
      } catch (error) {
        console.error("Error updating question:", error);
        toast({
          title: "Error",
          description: "Failed to update question. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemove = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);
      if (error) throw error;
      onQuestionRemoved();
      toast({
        title: "Success",
        description: "Question removed successfully!",
      });
    } catch (error) {
      console.error("Error removing question:", error);
      toast({
        title: "Error",
        description: "Failed to remove question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewQuestionChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setNewQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNewQuestion = async () => {
    try {
      const { error } = await supabase
        .from("questions")
        .insert([newQuestion])
        .select();
      if (error) throw error;
      onQuestionAdded();
      setNewQuestion({
        question: "",
        question_gu: "",
        answer: "",
        answer_gu: "",
        marks: 1,
        type: "",
        section_title: "",
        is_reviewed: false,
        question_images: [],
        question_images_gu: [],
        answer_images: [],
        answer_images_gu: [],
      });
      toast({
        title: "Success",
        description: "New question added successfully!",
      });
    } catch (error) {
      console.error("Error adding new question:", error);
      toast({
        title: "Error",
        description: "Failed to add new question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (
    questionId: string | null,
    field: string,
    files: FileList | string[]
  ) => {
    const uploadedUrls: string[] = [];

    const fileArray = Array.isArray(files) ? files : Array.from(files);
    for (const file of fileArray) {
      if (typeof file === "string") {
        uploadedUrls.push(file);
        continue;
      }
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

    if (questionId && editedQuestion) {
      setEditedQuestion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: [...((prev[field] as string[]) || []), ...uploadedUrls],
        };
      });
    } else {
      setNewQuestion((prev) => ({
        ...prev,
        [field]: [...((prev[field] as string[]) || []), ...uploadedUrls],
      }));
    }
  };

  const handleImageRemove = async (
    questionId: string | null,
    field: string,
    index: number
  ) => {
    if (questionId && editedQuestion) {
      setEditedQuestion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: (prev[field] as string[]).filter((_, i) => i !== index),
        };
      });
    } else {
      setNewQuestion((prev) => ({
        ...prev,
        [field]: (prev[field] as string[]).filter((_, i) => i !== index),
      }));
    }
  };

  const handlePaste = useCallback(
    async (
      e: React.ClipboardEvent,
      field: string,
      questionId: string | null
    ) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const base64data = event.target?.result as string;
              await handleImageUpload(questionId, field, [base64data]);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    },
    [handleImageUpload]
  ); //The fix is here. handleImageUpload is now a dependency of useCallback

  const groupedQuestions = questions.reduce((acc, question) => {
    const sectionTitle =
      question.section_title || question.sectionTitle || "Uncategorized";
    if (!acc[sectionTitle]) {
      acc[sectionTitle] = [];
    }
    acc[sectionTitle].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">Existing Questions</h2>
      <div className="mb-4">
        <Label>Gujarati Medium Progress</Label>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-gray-500 mt-1">{progress}% complete</p>
      </div>
      {Object.entries(groupedQuestions).map(
        ([sectionTitle, sectionQuestions]) => (
          <Accordion
            type="single"
            collapsible
            className="mb-4"
            key={sectionTitle}
          >
            <AccordionItem value={sectionTitle}>
              <AccordionTrigger>{sectionTitle}</AccordionTrigger>
              <AccordionContent>
                {sectionQuestions.map((question) => (
                  <Card key={question.id} className="mb-4">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Question {question.id}</span>
                        <div>
                          <Button
                            onClick={() => toggleQuestion(question.id)}
                            className="mr-2"
                          >
                            {expandedQuestions.includes(question.id)
                              ? "Collapse"
                              : "Expand"}
                          </Button>
                          <Button
                            onClick={() => handleEdit(question)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleRemove(question.id)}
                            variant="destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {editingQuestion === question.id && editedQuestion ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`question-${question.id}`}>
                                Question (English)
                              </Label>
                              <Textarea
                                id={`question-${question.id}`}
                                value={editedQuestion.question}
                                onChange={(e) =>
                                  handleEditChange("question", e.target.value)
                                }
                                onPaste={(e) =>
                                  handlePaste(e, "question_images", question.id)
                                }
                              />
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleImageUpload(
                                    question.id,
                                    "question_images",
                                    e.target.files!
                                  )
                                }
                                className="mt-2"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                {editedQuestion.question_images?.map(
                                  (img, index) => (
                                    <div key={index} className="relative">
                                      <ImagePreview
                                        src={img || "/placeholder.svg"}
                                        alt={`Question image ${index + 1}`}
                                      />
                                      <button
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        onClick={() =>
                                          handleImageRemove(
                                            question.id,
                                            "question_images",
                                            index
                                          )
                                        }
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`answer-${question.id}`}>
                                Answer (English)
                              </Label>
                              <Textarea
                                id={`answer-${question.id}`}
                                value={editedQuestion.answer as string}
                                onChange={(e) =>
                                  handleEditChange("answer", e.target.value)
                                }
                                onPaste={(e) =>
                                  handlePaste(e, "answer_images", question.id)
                                }
                              />
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleImageUpload(
                                    question.id,
                                    "answer_images",
                                    e.target.files!
                                  )
                                }
                                className="mt-2"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                {editedQuestion.answer_images?.map(
                                  (img, index) => (
                                    <div key={index} className="relative">
                                      <ImagePreview
                                        src={img || "/placeholder.svg"}
                                        alt={`Answer image ${index + 1}`}
                                      />
                                      <button
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        onClick={() =>
                                          handleImageRemove(
                                            question.id,
                                            "answer_images",
                                            index
                                          )
                                        }
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`question-gu-${question.id}`}>
                                Question (Gujarati)
                              </Label>
                              <Textarea
                                id={`question-gu-${question.id}`}
                                value={editedQuestion.question_gu}
                                onChange={(e) =>
                                  handleEditChange(
                                    "question_gu",
                                    e.target.value
                                  )
                                }
                                onPaste={(e) =>
                                  handlePaste(
                                    e,
                                    "question_images_gu",
                                    question.id
                                  )
                                }
                              />
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleImageUpload(
                                    question.id,
                                    "question_images_gu",
                                    e.target.files!
                                  )
                                }
                                className="mt-2"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                {editedQuestion.question_images_gu?.map(
                                  (img, index) => (
                                    <div key={index} className="relative">
                                      <ImagePreview
                                        src={img || "/placeholder.svg"}
                                        alt={`Question image (Gujarati) ${
                                          index + 1
                                        }`}
                                      />
                                      <button
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        onClick={() =>
                                          handleImageRemove(
                                            question.id,
                                            "question_images_gu",
                                            index
                                          )
                                        }
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`answer-gu-${question.id}`}>
                                Answer (Gujarati)
                              </Label>
                              <Textarea
                                id={`answer-gu-${question.id}`}
                                value={editedQuestion.answer_gu as string}
                                onChange={(e) =>
                                  handleEditChange("answer_gu", e.target.value)
                                }
                                onPaste={(e) =>
                                  handlePaste(
                                    e,
                                    "answer_images_gu",
                                    question.id
                                  )
                                }
                              />
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleImageUpload(
                                    question.id,
                                    "answer_images_gu",
                                    e.target.files!
                                  )
                                }
                                className="mt-2"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                {editedQuestion.answer_images_gu?.map(
                                  (img, index) => (
                                    <div key={index} className="relative">
                                      <ImagePreview
                                        src={img || "/placeholder.svg"}
                                        alt={`Answer image (Gujarati) ${
                                          index + 1
                                        }`}
                                      />
                                      <button
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        onClick={() =>
                                          handleImageRemove(
                                            question.id,
                                            "answer_images_gu",
                                            index
                                          )
                                        }
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`section-title-${question.id}`}>
                                Section Title
                              </Label>
                              <Input
                                id={`section-title-${question.id}`}
                                value={
                                  editedQuestion.section_title ||
                                  editedQuestion.sectionTitle
                                }
                                onChange={(e) =>
                                  handleEditChange(
                                    "section_title",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`marks-${question.id}`}>
                                Marks
                              </Label>
                              <Input
                                id={`marks-${question.id}`}
                                type="number"
                                value={editedQuestion.marks}
                                onChange={(e) =>
                                  handleEditChange(
                                    "marks",
                                    Number.parseInt(e.target.value, 10)
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`reviewed-${question.id}`}
                                checked={editedQuestion.is_reviewed}
                                onCheckedChange={(checked) =>
                                  handleEditChange(
                                    "is_reviewed",
                                    checked as boolean
                                  )
                                }
                              />
                              <Label htmlFor={`reviewed-${question.id}`}>
                                Reviewed
                              </Label>
                            </div>
                          </div>
                          <Button onClick={handleSave}>Save Changes</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold">English</h3>
                            <p>
                              <strong>Question:</strong>{" "}
                              {renderContent(
                                question.question,
                                question.question_images
                              )}
                            </p>
                            {expandedQuestions.includes(question.id) && (
                              <p>
                                <strong>Answer:</strong>{" "}
                                {renderContent(
                                  question.answer as string,
                                  question.answer_images
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">Gujarati</h3>
                            <p>
                              <strong>Question:</strong>{" "}
                              {renderContent(
                                question.question_gu,
                                question.question_images_gu
                              )}
                            </p>
                            {expandedQuestions.includes(question.id) && (
                              <p>
                                <strong>Answer:</strong>{" "}
                                {renderContent(
                                  question.answer_gu as string,
                                  question.answer_images_gu
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {expandedQuestions.includes(question.id) && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <p>
                            <strong>Marks:</strong> {question.marks}
                          </p>
                          <p>
                            <strong>Type:</strong> {question.type}
                          </p>
                          <p>
                            <strong>Reviewed:</strong>{" "}
                            {question.is_reviewed ? "Yes" : "No"}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      )}
      <Card>
        <CardHeader>
          <CardTitle>Add New Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-question">Question (English)</Label>
                <Textarea
                  id="new-question"
                  value={newQuestion.question}
                  onChange={(e) =>
                    handleNewQuestionChange("question", e.target.value)
                  }
                  onPaste={(e) => handlePaste(e, "question_images", null)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    handleImageUpload(null, "question_images", e.target.files!)
                  }
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newQuestion.question_images?.map((img, index) => (
                    <div key={index} className="relative">
                      <ImagePreview
                        src={img || "/placeholder.svg"}
                        alt={`New question image ${index + 1}`}
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={() =>
                          handleImageRemove(null, "question_images", index)
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="new-answer">Answer (English)</Label>
                <Textarea
                  id="new-answer"
                  value={newQuestion.answer as string}
                  onChange={(e) =>
                    handleNewQuestionChange("answer", e.target.value)
                  }
                  onPaste={(e) => handlePaste(e, "answer_images", null)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    handleImageUpload(null, "answer_images", e.target.files!)
                  }
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newQuestion.answer_images?.map((img, index) => (
                    <div key={index} className="relative">
                      <ImagePreview
                        src={img || "/placeholder.svg"}
                        alt={`New answer image ${index + 1}`}
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={() =>
                          handleImageRemove(null, "answer_images", index)
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-question-gu">Question (Gujarati)</Label>
                <Textarea
                  id="new-question-gu"
                  value={newQuestion.question_gu}
                  onChange={(e) =>
                    handleNewQuestionChange("question_gu", e.target.value)
                  }
                  onPaste={(e) => handlePaste(e, "question_images_gu", null)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    handleImageUpload(
                      null,
                      "question_images_gu",
                      e.target.files!
                    )
                  }
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newQuestion.question_images_gu?.map((img, index) => (
                    <div key={index} className="relative">
                      <ImagePreview
                        src={img || "/placeholder.svg"}
                        alt={`New question image (Gujarati) ${index + 1}`}
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={() =>
                          handleImageRemove(null, "question_images_gu", index)
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="new-answer-gu">Answer (Gujarati)</Label>
                <Textarea
                  id="new-answer-gu"
                  value={newQuestion.answer_gu as string}
                  onChange={(e) =>
                    handleNewQuestionChange("answer_gu", e.target.value)
                  }
                  onPaste={(e) => handlePaste(e, "answer_images_gu", null)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    handleImageUpload(null, "answer_images_gu", e.target.files!)
                  }
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newQuestion.answer_images_gu?.map((img, index) => (
                    <div key={index} className="relative">
                      <ImagePreview
                        src={img || "/placeholder.svg"}
                        alt={`New answer image (Gujarati) ${index + 1}`}
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        onClick={() =>
                          handleImageRemove(null, "answer_images_gu", index)
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-marks">Marks</Label>
                <Input
                  id="new-marks"
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) =>
                    handleNewQuestionChange(
                      "marks",
                      Number.parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-type">Type</Label>
                <Input
                  id="new-type"
                  value={newQuestion.type || ""}
                  onChange={(e) =>
                    handleNewQuestionChange("type", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-section-title">Section Title</Label>
                <Input
                  id="new-section-title"
                  value={newQuestion.section_title || ""}
                  onChange={(e) =>
                    handleNewQuestionChange("section_title", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-reviewed"
                checked={newQuestion.is_reviewed}
                onCheckedChange={(checked) =>
                  handleNewQuestionChange("is_reviewed", checked as boolean)
                }
              />
              <Label htmlFor="new-reviewed">Reviewed</Label>
            </div>
            <Button onClick={handleAddNewQuestion}>Add Question</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
