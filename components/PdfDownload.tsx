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

    const addImage = (
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

    // Add questions directly from selectedQuestions (without grouping by chapter)
    for (const [index, question] of selectedQuestions.entries()) {
      if (yPos > pageHeight - 30) addNewPage();

      // Add the question text
      yPos = addWrappedText(
        `Q${index + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        11,
        true
      );

      // Add images asynchronously (optimize size)
      if (question.images && question.images.length > 0) {
        // Ensure question.images is an array
        const imagesArray = Array.isArray(question.images)
          ? question.images
          : [question.images];

        // Map each image and add it to the document
        const imagePromises = imagesArray.map(async (img: string) => {
          return await addImage(
            img,
            margin,
            yPos + 3, // Adjust y position for images
            pageWidth - 2 * margin, // Optimize width for the page
            40 // Resize image height to a smaller value to save space
          );
        });

        // Wait for all images to be added and adjust yPos accordingly
        const imageHeights = await Promise.all(imagePromises);
        yPos += Math.max(...imageHeights); // Adjust yPos for the largest image
      }

      // Add options if they exist
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

      // Add marks after the question text and options
      yPos = addWrappedText(
        `(${question.marks} marks)`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        10
      );
    }

    // Answer Key page

    // Assuming you already have the helper functions like addWrappedText, renderAnswer, addImage, etc.

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

    for (const [index, question] of selectedQuestions.entries()) {
      if (yPos > pageHeight - 30) addNewPage();

      // Add question text
      yPos = addWrappedText(
        `Q${index + 1}. ${question.question}`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        11,
        true
      );

      // Add answer using renderAnswer
      yPos = renderAnswer(
        question.answer,
        margin,
        yPos,
        pageWidth - 2 * margin
      );

      // Add images asynchronously, ensure they're optimized
      if (question.images && question.images.length > 0) {
        // Ensure question.images is an array
        const imagesArray = Array.isArray(question.images)
          ? question.images
          : [question.images];

        // Map each image and add it to the document
        const imagePromises = imagesArray.map(async (img: string) => {
          return await addImage(
            img,
            margin,
            yPos + 3, // Adjust y position for images
            pageWidth - 2 * margin, // Optimize width for the page
            40 // Resize image height to a smaller value to save space
          );
        });

        // Wait for all images to be added and adjust yPos accordingly
        const imageHeights = await Promise.all(imagePromises);
        yPos += Math.max(...imageHeights); // Adjust yPos for the largest image
      }

      // Add marks after the answer
      yPos = addWrappedText(
        `(${question.marks} marks)`,
        margin,
        yPos,
        pageWidth - 2 * margin,
        10
      );

      // Ensure proper spacing between questions
      yPos += lineHeight;
    }

    // After the loop, you can optionally add a closing statement like "End of Answer Key" or similar

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
