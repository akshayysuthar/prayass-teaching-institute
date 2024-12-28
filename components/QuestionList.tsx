import { useState } from "react";
import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditQuestionForm } from "./EditQuestionForm";

interface QuestionListProps {
  questions: Question[];
  onQuestionUpdated: () => void;
}

export function QuestionList({
  questions,
  onQuestionUpdated,
}: QuestionListProps) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Marks</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell className="font-medium">
                {question.question.substring(0, 50)}...
              </TableCell>
              <TableCell>{question.type}</TableCell>
              <TableCell>{question.marks}</TableCell>
              <TableCell>{question.subject_id}</TableCell>
              <TableCell>
                <Button onClick={() => setEditingQuestion(question)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingQuestion && (
        <EditQuestionForm
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSuccess={() => {
            setEditingQuestion(null);
            onQuestionUpdated();
          }}
        />
      )}
    </div>
  );
}
