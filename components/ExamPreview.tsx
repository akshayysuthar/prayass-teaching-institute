import { Button } from "@/components/ui/button";
import { Question } from "@/types";

interface ExamPreviewProps {
  selectedQuestions: Question[];
  onGeneratePdf: () => void;
}

export function ExamPreview({
  selectedQuestions,
  onGeneratePdf,
}: ExamPreviewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Exam Preview</h2>
      <ol className="list-decimal list-inside space-y-4">
        {selectedQuestions.map((question) => (
          <li key={question.id} className="text-lg">
            {question.question}
          </li>
        ))}
      </ol>
      <Button onClick={onGeneratePdf}>Generate PDF</Button>
    </div>
  );
}
