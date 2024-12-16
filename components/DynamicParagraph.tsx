import React from 'react';
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';

interface DynamicParagraphProps {
  content: string;
  images: string[];
}

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 10,
  },
  image: {
    marginVertical: 5,
    maxWidth: '30%',
    maxHeight: 200,
  },
});

export const DynamicParagraph: React.FC<DynamicParagraphProps> = ({ content, images }) => {
  const parts = content.split(/(\[img\d+\])/g);

  return (
    <View style={styles.paragraph}>
      {parts.map((part, index) => {
        const match = part.match(/\[img(\d+)\]/);
        if (match) {
          const imgIndex = parseInt(match[1], 10) - 1;
          if (images[imgIndex]) {
            return <Image key={index} style={styles.image} src={images[imgIndex]} />;
          }
        }
        return <Text key={index}>{part}</Text>;
      })}
    </View>
  );
};

