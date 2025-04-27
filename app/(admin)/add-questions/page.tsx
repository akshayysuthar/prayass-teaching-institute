"use client";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AddQuestionPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  return (
    <div className="container mx-auto ">
      <h1 className="text-2xl font-bold my-4 text-foreground">
        Add New Question
      </h1>
      {isSignedIn ? (
        <AddQuestionForm />
      ) : (
        <div className=" text-center space-y-4 border rounded-lg bg-background">
          <p className="text-foreground text-lg">
            Please sign in to access the question form.
          </p>
          <Button onClick={() => router.push("/sign-in")}>Sign In</Button>
        </div>
      )}
    </div>
  );
}
