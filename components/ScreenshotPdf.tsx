"use client";

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from "@/components/ui/button";

interface ScreenshotPdfProps {
  targetRef: React.RefObject<HTMLDivElement>;
}

export function ScreenshotPdf({ targetRef }: ScreenshotPdfProps) {
  const generatePdf = async () => {
    if (targetRef.current) {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pages = targetRef.current.querySelectorAll('.a4-page');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
      }

      pdf.save('exam_paper.pdf');
    }
  };

  return (
    <Button onClick={generatePdf}>Generate PDF from Exam</Button>
  );
}

