"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AddContentForm } from "@/components/AddContentForm";
import { AddSubjectForm } from "@/components/AddSubjectForm";
import { EditContentForm } from "@/components/EditContentForm";
import { EditSubjectForm } from "@/components/EditSubjectForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { Content, Subject } from "@/types";
import { Loading } from "@/components/Loading";
import { siteConfig } from "@/config/site";

export default function ManageContentPage() {
  const { user } = useUser();
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (
      !user ||
      !siteConfig.adminEmail.includes(user.emailAddresses[0]?.emailAddress)
    ) {
      redirect("/");
    }
  }, [user]);

  useEffect(() => {
    fetchContents();
    fetchSubjects();
  }, []);

  const fetchContents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("contents").select("*");
    if (error) {
      console.error("Error fetching contents:", error);
    } else {
      setContents(data);
    }
    setIsLoading(false);
  };

  const fetchSubjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("subjects").select("*");
    if (error) {
      console.error("Error fetching subjects:", error);
    } else {
      setSubjects(data);
    }
    setIsLoading(false);
  };

  const handleContentAdded = () => {
    fetchContents();
  };

  const handleSubjectAdded = () => {
    fetchSubjects();
  };

  const handleContentUpdated = () => {
    fetchContents();
    setEditingContent(null);
  };

  const handleSubjectUpdated = () => {
    fetchSubjects();
    setEditingSubject(null);
  };

  if (!user) return null;

  if (isLoading) {
    return <Loading title="Loading content management..." />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Content and Subjects</h1>
        <p className="text-sm text-muted-foreground">
          Logged in as admin: {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add New Content</h2>
          <AddContentForm onContentAdded={handleContentAdded} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add New Subject</h2>
          <AddSubjectForm onSubjectAdded={handleSubjectAdded} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Contents</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {contents.map((content) => (
            <div key={content.id} className="border p-4 rounded-md">
              <h3 className="font-bold">{content.name}</h3>
              <p>Board: {content.board}</p>
              <p>Medium: {content.medium}</p>
              <p>Class: {content.class}</p>
              <Button
                onClick={() => setEditingContent(content)}
                className="mt-2"
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Subjects</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="border p-4 rounded-md">
              <h3 className="font-bold">{subject.subject_name}</h3>
              <p>Chapter: {subject.chapter_name}</p>
              <p>Chapter No: {subject.chapter_no}</p>
              <Button
                onClick={() => setEditingSubject(subject)}
                className="mt-2"
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      </div>

      {editingContent && (
        <EditContentForm
          content={editingContent}
          onClose={() => setEditingContent(null)}
          onSuccess={handleContentUpdated}
        />
      )}

      {editingSubject && (
        <EditSubjectForm
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSuccess={handleSubjectUpdated}
        />
      )}
    </div>
  );
}
