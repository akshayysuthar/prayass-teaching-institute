export interface Question {
  id: string;
  class: number;
  subject: string;
  bookName: string;
  board: string;
  Ch: string;
  chapterName: string;
  section: string;
  type: string;
  question: string;
  questionImages: string[];
  question_images?: string[];
  answer: string | string[] | Record<string, string | string[]>;
  answer_images?: string[];
  answerImages?: string[];
  options?: Record<string, string>;
  marks: number;
  isReviewed: string;
  reviewedBy: string;
  lastUpdated: string;
  selectionCount?: number;
}
export interface SubjectData {
  class: number;
  board: string;
  medium?: string;
  subject?: string;
  subjects?: Array<{
    name: string;
    mediums?: Array<{
      language: string;
    }>;
  }>;
}

export interface Section {
  type: string;
  questions: Question[];
}

export interface Chapter {
  id: string;
  name: string;
  Ch: string;
  class: number;
  board: string;
  subject: string;
  questions: Question[];
}

interface Subject {
  name: string;
  mediums?: { language: string }[];
}

export interface SubjectDataItem {
  medium?: string;
  class: number;
  board: string;
  subject?: string;
  subjects?: Subject[];
}

export interface SubjectSelectorProps {
  subjectData: SubjectDataItem[];
  classNumber: number;
  board: string;
  medium: string;
  onSelectSubject: (subject: string) => void;
  initialSubject: string | null;
}

export interface ChapterSelectorProps {
  questionBankData: Chapter[];
  onSelectQuestions: (questions: Question[]) => void;
}

export interface ExamMetadata {
  instituteName: string;
  standard: number | null;
  subject: string | null;
  chapters: string[];
  studentName?: string;
  teacherName: string;
  totalMarks: number;
}
export interface GeneratedExamProps extends ExamMetadata {
  selectedQuestions: Question[];
}

export interface PdfDownloadProps extends ExamMetadata {
  selectedQuestions: Question[];
  contentId?: string; // Add this if necessary
}

export interface SelectedChapter {
  id: string;
  name: string;
}

export interface ClassSelectorProps {
  subjectData: any[];
  onSelectClass: (classNumber: number) => void;
  onSelectBoard: (board: string) => void;
  onSelectMedium: (medium: string) => void;
  initialClass: number | null;
  initialBoard: string | null;
  initialMedium: string | null;
}


