"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExamStructure } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExamStructureFormProps {
  examStructure: ExamStructure;
  onExamStructureChange: (newStructure: ExamStructure) => void;
  totalPaperMarks: number;
  allowCustomQuestionTypes?: boolean;
}

export function ExamStructureForm({
  examStructure,
  onExamStructureChange,
  totalPaperMarks,
  allowCustomQuestionTypes = false,
}: ExamStructureFormProps) {
  const { toast } = useToast();

  // Calculate remaining marks
  const assignedMarks = examStructure.sections.reduce(
    (sum, section) => sum + section.totalMarks,
    0
  );
  const remainingMarks = totalPaperMarks - assignedMarks;

  const handleSectionChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newSections = [...examStructure.sections];

    // For other fields, just update the value
    if (field === "totalMarks") {
      const oldMarks = newSections[index].totalMarks;
      const newMarks = Number.parseInt(value as string);

      // Check if we have enough remaining marks
      if (newMarks > oldMarks && newMarks - oldMarks > remainingMarks) {
        toast({
          title: "Not enough marks",
          description: `You only have ${remainingMarks} marks remaining to allocate.`,
          variant: "destructive",
        });
        return;
      }

      // Update marks per question and total questions
      if (newSections[index].marksPerQuestion > 0) {
        const totalQuestions = Math.floor(
          newMarks / newSections[index].marksPerQuestion
        );
        newSections[index] = {
          ...newSections[index],
          totalMarks: newMarks,
          totalQuestions: totalQuestions,
        };
      } else {
        newSections[index] = {
          ...newSections[index],
          totalMarks: newMarks,
        };
      }
    } else if (field === "marksPerQuestion") {
      const marksPerQuestion = Number.parseInt(value as string);
      if (marksPerQuestion > 0) {
        const totalQuestions = Math.floor(
          newSections[index].totalMarks / marksPerQuestion
        );
        newSections[index] = {
          ...newSections[index],
          marksPerQuestion: marksPerQuestion,
          totalQuestions: totalQuestions,
        };
      } else {
        newSections[index] = {
          ...newSections[index],
          marksPerQuestion: marksPerQuestion,
        };
      }
    } else if (field === "totalQuestions") {
      const totalQuestions = Number.parseInt(value as string);
      const marksPerQuestion = newSections[index].marksPerQuestion;
      const newTotalMarks = totalQuestions * marksPerQuestion;

      // Check if we have enough remaining marks
      const oldMarks = newSections[index].totalMarks;
      if (
        newTotalMarks > oldMarks &&
        newTotalMarks - oldMarks > remainingMarks
      ) {
        toast({
          title: "Not enough marks",
          description: `You only have ${remainingMarks} marks remaining to allocate.`,
          variant: "destructive",
        });
        return;
      }

      newSections[index] = {
        ...newSections[index],
        totalQuestions: totalQuestions,
        totalMarks: newTotalMarks,
      };
    } else {
      newSections[index] = {
        ...newSections[index],
        [field]: value,
      };
    }

    onExamStructureChange({
      ...examStructure,
      sections: newSections,
    });
  };

  const addNewSection = () => {
    // Check if we have any marks left to allocate
    if (remainingMarks <= 0) {
      toast({
        title: "No marks remaining",
        description:
          "You have allocated all available marks. Adjust existing sections to add a new one.",
        variant: "destructive",
      });
      return;
    }

    const newSectionName = String.fromCharCode(
      65 + examStructure.sections.length
    );
    const defaultMarksPerQuestion = 1;
    const defaultTotalMarks = Math.min(10, remainingMarks);

    const newSection = {
      name: newSectionName,
      questionType: `Section ${newSectionName}`,
      totalMarks: defaultTotalMarks,
      marksPerQuestion: defaultMarksPerQuestion,
      totalQuestions: Math.floor(defaultTotalMarks / defaultMarksPerQuestion),
    };

    onExamStructureChange({
      ...examStructure,
      sections: [...examStructure.sections, newSection],
    });
  };

  const removeSection = (index: number) => {
    const newSections = [...examStructure.sections];
    newSections.splice(index, 1);

    // Rename sections to maintain alphabetical order
    const renamedSections = newSections.map((section, idx) => ({
      ...section,
      name: String.fromCharCode(65 + idx),
    }));

    onExamStructureChange({
      ...examStructure,
      sections: renamedSections,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Exam Sections</h2>
        <Badge variant={remainingMarks >= 0 ? "outline" : "destructive"}>
          Remaining Marks: {remainingMarks}
        </Badge>
      </div>

      {examStructure.sections.length === 0 && (
        <div className="text-center p-6 border border-dashed rounded-md">
          <p className="mb-4">
            No sections defined yet. Click the button below to add your first
            section.
          </p>
          <Button onClick={addNewSection}>Add First Section</Button>
        </div>
      )}

      <div className="space-y-6">
        {examStructure.sections.map((section, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Section {section.name}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSection(index)}
                >
                  <Trash className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label
                    htmlFor={`sectionTitle-${index}`}
                    className="text-base font-medium"
                  >
                    Section Title (Question Type)
                  </Label>
                  <Input
                    id={`sectionTitle-${index}`}
                    value={section.questionType}
                    onChange={(e) =>
                      handleSectionChange(index, "questionType", e.target.value)
                    }
                    placeholder="e.g., Multiple Choice, Short Answer, etc."
                    className="mt-1 font-medium"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a descriptive title for this section (e.g., "Multiple
                    Choice Questions", "Short Answer", etc.)
                  </p>
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

        {examStructure.sections.length > 0 && remainingMarks > 0 && (
          <Button onClick={addNewSection} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Another Section
          </Button>
        )}
      </div>
    </div>
  );
}
