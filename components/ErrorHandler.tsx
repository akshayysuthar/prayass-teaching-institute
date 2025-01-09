"use client";

import { useState, useEffect } from 'react';
import { Toast } from "@/components/ui/toast";
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";

interface ErrorData {
  message: string;
  stack?: string;
  timestamp: number;
}

export function ErrorHandler() {
  const { toast } = useToast();
  const [error, setError] = useState<ErrorData | null>(null);

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      setError({
        message: errorMessage,
        stack: new Error().stack,
        timestamp: Date.now(),
      });
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', (event) => {
      setError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      setError({
        message: event.reason.message || 'Unhandled Promise Rejection',
        stack: event.reason.stack,
        timestamp: Date.now(),
      });
    });

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        title: "An error occurred",
        description: (
          <div>
            <p>{error.message}</p>
            <Button onClick={() => saveError(error)}>Save Error</Button>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [error, toast]);

  const saveError = async (errorData: ErrorData) => {
    try {
      const { data, error } = await supabase
        .from('errors')
        .insert([
          {
            message: errorData.message,
            stack: errorData.stack,
            timestamp: new Date(errorData.timestamp).toISOString(),
            status: 'Active',
          }
        ]);

      if (error) throw error;

      toast({
        title: "Error saved",
        description: "The error has been saved to the database.",
      });
    } catch (err) {
      console.error("Failed to save error:", err);
      toast({
        title: "Failed to save error",
        description: "An error occurred while saving the error to the database.",
        variant: "destructive",
      });
    }
  };

  return null; // This component doesn't render anything
}

