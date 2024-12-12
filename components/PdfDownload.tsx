"use client";

import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { Question, PdfDownloadProps } from "@/types";

// const fetchImageAsBase64 = async (url: string) => {
//   const response = await fetch(url);
//   const blob = await response.blob();
//   return new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onloadend = () => resolve(reader.result as string);
//     reader.onerror = reject;
//     reader.readAsDataURL(blob);
//   });
// };

// const addImage = async (
//   url: string,
//   doc: jsPDF,
//   x: number,
//   y: number,
//   maxWidth: number,
//   maxHeight: number
// ) => {
//   return new Promise<number>((resolve) => {
//     fetchImageAsBase64(url)
//       .then((base64Image) => {
//         const img = new Image();
//         img.onload = () => {
//           const canvas = document.createElement("canvas");
//           const ctx = canvas.getContext("2d");
//           if (ctx) {
//             const aspectRatio = img.width / img.height;
//             let width = maxWidth;
//             let height = maxWidth / aspectRatio;
//             if (height > maxHeight) {
//               height = maxHeight;
//               width = height * aspectRatio;
//             }

//             canvas.width = width;
//             canvas.height = height;
//             ctx.drawImage(img, 0, 0, width, height);

//             // High-quality JPEG conversion (quality set to 1 for best quality)
//             const jpegBase64 = canvas.toDataURL("image/jpeg", 1.0); // Ensure max quality

//             // Add image to PDF with better quality
//             doc.addImage(jpegBase64, "JPEG", x, y, width, height);
//             resolve(y + height);
//           } else {
//             console.error("Canvas context not available");
//             resolve(y);
//           }
//         };
//         img.onerror = () => {
//           console.error("Error loading image from URL:", url);
//           resolve(y);
//         };
//         img.src = base64Image;
//       })
//       .catch((error) => {
//         console.error("Error fetching image as base64:", error);
//         resolve(y);
//       });
//   });
// };

const addImage = async (
  url: string,
  doc: jsPDF,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
) => {
  return new Promise<number>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Add image directly without Base64 conversion
      doc.addImage(img, "JPEG", x, y, width, height);
      resolve(y + height);
    };
    img.onerror = () => {
      console.error("Error loading image from URL:", url);
      resolve(y);
    };
    img.src = url; // Directly use the image URL
  });
};

export function PdfDownload({
  selectedQuestions,
  instituteName,
  standard,
  subject,
  chapters,
  studentName,
  teacherName,
  totalMarks,
}: PdfDownloadProps) {
  const generatePdf = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const sidePadding = 10; // Side padding to ensure content doesn't go outside
    const lineHeight = 7;
    let yPos = margin;

    const addText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 12,
      bold: boolean = false
    ) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    const checkNewPage = () => {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    const renderAnswer = async (
      answer: Question["answer"],
      x: number,
      y: number,
      maxWidth: number
    ) => {
      if (typeof answer === "string") {
        return addText(answer, x, y, maxWidth);
      } else if (Array.isArray(answer)) {
        let currentY = y;
        for (const item of answer) {
          currentY = addText(`- ${item}`, x, currentY, maxWidth);
        }
        return currentY;
      } else if (typeof answer === "object" && answer !== null) {
        let currentY = y;
        for (const [key, value] of Object.entries(answer)) {
          currentY = addText(`${key}:`, x, currentY, maxWidth, 12, true);
          if (Array.isArray(value)) {
            for (const item of value) {
              currentY = addText(`- ${item}`, x + 5, currentY, maxWidth - 5);
            }
          } else if (typeof value === "string") {
            currentY = addText(value, x + 5, currentY, maxWidth - 5);
          }
        }
        return currentY;
      }
      return y;
    };

    // Header Section
    yPos = addText(
      instituteName,
      margin + sidePadding,
      yPos,
      pageWidth - 2 * margin - 2 * sidePadding,
      16,
      true
    );
    yPos = addText(
      `Standard: ${standard} | Subject: ${subject}`,
      margin + sidePadding,
      yPos,
      pageWidth - 2 * margin - 2 * sidePadding
    );
    yPos = addText(
      `Chapters: ${chapters.join(", ")}`,
      margin + sidePadding,
      yPos,
      pageWidth - 2 * margin - 2 * sidePadding
    );
    yPos = addText(
      `Teacher: ${teacherName} | Student: ${studentName}`,
      margin + sidePadding,
      yPos,
      pageWidth - 2 * margin - 2 * sidePadding
    );
    yPos = addText(
      `Total Marks: ${totalMarks} | Time: ${Math.ceil(totalMarks * 1.5)} mins`,
      margin + sidePadding,
      yPos,
      pageWidth - 2 * margin - 2 * sidePadding
    );
    yPos += lineHeight;

    // Question Section
    for (const [index, question] of selectedQuestions.entries()) {
      checkNewPage();

      yPos = addText(
        `Q${index + 1}. ${question.question}`,
        margin + sidePadding,
        yPos,
        pageWidth - 2 * margin - 2 * sidePadding,
        12,
        true
      );

      if (question.questionImages && question.questionImages.length > 0) {
        for (const img of question.questionImages) {
          yPos = await addImage(
            img,
            doc,
            margin + sidePadding,
            yPos + 2,
            pageWidth - 2 * margin - 2 * sidePadding,
            50
          );
          yPos += 2;
        }
      }

      if (question.options) {
        Object.entries(question.options).forEach(([key, value]) => {
          yPos = addText(
            `${key}) ${value}`,
            margin + sidePadding + 10,
            yPos,
            pageWidth - 2 * margin - 2 * sidePadding - 10
          );
        });
      }

      yPos = addText(
        `(${question.marks} marks)`,
        margin + sidePadding,
        yPos,
        pageWidth - 2 * margin - 2 * sidePadding,
        10
      );
      yPos += lineHeight;
    }

    // Footer Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("All the Best!", pageWidth / 2, pageHeight - margin, {
      align: "center",
    });

    // Answer Key Section
    doc.addPage();
    yPos = margin;
    yPos = addText(
      "Answer Key",
      margin + sidePadding,
      yPos,
      pageWidth - 2 * margin - 2 * sidePadding,
      14,
      true
    );
    yPos += lineHeight;

    for (const [index, question] of selectedQuestions.entries()) {
      checkNewPage();

      yPos = addText(
        // ${question.question}
        `Q${index + 1}. `,
        margin + sidePadding,
        yPos,
        pageWidth - 0 * margin - 4 * sidePadding,
        12,
        true
      );

      yPos = await renderAnswer(
        question.answer,
        margin + sidePadding,
        yPos,
        pageWidth - 0 * margin - 4 * sidePadding
      );
      // yPos += lineHeight; // Add space after the answer

      // Now render images below the answer
      if (question.answer_images && question.answer_images.length > 0) {
        for (const img of question.answer_images) {
          // Render image after the answer with better quality
          yPos = await addImage(
            img,
            doc,
            margin + sidePadding,
            yPos, // Add small space after the answer
            pageWidth - 2 * margin - 2 * sidePadding,
            25 // You can adjust this height for a better result
          );
          yPos += lineHeight; // Update the position after the image
        }
      }

      // yPos += lineHeight; // Add some space after images if needed
    }

    return doc;
  };

  const handleDownload = async () => {
    const doc = await generatePdf();
    doc.save("exam_paper_with_answers.pdf");
  };

  const handlePreview = async () => {
    const doc = await generatePdf();
    const pdfDataUri = doc.output("datauristring");
    window.open(pdfDataUri, "_blank");
  };

  return (
    <div className="space-x-4">
      <Button onClick={handlePreview}>Preview PDF</Button>
      <Button onClick={handleDownload}>Download PDF</Button>
    </div>
  );
}
