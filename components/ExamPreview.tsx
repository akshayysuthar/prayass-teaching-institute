import { Button } from "@/components/ui/button";
import { Question, ExamStructure } from "@/types";

interface ExamPreviewProps {
  selectedQuestions: Question[];
  examStructure: ExamStructure;
  onGeneratePdf: () => void;
}

export function ExamPreview({
  selectedQuestions,
  examStructure,
  onGeneratePdf,
}: ExamPreviewProps) {
  const groupedQuestions = examStructure.sections.map((section) => ({
    ...section,
    questions: selectedQuestions.filter((q) => q.type === section.questionType),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Exam Preview</h2>
      {groupedQuestions.map((section, index) => (
        <div key={index} className="space-y-4">
          <h3 className="text-xl font-semibold">
            Section {section.name} ({section.questionType})
          </h3>
          <ol className="list-decimal list-inside space-y-4">
            {section.questions.map((question) => (
              <li key={question.id} className="text-lg">
                {question.question}
                {question.type === "MCQ" && question.options && (
                  <ul className="list-none ml-6 mt-2">
                    {Object.entries(question.options).map(([key, value]) => (
                      <li key={key}>
                        {key}) {value}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="text-sm text-gray-500 ml-2">
                  ({question.marks} marks)
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <Button onClick={onGeneratePdf}>Generate PDF</Button>
    </div>
  );
}
