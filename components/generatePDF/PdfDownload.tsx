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
import { Card, CardContent } from "../ui/card";

// Register only NotoSansGujarati for PDF rendering
const registerFonts = () => {
  try {
    Font.register({
      family: "NotoSans",
      src: "/fonts/NotoSans-Regular.ttf",
    });
    // Font.register({
    //   family: "NotoSansGujarati",
    //   src: "/fonts/NotoSansGujarati-Regular.ttf",
    // });
    Font.register({
      family: "AnekGujarati-Regular",
      src: "/fonts/AnekGujarati-Regular.ttf",
    });
    // Font.register({
    //   family: "NotoSansGujarati",
    //   src: "/fonts/NotoSansGujarati-Bold.ttf",
    //   fontWeight: "bold",
    // });
    return true;
  } catch (error) {
    console.error("Font registration failed :", error);
    return false;
  }
};

interface PdfDownloadPropsExtended extends PdfDownloadProps {
  format: "exam" | "examWithAnswer" | "material";
  schoolName?: string;
  testTitle?: string;
  examTime?: string;
  subject: string;
  medium?: string;
}

// Types for groupedSections and subGroups
interface SubGroup {
  sectionTitle: string;
  questions: Question[];
  perQuestionMarks?: number;
  totalMarks: number;
  instruction?: string; // ✅ optional
}

interface GroupedSection {
  name: string;
  questionType: string;
  subGroups: SubGroup[];
  totalMarks: number;
}

// Utility: Detect if subject uses predefined section titles (Maths/Science)
function usesPredefinedTitles(subject: string) {
  if (!subject) return false;
  const s = subject.trim().toLowerCase();
  return s.includes("math") || s.includes("science");
}

// Group questions by marks and section, merging MCQ subgroups with similar titles
function groupQuestionsWithMergedMCQ(
  questions: Question[],
  examStructure: ExamStructure,
  isSectionWise: boolean,
  subject: string
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
  // Only 6 sections: A-F, distributed by marks (1-6)
  const marksMap: Record<number, string> = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F",
  };
  const sectionLabels: Record<number, string> = {
    1: "MCQs",
    2: "Short Answer",
    3: "Medium Answer",
    4: "Long Answer",
    5: "Very Long Answer",
    6: "Essay/Other",
  };
  const grouped: GroupedSection[] = [];
  const questionsByMarks: Record<number, Question[]> = {};
  questions.forEach((q) => {
    if (!questionsByMarks[q.marks]) questionsByMarks[q.marks] = [];
    questionsByMarks[q.marks].push(q);
  });
  const createdSections = new Set<string>();
  Object.entries(questionsByMarks).forEach(([marks, qList]) => {
    const markNum = +marks;
    if (markNum < 1 || markNum > 6) return; // Only 1-6 marks allowed
    const sectionName = marksMap[markNum];
    if (createdSections.has(sectionName)) return; // Prevent duplicate sections
    createdSections.add(sectionName);
    const sectionLabel = sectionLabels[markNum] || "Other";
    const subGrouped: Record<string, Question[]> = {};
    qList.forEach((q) => {
      let key: string;
      if (usesPredefinedTitles(subject)) {
        // Maths/Science: use predefined label for all
        key = sectionLabel;
      } else {
        // Others: use question's sectionTitle
        key = q.sectionTitle?.trim() || q.section_title?.trim() || sectionLabel;
      }
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

// Always use NotoSansGujarati as the font family
const getFontFamily = () => "AnekGujarati-Regular";

// Create all styles for the PDF document, fallback to NotoSansGujarati
const createStyles = () => {
  const fontFamily = "AnekGujarati-Regular";
  return StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 2, // Enough inner space
      // margin: 8, // Create outer whitespace
      fontFamily: fontFamily,
      // borderWidth: 1,
      // borderColor: "#000000",
      width: "auto", // Important: let content stay inside page
      height: "auto", // Prevent overflow to next page
      boxSizing: "border-box", // Safe in custom layouts
    },

    section: {
      margin: 2,
      padding: 3,
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
      fontWeight: "bold",
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
      marginBottom: 2,
    },
    subHeader: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 2,
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
      alignItems: "center",
      marginTop: 2,
      marginBottom: 2,
      textDecoration: "underline",
      color: "#000",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      // marginTop: 4,
      marginBottom: 5,
      width: "100%",
      position: "relative",
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
      position: "absolute",
      right: 0,
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
      marginBottom: 2,
      width: "100%",
      position: "relative",
    },
    subGroupHeaderTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "left",
      fontFamily: fontFamily,
    },
    subGroupHeaderMarks: {
      position: "absolute",
      right: 0,
      fontSize: 11,
      fontWeight: "bold",
      textAlign: "right",
      minWidth: 70,
      marginLeft: 10,
    },
    question: {
      fontSize: 12,
      // marginBottom: 1,
      width: "100%",
    },
    questionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      // marginBottom: 0,
    },
    questionContent: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
      marginTop: 1,
      fontFamily: fontFamily,
    },
    marks: {
      width: 60,
      textAlign: "right",
      fontSize: 10,
      fontWeight: "bold",
    },
    questionNumber: {
      fontWeight: "normal",
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

    // New header styles
    headerMainContainer: {
      marginBottom: 10,
    },
    headerSiteName: {
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
    },
    headerTestTitle: {
      fontSize: 12,
      textAlign: "center",
      marginBottom: 6,
      textDecoration: "underline",
    },
    headerThreeColumns: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottom: "1pt solid #000",
      paddingBottom: 4,
      marginBottom: 8,
      textAlign: "left",
    },
    headerColumn: {
      width: "33%",
      textAlign: "left",
    },
    headerColumnCenter: {
      width: "34%",
      textAlign: "left",
    },

    // right side text 
    headerText: {
      fontSize: 10,
      textAlign: "center",
    },

    // left side text 
    headerTextL: {
      fontSize: 10,
      textAlign: "left",
    },

    // center text
    headerTextLC: {
      fontSize: 10,
      textAlign: "left",
      marginLeft: 15,
    },
    headerRightColumn: {
      width: "33%",
      alignItems: "flex-end",
      textAlign: "left",
    },
    headerDateTopRight: {
      position: "absolute",
      top: 0,
      right: 0,
      fontSize: 10,
      color: "#fff",
      textAlign: "right",
      marginTop: 2,
      marginRight: 4,
    },
    questionText: {
      fontSize: 11,
      marginBottom: 1,
      fontFamily: fontFamily,
    },
  });
};

const getFormattedDate = () =>
  typeof window !== "undefined" ? new Date().toLocaleDateString() : "";

// --- Utility: Always render a valid element for DynamicParagraph
// const SafeDynamicParagraph = (
//   props: React.ComponentProps<typeof DynamicParagraph>
// ) => {
//   const content = props.content;

//   // Handle empty objects, null, undefined, or non-string content
//   if (
//     !content ||
//     (typeof content === "object" && Object.keys(content).length === 0) ||
//     (typeof content === "string" && content.trim() === "")
//   ) {
//     return <Text style={{ fontSize: 11, color: "#888" }}>-</Text>;
//   }

//   // If content is an object but not empty, stringify it
//   if (typeof content === "object") {
//     return <Text style={{ fontSize: 11 }}>{JSON.stringify(content)}</Text>;
//   }

//   return <DynamicParagraph {...props} />;
// };

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
    // console.log(err);
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
  medium,
  isSectionWise,
  format,
  // testTitle = "Unit Test",
  // examTime = "1 hour",
  teacherName,
}: PdfDownloadPropsExtended) => {
  // Debugging logs
  console.log("[PDF DEBUG]", {
    format,
    subject,
    numQuestions: selectedQuestions?.length || 0,
  });

  const styles = createStyles();
  const fontFamily = getFontFamily();

  const groupedSections = groupQuestionsWithMergedMCQ(
    selectedQuestions,
    examStructure,
    isSectionWise,
    subject // Pass subject as the fourth argument
  );

  // Format chapter numbers for display in the header
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
  const CHUNK_LIMIT = 999;

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
    <View style={styles.headerMainContainer}>
      {/* 🏫 Site name and title */}
      <Text style={styles.headerSiteName}>
        {instituteName || siteConfig.name}
      </Text>
      {/* <Text style={styles.headerTestTitle}>
        {testTitle || "Unit Test"} - {examTime || "Unit Test"}
      </Text> */}
      {/* <Text style={styles.headerTestTitle}>{schoolName || ""}</Text> */}
      <Text style={styles.headerDateTopRight}>{getFormattedDate()}</Text>

      {/* 📑 Three column layout */}
      <View style={styles.headerThreeColumns}>
        {/* Column 1: Chapters + Marks */}
        <View style={styles.headerColumn}>
          <Text style={styles.headerTextL}>
            Chapter: {formatChapters(selectedQuestions, chapters)}
          </Text>
          <Text style={styles.headerTextL}>
            Marks:
            {selectedQuestions.reduce((sum, q) => sum + q.marks, 0)}
          </Text>
        </View>
        {/* Column 2: Std + Subject + Medium */}
        <View style={styles.headerColumnCenter}>
          <Text style={styles.headerTextLC}>
            Std: {standard || "-"} | Subject: {subject}
          </Text>
          {/* <Text style={styles.headerText}></Text> */}
          <Text style={styles.headerTextLC}> Medium : {medium || "-"} </Text>
        </View>
        {/* Column 3: Teacher + Student */}
        <View style={styles.headerRightColumn}>
          <Text style={styles.headerText}>Teacher: {teacherName || "-"}</Text>
          <Text style={styles.headerText}>
            Student: {studentName || "_____________"}
          </Text>
        </View>
      </View>
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
              <View
                style={{
                  flex: 1,
                  margin: 8,
                  borderWidth: 1,
                  borderColor: "#000",
                  padding: 8,
                }}
              >
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
                                            {globalQuestionNumber}.
                                          </Text>
                                          <DynamicParagraph
                                            content={
                                              (q.question_gu &&
                                                q.question_gu.trim()) ||
                                              (q.question &&
                                                q.question.trim()) ||
                                              "-"
                                            }
                                            images={
                                              Array.isArray(q.question_images)
                                                ? q.question_images
                                                : []
                                            }
                                            isPdf={true}
                                            fontFamily={fontFamily}
                                            questionId={q.id}
                                            context={`Question-${globalQuestionNumber}`}
                                          />
                                        </View>
                                        {/* {q.type === "MCQ" &&
                                          q.options &&
                                          Object.keys(q.options).length > 0 && (
                                            <View style={styles.optionsRow}>
                                              {Object.entries(q.options).map(
                                                ([key, value]) => (
                                                  <View
                                                    key={key}
                                                    style={styles.option}
                                                  >
                                                    <Text
                                                      style={styles.optionText}
                                                    >
                                                      {key}) {value}
                                                    </Text>
                                                  </View>
                                                )
                                              )}
                                            </View>
                                          )} */}
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
              </View>
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
            <View
              style={{
                flex: 1,
                margin: 8,
                borderWidth: 1,
                borderColor: "#000",
                padding: 8,
              }}
            >
              <Text style={styles.watermark}>{siteConfig.name}</Text>
              <View style={styles.section}>
                <Text style={styles.header}>Answer Key</Text>

                {page.subGroups.map(({ sub }) =>
                  sub.questions.map((q: Question, qIdx: number) => {
                    // Fix type error: ensure answer is string
                    let answerContent = "";
                    if (typeof q.answer === "string" && q.answer.trim()) {
                      answerContent = q.answer;
                    } else if (
                      typeof q.answer_gu === "string" &&
                      q.answer_gu.trim()
                    ) {
                      answerContent = q.answer_gu;
                    } else if (
                      q.answer &&
                      typeof q.answer === "object" &&
                      Object.keys(q.answer).length > 0
                    ) {
                      answerContent = JSON.stringify(q.answer);
                    } else if (
                      q.answer_gu &&
                      typeof q.answer_gu === "object" &&
                      Object.keys(q.answer_gu).length > 0
                    ) {
                      answerContent = JSON.stringify(q.answer_gu);
                    } else {
                      answerContent = "-";
                    }
                    return (
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
                          content={answerContent}
                          images={
                            Array.isArray(q.answer_images)
                              ? q.answer_images
                              : []
                          }
                          isPdf={true}
                          isAnswerKey={true}
                          fontFamily={fontFamily}
                          questionId={q.id}
                          context={`Answer-${globalQuestionNumber}`}
                        />
                      </View>
                    );
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
            </View>
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
            <View
              style={{
                flex: 1,
                margin: 8,
                borderWidth: 1,
                borderColor: "#000",
                padding: 8,
              }}
            >
              <Text style={styles.watermark}>{siteConfig.name}</Text>
              <View style={styles.section}>
                {renderHeader()}
                {page.subGroups.map(({ sub }) =>
                  sub.questions.map((q: Question) => {
                    // Safely get answer content, ensuring it's always a valid string or '-'
                    const answerContent = (() => {
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
                    })();
                    const qEl = (
                      <View key={q.id}>
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
                          <DynamicParagraph
                            content={q.question_gu || q.question}
                            images={
                              Array.isArray(q.question_images)
                                ? q.question_images
                                : []
                            }
                            isPdf={true}
                            fontFamily={fontFamily}
                          />
                          <DynamicParagraph
                            content={answerContent}
                            images={
                              Array.isArray(q.answer_images)
                                ? q.answer_images
                                : []
                            }
                            isPdf={true}
                            isAnswerKey={true}
                            fontFamily={fontFamily}
                            questionId={q.id}
                            context={`Answer-${globalQuestionNumber}`}
                          />
                        </View>
                        {q.type === "MCQ" &&
                          q.options &&
                          Object.keys(q.options).length > 0 && (
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
                          <DynamicParagraph
                            content={answerContent}
                            images={
                              Array.isArray(q.answer_images)
                                ? q.answer_images
                                : []
                            }
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
            </View>
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
        description:
          "Failed to load fonts. PDF will use Gujarati fallback font.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Warn if too many questions
  useEffect(() => {
    if ((props.selectedQuestions?.length || 0) > 10) {
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
      const timeout = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Manual PDF download handler
  const handleManualDownload = async () => {
    setLoading(true);
    setError(null); // reset

    try {
      // Wait until fonts are loaded (if needed)
      await new Promise((resolve) => setTimeout(resolve, 300)); // small delay for layout stability

      // Validate all question content
      const cleanedQuestions = props.selectedQuestions.map((q) => ({
        ...q,
        question: typeof q.question === "string" ? q.question : "",
        question_gu: typeof q.question_gu === "string" ? q.question_gu : "",
        answer: typeof q.answer === "string" ? q.answer : "",
        answer_gu: typeof q.answer_gu === "string" ? q.answer_gu : "",
      }));

      // Proceed with PDF generation
      const blob = await pdf(
        <SafeDocument
          {...props}
          selectedQuestions={cleanedQuestions}
          setError={setError}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam_${props.format}_${
        props.teacherName || "teacher"
      }_${new Date().toLocaleDateString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
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
