import React from "react";
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
import { PdfDownloadProps } from "@/types";
import { DynamicParagraph } from "./DynamicParagraph";

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
    justifyContent: "space-between", // Places content at both ends
    alignItems: "center", // Vertically centers items
    marginBottom: 5,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    textDecoration: "underline",
  },
  date: {
    fontSize: 12, // Smaller font size
    color: "#555", // Optional: Grey text color for a subtle look
    textAlign: "right", // Align text to the right
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
    flexDirection: "row", // Arrange options in a row
    flexWrap: "wrap", // Allow wrapping if too many options
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
});

// Prayass Teaching Institute
// STD n School:                   Subject:
// Chapter:                        Students Name:
// Teacher Name:

const getFormattedDate = () => {
  if (typeof window !== "undefined") {
    return new Date().toLocaleDateString();
  }
  return ""; // Default fallback for SSR
};

const formattedDate = getFormattedDate();

const MyDocument = ({
  selectedQuestions,
  instituteName,
  standard,
  studentName,
  subject,
  chapters,
  teacherName,
}: // date,
// totalMarks,
// customContent,
PdfDownloadProps) => (
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
            <Text style={styles.rightColumn}>Student Name: {studentName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.leftColumn}>Teacher Name: {teacherName}</Text>
          </View>
        </View>

        {selectedQuestions.map((question, index) => (
          <View key={question.id} style={styles.question}>
            <Text style={styles.questionNumber}>
              {`${index + 1}. `}
              <DynamicParagraph
                content={question.question}
                images={question.question_images || []}
              />
              {` (${question.marks} marks)`}
            </Text>

            {/* If the question is MCQ, render the options in a row */}
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

            {/* Render answer for non-MCQ or other types of questions */}
            {/* {question.answer && (
              <View style={styles.answer}>
                <Text style={styles.answerText}>Answer: {question.answer}</Text>
              </View>
            )} */}
          </View>
        ))}
      </View>
      <Text style={styles.Footer}>All The Best!</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Answer Key</Text>

        {selectedQuestions.map((question, index) => (
          <View key={question.id} style={styles.question}>
            <Text style={styles.questionNumber}>{`${index + 1}. ${
              question.question
            }`}</Text>

            {/* Render options for MCQ questions
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
            )} */}

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

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
);

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
