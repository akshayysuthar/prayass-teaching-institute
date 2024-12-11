"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

interface ScreenshotPdfProps {
  targetRef: React.RefObject<HTMLDivElement>;
}

export function ScreenshotPdf({ targetRef }: ScreenshotPdfProps) {
  const captureScreenshot = async () => {
    if (targetRef.current) {
      const canvas = await html2canvas(targetRef.current);
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "exam_screenshot.png";
      link.click();
    }
  };

  const generatePdf = async () => {
    if (targetRef.current) {
      const canvas = await html2canvas(targetRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("exam_screenshot.pdf");
    }
  };

  return (
    <div className="mt-4 space-x-4 flex items-center">
      <Button onClick={captureScreenshot}>Capture Screenshot</Button>
      <Button onClick={generatePdf}>Generate PDF from Screenshot</Button>
    </div>
  );
}
