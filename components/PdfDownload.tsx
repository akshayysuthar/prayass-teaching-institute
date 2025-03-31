import { Button } from "@/components/ui/button";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import type { PdfDownloadProps, Question, ExamStructure } from "@/types";
import { DynamicParagraph } from "./DynamicParagraph";
import { siteConfig } from "@/config/site";

// Register fonts
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
  console.log("Fonts registered successfully");
} catch (error) {
  console.error("Font registration failed:", error);
}

interface PdfDownloadPropsExtended extends PdfDownloadProps {
  format: "exam" | "examWithAnswer" | "material";
  schoolName?: string;
  testTitle?: string;
  examTime?: string;
}

const getFontFamily = (subject: string) => {
  return subject.toLowerCase().includes("gujarati")
    ? "NotoSansGujarati"
    : "NotoSans";
};

const createStyles = (subject: string) => {
  const fontFamily = getFontFamily(subject);
  return StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 5, // change to 5 and don't change it
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
      marginBottom: 5, // keep don't change it
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: 10,
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
      marginBottom: 10,
    },
    subHeader: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 15,
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
      backgroundColor: "#f0f0f0",
      padding: 5,
    },
    question: {
      fontSize: 11,
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

const groupQuestionsBySection = (
  questions: Question[],
  examStructure: ExamStructure,
  isSectionWise: boolean
) => {
  if (!isSectionWise)
    return [{ name: "", questionType: "All Questions", questions }];

  // Group questions by marks
  const questionsByMarks: Record<number, Question[]> = {};
  questions.forEach((q) => {
    if (!questionsByMarks[q.marks]) questionsByMarks[q.marks] = [];
    questionsByMarks[q.marks].push(q);
  });

  const grouped: Array<{
    name: string;
    questionType: string;
    questions: Question[];
  }> = [];

  // Section A: MCQs and 1 mark questions
  const mcqsAndOneMarks = questions.filter(
    (q) => q.type === "MCQ" || q.marks === 1
  );
  if (mcqsAndOneMarks.length > 0) {
    grouped.push({
      name: "A",
      questionType: "MCQ/Short Answer",
      questions: mcqsAndOneMarks,
    });
  }

  // Section B: 2 marks questions
  if (questionsByMarks[2] && questionsByMarks[2].length > 0) {
    grouped.push({
      name: "B",
      questionType: "Short Answer",
      questions: questionsByMarks[2],
    });
  }

  // Section C: 3 marks questions
  if (questionsByMarks[3] && questionsByMarks[3].length > 0) {
    grouped.push({
      name: "C",
      questionType: "Medium Answer",
      questions: questionsByMarks[3],
    });
  }

  // Section D: 4 marks questions
  if (questionsByMarks[4] && questionsByMarks[4].length > 0) {
    grouped.push({
      name: "D",
      questionType: "Long Answer",
      questions: questionsByMarks[4],
    });
  }

  // Section E: 5 marks questions
  if (questionsByMarks[5] && questionsByMarks[5].length > 0) {
    grouped.push({
      name: "E",
      questionType: "Long Answer",
      questions: questionsByMarks[5],
    });
  }

  return grouped;
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
  const groupedSections = groupQuestionsBySection(
    selectedQuestions,
    examStructure,
    isSectionWise
  );
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  const fontFamily = getFontFamily(subject);
  const formattedDate = getFormattedDate();
  const formattedChapters = formatChapters(selectedQuestions, chapters);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>{instituteName || siteConfig.name}</Text>
      <Text style={styles.subHeader}>{testTitle}</Text>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>
          STD: {standard} {schoolName ? `- ${schoolName}` : ""}
        </Text>
        <Text style={styles.rightColumn}>Subject: {subject}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>Chapter: {formattedChapters}</Text>
        <Text style={styles.rightColumn}>Total Marks: {totalMarks}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>Date: {formattedDate}</Text>
        <Text style={styles.rightColumn}>Time: {examTime}</Text>
      </View>
      {studentName && (
        <View style={styles.row}>
          <Text style={styles.leftColumn}>Student: {studentName}</Text>
        </View>
      )}
    </View>
  );

  const renderQuestion = (
    question: Question,
    sectionIndex: number,
    questionIndex: number
  ) => {
    return (
      <View key={question.id} style={styles.question}>
        <View style={styles.questionRow}>
          <View style={styles.questionContent}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={styles.questionNumber}>{questionIndex + 1}. </Text>
              <DynamicParagraph
                content={question.question}
                images={question.question_images || []}
                isPdf={true}
                fontFamily={fontFamily}
              />
            </View>
            {question.type === "MCQ" && question.options && (
              <View style={styles.optionsRow}>
                {Object.entries(question.options).map(([key, value]) => (
                  <View key={key} style={styles.option}>
                    <Text style={styles.optionText}>
                      {key}) {value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.marks}>{`(${question.marks} marks)`}</Text>
        </View>
      </View>
    );
  };

  const renderQuestionsPage = () => (
    <Page size="A4" style={styles.page}>
      <Text style={styles.watermark}>{siteConfig.name}</Text>
      <View style={styles.section}>
        {renderHeader()}
        {groupedSections.map((section, sectionIndex) => (
          <View key={section.name || sectionIndex}>
            {isSectionWise && (
              <Text style={styles.sectionHeader}>
                Section {section.name} ({section.questionType})
              </Text>
            )}
            {section.questions.map((question, questionIndex) =>
              renderQuestion(question, sectionIndex, questionIndex)
            )}
          </View>
        ))}
      </View>
      <Text style={styles.footer}>All The Best!</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  );

  const renderAnswerKeyPage = () => (
    <Page size="A4" style={styles.page}>
      <Text style={styles.watermark}>{siteConfig.name}</Text>
      <View style={styles.section}>
        <Text style={styles.header}>Answer Key</Text>
        <Text style={styles.subHeader}>
          {subject} - {testTitle}
        </Text>
        {groupedSections.map((section, sectionIndex) => (
          <View key={section.name || sectionIndex}>
            {isSectionWise && (
              <Text style={styles.sectionHeader}>
                Section {section.name} ({section.questionType})
              </Text>
            )}
            {section.questions.map((question, questionIndex) => {
              return (
                <View key={question.id} style={styles.question}>
                  <Text style={styles.questionNumber}>
                    {questionIndex + 1}.{" "}
                  </Text>
                  <Text style={{ fontFamily }}>{question.question}</Text>
                  <Text>Answer:</Text>
                  <DynamicParagraph
                    content={
                      typeof question.answer === "string"
                        ? question.answer
                        : JSON.stringify(question.answer)
                    }
                    images={question.answer_images || []}
                    isPdf={true}
                    isAnswerKey={true}
                    fontFamily={fontFamily}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  );

  const renderMaterialPage = () => (
    <Page size="A4" style={styles.page}>
      <Text style={styles.watermark}>{siteConfig.name}</Text>
      <View style={styles.section}>
        {renderHeader()}
        {groupedSections.map((section, sectionIndex) => (
          <View key={section.name || sectionIndex}>
            {isSectionWise && (
              <Text style={styles.sectionHeader}>
                Section {section.name} ({section.questionType})
              </Text>
            )}
            {section.questions.map((question, questionIndex) => {
              return (
                <View key={question.id} style={styles.question}>
                  <View style={styles.questionRow}>
                    <View style={styles.questionContent}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        <Text style={styles.questionNumber}>
                          {questionIndex + 1}.{" "}
                        </Text>
                        <DynamicParagraph
                          content={question.question}
                          images={question.question_images || []}
                          isPdf={true}
                          fontFamily={fontFamily}
                        />
                      </View>
                      {question.type === "MCQ" && question.options && (
                        <View style={styles.optionsRow}>
                          {Object.entries(question.options).map(
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
                      <Text>Answer:</Text>
                      <DynamicParagraph
                        content={
                          typeof question.answer === "string"
                            ? question.answer
                            : JSON.stringify(question.answer)
                        }
                        images={question.answer_images || []}
                        isPdf={true}
                        isAnswerKey={true}
                        fontFamily={fontFamily}
                      />
                    </View>
                    <Text
                      style={styles.marks}
                    >{`(${question.marks} marks)`}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.footer}>All The Best!</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  );

  return (
    <Document>
      {format === "exam" && renderQuestionsPage()}
      {format === "examWithAnswer" && (
        <>
          {renderQuestionsPage()}
          {renderAnswerKeyPage()}
        </>
      )}
      {format === "material" && renderMaterialPage()}
    </Document>
  );
};

export function PdfDownload(props: PdfDownloadPropsExtended) {
  return (
    <div className="space-y-4">
      <PDFViewer width="100%" height={600} className="w-full">
        <MyDocument {...props} />
      </PDFViewer>
      <div className="flex justify-between">
        <PDFDownloadLink
          document={<MyDocument {...props} />}
          fileName={`exam_${props.format}_${
            props.teacherName
          }_${new Date().toLocaleDateString()}.pdf`}
        >
          <Button>Download PDF</Button>
        </PDFDownloadLink>
      </div>
    </div>
  );
}
