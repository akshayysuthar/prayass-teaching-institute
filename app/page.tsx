import { Suspense, use } from "react";

import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";

async function fetchDashboardData() {
  const [questionCount, subjectCount, contentCount] = await Promise.all([
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase.from("contents").select("*", { count: "exact", head: true }),
  ]);

  return {
    questionCount: questionCount.count ?? 0,
    subjectCount: subjectCount.count ?? 0,
    contentCount: contentCount.count ?? 0,
  };
}

function DashboardContent() {
  const data = use(fetchDashboardData());

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.questionCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.subjectCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.contentCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Exam Paper Generator Dashboard
      </h1>
      <Suspense fallback={<div>Loading dashboard data...</div>}>
        <DashboardContent />
      </Suspense>
      <div className="mt-8 space-y-4">
        <Link
          href="/add-question"
          className="block text-blue-600 hover:underline"
        >
          Add New Question
        </Link>
        <Link
          href="/generate-exam"
          className="block text-blue-600 hover:underline"
        >
          Generate Exam
        </Link>
        <Link
          href="/question-bank"
          className="block text-blue-600 hover:underline"
        >
          View Question Bank
        </Link>
      </div>
    </div>
  );
}
