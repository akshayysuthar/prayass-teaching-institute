import { useState } from "react";
import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionDetails } from "./QuestionDetails";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";

interface QuestionListProps {
  questions: Question[];
  onQuestionUpdated: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isAdmin: boolean;
}

export function QuestionList({
  questions,
  onQuestionUpdated,
  onLoadMore,
  hasMore,
  isAdmin,
}: QuestionListProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [editingField, setEditingField] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const { toast } = useToast();

  const renderContent = (content: string, images: string[] | null) => {
    if (!content) return null;
    const parts = content.split(/(\[img\d+\])/g);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[img(\d+)\]/);
      if (imgMatch && images && images[parseInt(imgMatch[1]) - 1]) {
        return (
          <Image
            key={index}
            src={images[parseInt(imgMatch[1]) - 1]}
            alt={`Image ${imgMatch[1]}`}
            width={600}
            height={100}
            className="inline-block mr-2"
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleEdit = async (
    question: Question,
    field: string,
    value: string | number
  ) => {
    try {
      const { error } = await supabase
        .from("questions")
        .update({ [field]: value })
        .eq("id", question.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question updated successfully!",
      });

      onQuestionUpdated();
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    }
    setEditingField(null);
  };

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Question {question.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>Question:</strong>{" "}
                {renderContent(question.question, question.question_images)}
              </div>
              <div>
                <strong>Answer:</strong>{" "}
                {renderContent(
                  question.answer as string,
                  question.answer_images
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Type:</strong>{" "}
                  {editingField?.id === question.id &&
                  editingField.field === "type" ? (
                    <Input
                      value={question.type || ""}
                      onChange={(e) =>
                        handleEdit(question, "type", e.target.value)
                      }
                      onBlur={() => setEditingField(null)}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() =>
                        isAdmin &&
                        setEditingField({ id: question.id, field: "type" })
                      }
                    >
                      {question.type}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Marks:</strong>{" "}
                  {editingField?.id === question.id &&
                  editingField.field === "marks" ? (
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(e) =>
                        handleEdit(question, "marks", parseInt(e.target.value))
                      }
                      onBlur={() => setEditingField(null)}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() =>
                        isAdmin &&
                        setEditingField({ id: question.id, field: "marks" })
                      }
                    >
                      {question.marks}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Subject:</strong> {question.subject_id}
                </div>
                <div>
                  <strong>Chapter:</strong> {question.section_title}
                </div>
              </div>
              <div>
                <strong>Reviewed:</strong> {question.is_reviewed ? "Yes" : "No"}
              </div>
              <Button onClick={() => setSelectedQuestion(question)}>
                {isAdmin ? "Edit" : "View"} Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="mt-4 text-center">
          <Button onClick={onLoadMore}>View More</Button>
        </div>
      )}

      {selectedQuestion && (
        <QuestionDetails
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onSuccess={() => {
            setSelectedQuestion(null);
            onQuestionUpdated();
          }}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
