"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { ExamHistory } from "@/components/ExamHistory";

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
    <div className="bg-scroll bg-background">
      {/* Hero Section */}
      <section className="relative bg-blue-600 text-foreground py-20">
        <div
          className="absolute inset-0 opacity-10 bg-pattern"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Image
                src={siteConfig.mainLogo || "/placeholder.svg"}
                alt={siteConfig.name}
                width={80}
                height={80}
                className="bg-white p-2 rounded-full shadow-lg"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {siteConfig.name}
            </h1>
            <p className="text-xl font-light mb-6">{siteConfig.tagline}</p>
            <p className="text-xl mb-8">{siteConfig.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <Button asChild size="lg" variant="secondary">
                <Link href="/generate-exam" className="flex items-center">
                  {siteConfig.navLinks[2].icon ? <siteConfig.navLinks[2].icon className="mr-2 h-5 w-5" /> : null} Generate Exam
                </Link>
              </Button> */}
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-blue-700 text-white hover:bg-blue-800 border-white"
                >
                  <Link href="/sign-in" className="flex items-center">
                    Sign In <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-50 clip-path-wave"></div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Recent Exams Section */}
        <section className="mb-16">
          <ExamHistory />
        </section>

        {/* Preferences Section */}
        <section className="mb-16">
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-2xl font-semibold  flex items-center">
                {/* <siteConfig.navLinks[0].icon className="mr-2 h-6 w-6" /> Your Preferences */}
              </CardTitle>
              <CardDescription>
                Set your preferences to quickly find relevant content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
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
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 ">
            Available Content
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-700">Loading content...</p>
            </div>
          ) : filteredContents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContents.map((content) => (
                <Card
                  key={content.id}
                  className="hover:shadow-lg transition-shadow border-none shadow-md"
                >
                  <CardHeader className="bg-blue-50 pb-2">
                    <CardTitle className="flex items-center ">
                      {/* <siteConfig.navLinks[1].icon className="mr-2 h-6 w-6" /> {content.name} */}
                      {content.status !== false && (
                        <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Class {content.class} • {content.medium} • {content.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
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
                        {content.semester || "Not Found"}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 pt-2">
                    <Button
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Link href={`/generate-exam?contentId=${content.id}`}>
                        Generate Exam <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white p-6 text-center shadow-md">
              <p className="text-gray-600 mb-4">
                No content matches your preferences. Try adjusting your filters
                or browse all available content.
              </p>
              <Button
                onClick={() =>
                  setPreferences({ medium: "", standard: "", semester: "" })
                }
                variant="outline"
                className="border-blue-600  hover:bg-blue-50"
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </section>

        {/* Content Management Section (Admin Only) */}
        {isAdmin && (
          <section className="mb-8">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-2xl font-semibold ">
                  Content Management
                </CardTitle>
                <CardDescription>
                  Administrative tools for managing educational content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <p className="text-gray-600">
                  As an administrator, you have access to tools for managing
                  your educational content efficiently.
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

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 ">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {siteConfig.features.map((feature, index) => (
            <Card
              key={index}
              className="border-t-4 border-blue-400 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center ">
                  <feature.icon className="mr-2 h-6 w-6" /> {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Add a CSS class for the wave effect */}
      <style jsx global>{`
        .clip-path-wave {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          shape-outside: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,
1200,52.47V0Z' opacity='.25' class='shape-fill' fill='%23f9fafb'%3E%3C/path%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.5' class='shape-fill' fill='%23f9fafb'%3E%3C/path%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' class='shape-fill' fill='%23f9fafb'%3E%3C/path%3E%3C/svg%3E");
          background-size: cover;
          background-position: center;
        }

        .bg-pattern {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
