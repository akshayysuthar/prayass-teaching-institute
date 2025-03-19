"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Question, ExamStructure } from "@/types"
import { ChapterSelector } from "./ChapterSelector"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QuestionTypeSelectorProps {
  questions: Question[]
  onSelectQuestions: (questions: Question[]) => void
  onSelectChapters: (chapters: any[]) => void
  examStructure: ExamStructure
  onExamStructureChange: (newStructure: ExamStructure) => void
  isSectionWise: boolean
  totalPaperMarks?: number
}

export function QuestionTypeSelector({
  questions,
  onSelectQuestions,
  onSelectChapters,
  examStructure,
  onExamStructureChange,
  isSectionWise,
  totalPaperMarks = 100,
}: QuestionTypeSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string>("all")
  const [questionsByType, setQuestionsByType] = useState<Record<string, Question[]>>({})
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])
  const [remainingMarks, setRemainingMarks] = useState<number>(totalPaperMarks)

  // Group questions by type
  useEffect(() => {
    // Group questions by their type
    const grouped: Record<string, Question[]> = { all: [...questions] }

    questions.forEach((question) => {
      const type = question.type || "Other"
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(question)
    })

    setQuestionsByType(grouped)

    // Set the default tab to "all" or the first available type
    if (Object.keys(grouped).length > 0 && !grouped[selectedTab]) {
      setSelectedTab("all")
    }
  }, [questions, selectedTab])

  // Calculate remaining marks
  useEffect(() => {
    const usedMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0)
    setRemainingMarks(totalPaperMarks - usedMarks)
  }, [selectedQuestions, totalPaperMarks])

  // Handle question selection
  const handleQuestionSelect = (questions: Question[]) => {
    setSelectedQuestions(questions)
    onSelectQuestions(questions)
  }

  // Get section name for a question type
  const getSectionName = (questionType: string) => {
    if (!isSectionWise) return ""

    const section = examStructure.sections.find((s) => s.questionType === questionType)
    return section ? section.name : ""
  }

  // Calculate stats for each question type
  const typeStats = useMemo(() => {
    const stats: Record<string, { count: number; selected: number; marks: number }> = {}

    Object.keys(questionsByType).forEach((type) => {
      if (type === "all") return

      const questionsOfType = questionsByType[type] || []
      const selectedOfType = selectedQuestions.filter((q) => q.type === type)

      stats[type] = {
        count: questionsOfType.length,
        selected: selectedOfType.length,
        marks: selectedOfType.reduce((sum, q) => sum + q.marks, 0),
      }
    })

    return stats
  }, [questionsByType, selectedQuestions])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Questions</h3>
        <Badge variant="outline" className="text-lg">
          Remaining Marks: {remainingMarks}
        </Badge>
      </div>

      {/* Question type stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {Object.entries(typeStats).map(([type, stats]) => (
          <Card key={type}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">
                  {type} {isSectionWise && <span className="text-gray-500">(Section {getSectionName(type)})</span>}
                </h4>
                <Badge variant="secondary">
                  {stats.selected}/{stats.count}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">Selected Marks: {stats.marks}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All Questions</TabsTrigger>
          {Object.keys(questionsByType)
            .filter((type) => type !== "all")
            .map((type) => (
              <TabsTrigger key={type} value={type}>
                {type} ({questionsByType[type]?.length || 0})
              </TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="all">
          <ChapterSelector
            questions={questionsByType.all || []}
            onSelectQuestions={handleQuestionSelect}
            onSelectChapters={onSelectChapters}
            examStructure={examStructure}
            onExamStructureChange={onExamStructureChange}
            isSectionWise={isSectionWise}
            totalMarks={totalPaperMarks}
            remainingMarks={remainingMarks}
          />
        </TabsContent>

        {Object.keys(questionsByType)
          .filter((type) => type !== "all")
          .map((type) => (
            <TabsContent key={type} value={type}>
              <ChapterSelector
                questions={questionsByType[type] || []}
                onSelectQuestions={handleQuestionSelect}
                onSelectChapters={onSelectChapters}
                examStructure={examStructure}
                onExamStructureChange={onExamStructureChange}
                isSectionWise={isSectionWise}
                totalMarks={totalPaperMarks}
                remainingMarks={remainingMarks}
              />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  )
}

