/**
 * QuickActionButton — extracted from app/(dashboard)/index.tsx
 *
 * Renders a quick action card with gradient icon, title, and tap handler.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { BodyText } from '@/components/ui/DesignSystemComponents';

interface QuickActionButtonProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  index: number;
}

export default function QuickActionButton({
  title,
  icon,
  color,
  onPress,
  index,
}: QuickActionButtonProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).springify()}
      style={qaStyles.wrapper}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)']}
          style={qaStyles.card}
        >
          <View style={qaStyles.content}>
            <LinearGradient colors={[`${color}30`, `${color}15`]} style={qaStyles.iconBg}>
              <Ionicons name={icon as unknown} size={32} color={color} />
            </LinearGradient>
            <BodyText style={qaStyles.title as unknown}>{title}</BodyText>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const qaStyles = {
  wrapper: {
    marginRight: 12,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  content: {
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center' as const,
    color: '#374151',
  },
};
