import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExamStructure } from "@/types";

interface ExamStructureFormProps {
  examStructure: ExamStructure;
  onExamStructureChange: (newStructure: ExamStructure) => void;
}

export function ExamStructureForm({
  examStructure,
  onExamStructureChange,
}: ExamStructureFormProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleTotalMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalMarks = parseInt(e.target.value);
    onExamStructureChange({ ...examStructure, totalMarks: newTotalMarks });
  };

  const handleSectionChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newSections = [...examStructure.sections];
    newSections[index] = {
      ...newSections[index],
      [field]: field === "totalMarks" ? parseInt(value as string) : value,
    };
    onExamStructureChange({ ...examStructure, sections: newSections });
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Exam Structure</h2>
        <Button onClick={toggleEdit}>{isEditing ? "Save" : "Edit"}</Button>
      </div>
      {isEditing ? (
        <>
          <div>
            <Label htmlFor="totalMarks">Total Marks</Label>
            <Input
              id="totalMarks"
              type="number"
              value={examStructure.totalMarks}
              onChange={handleTotalMarksChange}
            />
          </div>
          {examStructure.sections.map((section, index) => (
            <div key={index} className="border p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">
                Section {section.name}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`questionType-${index}`}>Question Type</Label>
                  <Input
                    id={`questionType-${index}`}
                    value={section.questionType}
                    onChange={(e) =>
                      handleSectionChange(index, "questionType", e.target.value)
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor={`totalMarks-${index}`}>Total Marks</Label>
                  <Input
                    id={`totalMarks-${index}`}
                    type="number"
                    value={section.totalMarks}
                    onChange={(e) =>
                      handleSectionChange(index, "totalMarks", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examStructure.sections.map((section, index) => (
            <div key={index} className="border p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">
                Section {section.name}
              </h3>
              <p>Type: {section.questionType}</p>
              <p>Marks: {section.totalMarks}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
