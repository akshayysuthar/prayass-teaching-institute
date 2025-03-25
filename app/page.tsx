"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  PlusCircle,
  Settings,
  BookOpen,
  User,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const { user } = useUser();
  const isAdmin =
    user &&
    siteConfig.adminEmail.includes(
      user.primaryEmailAddress?.emailAddress || ""
    );
  const isBrowser = typeof window !== "undefined";

  // Preferences State
  const [preferences, setPreferences] = useState({
    medium: "",
    standard: "",
    semester: "",
  });

  // Recent History State (mock data for now)
  const [recentHistory] = useState([
    { id: 1, title: "Math Exam - Std 10", date: "2025-03-20" },
    { id: 2, title: "Science Exam - Std 9", date: "2025-03-18" },
  ]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (isBrowser) {
      const savedPrefs = localStorage.getItem("examPreferences");
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    }
  }, [isBrowser]);

  // Save preferences to localStorage
  const savePreferences = () => {
    if (isBrowser) {
      localStorage.setItem("examPreferences", JSON.stringify(preferences));
      alert("Preferences saved!");
    }
  };

  const handlePreferenceChange = (
    field: keyof typeof preferences,
    value: string
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center py-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
          <h1 className="text-5xl font-extrabold mb-4">
            Welcome {user ? `${user.fullName}` : "Guest"} to {siteConfig.name}
          </h1>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            {siteConfig.description} Create, manage, and generate exam papers
            with ease.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild variant="secondary" size="lg">
              <Link href="/generate-exam" className="flex items-center">
                <FileText className="mr-2 h-5 w-5" /> Generate Paper
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/add-questions" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Question
              </Link>
            </Button>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-12">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-600">
                  <FileText className="mr-2 h-6 w-6" /> Generate Exam Paper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Create custom exam papers quickly and efficiently.
                </p>
                <Button asChild variant="link" className="p-0">
                  <Link href="/generate-exam">
                    Start Now <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-600">
                  <PlusCircle className="mr-2 h-6 w-6" /> Add Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Contribute to the question bank with new content.
                </p>
                <Button asChild variant="link" className="p-0">
                  <Link href="/add-questions">
                    Add Now <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-600">
                  <BookOpen className="mr-2 h-6 w-6" /> Exam Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Explore manual or auto-generation options.
                </p>
                <Button asChild variant="link" className="p-0">
                  <Link href="/generate-exam?auto=true">
                    Generate <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center">
                <User className="mr-2 h-6 w-6 text-indigo-600" /> Your
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="medium" className="text-gray-700">
                    Medium
                  </Label>
                  <Input
                    id="medium"
                    value={preferences.medium}
                    onChange={(e) =>
                      handlePreferenceChange("medium", e.target.value)
                    }
                    placeholder="e.g., English, Gujarati"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="standard" className="text-gray-700">
                    Standard
                  </Label>
                  <Input
                    id="standard"
                    value={preferences.standard}
                    onChange={(e) =>
                      handlePreferenceChange("standard", e.target.value)
                    }
                    placeholder="e.g., 9, 10"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="semester" className="text-gray-700">
                    Semester
                  </Label>
                  <Input
                    id="semester"
                    value={preferences.semester}
                    onChange={(e) =>
                      handlePreferenceChange("semester", e.target.value)
                    }
                    placeholder="e.g., 1, 2"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={savePreferences}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Exam Paper Generator Section */}
        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center">
                <FileText className="mr-2 h-6 w-6 text-indigo-600" /> Exam Paper
                Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Link href="/generate-exam">Manually Generate</Link>
                </Button>
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Link href="/generate-exam?auto=true">Auto Generate</Link>
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Recent History
                </h3>
                {recentHistory.length > 0 ? (
                  <ul className="space-y-2">
                    {recentHistory.map((item) => (
                      <li key={item.id} className="text-sm text-gray-600">
                        {item.title} - {item.date}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No recent exams generated.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Content Management Section (Admin Only) */}
        {isAdmin && (
          <section className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center">
                  <Settings className="mr-2 h-6 w-6 text-indigo-600" /> Content
                  Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600">
                  Manage your educational content efficiently.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    asChild
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Link href="/manage-content#content">Manage Content</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Link href="/manage-content#chapters">Manage Chapters</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Link href="/manage-content#questions">
                      Manage Questions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
