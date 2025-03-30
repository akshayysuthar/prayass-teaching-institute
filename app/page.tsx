"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen, User } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Content = {
  id: number;
  name: string;
  class: number;
  medium: string;
  semester: string;
  created_at: string;
};

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
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

  // Content State
  const [contents, setContents] = useState<Content[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (isBrowser) {
      const savedPrefs = localStorage.getItem("examPreferences");
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    }
    fetchContents();
  }, [isBrowser]);

  // Fetch contents from database
  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contents.",
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contents based on preferences
  useEffect(() => {
    if (contents.length > 0) {
      let filtered = [...contents];

      if (preferences.medium) {
        filtered = filtered.filter(
          (content) =>
            content.medium.toLowerCase() === preferences.medium.toLowerCase()
        );
      }

      if (preferences.standard) {
        filtered = filtered.filter(
          (content) => content.class.toString() === preferences.standard
        );
      }

      if (preferences.semester) {
        filtered = filtered.filter(
          (content) =>
            content.semester.toLowerCase() ===
            preferences.semester.toLowerCase()
        );
      }

      setFilteredContents(filtered);
    }
  }, [contents, preferences]);

  // Save preferences to localStorage
  const savePreferences = () => {
    if (isBrowser) {
      localStorage.setItem("examPreferences", JSON.stringify(preferences));
      toast({
        title: "Success",
        description: "Preferences saved successfully!",
      });
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
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 bg-blue-600 text-white rounded-lg shadow-lg mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Welcome {user ? `${user.fullName}` : "Guest"} to {siteConfig.name}
          </h1>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Create, manage, and generate exam papers with ease.
          </p>
          <Button asChild variant="secondary" size="lg">
            <Link href="/generate-exam" className="flex items-center">
              <FileText className="mr-2 h-5 w-5" /> Generate Paper
            </Link>
          </Button>
        </section>

        {/* Preferences Section */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-blue-600 flex items-center">
                <User className="mr-2 h-6 w-6" /> Your Preferences
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Available Content Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            Available Content
          </h2>
          {isLoading ? (
            <div className="text-center py-8">Loading content...</div>
          ) : filteredContents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContents.map((content) => (
                <Card
                  key={content.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-600">
                      <BookOpen className="mr-2 h-6 w-6" /> {content.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Standard:</span>{" "}
                        {content.class}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Medium:</span>{" "}
                        {content.medium}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Semester:</span>{" "}
                        {content.semester}
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Link href={`/generate-exam?contentId=${content.id}`}>
                        Generate Exam
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white p-6 text-center">
              <p className="text-gray-600 mb-4">
                No content matches your preferences. Try adjusting your filters
                or browse all available content.
              </p>
              <Button
                onClick={() =>
                  setPreferences({ medium: "", standard: "", semester: "" })
                }
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </section>

        {/* Content Management Section (Admin Only) */}
        {isAdmin && (
          <section className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-blue-600">
                  Content Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600">
                  Manage your educational content efficiently.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href="/manage-content#content">Manage Content</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href="/manage-content#chapters">Manage Chapters</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
