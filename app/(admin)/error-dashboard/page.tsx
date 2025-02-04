"use client";

import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ErrorRecord {
  [x: string]: ReactNode;
  id: number;
  message: string;
  stack: string | null;
  timestamp: string;
  status: "Active" | "Fixed";
  screenshot: string | null;
}

export default function ErrorDashboard() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    const { data, error } = await supabase
      .from("errors")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching errors:", error);
      toast({
        title: "Error",
        description: "Failed to fetch errors. Please try again.",
        variant: "destructive",
      });
    } else {
      setErrors(data || []);
    }
  };

  const handleStatusChange = async (
    id: number,
    newStatus: "Active" | "Fixed"
  ) => {
    const { error } = await supabase
      .from("errors")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating error status:", error);
      toast({
        title: "Error",
        description: "Failed to update error status. Please try again.",
        variant: "destructive",
      });
    } else {
      fetchErrors(); // Refresh the list
      toast({
        title: "Success",
        description: "Error status updated successfully.",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Error Dashboard</h1>
      <Table>
        <TableCaption>
          A list of all errors captured in the application.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((error) => (
            <TableRow key={error.id}>
              <TableCell>
                {new Date(error.timestamp).toLocaleString()}
              </TableCell>
              <TableCell>{error.message}</TableCell>
              <TableCell>{error.details}</TableCell>
              <TableCell>{error.status}</TableCell>
              <TableCell>
                <Button
                  onClick={() =>
                    handleStatusChange(
                      error.id,
                      error.status === "Active" ? "Fixed" : "Active"
                    )
                  }
                  variant="outline"
                  size="sm"
                >
                  Mark as {error.status === "Active" ? "Fixed" : "Active"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
