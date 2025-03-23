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
  imageDefault: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 400,
    maxHeight: 80,
    objectFit: "contain",
  },
  imagePriority: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 700,
    maxHeight: 150,
    objectFit: "contain",
  },
  answerImageDefault: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 700,
    maxHeight: 120,
    objectFit: "contain",
  },
  answerImagePriority: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 750,
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
  imageMixed: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 300,
    maxHeight: 60,
    objectFit: "contain",
  },
  answerImageMixed: {
    marginVertical: 1,
    marginLeft: 0,
    alignSelf: "flex-start",
    width: 400,
    maxHeight: 80,
    objectFit: "contain",
  },
  errorText: {
    color: "#ff0000",
    fontSize: 10,
    marginVertical: 8,
  },
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 1,
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

  const renderImages = (imageIndices: number[], isMixed: boolean) => {
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
        if (isImageOnly && isPdf) {
          baseStyle = styles.answerImagePriority;
        } else if (isMixed) {
          baseStyle = styles.answerImageMixed;
        } else {
          baseStyle = styles.answerImageDefault;
        }
      } else {
        if (isImageOnly && isPdf) {
          baseStyle = styles.imagePriority;
        } else if (isMixed) {
          baseStyle = styles.imageMixed;
        } else {
          baseStyle = styles.imageDefault;
        }
      }
      const imageStyle = { ...baseStyle, marginRight: isAnswerKey ? 0 : 10 };
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
        const isMixed = parts
          .slice(index)
          .some(
            (p) =>
              p.trim() &&
              !p.match(/\[img\d+(?:\s+width=\d+)?(?:\s+height=\d+)?\]/)
          );
        const imageContainer = isAnswerKey ? (
          <View key={`images-${index}`}>
            {renderImages(imageIndices, isMixed)}
          </View>
        ) : (
          <View key={`images-${index}`} style={styles.imageRow}>
            {renderImages(imageIndices, isMixed)}
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
    const isMixed = false;
    const imageContainer = isAnswerKey ? (
      <View key={`images-end`}>{renderImages(imageIndices, isMixed)}</View>
    ) : (
      <View key={`images-end`} style={styles.imageRow}>
        {renderImages(imageIndices, isMixed)}
      </View>
    );
    elements.push(imageContainer);
  }

  return <View style={styles.paragraph}>{elements}</View>;
};
