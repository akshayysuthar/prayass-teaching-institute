export interface Question {
  // server side or metadata
  id: string;
  isReviewed: boolean;
  reviewedBy: string; // by defeult it will system
  lastUpdated: string;
  selectionCount?: number; // by defeult it will 0
  class: number; // The class/grade level of the question (e.g., 1 to 10).
  subject: string; // The subject of the question (e.g., Math, Science).
  bookName: string; // Name of the textbook associated with the question.
  board: string; // Educational board (e.g., CBSE, GSEB).
  Ch: string; // Chapter number.
  chapterName: string; // Full name of the chapter.
  section: string; // Section within the chapter (if applicable).
  type: string; // Type of question (e.g., 'MCQ', 'Short Answer').
  alert: string;

  // client side
  question: string;
  questionImages: string[];
  question_images?: string[];
  answer: string | string[] | Record<string, string | string[]>;
  answerImages?: string[];
  answer_images?: string[];
  options?: Record<string, string>;
  marks: number;
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
