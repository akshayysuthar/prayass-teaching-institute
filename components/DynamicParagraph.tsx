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
    maxWidth: '100%',
    maxHeight: 200,
  },
  smallImage: {
    marginVertical: 5,
    maxWidth: '50%',
    maxHeight: 100,
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
            const imgSrc = images[imgIndex];
            const isSmallImage = imgSrc.includes('small'); // Assuming small images have 'small' in their URL
            return (
              <Image
                key={index}
                style={isSmallImage ? styles.smallImage : styles.image}
                src={imgSrc}
              />
            );
          }
        }
        return <Text key={index}>{part}</Text>;
      })}
    </View>
  );
};

