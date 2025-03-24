"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user } = useUser();
  const isAdmin =
    user &&
    siteConfig.adminEmail.includes(
      user.primaryEmailAddress?.emailAddress || ""
    );

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
    const savedPrefs = localStorage.getItem("examPreferences");
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
  }, []);

  // Save preferences to localStorage
  const savePreferences = () => {
    localStorage.setItem("examPreferences", JSON.stringify(preferences));
    alert("Preferences saved!");
  };

  const handlePreferenceChange = (
    field: keyof typeof preferences,
    value: string
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: siteConfig.theme.background }}
    >
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: siteConfig.theme.primary }}
          >
            Welcome to {siteConfig.name}
          </h1>
          <p className="text-lg" style={{ color: siteConfig.theme.text }}>
            {siteConfig.description}
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-12">
          {/* Preferences Section */}
          <section>
            <Card style={{ backgroundColor: siteConfig.theme.background }}>
              <CardHeader>
                <CardTitle style={{ color: siteConfig.theme.primary }}>
                  Set Your Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="medium"
                      style={{ color: siteConfig.theme.text }}
                    >
                      Medium
                    </Label>
                    <Input
                      id="medium"
                      value={preferences.medium}
                      onChange={(e) =>
                        handlePreferenceChange("medium", e.target.value)
                      }
                      placeholder="e.g., English, Gujarati"
                      style={{
                        borderColor: siteConfig.theme.accent,
                        color: siteConfig.theme.text,
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="standard"
                      style={{ color: siteConfig.theme.text }}
                    >
                      Standard
                    </Label>
                    <Input
                      id="standard"
                      value={preferences.standard}
                      onChange={(e) =>
                        handlePreferenceChange("standard", e.target.value)
                      }
                      placeholder="e.g., 9, 10"
                      style={{
                        borderColor: siteConfig.theme.accent,
                        color: siteConfig.theme.text,
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="semester"
                      style={{ color: siteConfig.theme.text }}
                    >
                      Semester
                    </Label>
                    <Input
                      id="semester"
                      value={preferences.semester}
                      onChange={(e) =>
                        handlePreferenceChange("semester", e.target.value)
                      }
                      placeholder="e.g., 1, 2"
                      style={{
                        borderColor: siteConfig.theme.accent,
                        color: siteConfig.theme.text,
                      }}
                    />
                  </div>
                </div>
                <Button
                  onClick={savePreferences}
                  style={{
                    backgroundColor: siteConfig.theme.primary,
                    color: siteConfig.theme.text,
                  }}
                  className="mt-4 hover:bg-opacity-90"
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Exam Paper Generator Section */}
          <section>
            <Card style={{ backgroundColor: siteConfig.theme.background }}>
              <CardHeader>
                <CardTitle style={{ color: siteConfig.theme.primary }}>
                  Exam Paper Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    asChild
                    style={{
                      backgroundColor: siteConfig.theme.secondary,
                      color: siteConfig.theme.text,
                    }}
                    className="hover:bg-opacity-90"
                  >
                    <Link href="/generate-exam">Manually Generate</Link>
                  </Button>
                  <Button
                    asChild
                    style={{
                      backgroundColor: siteConfig.theme.secondary,
                      color: siteConfig.theme.text,
                    }}
                    className="hover:bg-opacity-90"
                  >
                    <Link href="/generate-exam?auto=true">Auto Generate</Link>
                  </Button>
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: siteConfig.theme.primary }}
                  >
                    Recent History
                  </h3>
                  {recentHistory.length > 0 ? (
                    <ul className="space-y-2">
                      {recentHistory.map((item) => (
                        <li
                          key={item.id}
                          className="text-sm"
                          style={{ color: siteConfig.theme.text }}
                        >
                          {item.title} - {item.date}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: siteConfig.theme.text }}>
                      No recent exams generated.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Content Management Section (Admin Only) */}
          {isAdmin && (
            <section>
              <Card style={{ backgroundColor: siteConfig.theme.background }}>
                <CardHeader>
                  <CardTitle style={{ color: siteConfig.theme.primary }}>
                    Content Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p style={{ color: siteConfig.theme.text }}>
                    Manage your educational content efficiently.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      asChild
                      style={{
                        backgroundColor: siteConfig.theme.primary,
                        color: siteConfig.theme.text,
                      }}
                      className="hover:bg-opacity-90"
                    >
                      <Link href="/manage-content#content">Manage Content</Link>
                    </Button>
                    <Button
                      asChild
                      style={{
                        backgroundColor: siteConfig.theme.primary,
                        color: siteConfig.theme.text,
                      }}
                      className="hover:bg-opacity-90"
                    >
                      <Link href="/manage-content#chapters">
                        Manage Chapters
                      </Link>
                    </Button>
                    <Button
                      asChild
                      style={{
                        backgroundColor: siteConfig.theme.primary,
                        color: siteConfig.theme.text,
                      }}
                      className="hover:bg-opacity-90"
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
        </main>
      </div>
    </div>
  );
}
