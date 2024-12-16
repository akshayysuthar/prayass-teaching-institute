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
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 10,
  },
  question: {
    marginBottom: 20,
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
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
});

const MyDocument = ({
  selectedQuestions,
  instituteName,
  standard,
  subject,
  // date,
  totalMarks,
}: // customContent,
PdfDownloadProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>{instituteName}</Text>
        <Text style={styles.subHeader}>
          Standard: {standard} | Subject: {subject}
        </Text>
        <Text style={styles.subHeader}>
          Date: {} | Total Marks: {totalMarks}
        </Text>

        {selectedQuestions.map((question, index) => (
          <View key={question.id} style={styles.question}>
            <Text style={styles.questionNumber}>{`${index + 1}. (${
              question.marks
            } marks)`}</Text>
            <DynamicParagraph
              content={question.question}
              images={question.questionImages || []}
            />
          </View>
        ))}

        <Text style={styles.subHeader}>All The Best!</Text>
      </View>
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
