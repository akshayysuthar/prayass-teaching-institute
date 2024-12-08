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
          y = addWrappedText(`${item}`, x, y, maxWidth);
        });
        return y;
      } else if (typeof answer === "object") {
        Object.entries(answer).forEach(
          ([key, value]: [string, string | string[]]) => {
            y = addWrappedText(`${key}:`, x, y, maxWidth, 11, true);
            if (Array.isArray(value)) {
              value.forEach((item: string) => {
                y = addWrappedText(`- ${item}`, x + 5, y, maxWidth - 5);
              });
            } else if (typeof value === "string") {
              y = addWrappedText(value, x + 5, y, maxWidth - 5);
            }
          }
        );
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
      return new Promise<number>((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          let imgWidth = img.width;
          let imgHeight = img.height;

          const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          imgWidth *= scale;
          imgHeight *= scale;

          doc.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
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
      `Chapters: ${chapters.map((ch) => ch).join(", ")}`,
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
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      if (yPos > pageHeight - 30) addNewPage();

      yPos = addWrappedText(
        `Q${i + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        11,
        true
      );

      // question images
      if (question.images && question.images.length > 0) {
        (Array.isArray(question.images)
          ? question.images
          : [question.images]
        ).forEach(async (img: string) => {
          yPos = await addImage(
            img,
            margin,
            yPos + 3,
            pageWidth - 2 * margin,
            50
          );
          yPos += 3;
        });
      }

      if (question.options) {
        Object.entries(question.options).forEach(
          ([key, value]: [string, string]) => {
            yPos = addWrappedText(
              `${key}) ${value}`,
              margin + 10,
              yPos,
              pageWidth - 2 * margin - 10
            );
          }
        );
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

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("All the Best!", pageWidth / 2, pageHeight - margin, {
      align: "center",
    });

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

    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      if (yPos > pageHeight - 30) addNewPage();

      yPos = addWrappedText(
        `Q${i + 1}. ${question.question}`,
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

      if (question.images && question.images.length > 0) {
        (Array.isArray(question.images)
          ? question.images
          : [question.images]
        ).forEach(async (img: string) => {
          yPos = await addImage(
            img,
            margin,
            yPos + 3,
            pageWidth - 2 * margin,
            50
          );
          yPos += 3;
        });
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
