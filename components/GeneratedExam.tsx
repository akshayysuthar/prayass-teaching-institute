"use client";

import { useState, useMemo } from "react";
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
import { Question, GeneratedExamProps } from "@/types";

interface GroupedQuestions {
  [chapterId: string]: Question[];
}

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

  const groupedQuestions = useMemo(() => {
    const grouped: GroupedQuestions = {};
    selectedQuestions.forEach((question) => {
      if (!grouped[question.Ch]) {
        grouped[question.Ch] = [];
      }
      grouped[question.Ch].push(question);
    });
    return grouped;
  }, [selectedQuestions]);

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

  const renderImages = (images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 my-2">
        {imageArray.map((img, index) => (
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
        className="mb-6 pb-4 border-b border-gray-200 last:border-b-0 break-inside-avoid px-5"
      >
        <div className="flex justify-between items-start mb-2">
          <p className="font-semibold">{`Q${index + 1}. ${
            question.question
          }`}</p>
          <span className="text-sm text-gray-500 ml-2">
            ({question.marks} marks)
          </span>
        </div>
        {question.questionImages &&
          question.questionImages.length > 0 &&
          renderImages(question.questionImages)}
        {question.options && (
          <div className="ml-4 mt-2">
            {Object.entries(question.options).map(([key, value]) => (
              <p key={key} className="mb-1">{`${key}) ${value}`}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAnswer = (answer: Question["answer"]) => {
    if (typeof answer === "string") {
      return <p className="ml-4">{answer}</p>;
    } else if (Array.isArray(answer)) {
      return (
        <ul className="list-disc list-inside ml-4">
          {answer.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    } else if (typeof answer === "object" && answer !== null) {
      return (
        <div className="ml-4">
          {Object.entries(answer).map(([key, value], index) => (
            <div key={index}>
              <strong>{key}:</strong>
              {Array.isArray(value) ? (
                <ul className="list-disc list-inside ml-4">
                  {value.map((item, subIndex) => (
                    <li key={subIndex}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="ml-4">[value]</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="a4-page">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-4">{instituteName}</h2>
        <p className="text-lg">
          Standard: {standard} | Subject: {subject}
        </p>
        <p className="text-lg">Chapters: {chapters.join(", ")}</p>
        <p className="text-lg">
          <strong>Student&apos;s Name:</strong> {studentName}
        </p>
        <p className="text-lg">
          <strong>Teacher&apos;s Name:</strong> {teacherName}
        </p>
        <p className="text-lg">Total Marks: {totalMarks}</p>
        <p className="text-lg">Time: {Math.ceil(totalMarks * 1.5)} minutes</p>
      </div>

      {Object.entries(groupedQuestions).map(([chapterId, questions]) => (
        <div key={chapterId} className="mb-6">
          <h3 className="text-xl font-bold mb-4">{chapterId}</h3>
          {questions.map((question, index) =>
            renderQuestion(question, index + 1)
          )}
        </div>
      ))}

      <div className="text-center mt-8">
        <p className="text-xl font-bold">All the Best!</p>
      </div>

      {showAnswerKey && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-2xl font-bold mb-4">Answer Key</h3>
          {Object.entries(groupedQuestions).map(([chapterId, questions]) => (
            <div key={chapterId} className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{chapterId}</h4>
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="mb-4 pb-2 border-b last:border-b-0 break-inside-avoid"
                >
                  <p className="font-semibold">{`Q${index + 1}. ${
                    question.question
                  }`}</p>
                  <div className="mt-1">{renderAnswer(question.answer)}</div>
                  {question.answerImages &&
                    question.answerImages.length > 0 &&
                    renderImages(question.answerImages)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

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
                      {question.reviewedBy || "N/A"}
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
