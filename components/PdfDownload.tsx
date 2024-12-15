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
  Image,
} from "@react-pdf/renderer";
import { PdfDownloadProps, Question } from "@/types";

// Create styles
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
    marginBottom: 10,
  },
  image: {
    minWidth: "15%",
    maxWidth: "50%",
    maxHeight: 200,
    marginVertical: 10,
  },
  answerKey: {
    marginTop: 20,
    borderTop: 1,
    paddingTop: 10,
  },
});

// Create Document Component
const MyDocument = ({
  selectedQuestions,
  instituteName,
  standard,
  subject,
  totalMarks,
}: PdfDownloadProps) => (
  <Document>
    {/* Question Paper */}
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
            <Text>{`${index + 1}. ${question.question} (${
              question.marks
            } marks)`}</Text>
            {question.questionImages &&
              question.questionImages.map((image, imgIndex) => (
                <Image key={imgIndex} style={styles.image} src={image} />
              ))}
          </View>
        ))}

        <Text style={styles.subHeader}>All The Best!</Text>
      </View>
    </Page>

    {/* Answer Key */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Answer Key</Text>

        {selectedQuestions.map((question, index) => (
          <View key={question.id} style={styles.question}>
            <Text>{`${index + 1}. ${question.question}`}</Text>
            <Text>{`Answer: ${question.answer}`}</Text>
            {question.answer_images &&
              question.answer_images.map((image, imgIndex) => (
                <Image key={imgIndex} style={styles.image} src={image} />
              ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export function PdfDownload(props: PdfDownloadProps) {
  return (
    <div className="space-y-4">
      {/* PDF Viewer */}
      <PDFViewer width="100%" height={600}>
        <MyDocument {...props} />
      </PDFViewer>

      {/* Download Button */}
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
