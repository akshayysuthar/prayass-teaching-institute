"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";

interface ErrorData {
  message: string;
  stack?: string;
  timestamp: number;
  details?: string;
}

export function ErrorHandler() {
  const { toast } = useToast();
  const [error, setError] = useState<ErrorData | null>(null);

  const saveError = useCallback(
    async (errorData: ErrorData) => {
      try {
        const errorDetails = JSON.stringify(errorData, null, 2);
        await supabase.from("errors").insert([
          {
            message: errorData.message,
            stack: errorData.stack,
            timestamp: new Date(errorData.timestamp).toISOString(),
            status: "Active",
            details: errorDetails, // Add this line to save the full error object
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

  useEffect(() => {
    if (error) {
      toast({
        title: "An error occurred",
        description: (
          <div>
            <p>
              {error.message} {error.details}
            </p>
            <Button onClick={() => saveError(error)}>Save Error</Button>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [error, toast, saveError]);

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(" ");
      setError({
        message: errorMessage,
        stack: new Error().stack,
        timestamp: Date.now(),
        details: JSON.stringify(args, null, 2), // Add this line
      });
      originalConsoleError.apply(console, args);
    };

    window.addEventListener("error", (event) => {
      setError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        details: JSON.stringify(event.error, null, 2), // Add this line
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      setError({
        message: event.reason.message || "Unhandled Promise Rejection",
        stack: event.reason.stack,
        timestamp: Date.now(),
        details: JSON.stringify(event.reason, null, 2), // Add this line
      });
    });

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
