import { Button } from "@/components/ui/button";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import type { PdfDownloadProps, Question, ExamStructure } from "@/types";
import { DynamicParagraph } from "./DynamicParagraph";

interface PdfDownloadPropsExtended extends PdfDownloadProps {
  fontSize: number; // Added for dynamic font size
}

const createStyles = (fontSize: number) =>
  StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 40,
      fontFamily: "Helvetica",
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    headerContainer: {
      marginBottom: 25,
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: 10,
    },
    row: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      width: "100%",
    },
    header: {
      fontSize: fontSize + 7, // Adjusted based on input
      fontWeight: "bold",
      textDecoration: "underline",
      textAlign: "center",
    },
    date: {
      fontSize: fontSize,
      color: "#555",
      textAlign: "right",
    },
    leftColumn: {
      fontSize: fontSize,
      fontWeight: "bold",
    },
    rightColumn: {
      fontSize: fontSize,
      textAlign: "right",
      fontWeight: "bold",
    },
    sectionHeader: {
      fontSize: fontSize + 3,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 15,
      marginBottom: 10,
      backgroundColor: "#f0f0f0",
      padding: 5,
    },
    question: {
      fontSize: fontSize,
      marginBottom: 8,
      width: "100%",
    },
    questionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    questionContent: {
      flex: 1,
      marginRight: 10,
    },
    marks: {
      width: 60,
      textAlign: "right",
      fontSize: fontSize,
    },
    questionNumber: {
      fontWeight: "bold",
    },
    optionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 5,
      marginBottom: 10,
    },
    option: {
      marginRight: 15,
      marginBottom: 5,
      padding: 5,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 4,
      backgroundColor: "#fafafa",
    },
    optionText: {
      fontSize: fontSize,
    },
    Footer: {
      textAlign: "center",
      fontSize: fontSize - 1,
      color: "#666",
      marginTop: 20,
    },
    pageNumber: {
      position: "absolute",
      fontSize: fontSize - 2,
      bottom: 15,
      right: 20,
      color: "grey",
    },
  });

const getFormattedDate = () => {
  if (typeof window !== "undefined") {
    return new Date().toLocaleDateString();
  }
  return "";
};

const formattedDate = getFormattedDate();

const groupQuestionsBySection = (
  questions: (Question & { sectionId: number })[],
  examStructure: ExamStructure,
  isSectionWise: boolean
) => {
  if (!isSectionWise) {
    return [{ name: "", questionType: "All Questions", questions }];
  }

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
  studentName,
  subject,
  chapters,
  teacherName,
  isSectionWise,
  fontSize,
}: PdfDownloadPropsExtended) => {
  const styles = createStyles(fontSize);
  const groupedSections = groupQuestionsBySection(
    selectedQuestions as (Question & { sectionId: number })[],
    examStructure,
    isSectionWise
  );
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  let globalQuestionNumber = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>{instituteName}</Text>
            <View style={styles.row}>
              <Text style={styles.leftColumn}>STD & School: {standard}</Text>
              <Text style={styles.rightColumn}>Subject: {subject}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.leftColumn}>Chapter: {chapters}</Text>
              <Text style={styles.rightColumn}>
                Student: {studentName || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.leftColumn}>Teacher: {teacherName}</Text>
              <Text style={styles.rightColumn}>Marks: {totalMarks}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
          </View>

          {groupedSections.map((section) => (
            <View key={section.questionType}>
              {isSectionWise && (
                <Text style={styles.sectionHeader}>
                  Section {section.name} ({section.questionType})
                </Text>
              )}
              {section.questions.map((question) => {
                globalQuestionNumber += 1;
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
        <Text style={styles.Footer}>All The Best!</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

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
                    <Text style={styles.questionNumber}>
                      {questionNumber}.{" "}
                    </Text>
                    <Text>{question.question}</Text>
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
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export function PdfDownload(props: PdfDownloadPropsExtended) {
  return (
    <div className="space-y-4">
      <PDFViewer width="100%" height={600}>
        <MyDocument {...props} />
      </PDFViewer>
      <div className="flex justify-between">
        <PDFDownloadLink
          document={<MyDocument {...props} />}
          fileName="exam_paper.pdf"
        >
          <Button>Download PDF</Button>
        </PDFDownloadLink>
      </div>
    </div>
  );
}
