import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  style,
}) => {
  const { colors, typography } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 44;
      case 'large':
        return 64;
      case 'xlarge':
        return 96;
      default:
        return 44;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 16;
      case 'large':
        return 24;
      case 'xlarge':
        return 36;
      default:
        return 16;
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const sizeValue = getSize();

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
        />
      ) : name ? (
        <Text
          style={[
            styles.initials,
            {
              fontSize: getFontSize(),
              color: colors.white,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <View style={[styles.placeholder, { width: sizeValue, height: sizeValue }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: 'transparent',
  },
});
