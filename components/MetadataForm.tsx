"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface MetadataFormProps {
  metadata: {
    content_id: string;
    subject_id: string;
    sectionTitle: string;
    type: string;
  };
  handleMetadataChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  sectionTitleSuggestions?: string[];
  typeSuggestions?: string[];
  selectedClass: string | null; // Added selectedClass property
  setSelectedClass: (cls: string) => void; // Correctly typed setSelectedClass as a function
}

export function MetadataForm({
  metadata,
  handleMetadataChange,
  sectionTitleSuggestions = [],
  typeSuggestions = [],
  selectedClass,
  setSelectedClass,
}: MetadataFormProps) {
  const [contents, setContents] = useState<
    { id: number; name: string; board: string; medium: string; class: string }[]
  >([]);
  const [subjects, setSubjects] = useState<
    {
      id: number;
      subject_name: string;
      chapter_name: string;
      chapter_no: number;
    }[]
  >([]);
  const [openContent, setOpenContent] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);
  const [openSectionTitle, setOpenSectionTitle] = useState(false);
  const [openType, setOpenType] = useState(false);

  useEffect(() => {
    fetchContents();
  }, [selectedClass]);

  useEffect(() => {
    if (metadata.content_id) {
      fetchSubjects(metadata.content_id);
    } else {
      setSubjects([]);
    }
  }, [metadata.content_id]);

  const fetchContents = async () => {
    let query = supabase.from("contents").select("*");
    if (selectedClass) {
      query = query.eq("class", selectedClass);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching contents:", error);
    } else {
      setContents(data);
    }
  };

  const fetchSubjects = async (contentId: string) => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, subject_name, chapter_name, chapter_no")
      .eq("content_id", contentId)
      .order("chapter_no");
    if (error) {
      console.error("Error fetching subjects:", error);
    } else {
      setSubjects(data || []);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    const event = {
      target: { name, value },
    } as React.ChangeEvent<HTMLSelectElement>;
    handleMetadataChange(event);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div className="space-y-2">
        {/* <Label htmlFor="content_id" className="text-foreground">
          Content
        </Label>
        <Label htmlFor="content_id" className="text-foreground">
          {selectedClass ? "Subject" : "Content"}
        </Label> */}
        {/* 
        <Label htmlFor="subject_id" className="text-foreground">
          {selectedClass ? "Chapter" : "Subject/Chapter"}
        </Label> */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((cls) => (
            <Button
              key={cls}
              variant={selectedClass === cls ? "default" : "outline"}
              onClick={() => setSelectedClass(cls)}
            >
              Class {cls}
            </Button>
          ))}
        </div>

        <Popover open={openContent} onOpenChange={setOpenContent}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openContent}
              className="w-full justify-between text-foreground border-input hover:bg-muted"
            >
              {metadata.content_id
                ? contents.find(
                    (content) => content.id.toString() === metadata.content_id
                  )?.name
                : "Select Subject..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search content..." />
              <CommandList>
                <CommandEmpty>No Subject found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {contents.map((content) => (
                    <CommandItem
                      key={content.id}
                      value={content.id.toString()}
                      onSelect={(value) => {
                        handleSelectChange("content_id", value);
                        setOpenContent(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          metadata.content_id === content.id.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {content.name} - {content.board} - {content.medium} -
                      Class {content.class}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_id" className="text-foreground">
          Chapter
        </Label>
        <Popover open={openSubject} onOpenChange={setOpenSubject}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSubject}
              className="w-full justify-between text-foreground border-input hover:bg-muted"
              disabled={!metadata.content_id}
            >
              {metadata.subject_id
                ? subjects.find(
                    (subject) => subject.id.toString() === metadata.subject_id
                  )
                  ? `Ch ${
                      subjects.find(
                        (subject) =>
                          subject.id.toString() === metadata.subject_id
                      )?.chapter_no
                    }: ${
                      subjects.find(
                        (subject) =>
                          subject.id.toString() === metadata.subject_id
                      )?.chapter_name
                    }`
                  : "Select subject..."
                : "Select subject..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search Chapter..." />
              <CommandList>
                <CommandEmpty>No Chapter found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {subjects.map((subject) => (
                    <CommandItem
                      key={subject.id}
                      value={subject.id.toString()}
                      onSelect={(value) => {
                        handleSelectChange("subject_id", value);
                        setOpenSubject(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          metadata.subject_id === subject.id.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Ch {subject.chapter_no}: {subject.chapter_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sectionTitle" className="text-foreground">
          Section Title
        </Label>
        <Popover open={openSectionTitle} onOpenChange={setOpenSectionTitle}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSectionTitle}
              className="w-full justify-between text-foreground border-input hover:bg-muted"
            >
              {metadata.sectionTitle || "Select section title..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search or enter section title..." />
              <CommandList>
                <CommandEmpty>
                  No section title found. Type to create one.
                </CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {sectionTitleSuggestions.map((title) => (
                    <CommandItem
                      key={title}
                      value={title}
                      onSelect={(value) => {
                        handleSelectChange("sectionTitle", value);
                        setOpenSectionTitle(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          metadata.sectionTitle === title
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          id="sectionTitle"
          name="sectionTitle"
          value={metadata.sectionTitle}
          onChange={handleMetadataChange}
          placeholder="Or type a new section title"
          className="mt-2 text-foreground border-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-foreground">
          Question Type
        </Label>
        <Popover open={openType} onOpenChange={setOpenType}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openType}
              className="w-full justify-between text-foreground border-input hover:bg-muted"
            >
              {metadata.type || "Select question type..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search or enter type..." />
              <CommandList>
                <CommandEmpty>
                  No question type found. Type to create one.
                </CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {typeSuggestions.map((type) => (
                    <CommandItem
                      key={type}
                      value={type}
                      onSelect={(value) => {
                        handleSelectChange("type", value);
                        setOpenType(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          metadata.type === type ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {type}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          id="type"
          name="type"
          value={metadata.type}
          onChange={handleMetadataChange}
          placeholder="Or type a new question type"
          className="mt-2 text-foreground border-input"
        />
      </div>
    </div>
  );
}
