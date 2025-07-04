"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Content = {
  id: number;
  name: string;
  class: number;
  medium: string;
  semester: string;
  created_at: string;
  status?: boolean;
};

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  // const isAdmin =
  //   user &&
  //   siteConfig.adminEmail.includes(
  //     user.primaryEmailAddress?.emailAddress || ""
  //   );
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
  const [availableFilters, setAvailableFilters] = useState({
    mediums: [] as string[],
    standards: [] as string[],
    semesters: [] as string[],
  });

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

      const allContents = data || [];

      // Extract unique values
      const mediums = Array.from(
        new Set(allContents.map((c) => c.medium.trim()))
      );
      const standards = Array.from(
        new Set(allContents.map((c) => c.class.toString()))
      );
      const semesters = Array.from(
        new Set(
          allContents.flatMap((c) =>
            c.semester.split(",").map((s: string) => s.trim())
          )
        )
      );

      setAvailableFilters({ mediums, standards, semesters });
      setContents(allContents);
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
  // const savePreferences = () => {
  //   if (isBrowser) {
  //     localStorage.setItem("examPreferences", JSON.stringify(preferences));
  //     toast({
  //       title: "Success",
  //       description: "Preferences saved successfully!",
  //     });
  //   }
  // };
  const groupedByStandardAndMedium = filteredContents.reduce((acc, item) => {
    const key = `Class: ${item.class} • [ ${item.medium.trim()} Medium ]`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, Content[]>);

  const handlePreferenceChange = (
    field: keyof typeof preferences,
    value: string
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* Hero Section */}
      <section className="py-10 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-2 sm:px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{siteConfig.name}</h1>
          <p className="text-base sm:text-lg">{siteConfig.tagline}</p>

          {user ? (
            <p className="mt-2 text-white">
              Welcome, {user.fullName || "User"}!
            </p>
          ) : (
            <Button
              asChild
              className="mt-4 bg-white text-blue-600 hover:bg-blue-100 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-gray-800"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Sticky Filter Bar with Buttons */}
      <div className="sticky top-16 z-20 bg-background shadow-sm border-b border-border py-3">
        <div className="container mx-auto px-2 sm:px-4 space-y-2">
          {/* Medium Filter */}
          {/* <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold mr-2">Medium:</span>
            {availableFilters.mediums.map((m) => (
              <button
                key={m}
                onClick={() => handlePreferenceChange("medium", m)}
                className={`px-3 py-1 rounded border text-sm ${
                  preferences.medium === m
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
            <button
              onClick={() => handlePreferenceChange("medium", "")}
              className={`px-3 py-1 rounded border text-sm ${
                preferences.medium === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              All
            </button>
          </div> */}

          {/* Standard Filter */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 w-full">
            <span className="text-sm font-semibold mr-2">Standard:</span>
            <div className="flex flex-wrap gap-2 w-full">
              {availableFilters.standards.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePreferenceChange("standard", s)}
                  className={`px-3 py-1 rounded border text-sm transition-colors w-16 sm:w-auto
                    ${preferences.standard === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border-border"}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Semester Filter */}
          <div className="hidden">
            {/* <span className="text-sm font-semibold mr-2">Semester:</span>
            {availableFilters.semesters.map((s) => (
              <button
                key={s}
                onClick={() => handlePreferenceChange("semester", s)}
                className={`px-3 py-1 rounded border text-sm ${
                  preferences.semester === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))} */}
            {/* <button
              onClick={() => handlePreferenceChange("semester", "")}
              className={`px-3 py-1 rounded border text-sm ${
                preferences.semester === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              All
            </button> */}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-2 sm:px-4 py-6">
        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-300">Loading content...</p>
        ) : Object.keys(groupedByStandardAndMedium).length > 0 ? (
          Object.entries(groupedByStandardAndMedium).map(
            ([groupKey, items]) => (
              <div key={groupKey} className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground">{groupKey}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map((content) => (
                    <div
                      key={content.id}
                      className="border rounded shadow-sm p-3 sm:p-4 bg-background dark:bg-gray-900"
                    >
                      <p className="font-semibold text-base sm:text-lg mb-1 text-foreground">
                        {content.name}
                      </p>
                      <Button
                        asChild
                        className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        <Link href={`/generate-exam?contentId=${content.id}`}>
                          Generate Exam
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-300">No content found.</p>
        )}
      </div>
    </div>
  );
}
