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
import Image from "next/image";

interface QuestionDetailsProps {
  question: Question;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin: boolean;
}

export function QuestionDetails({
  question,
  onClose,
  onSuccess,
  isAdmin,
}: QuestionDetailsProps) {
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
    if (!isAdmin) return;

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

  const renderContent = (content: string, images: string[] | null) => {
    if (!content) return null;
    const parts = content.split(/(\[img\d+\])/g);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[img(\d+)\]/);
      if (imgMatch && images && images[parseInt(imgMatch[1]) - 1]) {
        return (
          <Image
            key={index}
            src={images[parseInt(imgMatch[1]) - 1]}
            alt={`Image ${imgMatch[1]}`}
            width={200}
            height={200}
            className="inline-block mr-2"
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isAdmin ? "Edit Question" : "View Question"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            {isAdmin ? (
              <Textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="p-2 border rounded-md">
                {renderContent(formData.question, formData.question_images)}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="answer">Answer</Label>
            {isAdmin ? (
              <Textarea
                id="answer"
                name="answer"
                value={formData.answer as string}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="p-2 border rounded-md">
                {renderContent(
                  formData.answer as string,
                  formData.answer_images
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              name="type"
              value={formData.type || ""}
              onChange={handleChange}
              required
              readOnly={!isAdmin}
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
              readOnly={!isAdmin}
            />
          </div>
          <div>
            <Label htmlFor="is_reviewed">Reviewed</Label>
            <Input
              id="is_reviewed"
              name="is_reviewed"
              type="checkbox"
              checked={formData.is_reviewed}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_reviewed: e.target.checked,
                }))
              }
              disabled={!isAdmin}
            />
          </div>
          {isAdmin && (
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
