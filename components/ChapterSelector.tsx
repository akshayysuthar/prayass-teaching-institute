import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Question, SelectedChapter, Subject } from "@/types";

interface ChapterSelectorProps {
  questions: Question[];
  subject: Subject[];
  onSelectQuestions: (questions: Question[]) => void;
  onSelectChapters: (chapters: SelectedChapter[]) => void;
}

export function ChapterSelector({
  questions,
  subject,
  onSelectQuestions,
  onSelectChapters,
}: ChapterSelectorProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  console.log(questions);
  console.log(subject);

  const groupedBySubject = useMemo(() => {
    const subjectMap: { [key: string]: { [key: string]: Question[] } } = {};
    questions.forEach((q) => {
      if (!subjectMap[q.subject_id]) {
        subjectMap[q.subject_id] = {};
      }
      const section = q.section_title || "General";
      if (!subjectMap[q.subject_id][section]) {
        subjectMap[q.subject_id][section] = [];
      }
      subjectMap[q.subject_id][section].push(q);
    });
    return subjectMap;
  }, [questions]);

  const chapters = useMemo(() => {
    const chapterMap = new Map<
      string,
      { id: string; name: string; chapter_no: number }
    >();
    questions.forEach((q) => {
      if (!chapterMap.has(q.chapter_no)) {
        chapterMap.set(q.chapter_no, {
          id: q.chapter_no,
          name: q.chapter_name || "Unknown",
          chapter_no: q.chapter_no,
        });
      }
    });
    return Array.from(chapterMap.values()).sort(
      (a, b) => a.chapter_no - b.chapter_no
    );
  }, [questions]);

  const handleQuestionChange = useCallback((question: Question) => {
    setSelectedQuestions((prev) => {
      const isSelected = prev.some((q) => q.id === question.id);
      const updated = isSelected
        ? prev.filter((q) => q.id !== question.id)
        : [...prev, question];
      return updated;
    });
  }, []);

  useEffect(() => {
    onSelectQuestions(selectedQuestions);
  }, [selectedQuestions, onSelectQuestions]);

  useEffect(() => {
    const uniqueChapters = Array.from(
      new Set(selectedQuestions.map((q) => q.chapter_no))
    ).map((ch) => ({ id: ch, name: ch }));
    onSelectChapters(uniqueChapters);
  }, [selectedQuestions, onSelectChapters]);

  const handleReset = useCallback(() => {
    setSelectedQuestions([]);
    onSelectQuestions([]);
    onSelectChapters([]);
  }, [onSelectQuestions, onSelectChapters]);

  const renderImages = useCallback((images?: string | string[]) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [images];
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {imageArray.map((img, index) => (
          <Image
            key={index}
            src={img}
            alt={`Question image ${index + 1}`}
            width={200}
            height={200}
            className="object-contain"
          />
        ))}
      </div>
    );
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 items-center justify-center">
        <h2 className="col-span-4 text-xl font-bold text-center">
          Select Chapter
        </h2>
        <div className="col-span-3 mt-2">
          <Badge variant="secondary" className="mr-1">
            Selected Questions: {selectedQuestions.length}
          </Badge>
          <Badge variant="secondary" className="mr-1">
            Selected Chapters:{" "}
            {
              Array.from(new Set(selectedQuestions.map((q) => q.chapter_no)))
                .length
            }
          </Badge>
        </div>
        <div className="col-span-1 flex justify-center items-center">
          <Button
            disabled={selectedQuestions.length === 0}
            onClick={handleReset}
            variant="destructive"
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedBySubject).map(([subjectId, sections]) => {
          const subjectDetails = subject.find(
            (sub) => sub.id === parseInt(subjectId)
          );
          const subjectChapters = chapters.filter((chapter) =>
            questions.some(
              (q) =>
                q.subject_id === parseInt(subjectId) &&
                q.chapter_no === parseInt(chapter.id)
            )
          );
          return (
            <Accordion type="single" collapsible key={subjectId}>
              <AccordionItem value={`subject-${subjectId}`}>
                <AccordionTrigger>
                  <h3 className="text-lg font-bold flex gap-3">
                    <span>
                      Chapter {subjectDetails?.chapter_no || subjectId}
                    </span>
                    <span>{subjectDetails?.chapter_name || subjectId}</span>
                    {subjectChapters
                      .map((ch) => `${ch.id} (${ch.name})`)
                      .join(", ")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent>
                  {Object.entries(sections)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([section, sectionQuestions]) => (
                      <Accordion type="single" collapsible key={section}>
                        <AccordionItem value={`section-${section}`}>
                          <AccordionTrigger>
                            <h4 className="text-md font-semibold">{section}</h4>
                          </AccordionTrigger>
                          <AccordionContent>
                            {chapters.map((chapter) => (
                              <div key={chapter.id}>
                                {sectionQuestions
                                  .filter(
                                    (q) =>
                                      q.chapter_no === chapter.id
                                  )
                                  .map((question) => (
                                    <div
                                      className="flex items-start space-x-3"
                                      key={question.id}
                                    >
                                      <Checkbox
                                        id={`question-${question.id}`}
                                        checked={selectedQuestions.some(
                                          (q) => q.id === question.id
                                        )}
                                        onCheckedChange={() =>
                                          handleQuestionChange(question)
                                        }
                                      />
                                      <Label
                                        htmlFor={`question-${question.id}`}
                                        className="flex flex-col space-y-2"
                                      >
                                        <span>
                                          {question.question} ({question.marks}{" "}
                                          marks)
                                        </span>
                                        {renderImages(
                                          question.question_images || undefined
                                        )}
                                        <span className="text-sm text-gray-500">
                                          Selected{" "}
                                          {question.selection_count || 0} times
                                        </span>
                                      </Label>
                                    </div>
                                  ))}
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
      </div>
    </div>
  );
}
