import { useState } from "react";
import type { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionDetails } from "./QuestionDetails";
import Image from "next/image";

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

  const renderContent = (content: string, images: string[] | null) => {
    if (!content) return null;
    const parts = content.split(/(\[img\d+\])/g);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[img(\d+)\]/);
      if (imgMatch && images && images[Number.parseInt(imgMatch[1]) - 1]) {
        return (
          <Image
            key={index}
            src={images[Number.parseInt(imgMatch[1]) - 1] || "/placeholder.svg"}
            alt={`Image ${imgMatch[1]}`}
            width={100}
            height={100}
            className="inline-block mr-2"
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
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
                <strong>Content:</strong> {question.content_name}
              </div>
              <div>
                <strong>Subject:</strong> {question.subject_name}
              </div>
              <div>
                <strong>Chapter:</strong> {question.chapter_no}.{" "}
                {question.chapter_name}
              </div>
              <div>
                <strong>Question (English):</strong>{" "}
                {renderContent(question.question, question.question_images)}
              </div>
              {question.question_gu && (
                <div>
                  <strong>Question (Gujarati):</strong>{" "}
                  {renderContent(
                    question.question_gu,
                    question.question_images_gu
                  )}
                </div>
              )}
              <div>
                <strong>Answer (English):</strong>{" "}
                {renderContent(
                  question.answer as string,
                  question.answer_images
                )}
              </div>
              {question.answer_gu && (
                <div>
                  <strong>Answer (Gujarati):</strong>{" "}
                  {renderContent(
                    question.answer_gu as string,
                    question.answer_images_gu
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Type:</strong> {question.type}
                </div>
                <div>
                  <strong>Marks:</strong> {question.marks}
                </div>
                <div>
                  <strong>Reviewed:</strong>{" "}
                  {question.is_reviewed ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Created By:</strong> {question.created_by}
                </div>
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
