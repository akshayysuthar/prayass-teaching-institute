import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Content } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditContentFormProps {
  content: Content;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditContentForm({
  content,
  onClose,
  onSuccess,
}: EditContentFormProps) {
  const [name, setName] = useState(content.name);
  const [board, setBoard] = useState(content.board);
  const [medium, setMedium] = useState(content.medium);
  const [code, setCode] = useState(content.code);
  const [classNumber, setClassNumber] = useState(content.class.toString());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("contents")
        .update({
          name,
          board,
          medium,
          code,
          class: parseInt(classNumber),
        })
        .eq("id", content.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content updated successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating content:", error);
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="board">Board</Label>
            <Input
              id="board"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="medium">Medium</Label>
            <Input
              id="medium"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="class">Class</Label>
            <Input
              id="class"
              type="number"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
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
