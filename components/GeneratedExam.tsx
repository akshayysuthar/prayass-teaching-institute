"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Question, GeneratedExamProps } from "@/types";

interface GroupedQuestions {
  [chapterId: string]: Question[];
}

// Utility function to format text into paragraphs
const formatText = (input: string) => {
  const parts = input.split(/(?=\d+\.\s)/); // Match question numbers like "1. ", "2. "
  return parts
    .map(
      (part) =>
        part
          .replace(
            /(\s)(Since|Applying|Therefore|Let|a\s?=\s?|b\s?=\s?|Dividend|Divisor|HCF)/g,
            "\n$1$2"
          ) // Add newlines before keywords
          .replace(/(?<=\d+ × \d+)/g, "\n") // Add newline after mathematical operations
    )
    .join("\n\n");
};

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
  const [currentPage, setCurrentPage] = useState(1);

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

  const renderImages = (images?: string | string[]) => {
    if (!images || images.length === 0) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 my-2">
        {imageArray.map((img, index) => (
          <Image
            key={index}
            src={img}
            alt={`Question/Answer image ${index + 1}`}
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
      <div key={question.id} className="mb-4 break-inside-avoid">
        <p className="font-semibold">
          {`Q${index + 1}. ${question.question}`} ({question.marks} marks)
        </p>
        {/* Render question images */}
        {question.question_images && renderImages(question.question_images)}
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

  const renderAnswer = (question: Question, index: number) => {
    return (
      <div key={question.id} className="mb-4 break-inside-avoid">
        <p className="font-semibold">{`Q${index + 1}. ${question.question}`}</p>
        <div className="ml-4">
          {typeof question.answer === "string" ? (
            <p>{formatText(question.answer)}</p> // Format the answer text
          ) : Array.isArray(question.answer) ? (
            <ul className="list-disc list-inside">
              {question.answer.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            Object.entries(question.answer).map(([key, value], idx) => (
              <div key={idx}>
                <strong>{key}:</strong>
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside ml-4">
                    {value.map((item, subIdx) => (
                      <li key={subIdx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-4">{value}</p>
                )}
              </div>
            ))
          )}
        </div>
        {/* Render answer images */}
        {question.answer_images && renderImages(question.answer_images)}
      </div>
    );
  };

  const renderPage = (pageNumber: number) => {
    const isAnswerKeyPage =
      pageNumber === Math.ceil(selectedQuestions.length / 5) + 1;

    return (
      <div className="a4-page">
        {pageNumber === 1 && (
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
            <p className="text-lg">
              Time: {Math.ceil(totalMarks * 1.5)} minutes
            </p>
          </div>
        )}

        {isAnswerKeyPage ? (
          <div>
            <h3 className="text-2xl font-bold mb-4">Answer Key</h3>
            {selectedQuestions.map((question, index) =>
              renderAnswer(question, index + 1)
            )}
          </div>
        ) : (
          <div>
            {Object.entries(groupedQuestions).map(([chapterId, questions]) => (
              <div key={chapterId} className="mb-6">
                <h3 className="text-xl font-bold mb-4">{chapterId}</h3>
                {questions
                  .slice((pageNumber - 1) * 5, pageNumber * 5)
                  .map((question, index) =>
                    renderQuestion(question, (pageNumber - 1) * 5 + index + 1)
                  )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-xl font-bold">
            {isAnswerKeyPage
              ? "End of Answer Key"
              : pageNumber === 1
              ? "All the Best!"
              : `Page ${pageNumber}`}
          </p>
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(selectedQuestions.length / 5) + 1; // +1 for answer key page

  return (
    <div>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <div key={pageNumber} className="mb-8">
          {renderPage(pageNumber)}
        </div>
      ))}
    </div>
  );
}
