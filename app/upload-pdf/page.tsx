"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf';
import '../../utils/pdfjs-setup';

interface ExtractedQuestion {
  question: string;
  answer: string;
  type: string;
}

export default function UploadPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const processPdf = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      const extractedQuestions = processText(fullText);
      setExtractedQuestions(extractedQuestions);
      toast({
        title: "Success",
        description: `Processed ${extractedQuestions.length} questions from the PDF.`,
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "Error",
        description: "Failed to process the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processText = (text: string): ExtractedQuestion[] => {
    const questions: ExtractedQuestion[] = [];
    const lines = text.split('\n');
    let currentQuestion: ExtractedQuestion | null = null;

    for (const line of lines) {
      if (line.trim().match(/^Q\d+\.|^\d+\./)) {
        // New question starts
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = { question: line.trim(), answer: '', type: 'Short Answer' };
      } else if (currentQuestion && line.trim().startsWith('Ans:')) {
        // Answer starts
        currentQuestion.answer = line.replace('Ans:', '').trim();
      } else if (currentQuestion) {
        // Continuation of question or answer
        if (currentQuestion.answer) {
          currentQuestion.answer += ' ' + line.trim();
        } else {
          currentQuestion.question += ' ' + line.trim();
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  };

  const handleQuestionChange = (index: number, field: keyof ExtractedQuestion, value: string) => {
    const updatedQuestions = [...extractedQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setExtractedQuestions(updatedQuestions);
  };

  const uploadToDatabase = async () => {
    setIsUploading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(extractedQuestions.map(q => ({
          question: q.question,
          answer: q.answer,
          type: q.type,
          class: 10, // Default value, adjust as needed
          subject: "General", // Default value, adjust as needed
          marks: 1, // Default value, adjust as needed
        })));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Questions uploaded to database successfully!",
      });
      setExtractedQuestions([]);
    } catch (error) {
      console.error("Error uploading questions:", error);
      toast({
        title: "Error",
        description: "Failed to upload questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload and Process PDF</h1>
      <div className="mb-4">
        <Input type="file" accept=".pdf" onChange={handleFileChange} />
      </div>
      <Button onClick={processPdf} disabled={!file || isProcessing}>
        {isProcessing ? "Processing..." : "Process PDF"}
      </Button>

      {extractedQuestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Extracted Questions and Answers</h2>
          {extractedQuestions.map((q, index) => (
            <div key={index} className="mb-6 p-4 border rounded">
              <div className="mb-2">
                <Label htmlFor={`question-${index}`}>Question</Label>
                <Textarea
                  id={`question-${index}`}
                  value={q.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`answer-${index}`}>Answer</Label>
                <Textarea
                  id={`answer-${index}`}
                  value={q.answer}
                  onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`type-${index}`}>Question Type</Label>
                <Select
                  value={q.type}
                  onValueChange={(value) => handleQuestionChange(index, 'type', value)}
                >
                  <SelectTrigger id={`type-${index}`}>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQs">MCQs</SelectItem>
                    <SelectItem value="Short Answer">Short Answer</SelectItem>
                    <SelectItem value="Long Answer">Long Answer</SelectItem>
                    <SelectItem value="One Line">One Line</SelectItem>
                    <SelectItem value="One Word">One Word</SelectItem>
                    <SelectItem value="True or False">True or False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <Button onClick={uploadToDatabase} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload to Database"}
          </Button>
        </div>
      )}
    </div>
  );
}

