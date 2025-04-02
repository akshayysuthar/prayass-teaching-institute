"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  Plus,
  Upload,
  Save,
  AlertCircle,
  Check,
  X,
  FileText,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Content {
  id: number;
  name: string;
  board: string;
  medium: string;
  classNo: number; // Renamed from 'class' to avoid reserved keyword conflict
  semester: string;
}

interface Subject {
  id: number;
  subject_name: string;
  chapter_name: string;
  chapter_no: number;
  content_id: number;
}

interface QuestionRow {
  id: string;
  question: string;
  question_gu?: string | null;
  answer: string | object;
  answer_gu?: string | object | null;
  question_images?: string[] | null;
  question_images_gu?: string[] | null;
  answer_images?: string[] | null;
  answer_images_gu?: string[] | null;
  sectionTitle: string;
  type: string;
  marks: number;
  content_id: number;
  subject_id: number;
  isValid: boolean;
  errors?: Record<string, string>;
}

interface ParseCSVResult {
  data?: Record<string, string>[];
  error?: string;
}

export default function CsvUploadPage() {
  const [contentId, setContentId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [openContent, setOpenContent] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"required" | "optional">(
    "required"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useUser();

  // Required columns for CSV upload
  const requiredColumns = [
    "Question",
    "Answer",
    "sectionTitle",
    "Type",
    "Marks",
  ];
  const optionalColumns = [
    "QuestionGu",
    "AnswerGu",
    "QuestionImages",
    "AnswerImages",
    "QuestionImagesGu",
    "AnswerImagesGu",
  ];

  useEffect(() => {
    fetchContents();
  }, []);

  useEffect(() => {
    if (contentId) {
      fetchSubjects(contentId);
    } else {
      setSubjects([]);
      setSubjectId(null);
      setSelectedSubject(null);
    }
  }, [contentId]);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .order("name");
      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error("Error fetching contents:", error);
      toast({
        title: "Error",
        description: "Failed to load contents",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async (contentId: number) => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("content_id", contentId)
        .order("chapter_no");
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const handleContentSelect = (value: string) => {
    const id = parseInt(value, 10);
    setContentId(id);
    const content = contents.find((c) => c.id === id) || null;
    setSelectedContent(content);
    setOpenContent(false);
  };

  const handleSubjectSelect = (value: string) => {
    const id = parseInt(value, 10);
    setSubjectId(id);
    const subject = subjects.find((s) => s.id === id) || null;
    setSelectedSubject(subject);
    setOpenSubject(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!contentId || !subjectId) {
      setValidationError(
        "Please select Content and Subject before uploading a CSV file"
      );
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      const text = await file.text();
      const result = parseCSV(text);

      if (result.error) {
        setValidationError(result.error);
        setIsLoading(false);
        return;
      }

      const newQuestions = (result.data ?? []).map((row, index) => {
        // Process image fields - convert comma-separated strings to arrays if needed
        const processImages = (imageStr: string | undefined) => {
          if (!imageStr) return null;
          return imageStr
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url.length > 0);
        };

        const questionImages = processImages(row.QuestionImages);
        const answerImages = processImages(row.AnswerImages);
        const questionImagesGu = processImages(row.QuestionImagesGu);
        const answerImagesGu = processImages(row.AnswerImagesGu);

        // Create the question object
        const question: QuestionRow = {
          id: `temp-${index}`,
          question: row.Question || "",
          question_gu: row.QuestionGu || null,
          answer: row.Answer || "",
          answer_gu: row.AnswerGu || null,
          question_images: questionImages,
          answer_images: answerImages,
          question_images_gu: questionImagesGu,
          answer_images_gu: answerImagesGu,
          sectionTitle: row.sectionTitle || "",
          type: row.Type || "",
          marks: parseInt(row.Marks, 10) || 1,
          content_id: contentId,
          subject_id: subjectId,
          isValid: false,
          errors: {},
        };

        // Validate the question
        const validationResult = validateQuestion(question);
        question.isValid = validationResult.isValid;
        question.errors = validationResult.errors;

        return question;
      });

      setQuestions(newQuestions);

      toast({
        title: "Success",
        description: `CSV uploaded successfully with ${newQuestions.length} questions`,
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setValidationError("Failed to parse CSV file. Please check the format.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const parseCSV = (text: string): ParseCSVResult => {
    // Simple CSV parser
    const lines = text.split("\n");
    if (lines.length < 2) {
      return { error: "CSV file is empty or invalid" };
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    // Check required columns
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        return { error: `Missing required column: ${col}` };
      }
    }

    const data: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      // Handle quoted fields with commas
      const row: Record<string, string> = {};
      let currentPosition = 0;
      let currentField = "";
      let inQuotes = false;

      for (let j = 0; j < headers.length; j++) {
        currentField = "";
        inQuotes = false;

        // Skip leading whitespace
        while (
          currentPosition < lines[i].length &&
          lines[i][currentPosition] === " "
        ) {
          currentPosition++;
        }

        if (
          currentPosition < lines[i].length &&
          lines[i][currentPosition] === '"'
        ) {
          inQuotes = true;
          currentPosition++;
        }

        while (currentPosition < lines[i].length) {
          if (inQuotes) {
            if (
              lines[i][currentPosition] === '"' &&
              (currentPosition + 1 >= lines[i].length ||
                lines[i][currentPosition + 1] === ",")
            ) {
              currentPosition++;
              break;
            }
            currentField += lines[i][currentPosition];
          } else {
            if (lines[i][currentPosition] === ",") {
              break;
            }
            currentField += lines[i][currentPosition];
          }
          currentPosition++;
        }

        row[headers[j]] = currentField.trim();
        currentPosition++; // Skip the comma
      }

      data.push(row);
    }

    return { data };
  };

  const validateQuestion = (question: QuestionRow) => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!question.question) errors.question = "Question is required";
    if (!question.answer) errors.answer = "Answer is required";
    if (!question.sectionTitle)
      errors.sectionTitle = "Section title is required";
    if (!question.type) errors.type = "Type is required";

    // Marks validation
    if (isNaN(question.marks) || question.marks < 1 || question.marks > 5) {
      errors.marks = "Marks must be between 1 and 5";
    }

    // If content has Gujarati medium, validate Gujarati fields
    if (
      selectedContent?.medium === "Gujarati" ||
      selectedContent?.medium === "Both"
    ) {
      if (!question.question_gu)
        errors.question_gu = "Gujarati question is required for this content";
      if (!question.answer_gu)
        errors.answer_gu = "Gujarati answer is required for this content";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  function handleQuestionChange({
    id,
    field,
    value,
  }: {
    id: string;
    field: keyof QuestionRow;
    value: string | number | null | object;
  }): void {
    setQuestions((prev) => {
      return prev.map((q) => {
        if (q.id === id) {
          const updatedQuestion = { ...q, [field]: value };

          // Revalidate the question
          const validationResult = validateQuestion(updatedQuestion);

          return {
            ...updatedQuestion,
            isValid: validationResult.isValid,
            errors: validationResult.errors,
          };
        }
        return q;
      });
    });
  }

  const addNewRow = () => {
    if (!contentId || !subjectId) {
      toast({
        title: "Error",
        description: "Please select Content and Subject before adding a row",
        variant: "destructive",
      });
      return;
    }

    const newRow: QuestionRow = {
      id: `temp-${Date.now()}`,
      question: "",
      question_gu: null,
      answer: "",
      answer_gu: null,
      question_images: null,
      answer_images: null,
      question_images_gu: null,
      answer_images_gu: null,
      sectionTitle: "",
      type: "",
      marks: 1,
      content_id: contentId,
      subject_id: subjectId,
      isValid: false,
      errors: {},
    };

    // Validate the new row
    const validationResult = validateQuestion(newRow);
    newRow.isValid = validationResult.isValid;
    newRow.errors = validationResult.errors;

    setQuestions((prev) => [...prev, newRow]);
  };

  const deleteRow = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const saveToDatabase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save questions",
        variant: "destructive",
      });
      return;
    }

    const invalidQuestions = questions.filter((q) => !q.isValid);
    if (invalidQuestions.length > 0) {
      toast({
        title: "Validation Error",
        description: `${invalidQuestions.length} questions have errors. Please fix them before saving.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const questionsToSave = questions.map((q) => {
        // Format answer as JSONB
        const formatAnswer = (answer: string | object | null | undefined) => {
          if (!answer) return null;
          if (typeof answer === "string") {
            try {
              // Try to parse as JSON first
              return JSON.parse(answer);
            } catch {
              // If not valid JSON, wrap as text object
              return { text: answer };
            }
          }
          return answer;
        };

        // Format images as JSONB
        const formatImages = (images: string[] | null | undefined) => {
          if (!images || images.length === 0) return null;
          return images;
        };

        return {
          content_id: q.content_id,
          subject_id: q.subject_id,
          sectionTitle: q.sectionTitle,
          type: q.type,
          question: q.question,
          question_gu: q.question_gu || null,
          answer: formatAnswer(q.answer),
          answer_gu: formatAnswer(q.answer_gu),
          question_images: formatImages(q.question_images),
          question_images_gu: formatImages(q.question_images_gu),
          answer_images: formatImages(q.answer_images),
          answer_images_gu: formatImages(q.answer_images_gu),
          marks: q.marks,
          created_by: user.fullName || user.username || "Unknown User",
        };
      });

      const { error } = await supabase
        .from("questions")
        .insert(questionsToSave);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${questions.length} questions saved successfully`,
      });

      // Reset the form
      setQuestions([]);
    } catch (error) {
      console.error("Error saving questions:", error);
      toast({
        title: "Error",
        description: "Failed to save questions to database",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const allQuestionsValid =
    questions.length > 0 && questions.every((q) => q.isValid);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Upload Questions from CSV
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Select Content and Subject</CardTitle>
          <CardDescription>
            Choose the content and subject for all questions in the CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content_id">Content</Label>
              <Popover open={openContent} onOpenChange={setOpenContent}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openContent}
                    className="w-full justify-between"
                  >
                    {selectedContent
                      ? selectedContent.name
                      : "Select content..."}
                    <Upload className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search content..." />
                    <CommandList>
                      <CommandEmpty>No content found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {contents.map((content) => (
                          <CommandItem
                            key={content.id}
                            value={content.id.toString()}
                            onSelect={handleContentSelect}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                contentId === content.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {content.name} (Class {content.classNo},{" "}
                            {content.medium})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject_id">Subject/Chapter</Label>
              <Popover open={openSubject} onOpenChange={setOpenSubject}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSubject}
                    className="w-full justify-between"
                    disabled={!contentId}
                  >
                    {selectedSubject
                      ? `Ch ${selectedSubject.chapter_no}: ${selectedSubject.chapter_name}`
                      : "Select subject..."}
                    <Upload className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search subject..." />
                    <CommandList>
                      <CommandEmpty>No subject found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {subjects.map((subject) => (
                          <CommandItem
                            key={subject.id}
                            value={subject.id.toString()}
                            onSelect={handleSubjectSelect}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                subjectId === subject.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            Ch {subject.chapter_no}: {subject.chapter_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedContent && selectedSubject && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Selected Content and Subject</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Content:</span>{" "}
                  {selectedContent.name}
                </div>
                <div>
                  <span className="font-medium">Subject:</span>{" "}
                  {selectedSubject.subject_name}
                </div>
                <div>
                  <span className="font-medium">Chapter:</span> Ch{" "}
                  {selectedSubject.chapter_no}: {selectedSubject.chapter_name}
                </div>
                <div>
                  <span className="font-medium">Class:</span>{" "}
                  {selectedContent.classNo}, {selectedContent.medium}
                </div>
              </div>

              {(selectedContent.medium === "Gujarati" ||
                selectedContent.medium === "Both") && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm">
                  <AlertCircle className="inline-block h-4 w-4 mr-1 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium">Note:</span> This content
                  requires Gujarati translations. Make sure to include
                  QuestionGu and AnswerGu columns in your CSV.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 2: Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with the required columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading || !contentId || !subjectId}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !contentId || !subjectId}
            >
              <Upload className="mr-2 h-4 w-4" />
              Select CSV
            </Button>
          </div>

          {validationError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "required" | "optional")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="required">Required Columns</TabsTrigger>
                <TabsTrigger value="optional">Optional Columns</TabsTrigger>
              </TabsList>
              <TabsContent value="required" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Required CSV Columns:</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requiredColumns.map((column) => (
                      <div key={column} className="bg-muted p-3 rounded-md">
                        <div className="font-medium">{column}</div>
                        <div className="text-sm text-muted-foreground">
                          {column === "Question" &&
                            "The question text (required)"}
                          {column === "Answer" && "The answer text (required)"}
                          {column === "sectionTitle" &&
                            "Section title for the question (required)"}
                          {column === "Type" &&
                            "Question type (e.g., MCQ, Short Answer)"}
                          {column === "Marks" && "Marks value (1-5)"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium mb-2">Example CSV Format:</h4>
                    <pre className="bg-background p-3 rounded-md text-xs overflow-x-auto">
                      Question,Answer,sectionTitle,Type,Marks
                      <br />
                      &quot;What is photosynthesis?&quot;,&quot;The process by
                      which plants make food&quot;,&quot;Plant
                      Processes&quot;,&quot;Short Answer&quot;,2
                      <br />
                      &quot;Define ecosystem&quot;,&quot;A community of living
                      organisms and their
                      environment&quot;,&quot;Ecosystems&quot;,&quot;Long
                      Answer&quot;,3
                    </pre>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="optional" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Optional CSV Columns:</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {optionalColumns.map((column) => (
                      <div key={column} className="bg-muted p-3 rounded-md">
                        <div className="font-medium">{column}</div>
                        <div className="text-sm text-muted-foreground">
                          {column === "QuestionGu" &&
                            "Gujarati version of the question"}
                          {column === "AnswerGu" &&
                            "Gujarati version of the answer"}
                          {column === "QuestionImages" &&
                            "Comma-separated URLs of question images"}
                          {column === "AnswerImages" &&
                            "Comma-separated URLs of answer images"}
                          {column === "QuestionImagesGu" &&
                            "Comma-separated URLs of Gujarati question images"}
                          {column === "AnswerImagesGu" &&
                            "Comma-separated URLs of Gujarati answer images"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium mb-2">
                      Example with Optional Columns:
                    </h4>
                    <pre className="bg-background p-3 rounded-md text-xs overflow-x-auto">
                      Question,Answer,sectionTitle,Type,Marks,QuestionGu,AnswerGu
                      <br />
                      &quot;What is photosynthesis?&quot;,&quot;The process by
                      which plants make food&quot;,&quot;Plant
                      Processes&quot;,&quot;Short
                      Answer&quot;,2,&quot;પ્રકાશસંશ્લેષણ શું છે?&quot;,&quot;એ
                      પ્રક્રિયા જેના દ્વારા વનસ્પતિ ખોરાક બનાવે છે&quot;
                      <br />
                      &quot;Define ecosystem&quot;,&quot;A community of living
                      organisms and their
                      environment&quot;,&quot;Ecosystems&quot;,&quot;Long
                      Answer&quot;,3,&quot;ઇકોસિસ્ટમની વ્યાખ્યા
                      આપો&quot;,&quot;જીવંત જીવો અને તેમના પર્યાવરણનો
                      સમુદાય&quot;
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 3: Review and Edit Questions</CardTitle>
            <CardDescription>
              Review and edit the questions before saving to the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[300px]">Question</TableHead>
                      <TableHead className="w-[300px]">Answer</TableHead>
                      <TableHead>Section Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[80px]">Marks</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow
                        key={question.id}
                        className={
                          !question.isValid
                            ? "bg-red-50 dark:bg-red-950/20"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <Textarea
                              value={question.question}
                              onChange={(e) =>
                                handleQuestionChange({
                                  id: question.id,
                                  field: "question",
                                  value: e.target.value,
                                })
                              }
                              className={cn(
                                "min-h-[80px]",
                                question.errors?.question
                                  ? "border-red-500"
                                  : ""
                              )}
                            />
                            {question.errors?.question && (
                              <p className="text-xs text-red-500">
                                {question.errors.question}
                              </p>
                            )}

                            {(selectedContent?.medium === "Gujarati" ||
                              selectedContent?.medium === "Both") && (
                              <div className="mt-2">
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                  Gujarati Question
                                  {question.errors?.question_gu && (
                                    <span className="text-red-500 ml-1">
                                      *Required
                                    </span>
                                  )}
                                </Label>
                                <Textarea
                                  value={question.question_gu || ""}
                                  onChange={(e) =>
                                    handleQuestionChange({
                                      id: question.id,
                                      field: "question_gu",
                                      value: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    "min-h-[80px]",
                                    question.errors?.question_gu
                                      ? "border-red-500"
                                      : ""
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Textarea
                              value={
                                typeof question.answer === "string"
                                  ? question.answer
                                  : JSON.stringify(question.answer)
                              }
                              onChange={(e) =>
                                handleQuestionChange({
                                  id: question.id,
                                  field: "answer",
                                  value: e.target.value,
                                })
                              }
                              className={cn(
                                "min-h-[80px]",
                                question.errors?.answer ? "border-red-500" : ""
                              )}
                            />
                            {question.errors?.answer && (
                              <p className="text-xs text-red-500">
                                {question.errors.answer}
                              </p>
                            )}

                            {(selectedContent?.medium === "Gujarati" ||
                              selectedContent?.medium === "Both") && (
                              <div className="mt-2">
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                  Gujarati Answer
                                  {question.errors?.answer_gu && (
                                    <span className="text-red-500 ml-1">
                                      *Required
                                    </span>
                                  )}
                                </Label>
                                <Textarea
                                  value={
                                    typeof question.answer_gu === "string"
                                      ? question.answer_gu
                                      : question.answer_gu
                                      ? JSON.stringify(question.answer_gu)
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleQuestionChange({
                                      id: question.id,
                                      field: "answer_gu",
                                      value: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    "min-h-[80px]",
                                    question.errors?.answer_gu
                                      ? "border-red-500"
                                      : ""
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={question.sectionTitle}
                              onChange={(e) =>
                                handleQuestionChange({
                                  id: question.id,
                                  field: "sectionTitle",
                                  value: e.target.value,
                                })
                              }
                              className={cn(
                                question.errors?.sectionTitle
                                  ? "border-red-500"
                                  : ""
                              )}
                            />
                            {question.errors?.sectionTitle && (
                              <p className="text-xs text-red-500">
                                {question.errors.sectionTitle}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={question.type}
                              onChange={(e) =>
                                handleQuestionChange({
                                  id: question.id,
                                  field: "type",
                                  value: e.target.value,
                                })
                              }
                              className={cn(
                                question.errors?.type ? "border-red-500" : ""
                              )}
                            />
                            {question.errors?.type && (
                              <p className="text-xs text-red-500">
                                {question.errors.type}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={question.marks}
                              onChange={(e) =>
                                handleQuestionChange({
                                  id: question.id,
                                  field: "marks",
                                  value: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className={cn(
                                "w-16",
                                question.errors?.marks ? "border-red-500" : ""
                              )}
                            />
                            {question.errors?.marks && (
                              <p className="text-xs text-red-500">
                                {question.errors.marks}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRow(question.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={addNewRow}>
                <Plus className="mr-2 h-4 w-4" /> Add Row
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant={allQuestionsValid ? "outline" : "destructive"}>
                  {allQuestionsValid ? (
                    <>
                      <Check className="mr-1 h-3 w-3" /> All Valid
                    </>
                  ) : (
                    <>
                      <X className="mr-1 h-3 w-3" /> Has Errors
                    </>
                  )}
                </Badge>
                <Badge variant="outline">{questions.length} Questions</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={saveToDatabase}
                      disabled={
                        isSaving || !allQuestionsValid || questions.length === 0
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Saving..." : "Save to Database"}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {!allQuestionsValid
                    ? "Fix all errors before saving"
                    : "Save all questions to database"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      )}

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            CSV Format Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>The CSV file should contain the following required columns:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Question</strong>: The question text (required)
              </li>
              <li>
                <strong>Answer</strong>: The answer text (required)
              </li>
              <li>
                <strong>sectionTitle</strong>: Section title for the question
                (required)
              </li>
              <li>
                <strong>Type</strong>: Question type (e.g., MCQ, Short Answer)
              </li>
              <li>
                <strong>Marks</strong>: Marks value (1-5)
              </li>
            </ul>

            <p>Optional columns include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>QuestionGu</strong>: Gujarati version of the question
              </li>
              <li>
                <strong>AnswerGu</strong>: Gujarati version of the answer
              </li>
              <li>
                <strong>QuestionImages</strong>: Comma-separated URLs of
                question images
              </li>
              <li>
                <strong>AnswerImages</strong>: Comma-separated URLs of answer
                images
              </li>
              <li>
                <strong>QuestionImagesGu</strong>: Comma-separated URLs of
                Gujarati question images
              </li>
              <li>
                <strong>AnswerImagesGu</strong>: Comma-separated URLs of
                Gujarati answer images
              </li>
            </ul>

            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium mb-2">Notes:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  For Gujarati medium content, QuestionGu and AnswerGu are
                  required
                </li>
                <li>
                  Answer fields will be converted to JSONB format when saved
                </li>
                <li>Image fields should be comma-separated URLs</li>
                <li>Use quotes around fields that contain commas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
