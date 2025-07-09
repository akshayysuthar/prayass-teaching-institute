import React from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface DynamicParagraphProps {
  content: string | null | undefined;
  images?: string[];
  isPdf?: boolean;
  isAnswerKey?: boolean;
  fontFamily?: string;
  questionId?: string | number;
  context?: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  text: {
    fontSize: 11,
    marginBottom: 4,
  },
  imageContainer: {
    marginTop: 4,
    marginBottom: 4,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "space-evenly",
  },
  image: {
    width: 250,
    maxHeight: 160,
    objectFit: "contain",
  },
  largeImage: {
    width: 400,
    maxHeight: 300,
    objectFit: "contain",
  },
  placeholder: {
    fontSize: 11,
    color: "#666",
  },
});

export const DynamicParagraph: React.FC<DynamicParagraphProps> = ({
  content,
  images = [],
  isAnswerKey = false,
  fontFamily = "Helvetica", // fallback
  // questionId = "unknown",
  // context = "unknown",
}) => {
  const safeFontFamily =
    fontFamily && typeof fontFamily === "string" ? fontFamily : "Helvetica";

  if (
    content === null ||
    content === undefined ||
    (typeof content === "object" && Object.keys(content).length === 0) ||
    (typeof content === "string" && content.trim() === "") ||
    content === "null"
  ) {
    return (
      <View style={styles.container}>
        <Text style={{ ...styles.placeholder, fontFamily: safeFontFamily }}>
          -
        </Text>
      </View>
    );
  }

  const textContent =
    typeof content === "object" ? JSON.stringify(content) : content;

  const validImages = Array.isArray(images)
    ? images.filter(
        (img): img is string =>
          typeof img === "string" &&
          img.trim() !== "" &&
          !!(img.match(/^(https?:\/\/|\/|\.\/)/))
      )
    : [];
  const hasValidImages = validImages.length > 0;

  const parts = textContent.split(/(\[img\d+\])/g).filter(Boolean);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        const imgMatch = part.match(/^\[img(\d+)\]$/);
        if (imgMatch && hasValidImages) {
          const imageIndex = parseInt(imgMatch[1], 10) - 1;
          const imageSrc = validImages[imageIndex];

          if (!imageSrc || imageIndex >= validImages.length) {
            return (
              <Text
                key={`text-${index}`}
                style={[
                  styles.text,
                  { fontFamily: safeFontFamily, color: "#888" },
                ]}
              >
                [Missing Image]
              </Text>
            );
          }

          return (
            <View key={`img-${index}`} style={styles.imageContainer}>
              <Image
                src={imageSrc}
                style={isAnswerKey ? styles.largeImage : styles.image}
              />
            </View>
          );
        } else {
          return (
            <Text
              key={`text-${index}`}
              style={[styles.text, { fontFamily: safeFontFamily }]}
            >
              {part.trim()}
            </Text>
          );
        }
      })}
    </View>
  );
};
