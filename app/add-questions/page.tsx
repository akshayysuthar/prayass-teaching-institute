"use client";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { useUser } from "@clerk/nextjs";

export default function AddQuestionPage() {
  const { user, isSignedIn } = useUser();

  return (
    <div className="container mx-auto p-4">
      {/* <h1 className="text-2xl font-bold my-4">Add New Question</h1> */}
      {isSignedIn ? (
        <AddQuestionForm />
      ) : (
        <p>Please sign in to access the question form.</p>
      )}
    </div>
  );
}
