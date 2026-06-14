// ==========================================
// CorpPerks Manager App - Avatar Component
// ==========================================

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, BorderRadius } from '../utils/theme';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  style,
}) => {
  const getSize = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 44;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return FontSize.sm;
      case 'lg':
        return FontSize.xxl;
      case 'xl':
        return FontSize.xxxl;
      default:
        return FontSize.lg;
    }
  };

  const dimension = getSize();

  const getInitials = (): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: getFontSize() }]}>
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.backgroundDark,
  },
  placeholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
});

export default Avatar;
