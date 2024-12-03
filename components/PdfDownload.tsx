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
  const handleDownload = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
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
      fontSize = 12,
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
        answer.forEach((item, index) => {
          y = addWrappedText(`${index + 1}. ${item}`, x, y, maxWidth);
        });
        return y;
      } else if (typeof answer === "object") {
        Object.entries(answer).forEach(([key, value]) => {
          y = addWrappedText(`${key}:`, x, y, maxWidth, 12, true);
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
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
      width: number,
      height: number
    ) => {
      return new Promise<number>((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const imgHeight = (img.height * width) / img.width;
          doc.addImage(img, "JPEG", x, y, width, imgHeight);
          resolve(y + imgHeight);
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
      16,
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
      `Student's Name: ${studentName}`,
      margin,
      yPos,
      pageWidth - 2 * margin
    );
    yPos = addWrappedText(
      `Teacher's Name: ${teacherName}`,
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
    yPos += lineHeight * 2;

    // Add questions
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      if (yPos > pageHeight - 40) addNewPage();

      yPos = addWrappedText(
        `Q${i + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        12,
        true
      );

      if (question.questionImages && question.questionImages.length > 0) {
        for (const img of question.questionImages) {
          yPos = await addImage(
            img,
            margin,
            yPos + 5,
            pageWidth - 2 * margin,
            0
          );
          yPos += 5;
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
    doc.setFontSize(14);
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
      16,
      true
    );
    yPos += lineHeight * 2;

    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      if (yPos > pageHeight - 40) addNewPage();

      yPos = addWrappedText(
        `Q${i + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        12,
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
            yPos + 5,
            pageWidth - 2 * margin,
            0
          );
          yPos += 5;
        }
      }

      yPos += lineHeight;
    }

    doc.save("exam_paper_with_answers.pdf");
  };

  return <Button onClick={handleDownload}>Download PDF</Button>;
}
