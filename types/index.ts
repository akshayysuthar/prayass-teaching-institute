export interface Question {
  id: string;
  class: number;
  subject: string;
  board: string;
  Ch: string;
  name: string;
  type: string;
  question: string;
  questionImages?: string[];
  answer: string | string[] | Record<string, string | string[]>;
  answerImages?: string[];
  marks: number;
  isReviewed?: boolean;
  lastUpdated?: string;
  isHaveImg: string;
  chapterName: string;
  ReviewedBy?: string;
  chapterId: string;
  options?: Record<string, string>;
  selectionCount?: number;
  images: string;
  image: string;
}



export interface SubjectData {
  chapters: any;
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

export interface ExamMetadata {
  instituteName: string;
  standard: number | null;
  subject: string | null;
  chapters: string[];
  studentName: string;
  teacherName: string;
  totalMarks: number;
}
export interface GeneratedExamProps extends ExamMetadata {
  selectedQuestions: Question[];
}

export interface PdfDownloadProps extends ExamMetadata {
  selectedQuestions: Question[];
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
