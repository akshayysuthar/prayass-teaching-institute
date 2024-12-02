export interface Question {
  id: string;
  type: string;
  question: string;
  answer: string | string[] | Record<string, string | string[]>;
  options?: Record<string, string>;
  marks: number;
  image?: string;
  isReviewed?: boolean;
  lastUpdated?: string;
  isHaveImg: string;
  img?: string;
  ReviewedBy?: string;
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
  sections: Section[];
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

export interface SubjectSelectorProps {
  subjectData: any[];
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

export interface GeneratedExamProps {
  selectedQuestions: Question[];
  instituteName: string;
  standard: number | null;
  subject: string | null;
  chapters: string[];
  studentName: string;
  teacherName: string;
  totalMarks: number;
}

export interface PdfDownloadProps {
  selectedQuestions: Question[];
  instituteName: string;
  standard: number | null;
  subject: string | null;
  chapters: string[];
  studentName: string;
  teacherName: string;
  totalMarks: number;
}
