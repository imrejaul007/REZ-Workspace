// ==========================================
// CorpPerks Client App - Avatar Component
// ==========================================

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../utils/theme';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 48;
      case 'xl':
        return 64;
      default:
        return 40;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return FontSize.sm;
      case 'lg':
        return FontSize.lg;
      case 'xl':
        return FontSize.xxl;
      default:
        return FontSize.md;
    }
  };

  const getInitials = () => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const dimension = getSize();

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
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.border,
  },
  placeholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
