import React from "react";

// Define the data structure
interface QuestionData {
  id: string;
  class: number;
  subject: string;
  bookName: string;
  board: string;
  Ch: string;
  chapterName: string;
  section: string;
  type: string;
  question: string;
  questionImages: string[];
  answer: string | string[] | Record<string, string | string[]>;
  answerImages?: string[];
  options?: Record<string, string>;
  marks: number;
  isReviewed: string;
  reviewedBy: string;
  lastUpdated: string;
  selectionCount?: number;
}

interface DynamicParagraphProps {
  paragraph: string;
  images: string[];
}

// DynamicParagraph Component
const DynamicParagraph: React.FC<DynamicParagraphProps> = ({
  paragraph,
  images,
}) => {
  const renderContent = (text: string, imageUrls: string[]) => {
    const parts = text.split(/(\[img\d+\])/g); // Split by placeholders (e.g., [img1], [img2])
    return parts.map((part, index) => {
      const match = part.match(/\[img(\d+)\]/); // Match placeholder pattern
      if (match) {
        const imgIndex = parseInt(match[1], 10) - 1; // Get the image index (1-based to 0-based)
        if (imageUrls[imgIndex]) {
          return (
            <img
              key={index}
              src={imageUrls[imgIndex]}
              alt={`Image ${imgIndex + 1}`}
              style={{ width: "50%", height: "auto", margin: "5px" }}
            />
          );
        }
      }
      return (
        <span key={index} style={{ margin: "0 5px" }}>
          {part}
        </span>
      ); // Return text as is
    });
  };

  return <div>{renderContent(paragraph, images)}</div>;
};

// Test Component with Realistic Data
const TestComponent: React.FC = () => {
  const testData: QuestionData = {
    id: "1",
    class: 10,
    subject: "Math",
    bookName: "CBSE Math Textbook",
    board: "CBSE",
    Ch: "3",
    chapterName: "Linear Equations",
    section: "A",
    type: "Theory",
    question:
      "Form the pair of linear equations in the following problems, and find their solutions graphically.10 students of Class X took part in a Mathematics quiz. If the number of girls is 4 more than the number of boys, find the number of boys and girls who took part in the quiz.5 pencils and 7 pens together cost ₹ 50, whereas 7 pencils and 5 pens together cost ₹ 46. Find the cost of one pencil and that of one pen.",
    answer:
      "1. Let the number of boys and girls who took part in the quiz be x and y respectively. Then, the pair of linear equations formed is x + y – 10 (1) and y – x + 4(2) Let us draw the graphs of equations (1) and (2) by finding two solutions for each of the equations. These two solutions of the equations (1) and (2) are given below in table 1 and table 2 respectively. For equation (1) x + y – 10 ⇒ y = 10 – x Table 1 [img1] For equation (2) y = x + 4 [img2] We plot the points A(6, 4) and B(4, 6) on a graph paper and join these points to form the line AB representing the equation (1) as shown in the paper. Also, we plot the points C(0, 4) and D(l, 5) on the same graph paper and join these points to form the line CD representing the equation (2) as shown in the same figure. [img3]",
    answerImages: [
      "https://gsebsolutions.in/wp-content/uploads/2020/09/GSEB-Solutions-Class-10-Maths-Chapter-3-Pair-of-Linear-Equations-in-Two-Variables-Ex-3.2-1.png",
      "https://gsebsolutions.in/wp-content/uploads/2020/09/GSEB-Solutions-Class-10-Maths-Chapter-3-Pair-of-Linear-Equations-in-Two-Variables-Ex-3.2-2.png",
      "https://gsebsolutions.in/wp-content/uploads/2020/09/GSEB-Solutions-Class-10-Maths-Chapter-3-Pair-of-Linear-Equations-in-Two-Variables-Ex-3.2-3.png",
    ],

    marks: 5,
    isReviewed: "Yes",
    reviewedBy: "Teacher A",
    lastUpdated: "2024-12-16",
    selectionCount: 0,
    questionImages: [],
  };

  return (
    <div className="grid grid-cols-1 px-10 py-5 justify-center">
      <h1>Dynamic Question and Answer</h1>
      <div className="w-1/2">
        {/* Render the question */}
        <h2>Question:</h2>
        <DynamicParagraph
          paragraph={testData.question}
          images={testData.questionImages}
        />

        {/* Render the answer */}
        {typeof testData.answer === "string" && (
          <>
            <h2>Answer:</h2>
            <DynamicParagraph
              paragraph={testData.answer}
              images={testData.answerImages || []}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TestComponent;
