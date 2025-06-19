import React from "react";
import { Button } from "@/components/ui/button";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  // PDFViewer,
  Font,
  pdf,
} from "@react-pdf/renderer";

import type { PdfDownloadProps, Question, ExamStructure } from "@/types";
import { DynamicParagraph } from "./DynamicParagraph";
import { siteConfig } from "@/config/site";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
// import { Download } from "lucide-react";
import { Card, CardContent } from "./ui/card";

// Register fonts
const registerFonts = () => {
  try {
    Font.register({ family: "NotoSans", src: "/fonts/NotoSans-Regular.ttf" });
    Font.register({
      family: "NotoSans",
      src: "/fonts/NotoSans-Bold.ttf",
      fontWeight: "bold",
    });
    Font.register({
      family: "NotoSansGujarati",
      src: "/fonts/NotoSansGujarati-Regular.ttf",
    });
    Font.register({
      family: "NotoSansGujarati",
      src: "/fonts/NotoSansGujarati-Bold.ttf",
      fontWeight: "bold",
    });
    return true;
  } catch (error) {
    console.error("Font registration failed:", error);
    return false;
  }
};

interface PdfDownloadPropsExtended extends PdfDownloadProps {
  format: "exam" | "examWithAnswer" | "material";
  schoolName?: string;
  testTitle?: string;
  examTime?: string;
  subject: string;
}

// Types for groupedSections and subGroups
interface SubGroup {
  sectionTitle: string;
  questions: Question[];
  perQuestionMarks?: number;
  totalMarks: number;
}

interface GroupedSection {
  name: string;
  questionType: string;
  subGroups: SubGroup[];
  totalMarks: number;
}

// Helper: Normalize section titles for MCQ grouping
function normalizeSectionTitle(title: string): string {
  if (!title) return "Other";
  const t = title.trim().toLowerCase();
  if (t.includes("mcq") || t.includes("choose the correct answer"))
    return "MCQs";
  if (t.includes("one word")) return "One Word";
  return title.trim();
}

// Improved grouping: merge MCQ subgroups with similar section titles
function groupQuestionsWithMergedMCQ(
  questions: Question[],
  examStructure: ExamStructure,
  isSectionWise: boolean
): GroupedSection[] {
  if (!isSectionWise) {
    return [
      {
        name: "",
        questionType: "All Questions",
        subGroups: [
          {
            sectionTitle: "All",
            questions,
            totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
            perQuestionMarks:
              questions.length > 0 &&
              questions.every((q) => q.marks === questions[0].marks)
                ? questions[0].marks
                : undefined,
          },
        ],
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
      },
    ];
  }
  const grouped: GroupedSection[] = [];
  const marksMap: Record<number, string> = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
  };
  const questionsByMarks: Record<number, Question[]> = {};
  questions.forEach((q) => {
    if (!questionsByMarks[q.marks]) questionsByMarks[q.marks] = [];
    questionsByMarks[q.marks].push(q);
  });
  Object.entries(questionsByMarks).forEach(([marks, qList]) => {
    const sectionName = marksMap[+marks] || "";
    const sectionLabel =
      +marks === 1
        ? "MCQ/Short Answer"
        : +marks === 2
        ? "Short Answer"
        : +marks === 3
        ? "Medium Answer"
        : +marks >= 4
        ? "Long Answer"
        : "Others";
    // Merge MCQ subgroups with similar section titles
    const subGrouped: Record<string, Question[]> = {};
    qList.forEach((q) => {
      const raw = q.sectionTitle?.trim() || q.section_title?.trim() || "Other";
      const key = +marks === 1 ? normalizeSectionTitle(raw) : raw;
      if (!subGrouped[key]) subGrouped[key] = [];
      subGrouped[key].push(q);
    });
    const subGroups: SubGroup[] = Object.entries(subGrouped).map(
      ([sectionTitle, qs]) => {
        const totalMarks = qs.reduce((sum, q) => sum + q.marks, 0);
        const allSameMarks =
          qs.length > 0 && qs.every((q) => q.marks === qs[0].marks);
        return {
          sectionTitle,
          questions: qs,
          totalMarks,
          perQuestionMarks: allSameMarks ? qs[0].marks : undefined,
        };
      }
    );
    const totalMarks = qList.reduce((sum, q) => sum + q.marks, 0);
    grouped.push({
      name: sectionName,
      questionType: sectionLabel,
      subGroups,
      totalMarks,
    });
  });
  return grouped;
}

// Helper to get font family for a subject
const getFontFamily = (subject: string) => {
  if (!subject) return "NotoSans";
  return subject.toLowerCase().includes("gujarati")
    ? "NotoSansGujarati"
    : "NotoSans";
};

// Create styles for PDF
const createStyles = (subject: string) => {
  const fontFamily = getFontFamily(subject);

  return StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 5,
      fontFamily: "NotoSans",
      position: "relative",
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    watermark: {
      position: "absolute",
      top: "45%",
      left: "10%",
      opacity: 0.08,
      transform: "rotate(-30deg)",
      fontSize: 40,
      color: "#000",
      zIndex: -1,
    },
    headerContainer: {
      marginBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: 5,
    },
    row: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
      width: "100%",
    },
    header: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 5,
    },
    subHeader: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 5,
      textDecoration: "underline",
    },
    date: {
      fontSize: 10,
      color: "#555",
      textAlign: "right",
    },
    leftColumn: {
      fontSize: 10,
      fontWeight: "bold",
    },
    rightColumn: {
      fontSize: 10,
      textAlign: "left",
      fontWeight: "bold",
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 10,
      marginBottom: 10,
      textDecoration: "underline",
      color: "#000",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 10,
      width: "100%",
    },
    sectionHeaderTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      textDecoration: "underline",
      color: "#000",
    },
    sectionHeaderMarks: {
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "right",
      minWidth: 80,
      marginLeft: 10,
    },
    subGroupHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 4,
      width: "100%",
    },
    subGroupHeaderTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "left",
      fontFamily: "NotoSansGujarati",
    },
    subGroupHeaderMarks: {
      fontSize: 11,
      fontWeight: "bold",
      textAlign: "right",
      minWidth: 70,
      marginLeft: 10,
    },
    question: {
      fontSize: 12,
      marginBottom: 2,
      width: "100%",
    },
    questionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 1,
    },
    questionContent: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
      fontFamily,
    },
    marks: {
      width: 60,
      textAlign: "right",
      fontSize: 10,
      fontWeight: "bold",
    },
    questionNumber: {
      fontWeight: "bold",
    },
    optionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 5,
      marginBottom: 5,
    },
    option: {
      marginRight: 10,
      marginBottom: 5,
      padding: 3,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 4,
      backgroundColor: "#fafafa",
    },
    optionText: {
      fontSize: 10,
    },
    footer: {
      textAlign: "center",
      fontSize: 9,
      color: "#666",
      marginTop: 15,
    },
    pageNumber: {
      position: "absolute",
      fontSize: 8,
      bottom: 10,
      right: 15,
      color: "grey",
    },
  });
};

const getFormattedDate = () =>
  typeof window !== "undefined" ? new Date().toLocaleDateString() : "";

// --- Utility: Always render a valid element for DynamicParagraph
const SafeDynamicParagraph = (
  props: React.ComponentProps<typeof DynamicParagraph>
) => {
  const content = props.content;

  // Handle empty objects, null, undefined, or non-string content
  if (
    !content ||
    (typeof content === "object" && Object.keys(content).length === 0) ||
    (typeof content === "string" && content.trim() === "")
  ) {
    return <Text style={{ fontSize: 11, color: "#888" }}>-</Text>;
  }

  // If content is an object but not empty, stringify it
  if (typeof content === "object") {
    return <Text style={{ fontSize: 11 }}>{JSON.stringify(content)}</Text>;
  }

  return <DynamicParagraph {...props} />;
};

// --- Error boundary for PDF rendering ---
function SafeDocument(
  props: PdfDownloadPropsExtended & { setError: (msg: string) => void }
) {
  try {
    return <MyDocument {...props} />;
  } catch (err) {
    props.setError(
      "PDF generation failed due to a layout overflow. Try reducing the number of questions per exam or splitting the paper." +
        err
      // : "PDF generation failed: " + (err?.message || "Unknown error.")
    );
    return null;
  }
}

// --- Main PDF Document (move below SafeDocument for correct reference) ---
const MyDocument = ({
  selectedQuestions,
  examStructure,
  instituteName,
  standard,
  schoolName,
  studentName,
  subject,
  chapters,
  isSectionWise,
  format,
  testTitle = "Unit Test",
  examTime = "1 hour",
}: PdfDownloadPropsExtended) => {
  // Debugging logs
  console.log("[PDF DEBUG]", {
    format,
    subject,
    numQuestions: selectedQuestions?.length || 0,
  });

  const styles = createStyles(subject);
  const fontFamily = getFontFamily(subject);

  const groupedSections = groupQuestionsWithMergedMCQ(
    selectedQuestions,
    examStructure,
    isSectionWise
  );

  const formatChapters = (questions: Question[], chapters: string) => {
    if (chapters) return chapters;
    const chapterNos = [
      ...new Set(questions.map((q) => q.chapterNo).filter(Boolean) as number[]),
    ].sort((a, b) => a - b);
    if (chapterNos.length === 0) return "N/A";
    if (chapterNos.length === 1) return `${chapterNos[0]}`;
    const isConsecutive = chapterNos.every(
      (n, i) => i === 0 || n === chapterNos[i - 1] + 1
    );
    return isConsecutive
      ? `${chapterNos[0]} to ${chapterNos[chapterNos.length - 1]}`
      : chapterNos.join(", ");
  };

  // CHUNK_LIMIT for questions per page
  const CHUNK_LIMIT = 20;

  // Helper: Chunk groupedSections/subGroups into pages, never splitting a subgroup unless it exceeds CHUNK_LIMIT
  function paginateSections(
    groupedSections: GroupedSection[],
    chunkLimit: number
  ) {
    const pages: { sections: GroupedSection[]; totalQuestions: number }[] = [];
    let currentSections: GroupedSection[] = [];
    let currentCount = 0;

    for (const section of groupedSections) {
      let subGroups: SubGroup[] = [];
      for (const sub of section.subGroups) {
        // If a subgroup itself exceeds chunkLimit, split it
        if (sub.questions.length > chunkLimit) {
          for (let i = 0; i < sub.questions.length; i += chunkLimit) {
            const chunkQs = sub.questions.slice(i, i + chunkLimit);
            const chunkSub: SubGroup = {
              ...sub,
              questions: chunkQs,
              totalMarks: chunkQs.reduce((sum, q) => sum + q.marks, 0),
            };
            // If adding this chunk would overflow, start new page
            if (currentCount + chunkQs.length > chunkLimit) {
              if (subGroups.length > 0) {
                currentSections.push({ ...section, subGroups });
                subGroups = [];
              }
              if (currentSections.length > 0) {
                pages.push({
                  sections: currentSections,
                  totalQuestions: currentCount,
                });
                currentSections = [];
                currentCount = 0;
              }
            }
            subGroups.push(chunkSub);
            currentCount += chunkQs.length;
            // If exactly at limit, flush
            if (currentCount === chunkLimit) {
              currentSections.push({ ...section, subGroups });
              pages.push({
                sections: currentSections,
                totalQuestions: currentCount,
              });
              subGroups = [];
              currentSections = [];
              currentCount = 0;
            }
          }
        } else {
          // If adding this subgroup would overflow, flush currentSections
          if (currentCount + sub.questions.length > chunkLimit) {
            if (subGroups.length > 0) {
              currentSections.push({ ...section, subGroups });
              subGroups = [];
            }
            if (currentSections.length > 0) {
              pages.push({
                sections: currentSections,
                totalQuestions: currentCount,
              });
              currentSections = [];
              currentCount = 0;
            }
          }
          subGroups.push(sub);
          currentCount += sub.questions.length;
          // If exactly at limit, flush
          if (currentCount === chunkLimit) {
            currentSections.push({ ...section, subGroups });
            pages.push({
              sections: currentSections,
              totalQuestions: currentCount,
            });
            subGroups = [];
            currentSections = [];
            currentCount = 0;
          }
        }
      }
      if (subGroups.length > 0) {
        currentSections.push({ ...section, subGroups });
        subGroups = [];
      }
    }
    if (currentSections.length > 0) {
      pages.push({ sections: currentSections, totalQuestions: currentCount });
    }
    return pages;
  }

  // Helper: Paginate subgroups for answer key/material (by section/subgroup, not just flat)
  function paginateSubgroupsBySection(
    groupedSections: GroupedSection[],
    chunkLimit: number
  ) {
    const pages: {
      subGroups: {
        sectionName: string;
        sectionIdx: number;
        sub: SubGroup;
        subIdx: number;
      }[];
      totalQuestions: number;
    }[] = [];
    let current: {
      sectionName: string;
      sectionIdx: number;
      sub: SubGroup;
      subIdx: number;
    }[] = [];
    let currentCount = 0;
    groupedSections.forEach((section, sectionIdx) => {
      section.subGroups.forEach((sub, subIdx) => {
        if (sub.questions.length > chunkLimit) {
          // Split large subgroups
          for (let i = 0; i < sub.questions.length; i += chunkLimit) {
            const chunkQs = sub.questions.slice(i, i + chunkLimit);
            const chunkSub: SubGroup = {
              ...sub,
              questions: chunkQs,
              totalMarks: chunkQs.reduce((sum, q) => sum + q.marks, 0),
            };
            if (currentCount + chunkQs.length > chunkLimit) {
              if (current.length > 0) {
                pages.push({
                  subGroups: current,
                  totalQuestions: currentCount,
                });
                current = [];
                currentCount = 0;
              }
            }
            current.push({
              sectionName: section.name,
              sectionIdx,
              sub: chunkSub,
              subIdx,
            });
            currentCount += chunkQs.length;
            if (currentCount === chunkLimit) {
              pages.push({ subGroups: current, totalQuestions: currentCount });
              current = [];
              currentCount = 0;
            }
          }
        } else {
          if (currentCount + sub.questions.length > chunkLimit) {
            if (current.length > 0) {
              pages.push({ subGroups: current, totalQuestions: currentCount });
              current = [];
              currentCount = 0;
            }
          }
          current.push({ sectionName: section.name, sectionIdx, sub, subIdx });
          currentCount += sub.questions.length;
          if (currentCount === chunkLimit) {
            pages.push({ subGroups: current, totalQuestions: currentCount });
            current = [];
            currentCount = 0;
          }
        }
      });
    });
    if (current.length > 0) {
      pages.push({ subGroups: current, totalQuestions: currentCount });
    }
    return pages;
  }

  // --- Answer key props interface (move up for all usages) ---
  interface RenderImprovedAnswerKeyProps {
    groupedSections: GroupedSection[];
    styles: ReturnType<typeof createStyles>;
    fontFamily: string;
  }
  // Use the fontFamily from createStyles

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>{instituteName || siteConfig.name}</Text>
      <Text style={styles.subHeader}>{testTitle}</Text>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>
          STD: {standard}
          {schoolName ? ` - ${schoolName}` : ""}
        </Text>
        <Text style={styles.rightColumn}>Subject: {subject}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>
          Chapter: {formatChapters(selectedQuestions, chapters)}
        </Text>
        <Text style={styles.rightColumn}>
          Total Marks: {selectedQuestions.reduce((sum, q) => sum + q.marks, 0)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>Date: {getFormattedDate()}</Text>
        <Text style={styles.rightColumn}>Time: {examTime}</Text>
      </View>
      {studentName && (
        <View style={styles.row}>
          <Text style={styles.leftColumn}>Student: {studentName}</Text>
        </View>
      )}
    </View>
  );

  // --- Improved main exam rendering with auto-pagination and guards ---
  const renderImprovedExam = ({
    groupedSections,
    styles,
    fontFamily,
    renderHeader,
  }: {
    groupedSections: GroupedSection[];
    styles: ReturnType<typeof createStyles>;
    fontFamily: string;
    renderHeader: () => JSX.Element;
  }) => {
    // Auto-paginate sections/subgroups so no page exceeds CHUNK_LIMIT questions
    const pages = paginateSections(groupedSections, CHUNK_LIMIT);
    let globalQuestionNumber = 1;
    return (
      <>
        {pages.map(
          (
            page: { sections: GroupedSection[]; totalQuestions: number },
            pageIdx: number
          ) => (
            <Page size="A4" style={styles.page} key={pageIdx}>
              <Text style={styles.watermark}>{siteConfig.name}</Text>
              <View style={styles.section}>
                {renderHeader()}
                {page.sections
                  .filter(
                    (section: GroupedSection) =>
                      section.subGroups &&
                      section.subGroups.some(
                        (sub: SubGroup) => sub.questions.length > 0
                      )
                  )
                  .map((section: GroupedSection, sectionIdx: number) => (
                    <View key={section.name + sectionIdx}>
                      {/* Section header row: center title, right marks */}
                      <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeaderTitle}>
                          Section {section.name}
                        </Text>
                        <Text style={styles.sectionHeaderMarks}>
                          {section.totalMarks} marks
                        </Text>
                      </View>
                      {section.subGroups
                        .filter((sub: SubGroup) => sub.questions.length > 0)
                        .map((sub: SubGroup, subIdx: number) => (
                          <View key={sub.sectionTitle + subIdx}>
                            {/* Subgroup header row: center title, right marks */}
                            <View style={styles.subGroupHeaderRow}>
                              <Text style={styles.subGroupHeaderTitle}>
                                {sub.sectionTitle}
                                {sub.perQuestionMarks
                                  ? ` (${sub.perQuestionMarks} marks each)`
                                  : ""}
                              </Text>
                              <Text style={styles.subGroupHeaderMarks}>
                                {sub.totalMarks} marks
                              </Text>
                            </View>
                            {sub.questions.map((q: Question) => {
                              const qEl = (
                                <View key={q.id} style={styles.question}>
                                  <View style={styles.questionRow}>
                                    <View style={styles.questionContent}>
                                      <View
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "flex-start",
                                        }}
                                      >
                                        <Text style={styles.questionNumber}>
                                          {globalQuestionNumber}.{" "}
                                        </Text>
                                        <DynamicParagraph
                                          content={q.question_gu || q.question}
                                          images={q.question_images || []}
                                          isPdf={true}
                                          fontFamily={fontFamily}
                                        />
                                      </View>
                                      {q.type === "MCQ" && q.options && (
                                        <View style={styles.optionsRow}>
                                          {Object.entries(q.options).map(
                                            ([key, value]) => (
                                              <View
                                                key={key}
                                                style={styles.option}
                                              >
                                                <Text style={styles.optionText}>
                                                  {key}) {value}
                                                </Text>
                                              </View>
                                            )
                                          )}
                                        </View>
                                      )}
                                    </View>
                                    {/* Only show per-question marks if not all same in group */}
                                    {!sub.perQuestionMarks && (
                                      <Text
                                        style={styles.marks}
                                      >{`(${q.marks} marks)`}</Text>
                                    )}
                                  </View>
                                </View>
                              );
                              globalQuestionNumber++;
                              return qEl;
                            })}
                          </View>
                        ))}
                    </View>
                  ))}
              </View>
              <Text style={styles.footer}>All The Best!</Text>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) =>
                  `${pageNumber} / ${totalPages}`
                }
                fixed
              />
            </Page>
          )
        )}
      </>
    );
  };

  // --- Improved answer key rendering with section/subgroup auto-pagination ---
  const renderImprovedAnswerKey = ({
    groupedSections,
    styles,
    fontFamily,
  }: RenderImprovedAnswerKeyProps) => {
    const pages = paginateSubgroupsBySection(groupedSections, CHUNK_LIMIT);
    console.log(pages);
    let globalQuestionNumber = 1;
    return (
      <>
        {pages.map((page, pageIdx) => (
          <Page size="A4" style={styles.page} key={pageIdx}>
            <Text style={styles.watermark}>{siteConfig.name}</Text>
            <View style={styles.section}>
              <Text style={styles.header}>Answer Key</Text>

              {page.subGroups.map(({ sub }) =>
                sub.questions.map((q: Question, qIdx: number) => (
                  <View
                    key={q.id + qIdx}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 12,
                        marginRight: 6,
                      }}
                    >
                      {globalQuestionNumber++}.
                    </Text>

                    <DynamicParagraph
                      content={
                        typeof q.answer === "string"
                          ? q.answer
                          : typeof q.answer_gu === "string"
                          ? q.answer_gu
                          : "-"
                      }
                      images={q.answer_images || []}
                      isPdf={true}
                      isAnswerKey={true}
                      fontFamily={fontFamily}
                    />
                    {/* <View style={{ flex: 1 }}>
                      <DynamicParagraph
                        content={(() => {
                          if (
                            typeof q.answer_gu === "string" &&
                            q.answer_gu.trim()
                          ) {
                            return q.answer_gu;
                          }
                          if (typeof q.answer === "string" && q.answer.trim()) {
                            return q.answer;
                          }
                          if (
                            q.answer_gu &&
                            typeof q.answer_gu === "object" &&
                            Object.keys(q.answer_gu).length > 0
                          ) {
                            return JSON.stringify(q.answer_gu);
                          }
                          if (
                            q.answer &&
                            typeof q.answer === "object" &&
                            Object.keys(q.answer).length > 0
                          ) {
                            return JSON.stringify(q.answer);
                          }
                          return "-";
                        })()}
                        images={q.answer_images || []}
                        isPdf={true}
                        isAnswerKey={true}
                        fontFamily={fontFamily}
                      />
                    </View> */}
                  </View>
                ))
              )}
            </View>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
              fixed
            />
          </Page>
        ))}
      </>
    );
  };

  // --- Improved material rendering with section/subgroup auto-pagination ---
  const renderImprovedMaterial = ({
    groupedSections,
    styles,
    fontFamily,
    renderHeader,
  }: // subject,
  {
    groupedSections: GroupedSection[];
    styles: ReturnType<typeof createStyles>;
    fontFamily: string;
    renderHeader: () => JSX.Element;
    subject: string;
  }) => {
    const pages = paginateSubgroupsBySection(groupedSections, CHUNK_LIMIT);
    let globalQuestionNumber = 1;
    return (
      <>
        {pages.map((page, pageIdx) => (
          <Page size="A4" style={styles.page} key={pageIdx}>
            <Text style={styles.watermark}>{siteConfig.name}</Text>
            <View style={styles.section}>
              {renderHeader()}
              {page.subGroups.map(({ sub }) =>
                sub.questions.map((q: Question) => {
                  // Safely get answer content, ensuring it's always a valid string or '-'
                  const answerContent = (() => {
                    if (typeof q.answer_gu === "string" && q.answer_gu.trim()) {
                      return q.answer_gu;
                    }
                    if (typeof q.answer === "string" && q.answer.trim()) {
                      return q.answer;
                    }
                    if (
                      q.answer_gu &&
                      typeof q.answer_gu === "object" &&
                      Object.keys(q.answer_gu).length > 0
                    ) {
                      return JSON.stringify(q.answer_gu);
                    }
                    if (
                      q.answer &&
                      typeof q.answer === "object" &&
                      Object.keys(q.answer).length > 0
                    ) {
                      return JSON.stringify(q.answer);
                    }
                    return "-";
                  })();
                  const qEl = (
                    <View
                      key={q.id}
                      style={{
                        borderWidth: 1,
                        borderColor: "#bbb",
                        borderRadius: 4,
                        padding: 6,
                        marginBottom: 2,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 1,
                        }}
                      >
                        <Text style={{ ...styles.questionNumber }}>
                          {globalQuestionNumber++}.{" "}
                        </Text>
                        <SafeDynamicParagraph
                          content={q.question_gu || q.question}
                          images={q.question_images || []}
                          isPdf={true}
                          fontFamily={fontFamily}
                        />
                      </View>
                      {q.type === "MCQ" && q.options && (
                        <View
                          style={{
                            ...styles.optionsRow,
                            marginTop: 1,
                            marginBottom: 1,
                          }}
                        >
                          {Object.entries(q.options).map(([key, value]) => (
                            <View key={key} style={styles.option}>
                              <Text style={{ ...styles.optionText }}>
                                {key}) {value}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {/* Answer */}
                      <View style={{ marginTop: 1, marginLeft: 18 }}>
                        <Text style={{ fontWeight: "bold", fontSize: 11 }}>
                          Answer:
                        </Text>
                        <SafeDynamicParagraph
                          content={answerContent}
                          images={q.answer_images || []}
                          isPdf={true}
                          isAnswerKey={true}
                          fontFamily={fontFamily}
                        />
                      </View>
                    </View>
                  );
                  return answerContent && answerContent.trim() !== ""
                    ? qEl
                    : null;
                })
              )}
            </View>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
              fixed
            />
          </Page>
        ))}
      </>
    );
  };

  return (
    <Document>
      {format === "exam" &&
        renderImprovedExam({
          groupedSections,
          styles,
          fontFamily,
          renderHeader,
        })}
      {format === "examWithAnswer" && (
        <>
          {renderImprovedExam({
            groupedSections,
            styles,
            fontFamily,
            renderHeader,
          })}
          {renderImprovedAnswerKey({ groupedSections, styles, fontFamily })}
        </>
      )}
      {format === "material" &&
        renderImprovedMaterial({
          groupedSections,
          styles,
          fontFamily,
          renderHeader,
          subject,
        })}
    </Document>
  );
};

export function PdfDownload(props: PdfDownloadPropsExtended) {
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (!registerFonts()) {
      toast({
        title: "Warning",
        description: "Failed to load fonts. PDF may not render correctly.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Warn if too many questions
  useEffect(() => {
    if ((props.selectedQuestions?.length || 0) > 40) {
      toast({
        title: "Large PDF Warning",
        description: `You are generating a very large PDF (${props.selectedQuestions.length} questions). This may take longer and could fail on low-memory devices.`,
        variant: "default",
      });
    }
  }, [props.selectedQuestions, toast]);

  // Set loading to false after a short delay when PDF is being generated
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Manual PDF download handler
  const handleManualDownload = async () => {
    setLoading(true);
    try {
      const blob = await pdf(
        <SafeDocument {...props} setError={setError} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam_${props.format}_$${
        props.teacherName
      }_${new Date().toLocaleDateString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : String(err));
      toast({
        title: "Download Failed",
        description: "Could not generate or download the PDF.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-lg font-semibold mb-2">
          Generating PDF, please wait...
        </span>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-2">{error}</div>
      )}
      <Card className="shadow-md border-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <Button
              className="h-12 w-full text-base flex items-center gap-2"
              onClick={handleManualDownload}
              disabled={loading}
            >
              {loading ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
