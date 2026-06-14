import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrainingGap {
  metric: string;
  metricLabel: string;
  severity: 'high' | 'medium' | 'low';
  gapContext: string; // e.g. "Your food cost is 7% above peers"
  trainingModuleSlug: string;
  courseTitle: string;
  courseDuration: string;
}

interface TrainingNudgeNotificationProps {
  gap: TrainingGap;
  restaurantHubBaseUrl?: string;
}

const DISMISSED_KEY_PREFIX = 'training_nudge_dismissed_';

const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

export function TrainingNudgeNotification({
  gap,
  restaurantHubBaseUrl = 'https://hub.rez.app',
}: TrainingNudgeNotificationProps) {
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null);

  const storageKey = `${DISMISSED_KEY_PREFIX}${gap.trainingModuleSlug}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((val) => {
      setIsDismissed(val === 'true');
    });
  }, [storageKey]);

  async function handleDismiss() {
    await AsyncStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  }

  function handleOpen() {
    const url = `${restaurantHubBaseUrl}/training/${gap.trainingModuleSlug}`;
    Linking.openURL(url).catch(() => {
      // fallback — open home
      Linking.openURL(restaurantHubBaseUrl);
    });
  }

  // Not yet determined or dismissed — render nothing
  if (isDismissed !== false) return null;

  const accentColor = SEVERITY_COLORS[gap.severity];

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: accentColor }]}>
          {gap.severity === 'high' ? '⚠️' : gap.severity === 'medium' ? '📊' : '💡'}
        </Text>
        <Text style={styles.gapContext} numberOfLines={2}>
          {gap.gapContext}
        </Text>
        <Pressable onPress={handleDismiss} hitSlop={8} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.courseLabel}>{gap.courseDuration} fix available on REZ Hub</Text>
      <Text style={styles.courseTitle}>{gap.courseTitle}</Text>

      <Pressable style={[styles.ctaBtn, { backgroundColor: accentColor }]} onPress={handleOpen}>
        <Text style={styles.ctaText}>Start Course on REZ Hub →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
    marginTop: 2,
  },
  gapContext: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
  closeText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  courseLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  ctaBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
