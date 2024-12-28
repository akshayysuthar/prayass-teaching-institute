"use client";
import { redirect } from "next/navigation";
import { AddContentForm } from "@/components/AddContentForm";
import { AddSubjectForm } from "@/components/AddSubjectForm";
// import { Button } from "@/components/ui/button";
// import { useUser } from "@clerk/nextjs";

export default async function ManageContentPage() {
  // const { user } = useUser();

  // // Check if user is admin
  // if (
  //   !user ||
  //   user.emailAddresses[0]?.emailAddress !== "akshaysuthar05@gmail.com"
  // ) {
  //   redirect("/");
  // }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Content and Subjects</h1>
        <p className="text-sm text-muted-foreground">
          {/* Logged in as admin: {user.emailAddresses[0]?.emailAddress} */}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add New Content</h2>
          <AddContentForm />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add New Subject</h2>
          <AddSubjectForm />
        </div>
      </div>
    </div>
  );
}
