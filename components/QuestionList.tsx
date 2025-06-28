"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import type { Question } from "@/types";

interface QuestionListProps {
  questions: Question[];
  isLoading: boolean;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
}

export function QuestionList({
  questions,
  isLoading,
  onEditQuestion,
  onDeleteQuestion,
}: QuestionListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">Loading questions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Questions ({questions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No questions found. Add your first question above.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {question.type || "General"}
                      </Badge>
                      <Badge variant="secondary">{question.marks} marks</Badge>
                      {question.img_size && (
                        <Badge variant="outline">
                          Image: {question.img_size}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">Question:</p>
                        <p className="text-gray-700">{question.question}</p>
                        {question.question_gu && (
                          <p className="text-gray-600 text-sm mt-1">
                            ગુજરાતી: {question.question_gu}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-medium">Answer:</p>
                        <p className="text-gray-700">
                          {typeof question.answer === "string"
                            ? question.answer
                            : JSON.stringify(question.answer)}
                        </p>
                        {question.answer_gu && (
                          <p className="text-gray-600 text-sm mt-1">
                            ગુજરાતી:{" "}
                            {typeof question.answer_gu === "string"
                              ? question.answer_gu
                              : JSON.stringify(question.answer_gu)}
                          </p>
                        )}
                      </div>

                      {question.section_title && (
                        <div>
                          <p className="font-medium">Section Title:</p>
                          <p className="text-gray-700">
                            {question.section_title}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Display Images */}
                    {(question.question_images || question.answer_images) && (
                      <div className="mt-3">
                        <p className="font-medium mb-2">Images:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {question.question_images &&
                            Array.isArray(question.question_images) &&
                            question.question_images.map((img, idx) => (
                              <Image
                                key={`q-${idx}`}
                                src={img || "/placeholder.svg"}
                                alt={`Question image ${idx + 1}`}
                                width={100}
                                height={75}
                                className="object-cover rounded border"
                              />
                            ))}
                          {question.answer_images &&
                            Array.isArray(question.answer_images) &&
                            question.answer_images.map((img, idx) => (
                              <Image
                                key={`a-${idx}`}
                                src={img || "/placeholder.svg"}
                                alt={`Answer image ${idx + 1}`}
                                width={100}
                                height={75}
                                className="object-cover rounded border"
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditQuestion(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 border-t pt-2">
                  Created: {new Date(question.created_at).toLocaleDateString()}{" "}
                  by {question.created_by}
                  {question.last_updated && (
                    <span>
                      {" "}
                      | Updated:{" "}
                      {new Date(question.last_updated).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
