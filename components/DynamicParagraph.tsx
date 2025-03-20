import React from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface DynamicParagraphProps {
  content: string;
  images: string[];
  isPdf?: boolean;
  isAnswerKey?: boolean;
}

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 12,
    fontSize: 11,
  },
  imageDefault: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 400, // Default for questions
    maxHeight: 80,
    objectFit: "contain",
  },
  imagePriority: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 700, // Priority for image-only in questions
    maxHeight: 150,
    objectFit: "contain",
  },
  answerImageDefault: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 700, // Default for answer key
    maxHeight: 120,
    objectFit: "contain",
  },
  answerImagePriority: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 750, // Priority for image-only in answer key
    maxHeight: 200,
    objectFit: "contain",
  },
  smallImage: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 300,
    maxHeight: 60,
    objectFit: "contain",
  },
  errorText: {
    color: "#ff0000",
    fontSize: 10,
    marginVertical: 8,
  },
  imageRow: {
    flexDirection: "row", // Display images in a row for questions
    flexWrap: "wrap", // Wrap to next line if needed
    marginVertical: 1,
  },
});

export const DynamicParagraph: React.FC<DynamicParagraphProps> = ({
  content,
  images,
  isPdf = true,
  isAnswerKey = false,
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
      const baseStyle = isSmallImage
        ? styles.smallImage
        : isAnswerKey
        ? isImageOnly && isPdf
          ? styles.answerImagePriority
          : styles.answerImageDefault
        : isImageOnly && isPdf
        ? styles.imagePriority
        : styles.imageDefault;

      const imageStyle = {
        ...baseStyle,
        marginRight: isAnswerKey ? 0 : 10, // Space between images in row for questions
      };

      return <Image key={idx} style={imageStyle} src={imgSrc} />;
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
        const imageContainer = isAnswerKey ? (
          <View key={`images-${index}`}>{renderImages(imageIndices)}</View>
        ) : (
          <View key={`images-${index}`} style={styles.imageRow}>
            {renderImages(imageIndices)}
          </View>
        );
        elements.push(imageContainer);
        imageIndices = [];
      }
      elements.push(<Text key={index}>{part}</Text>);
    }
  });

  if (imageIndices.length > 0) {
    const imageContainer = isAnswerKey ? (
      <View key={`images-end`}>{renderImages(imageIndices)}</View>
    ) : (
      <View key={`images-end`} style={styles.imageRow}>
        {renderImages(imageIndices)}
      </View>
    );
    elements.push(imageContainer);
  }

  return <View style={styles.paragraph}>{elements}</View>;
};
