"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ClassSelector } from "@/components/ClassSelector";
import { SubjectSelector } from "@/components/SubjectSelector";
import { ChapterSelector } from "@/components/ChapterSelector";
import { PdfDownload } from "@/components/PdfDownload";
import { DemoLogin } from "@/components/DemoLogin";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Question, SelectedChapter, SubjectData } from "@/types";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ExamPaperGenerator() {
  const [user, setUser] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [totalMarks, setTotalMarks] = useState(80);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatedExam, setGeneratedExam] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [userPaperCount, setUserPaperCount] = useState(0);
  const { toast } = useToast();

  // Fetch Subject Data on Mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase.from("subjects").select("*");
        if (error) throw error;
        setSubjectData(data || []);
      } catch (error) {
        console.error("Error fetching subject data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch Questions When Subject is Selected
  const fetchQuestions = useCallback(async () => {
    if (!selectedClass || !selectedBoard || !selectedSubject) return;

    setIsQuestionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*, selectionCount")
        .eq("class", selectedClass)
        .eq("board", selectedBoard)
        .eq("subject", selectedSubject);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsQuestionsLoading(false);
      // console.log(questions);
    }
  }, [selectedClass, selectedBoard, selectedSubject]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Load initial localStorage state
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
    const savedClass = localStorage.getItem("selectedClass");
    if (savedClass) setSelectedClass(parseInt(savedClass));
    const savedBoard = localStorage.getItem("selectedBoard");
    if (savedBoard) setSelectedBoard(savedBoard);
    const savedMedium = localStorage.getItem("selectedMedium");
    if (savedMedium) setSelectedMedium(savedMedium);
    const savedTotalMarks = localStorage.getItem("totalMarks");
    if (savedTotalMarks) setTotalMarks(parseInt(savedTotalMarks));
    const savedGenerationType = localStorage.getItem("generationType");
    if (savedGenerationType) setGenerationType(savedGenerationType);
    const savedUserPaperCount = localStorage.getItem("userPaperCount");
    if (savedUserPaperCount) setUserPaperCount(parseInt(savedUserPaperCount));
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("user", user || "");
    localStorage.setItem("selectedClass", selectedClass?.toString() || "");
    localStorage.setItem("selectedBoard", selectedBoard || "");
    localStorage.setItem("selectedMedium", selectedMedium || "");
    localStorage.setItem("selectedSubject", selectedSubject || "");
    localStorage.setItem("totalMarks", totalMarks.toString());
    localStorage.setItem("generationType", generationType || "");
    localStorage.setItem("userPaperCount", userPaperCount.toString());
  }, [
    user,
    selectedClass,
    selectedBoard,
    selectedMedium,
    selectedSubject,
    totalMarks,
    generationType,
    userPaperCount,
  ]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(
      (item) =>
        item.class === selectedClass &&
        item.board === selectedBoard &&
        item.subject === selectedSubject
    );
  }, [questions, selectedClass, selectedBoard, selectedSubject]);

  const handleLogin = useCallback((username: string) => {
    setUser(username);
    console.log(`User logged in: ${username}`);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    console.log("User logged out");
  }, []);

  const handleTotalMarksChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTotalMarks = parseInt(e.target.value) || 0;
      console.log(`Total marks changed to: ${newTotalMarks}`);
      setTotalMarks(newTotalMarks);
    },
    []
  );

  const handleGenerate = useCallback(() => {
    console.log("Generating exam paper");
    setGeneratedExam(true);
    setUserPaperCount((prevCount) => prevCount + 1);
  }, []);

  const handleGenerationTypeChange = useCallback((type: string) => {
    console.log(`Generation type changed to: ${type}`);
    setGenerationType(type);

    if (type === "auto") {
      toast({
        title: "Not Supported For now ",
        description:
          "The auto function is not working for now. Please try again after some time.",
        variant: "destructive",
      });
      handleGenerationTypeChange("manual");
    } 
  }, []);

  const handleQuestionSelection = useCallback(
    (selectedQuestions: Question[]) => {
      setSelectedQuestions(selectedQuestions);
      // Update selected chapters
      const uniqueChapters = Array.from(
        new Set(selectedQuestions.map((q) => q.Ch))
      ).map((ch) => ({ id: ch, name: ch }));
      setSelectedChapters(uniqueChapters);
    },
    []
  );

  const handleChapterSelection = useCallback((chapters: SelectedChapter[]) => {
    setSelectedChapters(chapters);
    // console.log("Selected chapters:", chapters);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Exam Paper Generator
        </h1>
        <DemoLogin onLogin={handleLogin} />
      </div>
    );
  }

  console.log(selectedQuestions);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Exam Paper Generator</h1>
        <div className="flex items-center space-x-4">
          <Link href="/add-questions" className="text-blue-600 hover:underline">
            Add Question
          </Link>
          <span>Welcome, {user}!</span>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <div className="flex items-center justify-center mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${
            generationType === "manual"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => handleGenerationTypeChange("manual")}
        >
          Manual Generate
        </button>
        <button
          className={`px-4 py-2 rounded ${
            generationType === "auto" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => handleGenerationTypeChange("auto")}
        >
          Auto Generate
        </button>
      </div>
      <div className="space-y-4 grid grid-cols-1 justify-center gap-4 p-3">
        <ClassSelector
          subjectData={subjectData}
          onSelectClass={setSelectedClass}
          onSelectBoard={setSelectedBoard}
          onSelectMedium={setSelectedMedium}
          initialClass={selectedClass}
          initialBoard={selectedBoard}
          initialMedium={selectedMedium}
        />
        {selectedClass && selectedBoard && selectedMedium && (
          <SubjectSelector
            subjectData={subjectData}
            classNumber={selectedClass}
            board={selectedBoard}
            medium={selectedMedium}
            onSelectSubject={setSelectedSubject}
            initialSubject={selectedSubject}
          />
        )}
        <div>
          <Label htmlFor="totalMarks">Total Marks</Label>
          <Input
            id="totalMarks"
            type="number"
            value={totalMarks}
            onChange={handleTotalMarksChange}
            className="w-24"
          />
        </div>
        {isQuestionsLoading ? (
          <Loading />
        ) : (
          selectedSubject && (
            <ChapterSelector
              questions={filteredQuestions}
              onSelectQuestions={handleQuestionSelection}
              onSelectChapters={handleChapterSelection}
            />
          )
        )}

        <Button
          onClick={handleGenerate}
          disabled={selectedQuestions.length === 0}
        >
          Generate Exam Paper
        </Button>
      </div>

      {generatedExam && (
        <div className="mt-8">
          {/* <div id="examPaperContent">
            <GeneratedExam
              selectedQuestions={selectedQuestions}
              instituteName="ABC School"
              standard={selectedClass}
              subject={selectedSubject}
              chapters={selectedChapters.map((ch) => ch.name)}
              studentName={user}
              teacherName="Mr. Smith"
              totalMarks={totalMarks}
            />
          </div> */}
          <div className="mt-4 flex justify-center space-x-4">
            <PdfDownload
              selectedQuestions={selectedQuestions}
              instituteName="ABC School"
              standard={selectedClass}
              subject={selectedSubject}
              chapters={selectedChapters.map((ch) => ch.name)}
              studentName={user}
              teacherName="Mr. Smith"
              totalMarks={totalMarks}
            />
          </div>
        </div>
      )}
      <div className="mt-4 text-center">
        <p>
          Total papers generated by {user}: {userPaperCount}
        </p>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Created by Your Name</p>
        <p>App Version: 1.0.0-dev</p>
      </footer>
    </div>
  );
}
