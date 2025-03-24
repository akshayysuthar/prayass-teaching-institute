import React from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface DynamicParagraphProps {
  content: string;
  images: string[];
  isPdf?: boolean;
  isAnswerKey?: boolean;
  fontFamily?: string;
}

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 12,
    fontSize: 11,
  },
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 5,
    alignItems: "center",
  },
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 5,
  },
  imageLabel: {
    fontSize: 10,
    marginRight: 5,
    color: "#555",
  },
  imageDefault: {
    width: 250, // Reduced to fit multiple in a row
    maxHeight: 100,
    objectFit: "contain",
  },
  imagePriority: {
    width: 300, // Larger for image-only content
    maxHeight: 150,
    objectFit: "contain",
  },
  answerImageDefault: {
    width: 400, // Slightly larger for answers
    maxHeight: 220,
    objectFit: "contain",
  },
  answerImagePriority: {
    width: 550, // Larger for answer key image-only
    maxHeight: 300,
    objectFit: "contain",
  },
  smallImage: {
    width: 200,
    maxHeight: 90,
    objectFit: "contain",
  },
  errorText: {
    color: "#ff0000",
    fontSize: 10,
    marginVertical: 8,
  },
});

export const DynamicParagraph: React.FC<DynamicParagraphProps> = ({
  content,
  images,
  isPdf = true,
  isAnswerKey = false,
  fontFamily,
}) => {
  const parts = content.split(
    /(\[img\d+(?:\s+width=\d+)?(?:\s+height=\d+)?\])/g
  );
  const isImageOnly =
    parts.length === 1 &&
    parts[0].match(/\[img\d+(?:\s+width=\d+)?(?:\s+height=\d+)?\]/);

  const renderImages = (imageIndices: number[]) => {
    return imageIndices.map((imgIndex, idx) => {
      if (!images[imgIndex]) {
        return (
          <Text key={idx} style={styles.errorText}>
            [Image {imgIndex + 1} not found]
          </Text>
        );
      }
      const imgSrc = images[imgIndex];
      const isSmallImage = imgSrc.includes("small");
      let baseStyle;

      if (isSmallImage) {
        baseStyle = styles.smallImage;
      } else if (isAnswerKey) {
        baseStyle =
          isImageOnly && isPdf
            ? styles.answerImagePriority
            : styles.answerImageDefault;
      } else {
        baseStyle =
          isImageOnly && isPdf ? styles.imagePriority : styles.imageDefault;
      }

      return (
        <View key={idx} style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Img {idx + 1}</Text>
          <Image style={baseStyle} src={imgSrc} />
        </View>
      );
    });
  };

  const elements: React.ReactNode[] = [];
  let imageIndices: number[] = [];

  parts.forEach((part, index) => {
    const match = part.match(/\[img(\d+)(?:\s+width=\d+)?(?:\s+height=\d+)?\]/);
    if (match) {
      const imgIndex = parseInt(match[1], 10) - 1;
      imageIndices.push(imgIndex);
    } else if (part.trim()) {
      if (imageIndices.length > 0) {
        const imageContainer = (
          <View key={`images-${index}`} style={styles.imageRow}>
            {renderImages(imageIndices)}
          </View>
        );
        elements.push(imageContainer);
        imageIndices = [];
      }
      elements.push(
        <Text key={index} style={{ fontFamily: fontFamily || "NotoSans" }}>
          {part}
        </Text>
      );
    }
  });

  if (imageIndices.length > 0) {
    const imageContainer = (
      <View key={`images-end`} style={styles.imageRow}>
        {renderImages(imageIndices)}
      </View>
    );
    elements.push(imageContainer);
  }

  return <View style={styles.paragraph}>{elements}</View>;
};
