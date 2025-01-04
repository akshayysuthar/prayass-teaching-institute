"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
type AddContentFormProps = {
  onContentAdded: () => void;
};

export function AddContentForm({ onContentAdded }: AddContentFormProps) {
  const [name, setName] = useState("");
  const [board, setBoard] = useState("");
  const [medium, setMedium] = useState("");
  const [code, setCode] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("contents")
        .insert([{ name, board, medium, code, class: parseInt(classNumber) }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New content added successfully!",
      });

      // Reset form
      setName("");
      setBoard("");
      setMedium("");
      setCode("");
      setClassNumber("");
      // Trigger the callback to update parent state
      onContentAdded();
    } catch (error) {
      console.error("Error adding new content:", error);
      toast({
        title: "Error",
        description: "Failed to add new content. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
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
      <Button type="submit">Add Content</Button>
    </form>
  );
}
