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
import type { PdfDownloadProps } from "@/types";
import { DynamicParagraph } from "./DynamicParagraph";
import type { Question, ExamStructure } from "@/types";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 15,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
  },
  question: {
    fontSize: 10,
    marginBottom: 5,
  },
  questionNumber: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  answerKey: {
    marginTop: 20,
    borderTop: 1,
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 30,
    left: 0,
    right: 4,
    textAlign: "right",
    color: "grey",
  },
  Footer: {
    textAlign: "center",
  },
  headerContainer: {
    marginBottom: 20,
    width: "100%",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    width: "50%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    textDecoration: "underline",
  },
  date: {
    fontSize: 12,
    color: "#555",
    textAlign: "right",
    width: "25%",
  },
  leftColumn: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
  },
  rightColumn: {
    flex: 1,
    width: "25%",
    fontSize: 12,
    textAlign: "right",
    fontWeight: "bold",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  option: {
    marginRight: 10,
    marginBottom: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  optionText: {
    fontSize: 12,
  },
  marksText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 5,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
});

const getFormattedDate = () => {
  if (typeof window !== "undefined") {
    return new Date().toLocaleDateString();
  }
  return "";
};

const formattedDate = getFormattedDate();

// Group questions by their section type
const groupQuestionsBySection = (
  questions: Question[],
  examStructure: ExamStructure,
  isSectionWise: boolean
) => {
  if (!isSectionWise) {
    return [{ name: "", questionType: "All Questions", questions }];
  }

  // Create a map of all sections from the exam structure
  const sectionMap = examStructure.sections.reduce((acc, section) => {
    acc[section.questionType] = {
      ...section,
      questions: [],
    };
    return acc;
  }, {} as Record<string, any>);

  // Add each question to its corresponding section
  questions.forEach((question) => {
    const sectionType = question.type || "Other";

    // If this question type isn't in our structure yet, add it
    if (!sectionMap[sectionType]) {
      const newSectionName = String.fromCharCode(
        65 + Object.keys(sectionMap).length
      );
      sectionMap[sectionType] = {
        name: newSectionName,
        questionType: sectionType,
        questions: [],
      };
    }

    sectionMap[sectionType].questions.push(question);
  });

  return Object.values(sectionMap).filter(
    (section) => section.questions.length > 0
  );
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
}: PdfDownloadProps) => {
  const groupedSections = groupQuestionsBySection(
    selectedQuestions,
    examStructure,
    isSectionWise
  );
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.headerContainer}>
            <View style={styles.row}>
              <Text style={styles.header}>{instituteName}</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.leftColumn}>STD n School: {standard}</Text>
              <Text style={styles.rightColumn}>Subject: {subject}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.leftColumn}>Chapter: Ch {chapters}</Text>
              <Text style={styles.rightColumn}>
                Student Name: {studentName}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.leftColumn}>Teacher Name: {teacherName}</Text>
              <Text style={styles.rightColumn}>Total Marks: {totalMarks}</Text>
            </View>
          </View>

          {groupedSections.map((section, sectionIndex) => (
            <View key={section.questionType}>
              {isSectionWise && (
                <Text style={styles.sectionHeader}>
                  Section {section.name} ({section.questionType})
                </Text>
              )}

              {section.questions.map((question, index) => (
                <View key={question.id} style={styles.question}>
                  <Text style={styles.questionNumber}>
                    {`${isSectionWise ? section.name : ""}${
                      isSectionWise ? "." : ""
                    }${index + 1}. `}
                    <DynamicParagraph
                      content={question.question}
                      images={question.question_images || []}
                    />
                    {` (${question.marks} marks)`}
                  </Text>

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
              ))}
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

              {section.questions.map((question, index) => (
                <View key={question.id} style={styles.question}>
                  <Text style={styles.questionNumber}>
                    {`${isSectionWise ? section.name : ""}${
                      isSectionWise ? "." : ""
                    }${index + 1}. ${question.question}`}
                  </Text>

                  <Text>Answer:</Text>
                  <DynamicParagraph
                    content={
                      typeof question.answer === "string"
                        ? question.answer
                        : JSON.stringify(question.answer)
                    }
                    images={question.answer_images || []}
                  />
                </View>
              ))}
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

export function PdfDownload(props: PdfDownloadProps) {
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
