import { Button } from "@/components/ui/button";

export function ExamPreview({ selectedQuestions, onGeneratePdf }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Exam Preview</h2>
      <ol className="list-decimal list-inside space-y-4">
        {selectedQuestions.map((question, index) => (
          <li key={question.id} className="text-lg">
            {question.question}
          </li>
        ))}
      </ol>
      <Button onClick={onGeneratePdf}>Generate PDF</Button>
    </div>
  );
}

