import React from "react";
import { Button } from "@/components/ui/button";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
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

const getFontFamily = (subject: string) => {
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
  const styles = createStyles(subject);
  const groupedSections = groupQuestionsWithMergedMCQ(
    selectedQuestions,
    examStructure,
    isSectionWise
  );
  // Use the fontFamily from createStyles
  const fontFamily = getFontFamily(subject);
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

  // --- Improved main exam rendering ---
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
    let globalQuestionNumber = 1;
    return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>{siteConfig.name}</Text>
        <View style={styles.section}>
          {renderHeader()}
          {groupedSections.map(
            (section: GroupedSection, sectionIdx: number) => (
              <View key={section.name + sectionIdx}>
                {/* Section header row: center title, right marks */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>
                    Section {section.name}{" "}
                    {section.questionType ? `- ${section.questionType}` : ""}
                  </Text>
                  <Text style={styles.sectionHeaderMarks}>
                    Total: {section.totalMarks} marks
                  </Text>
                </View>
                {section.subGroups.map((sub: SubGroup, subIdx: number) => (
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
                        Total: {sub.totalMarks} marks
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
                                      <View key={key} style={styles.option}>
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
            )
          )}
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
    );
  };

  // --- Improved answer key rendering ---
  interface RenderImprovedAnswerKeyProps {
    groupedSections: GroupedSection[];
    styles: ReturnType<typeof createStyles>;
    fontFamily: string;
  }

  const renderImprovedAnswerKey = ({
    groupedSections,
    styles,
    fontFamily,
  }: RenderImprovedAnswerKeyProps) => {
    // Flatten all questions in order
    const allQuestions: Question[] = groupedSections.flatMap(
      (section: GroupedSection) =>
        section.subGroups.flatMap((sub: SubGroup) => sub.questions)
    );
    return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>{siteConfig.name}</Text>
        <View style={styles.section}>
          <Text style={styles.header}>Answer Key</Text>
          <View style={{ marginTop: 12 }}>
            {allQuestions.map((q: Question, idx: number) => (
              <View key={q.id} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold", fontSize: 12 }}>
                  {idx + 1}.{" "}
                  <DynamicParagraph
                    content={
                      typeof q.answer_gu === "string"
                        ? q.answer_gu
                        : typeof q.answer === "string"
                        ? q.answer
                        : JSON.stringify(q.answer)
                    }
                    images={q.answer_images || []}
                    isPdf={true}
                    isAnswerKey={true}
                    fontFamily={fontFamily}
                  />
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text
          style={styles.pageNumber}
          render={({
            pageNumber,
            totalPages,
          }: {
            pageNumber: number;
            totalPages: number;
          }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
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
      {/* fallback to old rendering for material */}
      {/* {format === "material" && renderMaterialPage()} */}
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

  // // Error boundary for PDF rendering
  // const SafeDocument = React.useCallback(() => {
  //   try {
  //     return <MyDocument {...props} />;
  //   } catch (err: unknown) {
  //     setError(
  //       err instanceof Error && err.message.includes("memory")
  //         ? "PDF generation failed due to memory limits. Try reducing the number of questions or splitting the paper."
  //         : "PDF generation failed: " +
  //             (err instanceof Error ? err.message : "Unknown error.")
  //     );
  //     return null;
  //   }
  // }, [props]);

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
      const blob = await pdf(<MyDocument {...props} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam_${props.format}_${
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
            <PDFViewer width="100%" height="100vh" className="w-full h-full">
              <MyDocument {...props} />
            </PDFViewer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
