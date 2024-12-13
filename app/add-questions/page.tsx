"use client";

import { AddQuestionForm } from "@/components/AddQuestionForm";
import { UploadedQuestions } from "@/components/UploadedQuestions";
import Link from "next/link";

export default function AddQuestionPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Add New Question</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Exam Generator
        </Link>
      </div>
      <AddQuestionForm />
      {/* <UploadedQuestions /> */}
    </div>
  );
}
