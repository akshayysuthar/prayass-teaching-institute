"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExamStructure } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamStructureFormProps {
  examStructure: ExamStructure;
  onExamStructureChange: (newStructure: ExamStructure) => void;
  questionTypes: string[]; // Add questionTypes prop
}

export function ExamStructureForm({
  examStructure,
  onExamStructureChange,
  questionTypes,
}: ExamStructureFormProps) {
  const [isEditing, setIsEditing] = useState(true); // Start in editing mode
  const { toast } = useToast();

  const handleTotalMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalMarks = Number.parseInt(e.target.value);
    onExamStructureChange({ ...examStructure, totalMarks: newTotalMarks });
  };

  const handleSectionChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newSections = [...examStructure.sections];

    // If changing marks per question, update total questions
    if (field === "marksPerQuestion" && newSections[index].totalMarks) {
      const marksPerQuestion = Number.parseInt(value as string);
      if (marksPerQuestion > 0) {
        const totalQuestions = Math.floor(
          newSections[index].totalMarks / marksPerQuestion
        );
        newSections[index] = {
          ...newSections[index],
          [field]: marksPerQuestion,
          totalQuestions: totalQuestions,
        };
      } else {
        newSections[index] = {
          ...newSections[index],
          [field]: marksPerQuestion,
        };
      }
    }
    // If changing total marks, update total questions
    else if (field === "totalMarks" && newSections[index].marksPerQuestion) {
      const totalMarks = Number.parseInt(value as string);
      const totalQuestions = Math.floor(
        totalMarks / newSections[index].marksPerQuestion
      );
      newSections[index] = {
        ...newSections[index],
        [field]: totalMarks,
        totalQuestions: totalQuestions,
      };
    }
    // If changing total questions, update total marks
    else if (
      field === "totalQuestions" &&
      newSections[index].marksPerQuestion
    ) {
      const totalQuestions = Number.parseInt(value as string);
      const totalMarks = totalQuestions * newSections[index].marksPerQuestion;
      newSections[index] = {
        ...newSections[index],
        [field]: totalQuestions,
        totalMarks: totalMarks,
      };
    }
    // For other fields, just update the value
    else {
      newSections[index] = {
        ...newSections[index],
        [field]:
          field === "totalMarks" ||
          field === "marksPerQuestion" ||
          field === "totalQuestions"
            ? Number.parseInt(value as string)
            : value,
      };
    }

    // Calculate total marks of all sections
    const totalSectionMarks = newSections.reduce(
      (sum, section) => sum + section.totalMarks,
      0
    );

    onExamStructureChange({
      totalMarks: totalSectionMarks,
      sections: newSections,
    });
  };

  const addNewSection = () => {
    const newSectionName = String.fromCharCode(
      65 + examStructure.sections.length
    );
    const newSection = {
      name: newSectionName,
      questionType: questionTypes.length > 0 ? questionTypes[0] : "",
      totalMarks: 10,
      marksPerQuestion: 1,
      totalQuestions: 10,
    };

    onExamStructureChange({
      ...examStructure,
      sections: [...examStructure.sections, newSection],
    });
  };

  const removeSection = (index: number) => {
    const newSections = [...examStructure.sections];
    newSections.splice(index, 1);

    // Recalculate total marks
    const totalSectionMarks = newSections.reduce(
      (sum, section) => sum + section.totalMarks,
      0
    );

    onExamStructureChange({
      totalMarks: totalSectionMarks,
      sections: newSections,
    });
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Exam Structure</h2>
        <Button onClick={toggleEdit}>{isEditing ? "View" : "Edit"}</Button>
      </div>

      <div className="text-lg font-medium">
        Total Exam Marks: {examStructure.totalMarks}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {examStructure.sections.length === 0 && (
            <div className="text-center p-4 border border-dashed rounded-md">
              <p>
                No sections defined yet. Click the button below to add a
                section.
              </p>
            </div>
          )}

          {examStructure.sections.map((section, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Section {section.name}
                  </h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSection(index)}
                    disabled={examStructure.sections.length <= 1}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor={`sectionName-${index}`}>Section Name</Label>
                    <Input
                      id={`sectionName-${index}`}
                      value={section.name}
                      onChange={(e) =>
                        handleSectionChange(index, "name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`questionType-${index}`}>
                      Question Type
                    </Label>
                    <Select
                      value={section.questionType}
                      onValueChange={(value) =>
                        handleSectionChange(index, "questionType", value)
                      }
                    >
                      <SelectTrigger id={`questionType-${index}`}>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                    {section.questionType === "custom" && (
                      <Input
                        className="mt-2"
                        placeholder="Enter custom question type"
                        value={
                          section.questionType === "custom"
                            ? ""
                            : section.questionType
                        }
                        onChange={(e) =>
                          handleSectionChange(
                            index,
                            "questionType",
                            e.target.value
                          )
                        }
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`marksPerQuestion-${index}`}>
                      Marks Per Question
                    </Label>
                    <Input
                      id={`marksPerQuestion-${index}`}
                      type="number"
                      min="1"
                      value={section.marksPerQuestion}
                      onChange={(e) =>
                        handleSectionChange(
                          index,
                          "marksPerQuestion",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`totalQuestions-${index}`}>
                      Total Questions
                    </Label>
                    <Input
                      id={`totalQuestions-${index}`}
                      type="number"
                      min="1"
                      value={section.totalQuestions}
                      onChange={(e) =>
                        handleSectionChange(
                          index,
                          "totalQuestions",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`totalMarks-${index}`}>Total Marks</Label>
                    <Input
                      id={`totalMarks-${index}`}
                      type="number"
                      min="1"
                      value={section.totalMarks}
                      onChange={(e) =>
                        handleSectionChange(index, "totalMarks", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addNewSection} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add New Section
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examStructure.sections.map((section, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">
                  Section {section.name}
                </h3>
                <p>
                  <strong>Type:</strong> {section.questionType}
                </p>
                <p>
                  <strong>Marks Per Question:</strong>{" "}
                  {section.marksPerQuestion}
                </p>
                <p>
                  <strong>Total Questions:</strong> {section.totalQuestions}
                </p>
                <p>
                  <strong>Total Marks:</strong> {section.totalMarks}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
