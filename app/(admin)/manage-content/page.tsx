"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
// import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import type { Content } from "@/types";
import { Loading } from "@/components/Loading";
// import { siteConfig } from "@/config/site";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  X,
  Plus,
  Edit,
  Trash,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Chapter type options
const CHAPTER_TYPE_OPTIONS = ["Chapter", "Poem", "Grammar", "(Custom Text)"];

// Extend Subject type to include chapterType
type SubjectWithChapterType = {
  id: number;
  subject_name: string;
  chapter_name: string;
  chapter_no: number;
  content_id: number;
  status: boolean;
  chapterType?: string | null;
};

export default function ManageContentPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithChapterType[]>([]);
  // const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedMedium, setSelectedMedium] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Content form state
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [contentForm, setContentForm] = useState({
    name: "",
    board: "",
    medium: "",
    class: "",
    semester: "",
    status: true,
  });

  // Subject form state
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] =
    useState<SubjectWithChapterType | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    subject_name: "",
    chapter_name: "",
    chapter_no: "",
    content_id: "",
    status: true,
    chapterType: "Chapter",
    customChapterType: "",
  });

  useEffect(() => {
    fetchContents();
    fetchSubjects();
    // fetchQuestions();
  }, []);

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error("Error fetching contents:", error);
      toast({
        title: "Error",
        description: "Failed to load contents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("subjects").select("*");
      if (error) throw error;
      setSubjects((data as SubjectWithChapterType[]) || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchQuestions = async () => {
  //   try {
  //     const { data, error } = await supabase.from("questions").select("*");
  //     if (error) throw error;

  //     setQuestions(data || []);
  //   } catch (error) {
  //     console.error("Error fetching questions:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to load questions",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
    setContentForm({
      name: content.name,
      board: content.board,
      medium: content.medium,
      class: content.class.toString(),
      semester: content.semester,
      status: content.status || false,
    });
    setShowContentForm(true);
  };

  const handleEditSubject = (subject: SubjectWithChapterType) => {
    setEditingSubject(subject);
    const chapterTypeSafe = subject.chapterType ?? "";
    setSubjectForm({
      subject_name: subject.subject_name,
      chapter_name: subject.chapter_name,
      chapter_no: subject.chapter_no.toString(),
      content_id: subject.content_id.toString(),
      status: subject.status || false,
      chapterType: CHAPTER_TYPE_OPTIONS.includes(chapterTypeSafe)
        ? chapterTypeSafe
        : "(Custom Text)",
      customChapterType: CHAPTER_TYPE_OPTIONS.includes(chapterTypeSafe)
        ? ""
        : chapterTypeSafe,
    });
    setShowSubjectForm(true);
  };

  const handleDeleteContent = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this content? This will also delete all associated subjects and questions."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("contents").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });

      fetchContents();
      fetchSubjects();
      // fetchQuestions();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this subject? This will also delete all associated questions."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });

      fetchSubjects();
      // fetchQuestions();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleContentStatus = async (content: Content) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("contents")
        .update({ status: !content.status })
        .eq("id", content.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Content status ${
          !content.status ? "activated" : "deactivated"
        }`,
      });

      fetchContents();
    } catch (error) {
      console.error("Error updating content status:", error);
      toast({
        title: "Error",
        description: "Failed to update content status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubjectStatus = async (subject: SubjectWithChapterType) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("subjects")
        .update({ status: !subject.status })
        .eq("id", subject.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subject status ${
          !subject.status ? "activated" : "deactivated"
        }`,
      });

      fetchSubjects();
    } catch (error) {
      console.error("Error updating subject status:", error);
      toast({
        title: "Error",
        description: "Failed to update subject status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectsForContent = (contentId: number) => {
    return subjects.filter((subject) => subject.content_id === contentId);
  };

  // Filtered contents
  const filteredContents = contents.filter((content) => {
    const mediumMatch = selectedMedium
      ? content.medium === selectedMedium
      : true;
    const classMatch = selectedClass
      ? content.class.toString() === selectedClass
      : true;
    return mediumMatch && classMatch;
  });

  // Subject form submit handler must be defined before JSX usage
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingSubject) {
        // Update existing subject
        const { error } = await supabase
          .from("subjects")
          .update({
            subject_name: subjectForm.subject_name,
            chapter_name: subjectForm.chapter_name,
            chapter_no: Number.parseInt(subjectForm.chapter_no),
            content_id: Number.parseInt(subjectForm.content_id),
            status: subjectForm.status,
            chapterType:
              subjectForm.chapterType === "(Custom Text)"
                ? subjectForm.customChapterType
                : subjectForm.chapterType,
          })
          .eq("id", editingSubject.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Subject updated successfully",
        });
      } else {
        // Add new subject
        const { error } = await supabase.from("subjects").insert({
          subject_name: subjectForm.subject_name,
          chapter_name: subjectForm.chapter_name,
          chapter_no: Number.parseInt(subjectForm.chapter_no),
          content_id: Number.parseInt(subjectForm.content_id),
          status: subjectForm.status,
          chapterType:
            subjectForm.chapterType === "(Custom Text)"
              ? subjectForm.customChapterType
              : subjectForm.chapterType,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Subject added successfully",
        });
      }

      // Reset form and refresh data
      setSubjectForm({
        subject_name: "",
        chapter_name: "",
        chapter_no: "",
        content_id: "",
        status: true,
        chapterType: "Chapter",
        customChapterType: "",
      });
      setEditingSubject(null);
      setShowSubjectForm(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast({
        title: "Error",
        description: "Failed to save subject",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (isLoading && (!contents.length || !subjects.length)) {
    return <Loading title="Loading content management..." />;
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-6xl">
      {/* Filter Titles and Buttons */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div>
            <div className="text-xs font-semibold mb-1">Filter by Medium</div>
            <div className="flex flex-wrap gap-2">
              {["English", "Gujarati", "Both"].map((medium) => (
                <Button
                  key={medium}
                  variant={selectedMedium === medium ? "default" : "outline"}
                  onClick={() =>
                    setSelectedMedium(medium === selectedMedium ? "" : medium)
                  }
                  className="text-xs px-2 py-1"
                >
                  {medium}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">Filter by Class</div>
            <div className="flex flex-wrap gap-2">
              {[...Array(10)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={
                    selectedClass === String(i + 1) ? "default" : "outline"
                  }
                  onClick={() =>
                    setSelectedClass(
                      selectedClass === String(i + 1) ? "" : String(i + 1)
                    )
                  }
                  className="text-xs px-2 py-1"
                >
                  Class {i + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-300">
          Manage Content and Subjects
        </h1>
        <p className="text-sm text-muted-foreground">
          Logged in as admin: {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      {/* Content Management Section (no tabs) */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Content Management</h2>
          <Button
            onClick={() => {
              setEditingContent(null);
              setContentForm({
                name: "",
                board: "",
                medium: "",
                class: "",
                semester: "",
                status: true,
              });
              setShowContentForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Content
          </Button>
        </div>

        {filteredContents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No contents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new content.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContents.map((content) => (
              <Accordion
                key={content.id}
                type="single"
                collapsible
                className="border rounded-md bg-white dark:bg-gray-900"
              >
                <AccordionItem value={`content-${content.id}`}>
                  <AccordionTrigger className="px-2 py-2 sm:px-4 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full">
                      <div className="flex-1 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        <div>
                          <span className="font-medium">
                            {content.name} - {content.medium} Med - Class{" "}
                            {content.class}
                          </span>
                          {content.status ? (
                            <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                          ) : (
                            <X className="inline-block ml-2 h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 py-2 sm:px-4 sm:py-2">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h3 className="text-lg font-medium">Content Details</h3>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditContent(content)}
                          >
                            <Edit className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteContent(content.id)}
                          >
                            <Trash className="mr-1 h-4 w-4" /> Delete
                          </Button>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`content-status-${content.id}`}
                              checked={content.status || false}
                              onCheckedChange={() =>
                                handleToggleContentStatus(content)
                              }
                            />
                            <Label htmlFor={`content-status-${content.id}`}>
                              {content.status ? "Active" : "Inactive"}
                            </Label>
                          </div>
                        </div>
                      </div>
                      {/* No question count or semester badge */}
                      <div className="text-sm text-gray-700 dark:text-gray-200 flex flex-wrap gap-2">
                        {content.board} <span className="mx-1">•</span>{" "}
                        {content.medium} <span className="mx-1">•</span> Class{" "}
                        {content.class}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          Subjects/Chapters
                        </h4>
                        {getSubjectsForContent(content.id).length > 0 ? (
                          <div className="space-y-2">
                            {getSubjectsForContent(content.id)
                              .sort((a, b) => a.chapter_no - b.chapter_no)
                              .map((subject) => (
                                <div
                                  key={subject.id}
                                  className="flex justify-between items-center p-2 border rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <span>
                                        Ch {subject.chapter_no}:{" "}
                                        {subject.chapter_name}
                                      </span>
                                      {subject.status ? (
                                        <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                                      ) : (
                                        <X className="inline-block ml-2 h-4 w-4 text-red-600" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditSubject(subject)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() =>
                                        handleDeleteSubject(subject.id)
                                      }
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                    <Switch
                                      id={`subject-status-${subject.id}`}
                                      checked={subject.status || false}
                                      onCheckedChange={() =>
                                        handleToggleSubjectStatus(subject)
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No subjects added yet.
                          </p>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setEditingSubject(null);
                            setSubjectForm({
                              subject_name: content.name,
                              chapter_name: "",
                              chapter_no: "",
                              content_id: content.id.toString(),
                              status: true,
                              chapterType: "Chapter",
                              customChapterType: "",
                            });
                            setShowSubjectForm(true);
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add Subject
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        )}
      </div>

      {/* Content Form Dialog */}
      <Dialog open={showContentForm} onOpenChange={setShowContentForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? "Edit Content" : "Add New Content"}
            </DialogTitle>
            <DialogDescription>
              {editingContent
                ? "Update the content details below."
                : "Fill in the details to add a new content."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              try {
                if (editingContent) {
                  // Update existing content
                  const { error } = await supabase
                    .from("contents")
                    .update({
                      name: contentForm.name,
                      board: contentForm.board,
                      medium: contentForm.medium,
                      class: Number.parseInt(contentForm.class),
                      semester: contentForm.semester,
                      status: contentForm.status,
                    })
                    .eq("id", editingContent.id);
                  if (error) throw error;
                  toast({
                    title: "Success",
                    description: "Content updated successfully",
                  });
                } else {
                  // Add new content
                  const { error } = await supabase.from("contents").insert({
                    name: contentForm.name,
                    board: contentForm.board,
                    medium: contentForm.medium,
                    class: Number.parseInt(contentForm.class),
                    semester: contentForm.semester,
                    status: contentForm.status,
                  });
                  if (error) throw error;
                  toast({
                    title: "Success",
                    description: "Content added successfully",
                  });
                }
                // Reset form and refresh data
                setContentForm({
                  name: "",
                  board: "",
                  medium: "",
                  class: "",
                  semester: "",
                  status: true,
                });
                setEditingContent(null);
                setShowContentForm(false);
                fetchContents();
              } catch (error) {
                console.error("Error saving content:", error);
                toast({
                  title: "Error",
                  description: "Failed to save content",
                  variant: "destructive",
                });
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={contentForm.name}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, name: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="board" className="text-right">
                  Board
                </Label>
                <Input
                  id="board"
                  value={contentForm.board}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, board: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="medium" className="text-right">
                  Medium
                </Label>
                <Input
                  id="medium"
                  value={contentForm.medium}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, medium: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Input
                  id="class"
                  type="number"
                  value={contentForm.class}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, class: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semester" className="text-right">
                  Semester
                </Label>
                <Input
                  id="semester"
                  value={contentForm.semester}
                  onChange={(e) =>
                    setContentForm({
                      ...contentForm,
                      semester: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content-status" className="text-right">
                  Status
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="content-status"
                    checked={contentForm.status}
                    onCheckedChange={(checked) =>
                      setContentForm({ ...contentForm, status: checked })
                    }
                  />
                  <Label htmlFor="content-status">
                    {contentForm.status ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingContent ? "Update Content" : "Add Content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subject Form Dialog */}
      <Dialog open={showSubjectForm} onOpenChange={setShowSubjectForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? "Update the subject details below."
                : "Fill in the details to add a new subject."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubjectSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content_id" className="text-right">
                  Content
                </Label>
                <select
                  id="content_id"
                  value={subjectForm.content_id}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      content_id: e.target.value,
                    })
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select Content</option>
                  {contents.map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.name} (Class {content.class}, {content.medium})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject_name" className="text-right">
                  Subject Name
                </Label>
                <Input
                  id="subject_name"
                  value={subjectForm.subject_name}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      subject_name: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="chapter_name" className="text-right">
                  Chapter Name
                </Label>
                <Input
                  id="chapter_name"
                  value={subjectForm.chapter_name}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      chapter_name: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="chapter_no" className="text-right">
                  Chapter No
                </Label>
                <Input
                  id="chapter_no"
                  type="number"
                  value={subjectForm.chapter_no}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      chapter_no: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="chapterType" className="text-right">
                  Chapter Type
                </Label>
                <div className="col-span-3 flex flex-col gap-2">
                  <select
                    id="chapterType"
                    value={subjectForm.chapterType}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        chapterType: e.target.value,
                        customChapterType:
                          e.target.value === "(Custom Text)"
                            ? subjectForm.customChapterType
                            : "",
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    {CHAPTER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {subjectForm.chapterType === "(Custom Text)" && (
                    <Input
                      id="customChapterType"
                      placeholder="Enter custom chapter type"
                      value={subjectForm.customChapterType}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          customChapterType: e.target.value,
                        })
                      }
                      className="w-full"
                      required
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject-status" className="text-right">
                  Status
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="subject-status"
                    checked={subjectForm.status}
                    onCheckedChange={(checked) =>
                      setSubjectForm({ ...subjectForm, status: checked })
                    }
                  />
                  <Label htmlFor="subject-status">
                    {subjectForm.status ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingSubject ? "Update Subject" : "Add Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
