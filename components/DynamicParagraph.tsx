import React from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface DynamicParagraphProps {
  content: string | undefined | null;
  images?: string[];
  isPdf?: boolean;
  isAnswerKey?: boolean;
  fontFamily?: string;
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
  fontFamily = "NotoSans",
}) => {
  if (
    !content ||
    (typeof content === "object" && Object.keys(content).length === 0) ||
    (typeof content === "string" && content.trim() === "")
  ) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>-</Text>
      </View>
    );
  }

  const textContent =
    typeof content === "object" ? JSON.stringify(content) : content;

  // Split content into parts: text and placeholders
  const parts = textContent.split(/(\[img\d+\])/g).filter(Boolean);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        const imgMatch = part.match(/^\[img(\d+)\]$/);
        if (imgMatch) {
          const imageIndex = parseInt(imgMatch[1], 10) - 1;
          const imageSrc = images[imageIndex];

          if (!imageSrc) return null;

          // Determine if image is at end or stand-alone
          const isLast = index === parts.length - 1;
          const isOnly = parts.length === 1;
          const useLargeImage = isLast || isOnly || isAnswerKey;

          return (
            <View key={`img-${index}`} style={styles.imageContainer}>
              <Image
                src={imageSrc}
                style={useLargeImage ? styles.largeImage : styles.image}
              />
            </View>
          );
        } else {
          return (
            <Text key={`text-${index}`} style={[styles.text, { fontFamily }]}>
              {part.trim()}
            </Text>
          );
        }
      })}
    </View>
  );
};
