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
  onLoadMore: () => void;
  hasMore: boolean;
}

export function QuestionList({
  questions,
  onQuestionUpdated,
  onLoadMore,
  hasMore,
}: QuestionListProps) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Answer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Marks</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Chapter</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell className="font-medium">
                {question.question.substring(0, 50)}...
              </TableCell>
              <TableCell>
                {typeof question.answer === "string"
                  ? question.answer.substring(0, 50)
                  : "Complex answer"}
                ...
              </TableCell>
              <TableCell>{question.type}</TableCell>
              <TableCell>{question.marks}</TableCell>
              <TableCell>{question.subject_id}</TableCell>
              <TableCell>{question.section_title}</TableCell>
              <TableCell>
                {new Date(question.last_updated).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button onClick={() => setEditingQuestion(question)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button onClick={onLoadMore}>View More</Button>
        </div>
      )}

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
