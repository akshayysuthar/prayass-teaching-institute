"use client";

import type React from "react";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

const PREDEFINED_TITLES = [
  "Answer the following questions",
  "Choose the correct option",
  "Write short answers",
  "Solve the following problems",
  "Answer in detail",
];

interface SectionTitleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SectionTitleSelector({
  value,
  onChange,
}: SectionTitleSelectorProps) {
  const [customTitle, setCustomTitle] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(
    PREDEFINED_TITLES.includes(value) ? value : "custom"
  );

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    if (option !== "custom") {
      onChange(option);
    } else {
      onChange(customTitle);
    }
  };

  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTitle(e.target.value);
    if (selectedOption === "custom") {
      onChange(e.target.value);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Section Title</Label>
      <RadioGroup
        value={selectedOption || "custom"}
        onValueChange={handleOptionChange}
      >
        {PREDEFINED_TITLES.map((title) => (
          <div key={title} className="flex items-center space-x-2">
            <RadioGroupItem value={title} id={`title-${title}`} />
            <Label htmlFor={`title-${title}`}>{title}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="title-custom" />
          <Label htmlFor="title-custom">Custom</Label>
          <Input
            value={selectedOption === "custom" ? value : customTitle}
            onChange={handleCustomTitleChange}
            placeholder="Enter custom title"
            className="ml-2"
            disabled={selectedOption !== "custom"}
          />
        </div>
      </RadioGroup>
    </div>
  );
}
