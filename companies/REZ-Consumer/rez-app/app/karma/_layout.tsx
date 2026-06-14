/**
 * Karma Tab Layout
 * Shared header and layout wrapper for all Karma screens.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'] as const;

interface KarmaHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function KarmaHeader({ title, subtitle, showBack, rightAction }: KarmaHeaderProps) {
  const router = useRouter();

  return (
    <LinearGradient colors={KARMA_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBack ? (
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/karma'))}
                style={styles.backButton}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
              </Pressable>
            ) : (
              <View style={styles.karmaIconBadge}>
                <Ionicons name="leaf" size={20} color={colors.text.inverse} />
              </View>
            )}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.headerRight}>{rightAction || <View style={{ width: 36 }} />}</View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function KarmaLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.md,
    minHeight: 56,
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  karmaIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.inverse,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
});
