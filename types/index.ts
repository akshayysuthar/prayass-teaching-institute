export interface Question {
  id: string;
  content_id: number;
  chapter_no: string;
  chapter_name: string;
  section_title: string | null;
  type: string | null;
  question: string;
  question_gu: string;
  question_images: string[] | null;
  question_images_gu: string[] | null;
  answer: string | object;
  answer_gu: string | object;
  answer_images: string[] | null;
  answer_images_gu: string[] | null;
  marks: number;
  selection_count: number;
  is_reviewed: boolean;
  reviewed_by: string | null;
  created_by: string;
  last_edited_by: string | null;
  last_updated: string;
  created_at: string;
  options?: { [key: string]: string };
  [key: string]: any; // Add this line
}

export interface Content {
  subject_name: any;
  subject: any;
  id: number;
  name: string;
  board: string;
  medium: string;
  code: string;
  class: number;
  created_at: string;
}

export interface SelectedChapter {
  [x: string]: any;
  id: string;
  name: string;
}

export interface ExamStructure {
  subject: any;
  totalMarks: number;
  sections: ExamSection[];
}

export interface ExamSection {
  name: string;
  questionType: string;
  totalMarks: number;
}

export interface PdfDownloadProps {
  selectedQuestions: Question[];
  examStructure: ExamStructure;
  instituteName: string;
  standard: string;
  studentName: string;
  subject: string;
  chapters: string;
  teacherName: string;
  isSectionWise: boolean;
  format: "exam" | "examWithAnswer" | "material" | null;
}

// export interface Question {
//   content_id: any;
//   chapter_name: string;
//   chapter_no: any;
//   id: string;
//   subject_id: number | string;
//   section_title: string | null;
//   type: string | null;
//   question: string;
//   question_images: string[] | null;
//   answer: string | object;
//   answer_images: string[] | null;
//   marks: number;
//   selection_count: number;
//   is_reviewed: boolean;
//   reviewed_by: string | null;
//   created_by: string;
//   last_edited_by: string | null;
//   last_updated: string;
//   created_at: string;
//   options?: { [key: string]: string };
// }

export interface Content {
  id: number;
  name: string;
  board: string;
  medium: string;
  code: string;
  class: number;
  created_at: string;
  locked?: string;
}

export interface Subject {
  id: number;
  subject_name: string;
  chapter_no: number;
  chapter_name: string;
  content_id: number;
  board_weightage: number;
  created_at: string;
  // type is not actually in the database, so we'll make it optional
  type?: string;
}

export interface SelectedChapter {
  id: string;
  name: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  adminOnly?: boolean;
  disabled?: boolean;
  external?: boolean;
}

export interface SubjectSelectorProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
  initialSubject?: string | null;
}

export interface PdfDownloadProps {
  selectedQuestions: Question[];
  instituteName: string;
  standard: string;
  studentName: string;
  subject: string;
  chapters: string;
  teacherName: string;
  examStructure: ExamStructure;
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
  initialSubject?: string | null;
}

export interface ChapterSelectorProps {
  questionBankData: Chapter[];
  onSelectQuestions: (questions: Question[]) => void;
  examStructure: ExamStructure;
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

// export interface Question {
//   // server side or metadata
//   id: string;
//   isReviewed: boolean;
//   reviewedBy: string; // by defeult it will system
//   last_updated: string;
//   selectionCount?: number; // by defeult it will 0
//   class: number; // The class/grade level of the question (e.g., 1 to 10).
//   subject: string; // The subject of the question (e.g., Math, Science).
//   bookName: string; // Name of the textbook associated with the question.
//   board: string; // Educational board (e.g., CBSE, GSEB).
//   chapterNo: string; // Chapter number.
//   chapterName: string; // Full name of the chapter.
//   section: string; // Section within the chapter (if applicable).
//   type: string; // Type of question (e.g., 'MCQ', 'Short Answer').

//   imageUploadPending: boolean;

//   // client side
//   question: string;
//   questionImages?: string[];
//   question_images: string[];
//   answer: string | string[] | Record<string, string | string[]>;
//   answerImages?: string[];
//   answer_images: string[];
//   options?: Record<string, string>;
//   marks: number;
// }

export interface ExamSection {
  name: string;
  questionType: string;
  marksPerQuestion: number;
  totalQuestions: number;
}

export interface ExamStructure {
  totalMarks: number;
  sections: ExamSection[];
}
