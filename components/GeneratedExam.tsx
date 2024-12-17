"use client";

import { useState } from "react";
import Image from "next/image";
import { Question, GeneratedExamProps } from "@/types";

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
}: Pick<GeneratedExamProps, "selectedQuestions">) {
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const renderImages = (images?: string | string[]) => {
    if (!images || images.length === 0) return null;
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

  const handleReport = (questionId: string) => {
    // Replace this with actual reporting logic (e.g., API call)
    alert(`Question with ID ${questionId} reported for errors.`);
  };

  const renderQuestion = (question: Question, index: number) => {
    return (
      <div
        key={question.id}
        className="p-4 border border-gray-300 rounded mb-4 shadow"
      >
        {/* Question Text */}
        <div className="flex justify-between items-start">
          <p className="font-semibold">{`Q${index + 1}. ${question.question} (${
            question.marks
          } marks)`}</p>
          <button
            onClick={() => handleReport(question.id)}
            className="text-sm text-red-500 hover:underline"
          >
            Report
          </button>
        </div>

        {/* Render Question Images */}
        {question.question_images && renderImages(question.question_images)}

        {/* Options */}
        {question.options && (
          <div className="ml-4 mt-2">
            {Object.entries(question.options).map(([key, value]) => (
              <p key={key} className="mb-1">{`${key}) ${value}`}</p>
            ))}
          </div>
        )}

        {/* Render Answer (conditionally based on the toggle) */}
        {showAnswerKey && (
          <div className="mt-4">
            <h4 className="font-semibold">Answer:</h4>
            {typeof question.answer === "string" ? (
              <p>{formatText(question.answer)}</p>
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

            {/* Render Answer Images */}
            {question.answer_images && renderImages(question.answer_images)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Generated Exam</h1>

      {/* Toggle Answer Key */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAnswerKey((prev) => !prev)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showAnswerKey ? "Hide Answer Key" : "Show Answer Key"}
        </button>
      </div>

      {/* Render Questions */}
      {selectedQuestions.map((question, index) =>
        renderQuestion(question, index)
      )}
    </div>
  );
}
