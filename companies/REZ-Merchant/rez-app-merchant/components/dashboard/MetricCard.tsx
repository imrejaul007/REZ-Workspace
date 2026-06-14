/**
 * MetricCard — extracted from app/(dashboard)/index.tsx
 *
 * Renders a single metric tile with icon, value, title, and trend indicator.
 */

import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Typography } from '@/constants/DesignTokens';
import { Caption, BodyText, Heading2 } from '@/components/ui/DesignSystemComponents';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  index: number;
}

export default function MetricCard({
  title,
  value,
  icon,
  color,
  change,
  index,
}: MetricCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={metricStyles.wrapper}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
        style={metricStyles.gradient}
      >
        <View style={metricStyles.content}>
          <View style={[metricStyles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as unknown} size={24} color={color} />
          </View>
          <Caption style={metricStyles.title}>{title}</Caption>
          <Heading2 style={[metricStyles.value, { color: Colors.text.primary }]}>
            {typeof value === 'number' && title.includes('Revenue')
              ? `₹${value.toLocaleString()}`
              : value.toLocaleString()}
          </Heading2>
          <View style={metricStyles.changeContainer}>
            {change ? (
              <>
                <Ionicons
                  name={change.includes('+') ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={change.includes('+') ? Colors.success[500] : Colors.error[500]}
                />
                <BodyText
                  style={{
                    color: change.includes('+') ? Colors.success[500] : Colors.error[500],
                    fontSize: Typography.fontSize.xs,
                    fontWeight: '600',
                    marginLeft: 4,
                  }}
                >
                  {change}
                </BodyText>
              </>
            ) : (
              <BodyText
                style={{
                  color: Colors.text.tertiary,
                  fontSize: Typography.fontSize.xs,
                  fontWeight: '600',
                }}
              >
                No change
              </BodyText>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const metricStyles = {
  wrapper: {
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  gradient: {
    borderRadius: 16,
  },
  content: {
    padding: 16,
    alignItems: 'flex-start' as const,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  title: {
    marginBottom: 4,
    color: Colors.text.secondary,
  },
  value: {
    marginBottom: 6,
  },
  changeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 2,
  },
};
