"use client";

import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { PdfDownloadProps } from "@/types";

// Utility functions for formatting
const addFormattedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize = 12,
  bold = false,
  lineHeight = 8
) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth); // Break text into lines
  for (const line of lines) {
    doc.text(line, x, y);
    y += lineHeight; // Move Y position for the next line
  }
  return y; // Return updated Y position
};

export function PdfDownload({
  selectedQuestions,
  instituteName,
  standard,
  subject,
  chapters,
  teacherName,
  totalMarks,
}: PdfDownloadProps) {
  const generatePdf = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 15; // Left margin
    const rightPadding = 5; // Extra padding on the right to prevent overflow
    const lineHeight = 10;
    const contentWidth = pageWidth - margin - rightPadding; // Account for padding

    let yPos = margin;

    // Header Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    yPos = addFormattedText(
      doc,
      instituteName.toUpperCase(),
      margin,
      yPos,
      contentWidth - margin,
      18,
      true
    );

    doc.setFontSize(12);
    yPos = addFormattedText(
      doc,
      `Standard: ${standard} | Subject: ${subject}`,
      margin,
      yPos,
      contentWidth - margin
    );
    yPos = addFormattedText(
      doc,
      `Chapters: ${chapters.join(", ")}`,
      margin,
      yPos,
      contentWidth - margin
    );
    yPos = addFormattedText(
      doc,
      `Teacher: ${teacherName} | Total Marks: ${totalMarks}`,
      margin,
      yPos,
      contentWidth - margin
    );
    yPos += lineHeight;

    doc.setFontSize(10);
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      pageWidth - margin - 40,
      yPos - lineHeight
    );

    // Section Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    yPos = addFormattedText(
      doc,
      "Questions",
      margin,
      yPos + lineHeight,
      contentWidth - margin,
      14,
      true
    );

    // Questions
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let questionCounter = 1;
    let answerKey = [];

    for (const question of selectedQuestions) {
      if (yPos > pageHeight - margin - lineHeight * 2) {
        doc.addPage();
        yPos = margin;
      }

      yPos = addFormattedText(
        doc,
        `${questionCounter}. ${question.question} (${question.marks} marks)`,
        margin,
        yPos,
        contentWidth - margin,
        12,
        true,
        lineHeight
      );

      if (question.options) {
        for (const [key, option] of Object.entries(question.options)) {
          yPos = addFormattedText(
            doc,
            `${key}) ${option}`,
            margin + 10,
            yPos,
            contentWidth - margin - 10,
            12,
            false
          );
        }
      }

      // Store answer key
      if (question.answer) {
        answerKey.push(`Q${questionCounter}: ${question.answer}`);
      }

      questionCounter++;
    }

    // Footer Section
    if (yPos > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Wish You - All The Best", pageWidth / 2, pageHeight - margin, {
      align: "center",
    });

    // Answer Key Section
    doc.addPage();
    yPos = margin;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    yPos = addFormattedText(
      doc,
      "Answer Key",
      margin,
      yPos,
      contentWidth - margin,
      16,
      true
    );

    doc.setFontSize(12);
    // doc.setFont("", "normal");
    for (const key of answerKey) {
      if (yPos > pageHeight - margin - lineHeight) {
        doc.addPage();
        yPos = margin;
      }
      yPos = addFormattedText(doc, key, margin, yPos, contentWidth - margin);
    }

    // Save the PDF
    doc.save("exam_paper.pdf");
  };

  const handleDownload = async () => {
    await generatePdf();
  };

  return (
    <div className="space-x-4">
      <Button onClick={handleDownload}>Download PDF</Button>
    </div>
  );
}
