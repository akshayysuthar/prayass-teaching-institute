import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Subject, Content } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditSubjectFormProps {
  subject: Subject;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSubjectForm({
  subject,
  onClose,
  onSuccess,
}: EditSubjectFormProps) {
  const [subjectName, setSubjectName] = useState(subject.subject_name);
  const [chapterNo, setChapterNo] = useState(subject.chapter_no.toString());
  const [chapterName, setChapterName] = useState(subject.chapter_name);
  const [boardWeightage, setBoardWeightage] = useState(
    subject.board_weightage.toString()
  );
  const [contentId, setContentId] = useState(subject.content_id.toString());
  const [contents, setContents] = useState<Content[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    const { data, error } = await supabase.from("contents").select("*");
    if (error) {
      console.error("Error fetching contents:", error);
    } else {
      setContents(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          subject_name: subjectName,
          chapter_no: parseInt(chapterNo),
          chapter_name: chapterName,
          board_weightage: parseFloat(boardWeightage),
          content_id: parseInt(contentId),
        })
        .eq("id", subject.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject updated successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating subject:", error);
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="chapterNo">Chapter Number</Label>
            <Input
              id="chapterNo"
              type="number"
              value={chapterNo}
              onChange={(e) => setChapterNo(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="chapterName">Chapter Name</Label>
            <Input
              id="chapterName"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="boardWeightage">Board Weightage</Label>
            <Input
              id="boardWeightage"
              type="number"
              step="0.01"
              value={boardWeightage}
              onChange={(e) => setBoardWeightage(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="contentId">Content</Label>
            <Select
              value={contentId}
              onValueChange={(value) => setContentId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Content" />
              </SelectTrigger>
              <SelectContent>
                {contents.map((content) => (
                  <SelectItem key={content.id} value={content.id.toString()}>
                    {content.name} - Class {content.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
