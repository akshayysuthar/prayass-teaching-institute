import { useState } from "react";
import type { Question, Content, Subject } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { X } from "lucide-react";

interface QuestionDetailsProps {
  question: Question;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin: boolean;
  contents: Content[];
  subjects: Subject[];
}

export function QuestionDetails({
  question,
  onClose,
  onSuccess,
  isAdmin,
  contents,
  subjects,
}: QuestionDetailsProps) {
  const [formData, setFormData] = useState(question);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("question-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return;
      }

      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("question-images").getPublicUrl(data.path);

        setFormData((prev) => ({
          ...prev,
          [field]: [...((prev[field] as string[]) || []), publicUrl],
        }));
      }
    }
  };

  const handleImageRemove = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="content_id">Content</Label>
              <Select
                value={formData.content_id.toString()}
                onValueChange={(value) =>
                  handleChange({
                    target: { name: "content_id", value },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content" />
                </SelectTrigger>
                <SelectContent>
                  {contents.map((content) => (
                    <SelectItem key={content.id} value={content.id.toString()}>
                      {content.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject_id">Subject</Label>
              <Select
                value={formData.subject_id.toString()}
                onValueChange={(value) =>
                  handleChange({
                    target: { name: "subject_id", value },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.subject_name} Ch {subject.chapter_no} -{" "}
                      {subject.chapter_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="question">Question (English)</Label>
            <Textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="question_gu">Question (Gujarati)</Label>
            <Textarea
              id="question_gu"
              name="question_gu"
              value={formData.question_gu}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="answer">Answer (English)</Label>
            <Textarea
              id="answer"
              name="answer"
              value={formData.answer as string}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="answer_gu">Answer (Gujarati)</Label>
            <Textarea
              id="answer_gu"
              name="answer_gu"
              value={formData.answer_gu as string}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_reviewed"
              checked={formData.is_reviewed}
              onCheckedChange={(checked) =>
                handleCheckboxChange("is_reviewed", checked as boolean)
              }
            />
            <Label htmlFor="is_reviewed">Reviewed</Label>
          </div>
          <div>
            <Label htmlFor="question_images">Question Images (English)</Label>
            <Input
              id="question_images"
              name="question_images"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "question_images")}
              multiple
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.question_images?.map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Question image ${index + 1}`}
                    width={100}
                    height={100}
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove("question_images", index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="question_images_gu">
              Question Images (Gujarati)
            </Label>
            <Input
              id="question_images_gu"
              name="question_images_gu"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "question_images_gu")}
              multiple
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.question_images_gu?.map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Question image (Gujarati) ${index + 1}`}
                    width={100}
                    height={100}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleImageRemove("question_images_gu", index)
                    }
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="answer_images">Answer Images (English)</Label>
            <Input
              id="answer_images"
              name="answer_images"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "answer_images")}
              multiple
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.answer_images?.map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Answer image ${index + 1}`}
                    width={100}
                    height={100}
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove("answer_images", index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="answer_images_gu">Answer Images (Gujarati)</Label>
            <Input
              id="answer_images_gu"
              name="answer_images_gu"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "answer_images_gu")}
              multiple
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.answer_images_gu?.map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Answer image (Gujarati) ${index + 1}`}
                    width={100}
                    height={100}
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove("answer_images_gu", index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
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
