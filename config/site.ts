import { PlusCircle, BookOpen, FileText, Settings, Home } from "lucide-react";

export type SiteConfig = {
  name: string;
  description: string;
  adminEmail: string[];
  url: string;
  navLinks: {
    disabled: string;
    title: string;
    href: string;
    icon?: any;
    adminOnly?: boolean;
  }[];
  footerLinks: { title: string; href: string }[];
  metadata: { title: string; description: string; keywords: string[] };
  pwa: {
    name: string;
    shortName: string;
    description: string;
    backgroundColor: string;
    themeColor: string;
  };
  // theme: {
  //   background: string;
  //   primary: string;
  //   secondary: string;
  //   accent: string;
  //   text: string;
  // };
};

export const siteConfig: SiteConfig = {
  name: "Prayass Teaching Institute",
  description: "Generate and manage exam papers efficiently",
  adminEmail: ["akshaysuthar05@gmail.com", "sutharmaina62@gmail.com"],
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
      adminOnly: true,
      disabled: "",
    },
    {
      title: "Bilingual Questions",
      href: "/bilingual-questions",
      icon: Settings,
      adminOnly: true,
      disabled: "",
    },
  ],
  footerLinks: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Contact", href: "/contact" },
  ],
  metadata: {
    title: "Prayass Teaching Institute - Create Professional Exam Papers",
    description:
      "An efficient tool for teachers to generate and manage exam papers",
    keywords: [
      "exam generator",
      "question bank",
      "education",
      "teaching",
      "assessment",
      "exam papers",
    ],
  },
  pwa: {
    name: "Exam Paper Generator",
    shortName: "ExamGen",
    description: "Generate and manage exam papers",
    backgroundColor: "#f9f7ed",
    themeColor: "#f7ce5b",
  },
  // theme: {
  //   background: "#FFFFFF",
  //   secondary: "#2667FF", 
  //   primary: "#3B28CC",
  //   accent: "#87BFFF", 
  //   text: "#000000", 
  // },
};
