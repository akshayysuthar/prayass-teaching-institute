import { useState } from "react";
import type { Question, Content, Subject } from "@/types";
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
  contents: Content[];
  subjects: Subject[];
}

export function QuestionList({
  questions,
  onQuestionUpdated,
  onLoadMore,
  hasMore,
  isAdmin,
  contents,
  subjects,
}: QuestionListProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );

  const renderContent = (content: string, images: string[] | null, imgSizes?: string[] | null) => {
    if (!content) return null;
    const parts = content.split(/(\[img\d+\])/g);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[img(\d+)\]/);
      if (imgMatch && images && images[Number.parseInt(imgMatch[1]) - 1]) {
        return (
          <span key={index} className="inline-block align-middle mr-2">
            <Image
              src={images[Number.parseInt(imgMatch[1]) - 1] || "/placeholder.svg"}
              alt={`Image ${imgMatch[1]}`}
              width={60}
              height={60}
              className="inline-block rounded border"
            />
            {imgSizes && imgSizes[Number.parseInt(imgMatch[1]) - 1] && (
              <span className="block text-xs text-gray-500 text-center">{imgSizes[Number.parseInt(imgMatch[1]) - 1]}</span>
            )}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="overflow-hidden border shadow-sm p-2 sm:p-4 flex flex-col gap-2 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              Q{question.id}
              <span className="text-xs font-normal text-gray-500">{question.type} • {question.marks} marks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{question.content_name}</span>
              {question.chapter_no && (
                <span> • Ch {question.chapter_no}: {question.chapter_name}</span>
              )}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Q:</span> {renderContent(question.question, question.question_images, question.img_size ? JSON.parse(question.img_size).question : undefined)}
            </div>
            <div className="text-sm">
              <span className="font-semibold">A:</span> {renderContent(question.answer as string, question.answer_images, question.img_size ? JSON.parse(question.img_size).answer : undefined)}
            </div>
            {/* Hide Gujarati fields, not remove */}
            <div className="hidden">
              {question.question_gu && (
                <div>
                  <strong>Question (Gujarati):</strong> {renderContent(question.question_gu, question.question_images_gu)}
                </div>
              )}
              {question.answer_gu && (
                <div>
                  <strong>Answer (Gujarati):</strong> {renderContent(question.answer_gu as string, question.answer_images_gu)}
                </div>
              )}
            </div>
            <div className="flex flex-row flex-wrap gap-2 mt-2">
              <Button size="sm" onClick={() => setSelectedQuestion(question)}>
                Edit
              </Button>
              <span className="text-xs text-gray-400 ml-auto">By: {question.created_by}</span>
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
          contents={contents}
          subjects={subjects}
        />
      )}
    </div>
  );
}
