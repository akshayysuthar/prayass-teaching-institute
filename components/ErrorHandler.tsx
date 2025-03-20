"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";

// Updated ErrorData interface with a summary field
interface ErrorData {
  summary: string; // Concise version of the error message
  message: string;
  stack?: string;
  timestamp: number;
  details?: string;
}

// Function to truncate long messages into a summary
const MAX_SUMMARY_LENGTH = 100; // Maximum length for the summary
const truncateMessage = (message: string): string => {
  if (message.length > MAX_SUMMARY_LENGTH) {
    return message.substring(0, MAX_SUMMARY_LENGTH) + "...";
  }
  return message;
};

export function ErrorHandler() {
  const { toast } = useToast();
  const [error, setError] = useState<ErrorData | null>(null);

  // Save error to the database, including the summary
  const saveError = useCallback(
    async (errorData: ErrorData) => {
      try {
        const errorDetails = JSON.stringify(errorData, null, 2);
        await supabase.from("errors").insert([
          {
            summary: errorData.summary, // Save the summary
            message: errorData.message,
            stack: errorData.stack,
            timestamp: new Date(errorData.timestamp).toISOString(),
            status: "Active",
            details: errorDetails,
          },
        ]);

        toast({
          title: "Error saved",
          description: "The error has been saved to the database.",
        });
      } catch (err) {
        console.error("Failed to save error:", err);
        toast({
          title: "Failed to save error",
          description:
            "An error occurred while saving the error to the database.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Display the summary in the toast instead of the full message
  useEffect(() => {
    if (error) {
      toast({
        title: "An error occurred",
        description: (
          <div>
            <p>{error.summary}</p> {/* Show summary instead of full message */}
            <Button onClick={() => saveError(error)}>Save Error</Button>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [error, toast, saveError]);

  // Capture errors and generate a summary
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(" ");
      const summary = truncateMessage(errorMessage); // Generate summary
      setError({
        summary, // Add summary to error data
        message: errorMessage,
        stack: new Error().stack,
        timestamp: Date.now(),
        details: JSON.stringify(args, null, 2),
      });
      originalConsoleError.apply(console, args);
    };

    window.addEventListener("error", (event) => {
      const summary = truncateMessage(event.message); // Generate summary
      setError({
        summary, // Add summary to error data
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        details: JSON.stringify(event.error, null, 2),
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const message = event.reason.message || "Unhandled Promise Rejection";
      const summary = truncateMessage(message); // Generate summary
      setError({
        summary, // Add summary to error data
        message,
        stack: event.reason.stack,
        timestamp: Date.now(),
        details: JSON.stringify(event.reason, null, 2),
      });
    });

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
