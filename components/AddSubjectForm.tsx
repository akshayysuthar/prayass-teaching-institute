"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Content } from "@/types";

export function AddSubjectForm() {
  const [contentId, setContentId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [chapterNo, setChapterNo] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [boardWeightage, setBoardWeightage] = useState("");
  const [contents, setContents] = useState<Content[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data);
    } catch (error) {
      console.error("Error fetching contents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("subjects").insert([
        {
          content_id: parseInt(contentId),
          subject_name: subjectName,
          chapter_no: parseInt(chapterNo),
          chapter_name: chapterName,
          board_weightage: parseFloat(boardWeightage),
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New subject added successfully!",
      });

      // Reset form
      setContentId("");
      setSubjectName("");
      setChapterNo("");
      setChapterName("");
      setBoardWeightage("");
    } catch (error) {
      console.error("Error adding new subject:", error);
      toast({
        title: "Error",
        description: "Failed to add new subject. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="content">Content</Label>
        <Select onValueChange={setContentId} value={contentId}>
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
      <Button type="submit">Add Subject</Button>
    </form>
  );
}
