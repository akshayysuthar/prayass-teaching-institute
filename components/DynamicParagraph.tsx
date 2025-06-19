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
  },
  image: {
    width: 200,
    height: "auto",
    maxHeight: 150,
    objectFit: "contain",
  },
  largeImage: {
    width: 400,
    height: "auto",
    maxHeight: 250,
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
  // If content is null, undefined, empty string, or empty object, show a placeholder
  if (!content || 
      (typeof content === 'object' && Object.keys(content).length === 0) || 
      (typeof content === "string" && content.trim() === "")) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>-</Text>
      </View>
    );
  }

  // If content is an object, stringify it
  const textContent = typeof content === 'object' ? JSON.stringify(content) : content;

  // Check if there's an image reference in the text
  const imgMatch = textContent.match(/\[img(\d+)\]/);
  const imageIndex = imgMatch ? parseInt(imgMatch[1], 10) - 1 : -1;

  return (
    <View style={styles.container}>
      {/* Always render text without the image tag */}
      <Text style={[styles.text, { fontFamily }]}>
        {textContent.replace(/\[img\d+\]/g, '').trim() || '-'}
      </Text>

      {/* Render image if referenced and exists */}
      {imageIndex >= 0 && images[imageIndex] && (
        <View style={styles.imageContainer}>
          <Image 
            style={isAnswerKey ? styles.largeImage : styles.image} 
            src={images[imageIndex]} 
          />
        </View>
      )}
    </View>
  );
};
