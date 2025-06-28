// "use client";

// import type React from "react";
// import { useState, useCallback, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { X, Upload, Paperclip } from "lucide-react";
// import Image from "next/image";
// import type { Content, Subject, Question } from "@/types";
// import { supabase } from "@/utils/supabase/client";
// import { useToast } from "@/hooks/use-toast";
// import { compressImage } from "@/utils/imageCompression";

// interface QuestionEditorProps {
//   selectedContent: Content | null;
//   selectedSubject: Subject | null;
//   editingQuestion: Question | null;
//   onSaveQuestion: (questionData: any) => Promise<boolean>;
//   onCancelEdit: () => void;
// }

// const IMAGE_SIZE_OPTIONS = [
//   { value: "inline", label: "Inline" },
//   { value: "small", label: "Small" },
//   { value: "medium", label: "Medium" },
//   { value: "large", label: "Large" },
// ];

// export function QuestionEditor({
//   selectedContent,
//   selectedSubject,
//   editingQuestion,
//   onSaveQuestion,
//   onCancelEdit,
// }: QuestionEditorProps) {
//   const [formData, setFormData] = useState({
//     question: "",
//     question_gu: "",
//     answer: "",
//     answer_gu: "",
//     type: "",
//     marks: 1,
//     section_title: "",
//     img_size: "medium",
//   });

//   const [questionImages, setQuestionImages] = useState<string[]>([]);
//   const [questionImagesGu, setQuestionImagesGu] = useState<string[]>([]);
//   const [answerImages, setAnswerImages] = useState<string[]>([]);
//   const [answerImagesGu, setAnswerImagesGu] = useState<string[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const { toast } = useToast();

//   // Load editing question data when editingQuestion changes
//   useEffect(() => {
//     if (editingQuestion) {
//       setFormData({
//         question: editingQuestion.question,
//         answer:
//           typeof editingQuestion.answer === "string"
//             ? editingQuestion.answer
//             : JSON.stringify(editingQuestion.answer),
//         type: editingQuestion.type || "",
//         marks: editingQuestion.marks,
//         section_title: editingQuestion.section_title || "",
//         img_size: editingQuestion.img_size || "medium",
//       });

//       setQuestionImages(
//         Array.isArray(editingQuestion.question_images)
//           ? editingQuestion.question_images.map((img: any) =>
//               typeof img === "string" ? { url: img, size: "medium" } : img
//             )
//           : []
//       );
//       setAnswerImages(
//         Array.isArray(editingQuestion.answer_images)
//           ? editingQuestion.answer_images.map((img: any) =>
//               typeof img === "string" ? { url: img, size: "medium" } : img
//             )
//           : []
//       );
//     } else {
//       resetForm();
//     }
//   }, [editingQuestion]);

//   const resetForm = () => {
//     setFormData({
//       question: "",
//       question_gu: "",
//       answer: "",
//       answer_gu: "",
//       type: "",
//       marks: 1,
//       section_title: "",
//       img_size: "medium",
//     });
//     setQuestionImages([]);
//     setQuestionImagesGu([]);
//     setAnswerImages([]);
//     setAnswerImagesGu([]);
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: name === "marks" ? Number.parseInt(value) || 1 : value,
//     }));
//   };

//   const handleSelectChange = (name: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const uploadImage = async (file: File): Promise<string | null> => {
//     try {
//       const compressedFile = await compressImage(file);
//       const fileExt = compressedFile.name.split(".").pop();
//       const fileName = `${Math.random()}.${fileExt}`;

//       const { error: uploadError, data } = await supabase.storage
//         .from("question-images")
//         .upload(fileName, compressedFile);

//       if (uploadError) {
//         console.error("Error uploading image:", uploadError);
//         return null;
//       }

//       if (data) {
//         const {
//           data: { publicUrl },
//         } = supabase.storage.from("question-images").getPublicUrl(data.path);

//         return publicUrl;
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     }
//     return null;
//   };

//   const handleImageUpload = async (
//     e: React.ChangeEvent<HTMLInputElement>,
//     imageType: "question" | "answer",
//     language: "en" | "gu"
//   ) => {
//     const files = Array.from(e.target.files || []);

//     for (const file of files) {
//       const imageUrl = await uploadImage(file);
//       if (imageUrl) {
//         if (imageType === "question" && language === "en") {
//           setQuestionImages((prev) => [...prev, imageUrl]);
//         } else if (imageType === "question" && language === "gu") {
//           setQuestionImagesGu((prev) => [...prev, imageUrl]);
//         } else if (imageType === "answer" && language === "en") {
//           setAnswerImages((prev) => [...prev, imageUrl]);
//         } else if (imageType === "answer" && language === "gu") {
//           setAnswerImagesGu((prev) => [...prev, imageUrl]);
//         }
//       }
//     }

//     // Reset input
//     e.target.value = "";
//   };

//   const removeImage = (
//     index: number,
//     imageType: "question" | "answer",
//     language: "en" | "gu"
//   ) => {
//     if (imageType === "question" && language === "en") {
//       setQuestionImages((prev) => prev.filter((_, i) => i !== index));
//     } else if (imageType === "question" && language === "gu") {
//       setQuestionImagesGu((prev) => prev.filter((_, i) => i !== index));
//     } else if (imageType === "answer" && language === "en") {
//       setAnswerImages((prev) => prev.filter((_, i) => i !== index));
//     } else if (imageType === "answer" && language === "gu") {
//       setAnswerImagesGu((prev) => prev.filter((_, i) => i !== index));
//     }
//   };

//   const handlePaste = useCallback(
//     async (
//       e: React.ClipboardEvent<HTMLTextAreaElement>,
//       imageType: "question" | "answer",
//       language: "en" | "gu"
//     ) => {
//       const items = e.clipboardData.items;
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf("image") !== -1) {
//           e.preventDefault();
//           const file = items[i].getAsFile();
//           if (file) {
//             const imageUrl = await uploadImage(file);
//             if (imageUrl) {
//               if (imageType === "question" && language === "en") {
//                 setQuestionImages((prev) => [...prev, imageUrl]);
//               } else if (imageType === "question" && language === "gu") {
//                 setQuestionImagesGu((prev) => [...prev, imageUrl]);
//               } else if (imageType === "answer" && language === "en") {
//                 setAnswerImages((prev) => [...prev, imageUrl]);
//               } else if (imageType === "answer" && language === "gu") {
//                 setAnswerImagesGu((prev) => [...prev, imageUrl]);
//               }
//             }
//           }
//         }
//       }
//     },
//     []
//   );

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.question.trim()) {
//       toast({
//         title: "Error",
//         description: "Question is required.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsSubmitting(true);

//     const questionData = {
//       question: formData.question,
//       answer: formData.answer,
//       question_images: questionImages.length > 0 ? questionImages : null,
//       answer_images: answerImages.length > 0 ? answerImages : null,
//       type: formData.type || null,
//       marks: formData.marks,
//       section_title: formData.section_title || null,
//       img_size: formData.img_size, // optional: remove if not using global anymore
//     };

//     const success = await onSaveQuestion(questionData);

//     if (success) {
//       resetForm();
//     }

//     setIsSubmitting(false);
//   };

//   const renderImageSection = (
//     title: string,
//     images: string[],
//     imageType: "question" | "answer",
//     language: "en" | "gu"
//   ) => (
//     <div className="space-y-2">
//       <Label>{title}</Label>
//       <div className="flex items-center space-x-2">
//         <label className="cursor-pointer">
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             className="hidden"
//             onChange={(e) => handleImageUpload(e, imageType, language)}
//           />
//           <Button type="button" variant="outline" size="sm">
//             <Upload className="h-4 w-4 mr-2" />
//             Upload Images
//           </Button>
//         </label>
//         <span className="text-sm text-gray-500">or paste with Ctrl+V</span>
//       </div>

//       {images.length > 0 && (
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//          {images.map((img, index) => (
//   <div key={index} className="relative group">
//     <Image
//       src={img.url}
//       alt={`${title} ${index + 1}`}
//       width={200}
//       height={150}
//       className="object-cover rounded border"
//     />
//     <Button
//       type="button"
//       variant="destructive"
//       size="sm"
//       className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
//       onClick={() => removeImage(index, imageType, "en")}
//     >
//       <X className="h-3 w-3" />
//     </Button>
//     {/* Hidden img size - kept in state, no UI */}
//   </div>
// ))}

//         </div>
//       )}
//     </div>
//   );

//   if (!selectedContent || !selectedSubject) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <p className="text-center text-gray-500">
//             Please select content and subject to start editing questions.
//           </p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>
//           {editingQuestion ? "Edit Question" : "Add New Question"}
//         </CardTitle>
//         <p className="text-sm text-gray-600">
//           Content: {selectedContent.name} | Subject:{" "}
//           {selectedSubject.subject_name} - Chapter {selectedSubject.chapter_no}
//         </p>
//         {editingQuestion && (
//           <Button
//             variant="outline"
//             onClick={onCancelEdit}
//             className="w-fit bg-transparent"
//           >
//             Cancel Edit
//           </Button>
//         )}
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Basic Information */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="type">Question Type</Label>
//               <Input
//                 id="type"
//                 name="type"
//                 value={formData.type}
//                 onChange={handleInputChange}
//                 placeholder="e.g., MCQ, Short Answer"
//               />
//             </div>

//             <div>
//               <Label htmlFor="marks">Marks</Label>
//               <Input
//                 id="marks"
//                 name="marks"
//                 type="number"
//                 min="1"
//                 max="10"
//                 value={formData.marks}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <div>
//               <Label htmlFor="img_size">Image Size</Label>
//               <Select
//                 value={formData.img_size}
//                 onValueChange={(value) => handleSelectChange("img_size", value)}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {IMAGE_SIZE_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div>
//             <Label htmlFor="section_title">Section Title</Label>
//             <Input
//               id="section_title"
//               name="section_title"
//               value={formData.section_title}
//               onChange={handleInputChange}
//               placeholder="e.g., Answer the following questions"
//             />
//           </div>

//           {/* Question Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="question">Question (English) *</Label>
//                 <div className="relative">
//                   <Textarea
//                     id="question"
//                     name="question"
//                     value={formData.question}
//                     onChange={handleInputChange}
//                     onPaste={(e) => handlePaste(e, "question", "en")}
//                     className="min-h-[120px] pr-10"
//                     placeholder="Enter your question here or paste an image..."
//                     required
//                   />
//                   <Paperclip className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
//                 </div>
//               </div>

//               {renderImageSection(
//                 "Question Images (English)",
//                 questionImages,
//                 "question",
//                 "en"
//               )}
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="question_gu">Question (Gujarati)</Label>
//                 <div className="relative">
//                   <Textarea
//                     id="question_gu"
//                     name="question_gu"
//                     value={formData.question_gu}
//                     onChange={handleInputChange}
//                     onPaste={(e) => handlePaste(e, "question", "gu")}
//                     className="min-h-[120px] pr-10"
//                     placeholder="ગુજરાતીમાં પ્રશ્ન લખો..."
//                   />
//                   <Paperclip className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
//                 </div>
//               </div>

//               {renderImageSection(
//                 "Question Images (Gujarati)",
//                 questionImagesGu,
//                 "question",
//                 "gu"
//               )}
//             </div>
//           </div>

//           {/* Answer Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="answer">Answer (English) *</Label>
//                 <div className="relative">
//                   <Textarea
//                     id="answer"
//                     name="answer"
//                     value={formData.answer}
//                     onChange={handleInputChange}
//                     onPaste={(e) => handlePaste(e, "answer", "en")}
//                     className="min-h-[120px] pr-10"
//                     placeholder="Enter your answer here or paste an image..."
//                     required
//                   />
//                   <Paperclip className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
//                 </div>
//               </div>

//               {renderImageSection(
//                 "Answer Images (English)",
//                 answerImages,
//                 "answer",
//                 "en"
//               )}
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="answer_gu">Answer (Gujarati)</Label>
//                 <div className="relative">
//                   <Textarea
//                     id="answer_gu"
//                     name="answer_gu"
//                     value={formData.answer_gu}
//                     onChange={handleInputChange}
//                     onPaste={(e) => handlePaste(e, "answer", "gu")}
//                     className="min-h-[120px] pr-10"
//                     placeholder="ગુજરાતીમાં જવાબ લખો..."
//                   />
//                   <Paperclip className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
//                 </div>
//               </div>

//               {renderImageSection(
//                 "Answer Images (Gujarati)",
//                 answerImagesGu,
//                 "answer",
//                 "gu"
//               )}
//             </div>
//           </div>

//           <div className="flex justify-end">
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting
//                 ? "Saving..."
//                 : editingQuestion
//                 ? "Update Question"
//                 : "Save Question"}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }
