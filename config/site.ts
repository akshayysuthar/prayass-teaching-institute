import {
  PlusCircle,
  BookOpen,
  FileText,
  Settings,
  Home,
  Book,
  GraduationCap,
  School,
  Upload,
} from "lucide-react";

export type SiteConfig = {
  name: string;
  description: string;
  tagline: string;
  adminEmail: string[];
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  mainLogo: string;
  url: string;
  navLinks: {
    disabled: string;
    title: string;
    href: string;
    icon?: any;
    adminOnly?: boolean;
  }[];
  footerLinks: { title: string; href: string }[];
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    author: string;
    ogImage: string;
  };
  pwa: {
    name: string;
    shortName: string;
    description: string;
    backgroundColor: string;
    themeColor: string;
  };
  theme: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  features: {
    title: string;
    description: string;
    icon: any;
  }[];
  subjects: string[];
  standards: string[];
};

export const siteConfig: SiteConfig = {
  name: "Prayass Teaching Institute",
  tagline: "Excellence in Education",
  description:
    "Professional exam paper generation and management system for educators",
  adminEmail: ["akshaysuthar05@gmail.com", "sutharmaina62@gmail.com", "*"],
  contactInfo: {
    email: "info@prayassinstitute.com",
    phone: "+91 98765 43210",
    address: "123 Education Street, Surat, Gujarat, India",
  },
  mainLogo: "/file.png",
  url: "https://prayass-teaching-institute.vercel.app/",
  navLinks: [
    { title: "Home", href: "/", disabled: "", icon: Home },
    {
      title: "Add Question",
      href: "/add-questions",
      icon: PlusCircle,
      disabled: "",
    },
    {
      title: "CSV Upload",
      href: "/csv-upload",
      icon: Upload,
      disabled: "",
    },
    {
      title: "Generate Exam",
      href: "/generate-exam",
      icon: FileText,
      disabled: "",
    },
    {
      title: "Manage Content",
      href: "/manage-content",
      icon: Settings,
      disabled: "",
    },
    {
      title: "Error",
      href: "/error-dashboard",
      icon: Settings,
      // adminOnly: true,
      disabled: "",
    },
  ],
  footerLinks: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Contact", href: "/contact" },
    { title: "About Us", href: "/about" },
    { title: "FAQ", href: "/faq" },
  ],
  metadata: {
    title: "Prayass Teaching Institute - Professional Exam Paper Generator",
    description:
      "An advanced tool for educators to create, manage, and generate professional exam papers with ease",
    keywords: [
      "exam generator",
      "question bank",
      "education",
      "teaching",
      "assessment",
      "exam papers",
      "Prayass Teaching Institute",
      "Gujarat education",
      "bilingual exams",
    ],
    author: "Akshay Suthar",
    ogImage: "/og-image.jpg",
  },
  pwa: {
    name: "Prayass Exam Generator",
    shortName: "ExamGen",
    description: "Professional exam paper generation system",
    backgroundColor: "#ffffff",
    themeColor: "#3b82f6",
  },
  theme: {
    background: "#FFFFFF",
    secondary: "#3b82f6",
    primary: "#1d4ed8",
    accent: "#93c5fd",
    text: "#1e293b",
  },
  features: [
    {
      title: "Easy Exam Creation",
      description:
        "Create professional exam papers with just a few clicks. Select questions by subject, chapter, or difficulty level.",
      icon: FileText,
    },
    {
      title: "Organized Content",
      description:
        "Manage your educational content efficiently with our intuitive content management system.",
      icon: BookOpen,
    },
    {
      title: "Professional PDFs",
      description:
        "Generate beautifully formatted PDF exam papers with answer keys that you can download and print.",
      icon: School,
    },
    {
      title: "Bilingual Support",
      description:
        "Create exams in multiple languages including English and Gujarati with full Unicode support.",
      icon: GraduationCap,
    },
  ],
  subjects: [
    "Mathematics",
    "Science",
    "Social Studies",
    "English",
    "Gujarati",
    "Hindi",
    "Sanskrit",
    "Computer Science",
    "Physics",
    "Chemistry",
    "Biology",
  ],
  standards: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
};
