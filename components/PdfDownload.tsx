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
  fontSize: number;
  format: "exam" | "examWithAnswer" | "material";
  pagePadding?: number;
  sectionMargin?: number;
  sectionPadding?: number;
  questionSpacing?: number;
  questionLeftMargin?: number;
  schoolName?: string;
}

const getFontFamily = (subject: string) => {
  return subject.toLowerCase().includes("gujarati")
    ? "NotoSansGujarati"
    : "NotoSans";
};

const createStyles = (
  fontSize: number,
  subject: string,
  pagePadding: number = 5,
  sectionMargin: number = 5,
  sectionPadding: number = 5,
  questionSpacing: number = 10,
  questionLeftMargin: number = 10
) => {
  const fontFamily = getFontFamily(subject);
  return StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: pagePadding,
      fontFamily: "NotoSans",
      borderColor: "#000",
    },
    section: { margin: sectionMargin, padding: sectionPadding, flexGrow: 1 },
    headerContainer: {
      marginBottom: sectionMargin,
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: sectionPadding,
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
      fontSize: fontSize + 7,
      fontWeight: "bold",
      textDecoration: "underline",
      textAlign: "center",
    },
    date: { fontSize: fontSize, color: "#555", textAlign: "right" },
    leftColumn: { fontSize: fontSize, fontWeight: "bold" },
    rightColumn: { fontSize: fontSize, textAlign: "right", fontWeight: "bold" },
    sectionHeader: {
      fontSize: fontSize + 3,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: sectionMargin,
      marginBottom: sectionMargin,
      backgroundColor: "#f0f0f0",
      padding: sectionPadding,
    },
    question: {
      fontSize: fontSize,
      marginBottom: questionSpacing,
      width: "100%",
    },
    questionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: questionSpacing,
    },
    questionContent: {
      flex: 1,
      marginLeft: questionLeftMargin,
      marginRight: 8,
      fontFamily,
    },
    marks: { width: 60, textAlign: "right", fontSize: fontSize },
    questionNumber: { fontWeight: "bold" },
    optionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 5, // Increased to give space for images
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
    optionText: { fontSize: fontSize },
    footer: {
      textAlign: "center",
      fontSize: fontSize - 1,
      color: "#666",
      marginTop: 15,
    },
    pageNumber: {
      position: "absolute",
      fontSize: fontSize - 2,
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
  questions: (Question & { sectionId: number })[],
  examStructure: ExamStructure,
  isSectionWise: boolean
) => {
  if (!isSectionWise)
    return [{ name: "", questionType: "All Questions", questions }];
  const grouped: Array<{
    name: string;
    questionType: string;
    questions: (Question & { sectionId: number })[];
  }> = [];
  examStructure.sections.forEach((section, index) => {
    const sectionQuestions = questions.filter((q) => q.sectionId === index);
    if (sectionQuestions.length > 0) {
      grouped.push({
        name: section.name,
        questionType: section.questionType,
        questions: sectionQuestions,
      });
    }
  });
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
  teacherName,
  isSectionWise,
  fontSize,
  format,
  pagePadding = 5,
  sectionMargin = 5,
  sectionPadding = 5,
  questionSpacing = 10,
  questionLeftMargin = 10,
}: PdfDownloadPropsExtended) => {
  const styles = createStyles(
    fontSize,
    subject,
    pagePadding,
    sectionMargin,
    sectionPadding,
    questionSpacing,
    questionLeftMargin
  );
  const groupedSections = groupQuestionsBySection(
    selectedQuestions as (Question & { sectionId: number })[],
    examStructure,
    isSectionWise
  );
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  const fontFamily = getFontFamily(subject);
  const formattedDate = getFormattedDate();
  const formattedChapters = formatChapters(selectedQuestions, chapters);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>{instituteName}</Text>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>
          STD: {standard} & {schoolName || ""}
        </Text>
        <Text style={styles.rightColumn}>Subject: {subject}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>Chapter: {formattedChapters}</Text>
        <Text style={styles.rightColumn}>Student: {studentName || ""}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.leftColumn}>Teacher: {teacherName}</Text>
        <Text style={styles.rightColumn}>Marks: {totalMarks}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </View>
  );

  const renderQuestion = (question: Question) => {
    globalQuestionNumber++;
    return (
      <View key={question.id} style={styles.question}>
        <View style={styles.questionRow}>
          <View style={styles.questionContent}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={styles.questionNumber}>
                {globalQuestionNumber}.{" "}
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

  let globalQuestionNumber = 0;

  const renderQuestionsPage = () => (
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        {renderHeader()}
        {groupedSections.map((section) => (
          <View key={section.questionType}>
            {isSectionWise && (
              <Text style={styles.sectionHeader}>
                Section {section.name} ({section.questionType})
              </Text>
            )}
            {section.questions.map(renderQuestion)}
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
      <View style={styles.section}>
        <Text style={styles.header}>Answer Key</Text>
        {groupedSections.map((section, sectionIndex) => (
          <View key={section.questionType}>
            {isSectionWise && (
              <Text style={styles.sectionHeader}>
                Section {section.name} ({section.questionType})
              </Text>
            )}
            {section.questions.map((question, index) => {
              const questionNumber =
                groupedSections
                  .slice(0, sectionIndex)
                  .reduce((sum, sec) => sum + sec.questions.length, 0) +
                index +
                1;
              return (
                <View key={question.id} style={styles.question}>
                  <Text style={styles.questionNumber}>{questionNumber}. </Text>
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
      <View style={styles.section}>
        {renderHeader()}
        {groupedSections.map((section) => (
          <View key={section.questionType}>
            {isSectionWise && (
              <Text style={styles.sectionHeader}>
                Section {section.name} ({section.questionType})
              </Text>
            )}
            {section.questions.map((question) => {
              globalQuestionNumber++;
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
                          {globalQuestionNumber}.{" "}
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
