import React from "react";

function page() {
  return <div>page</div>;
}

export default page;

// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { ContentSubjectSelector } from "@/components/ContentSubjectSelector";
// import { QuestionEditor } from "@/components/QuestionEditor";
// import { QuestionList } from "@/components/QuestionList";
// import type { Content, Subject, Question } from "@/types";
// import { supabase } from "@/utils/supabase/client";
// import { useToast } from "@/hooks/use-toast";

// export default function EditQuestionsPage() {
//   const [contents, setContents] = useState<Content[]>([]);
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [selectedContent, setSelectedContent] = useState<Content | null>(null);
//   const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
//   const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
//   const [isLoadingContents, setIsLoadingContents] = useState(true);
//   const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
//   const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

//   const { toast } = useToast();

//   // Fetch contents on component mount
//   useEffect(() => {
//     fetchContents();
//   }, []);

//   // Fetch subjects when content changes
//   useEffect(() => {
//     if (selectedContent) {
//       fetchSubjects(selectedContent.id);
//       fetchQuestions(selectedContent.id, selectedSubject?.id);
//     } else {
//       setSubjects([]);
//       setQuestions([]);
//       setSelectedSubject(null);
//     }
//   }, [selectedContent]);

//   // Fetch questions when subject changes
//   useEffect(() => {
//     if (selectedContent && selectedSubject) {
//       fetchQuestions(selectedContent.id, selectedSubject.id);
//     }
//   }, [selectedSubject]);

//   const fetchContents = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("contents")
//         .select("*")
//         .order("name");

//       if (error) throw error;

//       setContents(data || []);
//     } catch (error) {
//       console.error("Error fetching contents:", error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch contents.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoadingContents(false);
//     }
//   };

//   const fetchSubjects = async (contentId: number) => {
//     setIsLoadingSubjects(true);
//     try {
//       const { data, error } = await supabase
//         .from("subjects")
//         .select("*")
//         .eq("content_id", contentId)
//         .order("chapter_no");

//       if (error) throw error;

//       setSubjects(data || []);
//     } catch (error) {
//       console.error("Error fetching subjects:", error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch subjects.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoadingSubjects(false);
//     }
//   };

//   const fetchQuestions = async (contentId: number, subjectId?: number) => {
//     setIsLoadingQuestions(true);
//     try {
//       let query = supabase
//         .from("questions")
//         .select("*")
//         .eq("content_id", contentId);

//       if (subjectId) {
//         query = query.eq("subject_id", subjectId);
//       }

//       const { data, error } = await query.order("created_at", {
//         ascending: false,
//       });

//       if (error) throw error;

//       setQuestions(data || []);
//     } catch (error) {
//       console.error("Error fetching questions:", error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch questions.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoadingQuestions(false);
//     }
//   };

//   const handleContentChange = useCallback((content: Content | null) => {
//     setSelectedContent(content);
//     setSelectedSubject(null);
//     setEditingQuestion(null);
//     setQuestions([]);
//   }, []);

//   const handleSubjectChange = useCallback((subject: Subject | null) => {
//     setSelectedSubject(subject);
//     setEditingQuestion(null);
//   }, []);

//   const handleEditQuestion = useCallback((question: Question) => {
//     setEditingQuestion(question);
//   }, []);

//   const handleCancelEdit = useCallback(() => {
//     setEditingQuestion(null);
//   }, []);

//   const handleDeleteQuestion = async (questionId: string) => {
//     if (!confirm("Are you sure you want to delete this question?")) return;

//     try {
//       const { error } = await supabase
//         .from("questions")
//         .delete()
//         .eq("id", questionId);

//       if (error) throw error;

//       toast({
//         title: "Success",
//         description: "Question deleted successfully!",
//       });

//       // Refresh questions list
//       if (selectedContent) {
//         fetchQuestions(selectedContent.id, selectedSubject?.id);
//       }
//     } catch (error) {
//       console.error("Error deleting question:", error);
//       toast({
//         title: "Error",
//         description: "Failed to delete question.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleSaveQuestion = async (questionData: any) => {
//     if (!selectedContent || !selectedSubject) {
//       toast({
//         title: "Error",
//         description: "Please select content and subject first.",
//         variant: "destructive",
//       });
//       return false;
//     }

//     try {
//       const dataToSave = {
//         ...questionData,
//         content_id: selectedContent.id,
//         subject_id: selectedSubject.id,
//         created_by: "Current User", // Replace with actual user
//       };

//       let error;
//       if (editingQuestion) {
//         // Update existing question
//         const result = await supabase
//           .from("questions")
//           .update(dataToSave)
//           .eq("id", editingQuestion.id);
//         error = result.error;
//       } else {
//         // Insert new question
//         const result = await supabase.from("questions").insert([dataToSave]);
//         error = result.error;
//       }

//       if (error) throw error;

//       toast({
//         title: "Success",
//         description: `Question ${
//           editingQuestion ? "updated" : "saved"
//         } successfully!`,
//       });

//       // Reset editing state and refresh questions
//       setEditingQuestion(null);
//       if (selectedContent) {
//         fetchQuestions(selectedContent.id, selectedSubject?.id);
//       }

//       return true;
//     } catch (error) {
//       console.error("Error saving question:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save question. Please try again.",
//         variant: "destructive",
//       });
//       return false;
//     }
//   };

//   return (
//     <div className="container mx-auto py-8 px-4">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2">Edit Questions</h1>
//         <p className="text-gray-600">
//           Create and edit questions with support for images and multiple
//           languages.
//         </p>
//       </div>

//       <div className="space-y-6">
//         <ContentSubjectSelector
//           contents={contents}
//           subjects={subjects}
//           selectedContent={selectedContent}
//           selectedSubject={selectedSubject}
//           onContentChange={handleContentChange}
//           onSubjectChange={handleSubjectChange}
//           isLoadingContents={isLoadingContents}
//           isLoadingSubjects={isLoadingSubjects}
//         />

//         <QuestionEditor
//           selectedContent={selectedContent}
//           selectedSubject={selectedSubject}
//           editingQuestion={editingQuestion}
//           onSaveQuestion={handleSaveQuestion}
//           onCancelEdit={handleCancelEdit}
//         />

//         <QuestionList
//           questions={questions}
//           isLoading={isLoadingQuestions}
//           onEditQuestion={handleEditQuestion}
//           onDeleteQuestion={handleDeleteQuestion}
//         />
//       </div>
//     </div>
//   );
// }
