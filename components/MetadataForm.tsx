import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MetadataFormProps {
  metadata: {
    class: string;
    subject: string;
    bookName: string;
    board: string;
    chapterNo: string;
    chapterName: string;
    section: string;
    type: string;
  };
  handleMetadataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const classOptions = [6, 7, 8, 9, 10];
const boardOptions = ["CBSE", "GSEB"];
const subjectOptions = {
  6: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Gujarati", "Sanskrit"],
  7: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Gujarati", "Sanskrit"],
  8: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Gujarati", "Sanskrit"],
  9: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Gujarati", "Sanskrit"],
  10: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Gujarati", "Sanskrit"],
};

export function MetadataForm({ metadata, handleMetadataChange }: MetadataFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Metadata (applies to all questions in this chapter)</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="class">Class</Label>
          <Select
            name="class"
            onValueChange={(value) =>
              handleMetadataChange({
                target: { name: "class", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((classNum) => (
                <SelectItem key={classNum} value={classNum.toString()}>
                  {classNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select
            name="subject"
            onValueChange={(value) =>
              handleMetadataChange({
                target: { name: "subject", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions[metadata.class as unknown as keyof typeof subjectOptions]?.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bookName">Book Name</Label>
          <Input
            id="bookName"
            name="bookName"
            value={metadata.bookName}
            onChange={handleMetadataChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="board">Board</Label>
          <Select
            name="board"
            onValueChange={(value) =>
              handleMetadataChange({
                target: { name: "board", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select board" />
            </SelectTrigger>
            <SelectContent>
              {boardOptions.map((board) => (
                <SelectItem key={board} value={board}>
                  {board}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="chapterNo">Chapter Number</Label>
          <Input
            id="chapterNo"
            name="chapterNo"
            value={metadata.chapterNo}
            onChange={handleMetadataChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="chapterName">Chapter Name</Label>
          <Input
            id="chapterName"
            name="chapterName"
            value={metadata.chapterName}
            onChange={handleMetadataChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="section">Section</Label>
          <Input
            id="section"
            name="section"
            value={metadata.section}
            onChange={handleMetadataChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Question Type</Label>
          <Input
            id="type"
            name="type"
            value={metadata.type}
            onChange={handleMetadataChange}
            required
          />
        </div>
      </div>
    </div>
  );
}

