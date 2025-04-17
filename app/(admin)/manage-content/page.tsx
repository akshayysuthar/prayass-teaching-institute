"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
// import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import type { Content, Subject, Question } from "@/types";
import { Loading } from "@/components/Loading";
// import { siteConfig } from "@/config/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Switch } from "@/components/ui/switch";

export default function ManageContentPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contents");

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
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    subject_name: "",
    chapter_name: "",
    chapter_no: "",
    content_id: "",
    status: true,
  });

  // Question stats
  const [contentStats, setContentStats] = useState<
    Record<
      number,
      {
        total: number;
        byMarks: Record<number, number>;
      }
    >
  >({});

  // useEffect(() => {
  //   if (
  //     !user ||
  //     !siteConfig.adminEmail.includes(user.emailAddresses[0]?.emailAddress)
  //   ) {
  //     redirect("/");
  //   }
  // }, [user]);

  useEffect(() => {
    fetchContents();
    fetchSubjects();
    fetchQuestions();
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
      setSubjects(data || []);
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

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase.from("questions").select("*");
      if (error) throw error;

      setQuestions(data || []);

      // Calculate stats
      const stats: Record<
        number,
        { total: number; byMarks: Record<number, number> }
      > = {};

      data.forEach((question) => {
        const contentId = question.content_id;
        const marks = question.marks;

        if (!stats[contentId]) {
          stats[contentId] = { total: 0, byMarks: {} };
        }

        stats[contentId].total++;

        if (!stats[contentId].byMarks[marks]) {
          stats[contentId].byMarks[marks] = 0;
        }

        stats[contentId].byMarks[marks]++;
      });

      setContentStats(stats);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    }
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
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
  };

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

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      subject_name: subject.subject_name,
      chapter_name: subject.chapter_name,
      chapter_no: subject.chapter_no.toString(),
      content_id: subject.content_id.toString(),
      status: subject.status || false,
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
      fetchQuestions();
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
      fetchQuestions();
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

  const handleToggleSubjectStatus = async (subject: Subject) => {
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

  const getQuestionsForSubject = (subjectId: number) => {
    return questions.filter((question) => question.subject_id === subjectId);
  };

  if (!user) return null;

  if (isLoading && (!contents.length || !subjects.length)) {
    return <Loading title="Loading content management..." />;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Manage Content and Subjects
        </h1>
        <p className="text-sm text-muted-foreground">
          Logged in as admin: {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contents">Contents</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="contents" className="space-y-4">
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

          {contents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">
                    No contents found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a new content.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contents.map((content) => (
                <Accordion
                  key={content.id}
                  type="single"
                  collapsible
                  className="border rounded-md bg-white"
                >
                  <AccordionItem value={`content-${content.id}`}>
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <span className="font-medium">{content.name}</span>
                            {content.status ? (
                              <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                            ) : (
                              <X className="inline-block ml-2 h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50">
                            Class {content.class}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50">
                            {content.medium}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50">
                            Sem {content.semester}
                          </Badge>
                          {contentStats[content.id] && (
                            <Badge variant="outline" className="bg-blue-50">
                              {contentStats[content.id].total} Questions
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-2">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">
                            Content Details
                          </h3>
                          <div className="flex items-center gap-2">
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

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Board
                            </p>
                            <p>{content.board}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Medium
                            </p>
                            <p>{content.medium}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Class
                            </p>
                            <p>{content.class}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Semester
                            </p>
                            <p>{content.semester}</p>
                          </div>
                        </div>

                        {contentStats[content.id] && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                              Question Distribution
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(
                                contentStats[content.id].byMarks
                              ).map(([mark, count]) => (
                                <Badge
                                  key={mark}
                                  variant="outline"
                                  className="bg-blue-50"
                                >
                                  {mark} mark: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

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
                                      <Badge variant="outline">
                                        {
                                          getQuestionsForSubject(subject.id)
                                            .length
                                        }{" "}
                                        Questions
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleEditSubject(subject)
                                        }
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
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Subject Management</h2>
            <Button
              onClick={() => {
                setEditingSubject(null);
                setSubjectForm({
                  subject_name: "",
                  chapter_name: "",
                  chapter_no: "",
                  content_id: "",
                  status: true,
                });
                setShowSubjectForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Subject
            </Button>
          </div>

          {subjects.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">
                    No subjects found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a new subject.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contents.map((content) => {
                const contentSubjects = getSubjectsForContent(content.id);
                if (contentSubjects.length === 0) return null;

                return (
                  <Card key={`subject-group-${content.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        {content.name}
                        {content.status ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Class {content.class} | {content.medium} | Semester{" "}
                        {content.semester}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {contentSubjects
                          .sort((a, b) => a.chapter_no - b.chapter_no)
                          .map((subject) => (
                            <div
                              key={subject.id}
                              className="flex justify-between items-center p-3 border rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <div>
                                  <span className="font-medium">
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
                                <Badge variant="outline">
                                  {getQuestionsForSubject(subject.id).length}{" "}
                                  Questions
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSubject(subject)}
                                >
                                  <Edit className="mr-1 h-4 w-4" /> Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() =>
                                    handleDeleteSubject(subject.id)
                                  }
                                >
                                  <Trash className="mr-1 h-4 w-4" /> Delete
                                </Button>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`subject-list-status-${subject.id}`}
                                    checked={subject.status || false}
                                    onCheckedChange={() =>
                                      handleToggleSubjectStatus(subject)
                                    }
                                  />
                                  <Label
                                    htmlFor={`subject-list-status-${subject.id}`}
                                  >
                                    {subject.status ? "Active" : "Inactive"}
                                  </Label>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSubject(null);
                          setSubjectForm({
                            subject_name: content.name,
                            chapter_name: "",
                            chapter_no: "",
                            content_id: content.id.toString(),
                            status: true,
                          });
                          setShowSubjectForm(true);
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add Subject to{" "}
                        {content.name}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
          <form onSubmit={handleContentSubmit}>
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
                    setContentForm({ ...contentForm, semester: e.target.value })
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
