import { useState } from "react";
import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditQuestionFormProps {
  question: Question;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditQuestionForm({
  question,
  onClose,
  onSuccess,
}: EditQuestionFormProps) {
  const [formData, setFormData] = useState(question);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("questions")
        .update(formData)
        .eq("id", question.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question updated successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              name="type"
              value={formData.type || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              name="marks"
              type="number"
              value={formData.marks}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              name="answer"
              value={formData.answer as string}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
