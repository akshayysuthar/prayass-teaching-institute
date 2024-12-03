"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Question, GeneratedExamProps, SelectedChapter } from "@/types";

export function GeneratedExam({
  selectedQuestions,
  instituteName,
  standard,
  subject,
  chapters,
  studentName,
  teacherName,
  totalMarks,
}: GeneratedExamProps) {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [reportType, setReportType] = useState("");
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const handleShowDetails = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setDetailsDialogOpen(true);
  };

  const handleSubmitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reportData = {
      questionId: selectedQuestionId,
      reportType: reportType,
      description: formData.get("description"),
    };
    console.log("Report submitted:", reportData);
    setDetailsDialogOpen(false);
    setReportType("");
  };

  const renderImages = (images?: string[]) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 my-2">
        {images.map((img, index) => (
          <Image
            key={index}
            src={img}
            alt={`Image ${index + 1}`}
            width={200}
            height={200}
            className="object-contain"
          />
        ))}
      </div>
    );
  };

  const renderQuestion = (question: Question, index: number) => {
    return (
      <div
        key={question.id}
        className="mb-6 pb-4 border-b border-gray-200 last:border-b-0"
      >
        <p className="font-semibold mb-2">{`Q${index + 1}. ${
          question.question
        }`}</p>
        {renderImages(question.questionImages)}
        {question.options && (
          <div className="ml-4 mb-2 flex gap-3">
            {Object.entries(question.options).map(([key, value]) => (
              <p key={key} className="mb-1">{`${key}) ${value}`}</p>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">
            ({question.marks} marks)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShowDetails(question.id)}
          >
            Details
          </Button>
        </div>
      </div>
    );
  };

  const renderAnswer = (answer: Question["answer"], images?: string[]) => {
    return (
      <div>
        {typeof answer === "string" && <p>{answer}</p>}
        {Array.isArray(answer) && (
          <ul className="list-disc list-inside">
            {answer.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        {typeof answer === "object" && !Array.isArray(answer) && (
          <div>
            {Object.entries(answer).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong>
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside ml-4">
                    {value.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-4">{value}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {renderImages(images)}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{instituteName}</h2>
          <p className="text-lg">
            Standard: {standard} | Subject: {subject}
          </p>
          <p className="text-lg">
            Chapters:{" "}
            {[
              ...new Set(
                chapters.map((ch) =>
                  typeof ch === "object" && "name" in ch ? ch.name : ch
                )
              ),
            ].join(", ")}
          </p>

          <p className="text-lg">Student's Name: {studentName}</p>
          <p className="text-lg">Teacher's Name: {teacherName}</p>
          <p className="text-lg">Total Marks: {totalMarks}</p>
          <p className="text-lg">Time: {Math.ceil(totalMarks * 1.5)} minutes</p>
        </div>

        {selectedQuestions.map((question, index) =>
          renderQuestion(question, index)
        )}

        <div className="text-center mt-8">
          <p className="text-xl font-bold">All the Best!</p>
        </div>

        <div className="mt-8">
          <Button onClick={() => setShowAnswerKey(!showAnswerKey)}>
            {showAnswerKey ? "Hide Answer Key" : "Show Answer Key"}
          </Button>
        </div>

        {showAnswerKey && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Answer Key</h3>
            {selectedQuestions.map((question, index) => (
              <div key={question.id} className="mb-4">
                <p className="font-semibold">{`Q${index + 1}. ${
                  question.question
                }`}</p>
                <div className="ml-4 mt-1">
                  {renderAnswer(question.answer, question.answerImages)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          {selectedQuestionId && (
            <div className="space-y-4">
              {(() => {
                const question = selectedQuestions.find(
                  (q) => q.id === selectedQuestionId
                );
                return question ? (
                  <>
                    <p>
                      <strong>Question:</strong> {question.question}
                    </p>
                    <p>
                      <strong>Type:</strong> {question.type}
                    </p>
                    <p>
                      <strong>Marks:</strong> {question.marks}
                    </p>
                    <p>
                      <strong>Reviewed:</strong>{" "}
                      {question.isReviewed ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Last Updated:</strong>{" "}
                      {question.lastUpdated || "N/A"}
                    </p>
                    <p>
                      <strong>Reviewed By:</strong>{" "}
                      {question.ReviewedBy || "N/A"}
                    </p>
                  </>
                ) : null;
              })()}
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <Label htmlFor="reportType">Report Issue</Label>
                  <Select onValueChange={setReportType} value={reportType}>
                    <SelectTrigger id="reportType">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wrongAnswer">Wrong Answer</SelectItem>
                      <SelectItem value="spellingMistake">
                        Spelling Mistake
                      </SelectItem>
                      <SelectItem value="noAnswer">No Answer Shown</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Please describe the issue in detail"
                    required
                  />
                </div>
                <Button type="submit">Submit Report</Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
