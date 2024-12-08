import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Add the type definitions here or import them
type Medium = {
  language: string;
};

type Subject = {
  name: string;
  mediums?: Medium[];
};

type SubjectDataItem = {
  class: number;
  board: string;
  medium?: string;
  subjects?: Subject[];
};

type SubjectData = SubjectDataItem[];

type ClassSelectorProps = {
  subjectData: SubjectData;
  onSelectClass: (selectedClass: number) => void;
  onSelectBoard: (selectedBoard: string) => void;
  onSelectMedium: (selectedMedium: string) => void;
  initialClass?: number | null;
  initialBoard?: string | null;
  initialMedium?: string | null;
};

export function ClassSelector({
  subjectData,
  onSelectClass,
  onSelectBoard,
  onSelectMedium,
  initialClass = null,
  initialBoard = null,
  initialMedium = null,
}: ClassSelectorProps) {
  const [classNumber, setClassNumber] = useState<number | null>(initialClass);
  const [board, setBoard] = useState<string | null>(initialBoard);
  const [medium, setMedium] = useState<string | null>(initialMedium);
  const [availableClasses, setAvailableClasses] = useState<number[]>([]);
  const [availableBoards, setAvailableBoards] = useState<string[]>([]);
  const [availableMediums, setAvailableMediums] = useState<string[]>([]);

  useEffect(() => {
    const classes = Array.from(new Set(subjectData.map((item) => item.class)));
    setAvailableClasses(classes);
  }, [subjectData]);

  useEffect(() => {
    if (classNumber) {
      const boards = Array.from(
        new Set(
          subjectData
            .filter((item) => item.class === classNumber)
            .map((item) => item.board)
        )
      );
      setAvailableBoards(boards);
    }
  }, [classNumber, subjectData]);

  useEffect(() => {
    if (classNumber && board) {
      const mediums = Array.from(
        new Set(
          subjectData
            .filter(
              (item) => item.class === classNumber && item.board === board
            )
            .flatMap((item) => {
              if (item.medium) return [item.medium];
              if (item.subjects) {
                return item.subjects.flatMap((subject) =>
                  subject.mediums ? subject.mediums.map((m) => m.language) : []
                );
              }
              return [];
            })
        )
      );
      setAvailableMediums(mediums);
    }
  }, [classNumber, board, subjectData]);

  const handleClassChange = (value: string) => {
    const selectedClass = parseInt(value);
    setClassNumber(selectedClass);
    onSelectClass(selectedClass);
    setBoard(null);
    setMedium(null);
  };

  const handleBoardChange = (value: string) => {
    setBoard(value);
    onSelectBoard(value);
    setMedium(null);
  };

  const handleMediumChange = (value: string) => {
    setMedium(value);
    onSelectMedium(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="class">Class</Label>
        <Select
          onValueChange={handleClassChange}
          value={classNumber?.toString()}
        >
          <SelectTrigger id="class">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {availableClasses.map((c) => (
              <SelectItem key={c} value={c.toString()} disabled={c === 8}>
                {c}th {c === 8 && "(Locked)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {classNumber && (
        <div>
          <Label htmlFor="board">Board</Label>
          <Select onValueChange={handleBoardChange} value={board || undefined}>
            <SelectTrigger id="board">
              <SelectValue placeholder="Select Board" />
            </SelectTrigger>
            <SelectContent>
              {availableBoards.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {classNumber && board && (
        <div>
          <Label htmlFor="medium">Medium</Label>
          <Select
            onValueChange={handleMediumChange}
            value={medium || undefined}
          >
            <SelectTrigger id="medium">
              <SelectValue placeholder="Select Medium" />
            </SelectTrigger>
            <SelectContent>
              {availableMediums.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {classNumber === 9 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Class 9 is currently locked and not available for exam generation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
