import { useState, useEffect } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface QuestionSelectorProps {
  classNumber: number
  board: string
  medium: string
  subject: string
  chapters: number[]
  onSelectQuestions: (questions: string[]) => void
  totalMarks: number
  remainingMarks: number
  setRemainingMarks: (marks: number) => void
}

interface Question {
  id: number
  question: string
  answer: string | object
  chapterId: number
  sectionType: string
  marks: number
}

export function QuestionSelector({
  classNumber,
  board,
  medium,
  subject,
  chapters,
  onSelectQuestions,
  totalMarks,
  remainingMarks,
  setRemainingMarks,
}: QuestionSelectorProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

  useEffect(() => {
    // In a real application, you would fetch this data from an API
    const mockData = [
      {
        class: 10,
        board: "GSEB",
        subject: "Science",
        chapters: [
          {
            id: 1,
            name: "Chemical Reactions and Equations",
            sections: [
              {
                type: "InText Questions",
                questions: [
                  {
                    id: 1,
                    question: "Why should a magnesium ribbon be cleaned before burning in air?",
                    answer: "A magnesium ribbon should be cleaned before burning in air because magnesium reacts with oxygen slowly to form magnesium oxide, which prevents the burning of magnesium. The layer of magnesium oxide should be removed by sandpaper."
                  },
                  {
                    id: 2,
                    question: "Write the balanced equation for the following chemical reactions.\n(i) Hydrogen + Chlorine → Hydrogen chloride\n(ii) Barium chloride + Aluminium sulphate → Barium sulphate + Aluminium chloride.",
                    answer: {
                      i: "H2 + Cl2 → 2HCl",
                      ii: "3BaCl2 + Al2(SO4)3 → 3BaSO4 + 2AlCl3"
                    }
                  }
                ]
              },
              {
                type: "Textbook Questions",
                questions: [
                  {
                    id: 1,
                    question: "Which of the following statements about the reaction below are incorrect?\n2PbO(s) + C(s) → 2Pb(s) + CO2(g)\n(a) Lead is getting reduced.\n(b) Carbon dioxide is getting oxidised.\n(c) Carbon is getting oxidised.\n(d) Lead oxide is getting reduced.\n(i) (a) and (b)\n(ii) (a) and (c)\n(iii) (a), (b) and (c)\n(iv) all",
                    answer: "(i) (a) and (b)"
                  },
                  {
                    id: 2,
                    question: "Fe2O3 + 2Al → Al2O3 + 2Fe\nThe above reaction is an example of\n(a) combination reaction.\n(b) double displacement reaction.\n(c) decomposition reaction.\n(d) displacement reaction.",
                    answer: "(d) displacement reaction"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        class: 10,
        board: "GSEB",
        subject: "Social Science",
        chapters: [
          {
            id: 1,
            name: "Heritage of India",
            sections: [
              {
                type: "Detailed Questions",
                questions: [
                  {
                    id: 1,
                    question: "Give detail of the Aryan and Dravidian Culture.",
                    answer: {
                      Dravidians: [
                        "They originally belonged to India and were descendants of the Stone Age civilization.",
                        "Created the Mohenjodaro culture and had their own language and culture.",
                        "Introduced the worship of nature, animals, and deities, influencing the concept of Parvati and Shiva as mother and father.",
                        "Developed traditions like using 'dhup', 'deep', and 'aarti' in worship.",
                        "They excelled in crafts and arts like weaving, spinning, and boat-making.",
                        "After Aryan dominance, many Dravidians migrated to South India, contributing to languages like Tamil, Telugu, Kannada, and Malayalam."
                      ],
                      Aryans: [
                        "Nordic-Aryans created the Aryan civilization and were nature lovers who worshipped natural elements.",
                        "Inhabited the Aryavarta region, also known as 'Sapta Sindhu', extending to Mithila in the east and Vindhyachal in the south.",
                        "Contributed to practices like performing yagyas, reciting Vedas, and composing hymns.",
                        "Spread across Bharatbhumi, Bharatkhand, and Bharat Varsha, named after the Arya Bharat or Bharat tribe."
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    const subjectData = mockData.find(
      item => item.class === classNumber && item.board === board && item.subject === subject
    );

    if (subjectData) {
      const selectedChapters = subjectData.chapters.filter(chapter => chapters.includes(chapter.id));
      const allQuestions = selectedChapters.flatMap(chapter =>
        chapter.sections.flatMap(section =>
          section.questions.map(q => ({ ...q, chapterId: chapter.id, sectionType: section.type }))
        )
      );
      // Add marks to each question (for this example, we'll use random marks between 2 and 10)
      const questionsWithMarks = allQuestions.map(q => ({
        ...q,
        marks: Math.floor(Math.random() * 9) + 2 // Random marks between 2 and 10
      }));
      setQuestions(questionsWithMarks);
    } else {
      setQuestions([]);
    }
  }, [classNumber, board, medium, subject, chapters]);

  const handleQuestionChange = (questionId: string, marks: number) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) {
        setRemainingMarks(remainingMarks + marks)
        return prev.filter((id) => id !== questionId)
      } else {
        if (remainingMarks - marks < 0) {
          alert("You don't have enough remaining marks to add this question.")
          return prev
        }
        setRemainingMarks(remainingMarks - marks)
        return [...prev, questionId]
      }
    })
  }

  useEffect(() => {
    onSelectQuestions(selectedQuestions)
  }, [selectedQuestions, onSelectQuestions])

  return (
    <div className="mb-4">
      <h3 className="font-bold mb-2">Select Questions (Remaining Marks: {remainingMarks})</h3>
      {questions.map((question) => (
        <div key={`${question.chapterId}-${question.sectionType}-${question.id}`} className="mb-2">
          <Label className="flex items-center">
            <Checkbox
              checked={selectedQuestions.includes(`${question.chapterId}-${question.sectionType}-${question.id}`)}
              onCheckedChange={() => handleQuestionChange(`${question.chapterId}-${question.sectionType}-${question.id}`, question.marks)}
              className="mr-2"
            />
            <span>{question.question} ({question.marks} marks)</span>
          </Label>
        </div>
      ))}
    </div>
  )
}

