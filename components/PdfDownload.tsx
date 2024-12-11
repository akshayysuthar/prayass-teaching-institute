import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { Question, PdfDownloadProps } from "@/types";

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
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const lineHeight = 6;
    let yPos = margin;

    // Helper functions
    const addNewPage = () => {
      doc.addPage();
      yPos = margin;
    };

    const addWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize = 11,
      bold = false
    ) => {
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lineHeight * lines.length;
    };

    const renderAnswer = (
      answer: Question["answer"],
      x: number,
      y: number,
      maxWidth: number
    ) => {
      if (typeof answer === "string") {
        return addWrappedText(answer, x, y, maxWidth);
      } else if (Array.isArray(answer)) {
        answer.forEach((item: string) => {
          y = addWrappedText(`- ${item}`, x, y, maxWidth);
        });
        return y;
      } else if (typeof answer === "object" && answer !== null) {
        Object.entries(answer).forEach(([key, value]) => {
          y = addWrappedText(`${key}:`, x, y, maxWidth, 11, true);
          if (Array.isArray(value)) {
            value.forEach((item: string) => {
              y = addWrappedText(`- ${item}`, x + 5, y, maxWidth - 5);
            });
          } else if (typeof value === "string") {
            y = addWrappedText(value, x + 5, y, maxWidth - 5);
          }
        });
        return y;
      }
      return y;
    };

    const addImage = async (
      imgUrl: string,
      x: number,
      y: number,
      maxWidth: number,
      maxHeight: number
    ) => {
      return new Promise<number>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / aspectRatio;

          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
          }

          try {
            doc.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
            resolve(y + imgHeight);
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            resolve(y); // Resolve with the original y position if there's an error
          }
        };
        img.onerror = () => {
          console.error("Error loading image:", imgUrl);
          resolve(y); // Resolve with the original y position if there's an error
        };
        img.src = imgUrl;
      });
    };

    // Add header
    yPos = addWrappedText(
      instituteName,
      margin,
      yPos,
      pageWidth - 2 * margin,
      14,
      true
    );
    yPos = addWrappedText(
      `Standard: ${standard} | Subject: ${subject}`,
      margin,
      yPos,
      pageWidth - 2 * margin
    );
    yPos = addWrappedText(
      `Chapters: ${chapters.join(", ")}`,
      margin,
      yPos,
      pageWidth - 2 * margin
    );
    yPos = addWrappedText(
      `Teacher's Name: ${teacherName} | Student's Name: ${studentName} `,
      margin,
      yPos,
      pageWidth - 2 * margin
    );
    yPos = addWrappedText(
      `Total Marks: ${totalMarks} | Time: ${Math.ceil(
        totalMarks * 1.5
      )} minutes`,
      margin,
      yPos,
      pageWidth - 2 * margin
    );
    yPos += lineHeight;

    // Add questions
    for (const [index, question] of selectedQuestions.entries()) {
      if (yPos > pageHeight - 30) addNewPage();

      yPos = addWrappedText(
        `Q${index + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        11,
        true
      );

      if (question.questionImages && question.questionImages.length > 0) {
        for (const img of question.questionImages) {
          yPos = await addImage(
            img,
            margin,
            yPos + 3,
            pageWidth - 2 * margin,
            50
          );
          yPos += 3;
        }
      }

      if (question.options) {
        Object.entries(question.options).forEach(([key, value]) => {
          yPos = addWrappedText(
            `${key}) ${value}`,
            margin + 10,
            yPos,
            pageWidth - 2 * margin - 10
          );
        });
      }

      yPos = addWrappedText(
        `(${question.marks} marks)`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        10
      );
      yPos += lineHeight;
    }

    // Add "All the Best!" at the bottom of the last page
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("All the Best!", pageWidth / 2, pageHeight - margin, {
      align: "center",
    });

    // Add answer key on a new page
    addNewPage();
    yPos = addWrappedText(
      "Answer Key",
      pageWidth / 2,
      yPos,
      pageWidth - 2 * margin,
      14,
      true
    );
    yPos += lineHeight;

    for (const [index, question] of selectedQuestions.entries()) {
      if (yPos > pageHeight - 30) addNewPage();

      yPos = addWrappedText(
        `Q${index + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        11,
        true
      );
      yPos = renderAnswer(
        question.answer,
        margin,
        yPos,
        pageWidth - 2 * margin
      );

      if (question.answerImages && question.answerImages.length > 0) {
        for (const img of question.answerImages) {
          yPos = await addImage(
            img,
            margin,
            yPos + 3,
            pageWidth - 2 * margin,
            50
          );
          yPos += 3;
        }
      }

      yPos += lineHeight;
    }

    return doc;
  };

  const handleDownload = async () => {
    const doc = await generatePdf();
    doc.save("exam_paper_with_answers.pdf");
  };

  const handleOpenInNewTab = async () => {
    const doc = await generatePdf();
    const pdfDataUri = doc.output("datauristring");
    window.open(pdfDataUri, "_blank");
  };

  return (
    <div className="space-x-4">
      <Button onClick={handleOpenInNewTab}>Open PDF in New Tab</Button>
      <Button onClick={handleDownload}>Download PDF</Button>
    </div>
  );
}
