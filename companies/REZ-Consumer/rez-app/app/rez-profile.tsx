/**
 * REZ Profile - "What REZ Knows About You"
 *
 * Philosophy: Transparency builds trust. Show users what REZ knows.
 *
 * This screen serves dual purposes:
 * 1. Trust-building through transparency
 * 2. User control over their data and preferences
 *
 * Users can see:
 * - All collected memories
 * - Preferences derived from behavior
 * - Data sources REZ uses
 * - Control over personalization
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useMemoryContinuity, MemoryEntry } from '@/hooks/useMemoryContinuity';

// ============================================================================
// TYPES
// ============================================================================

interface PreferenceSection {
  id: string;
  title: string;
  icon: string;
  items: PreferenceItem[];
}

interface PreferenceItem {
  id: string;
  label: string;
  value: string;
  confidence: number;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const DATA_SOURCES: DataSource[] = [
  {
    id: 'location',
    name: 'Location Data',
    description: 'Used to find nearby deals and restaurants',
    enabled: true,
  },
  {
    id: 'behavior',
    name: 'Shopping Behavior',
    description: 'Used to personalize recommendations',
    enabled: true,
  },
  {
    id: 'social',
    name: 'Social Connections',
    description: 'Used for friend activity and group buying',
    enabled: true,
  },
  {
    id: 'transactions',
    name: 'Transaction History',
    description: 'Used to calculate savings and cashback',
    enabled: true,
  },
  {
    id: 'dining',
    name: 'Dining Preferences',
    description: 'Used to recommend restaurants',
    enabled: true,
  },
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Used to send contextual alerts',
    enabled: true,
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface MemorySectionProps {
  memories: MemoryEntry[];
  category: string;
  categoryLabel: string;
  icon: string;
}

function MemorySection({ memories, category, categoryLabel, icon }: MemorySectionProps) {
  const categoryMemories = memories.filter((m) => m.category === category);

  if (categoryMemories.length === 0) return null;

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High confidence';
    if (confidence >= 0.7) return 'Good confidence';
    return 'Learning';
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{categoryLabel}</Text>
        <Text style={styles.sectionCount}>{categoryMemories.length}</Text>
      </View>

      {categoryMemories.map((memory) => (
        <View key={memory.id} style={styles.memoryItem}>
          <View style={styles.memoryContent}>
            <Text style={styles.memoryStatement}>{memory.statement}</Text>
            <Text style={styles.memoryEvidence}>{memory.evidence}</Text>
          </View>
          <View style={styles.memoryMeta}>
            <View
              style={[
                styles.confidenceBadge,
                {
                  backgroundColor:
                    memory.confidence >= 0.9
                      ? colors.success + '20'
                      : memory.confidence >= 0.7
                      ? colors.brand.primary + '20'
                      : colors.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.confidenceText,
                  {
                    color:
                      memory.confidence >= 0.9
                        ? colors.success
                        : memory.confidence >= 0.7
                        ? colors.brand.primary
                        : colors.warning,
                  },
                ]}
              >
                {getConfidenceLabel(memory.confidence)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

interface DataSourceToggleProps {
  source: DataSource;
  onToggle: (id: string, enabled: boolean) => void;
}

function DataSourceToggle({ source, onToggle }: DataSourceToggleProps) {
  const [enabled, setEnabled] = useState(source.enabled);

  const handleToggle = useCallback(
    (value: boolean) => {
      setEnabled(value);
      onToggle(source.id, value);
    },
    [onToggle, source.id]
  );

  return (
    <Animated.View entering={FadeInRight.delay(100).duration(300)} style={styles.dataSource}>
      <View style={styles.dataSourceInfo}>
        <Text style={styles.dataSourceName}>{source.name}</Text>
        <Text style={styles.dataSourceDescription}>{source.description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.background.tertiary, true: colors.success + '60' }}
        thumbColor={enabled ? colors.success : colors.text.tertiary}
      />
    </Animated.View>
  );
}

interface InsightCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

function InsightCard({ title, value, subtitle, icon, color }: InsightCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={[styles.insightCard, { backgroundColor: color + '15' }]}>
      <Text style={styles.insightIcon}>{icon}</Text>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightSubtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RezProfile() {
  const router = useRouter();
  const { memories, profile } = useMemoryContinuity();
  const [dataSources, setDataSources] = useState(DATA_SOURCES);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  const handleDataToggle = useCallback((id: string, enabled: boolean) => {
    if (!enabled) {
      Alert.alert(
        'Disable Data Collection?',
        `Disabling ${id} may reduce the quality of your recommendations.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive' },
        ]
      );
    }
    setDataSources((prev) =>
      prev.map((source) => (source.id === id ? { ...source, enabled } : source))
    );
  }, []);

  const handleResetMemory = useCallback(() => {
    Alert.alert(
      'Reset REZ Memory?',
      'This will clear all learned preferences. Your account and rewards will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // In production: call API to reset memory
            Alert.alert('Memory Reset', 'REZ will start learning about you again.');
          },
        },
      ]
    );
  }, []);

  const memoryStats = {
    total: memories.length,
    highConfidence: memories.filter((m) => m.confidence >= 0.8).length,
    lastUpdated: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>REZ Knows You</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.intro}>
          <Text style={styles.introEmoji}>🧠</Text>
          <Text style={styles.introTitle}>What REZ Learned About You</Text>
          <Text style={styles.introText}>
            REZ uses these insights to personalize your experience. You can update or clear
            them anytime.
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <InsightCard
            title="Memories"
            value={memoryStats.total.toString()}
            subtitle="collected"
            icon="💾"
            color={colors.brand.primary}
          />
          <InsightCard
            title="High Confidence"
            value={memoryStats.highConfidence.toString()}
            subtitle="verified"
            icon="✅"
            color={colors.success}
          />
          <InsightCard
            title="Last Updated"
            value={memoryStats.lastUpdated}
            subtitle="today"
            icon="📅"
            color="#6366F1"
          />
        </View>

        {/* Personalization Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.personalizationCard}>
          <View style={styles.personalizationHeader}>
            <View>
              <Text style={styles.personalizationTitle}>AI Personalization</Text>
              <Text style={styles.personalizationSubtitle}>
                Power all intelligent features
              </Text>
            </View>
            <Switch
              value={personalizationEnabled}
              onValueChange={setPersonalizationEnabled}
              trackColor={{
                false: colors.background.tertiary,
                true: colors.brand.primary + '60',
              }}
              thumbColor={personalizationEnabled ? colors.brand.primary : colors.text.tertiary}
            />
          </View>
          <Text style={styles.personalizationWarning}>
            ⚠️ Disabling will reduce recommendation quality and may affect your rewards.
          </Text>
        </Animated.View>

        {/* Memory Sections by Category */}
        <Text style={styles.sectionHeaderText}>Your Memories</Text>

        <MemorySection
          memories={memories}
          category="dining"
          categoryLabel="Food & Dining"
          icon="🍽️"
        />
        <MemorySection
          memories={memories}
          category="shopping"
          categoryLabel="Shopping"
          icon="🛍️"
        />
        <MemorySection
          memories={memories}
          category="finance"
          categoryLabel="Savings & Finance"
          icon="💰"
        />
        <MemorySection
          memories={memories}
          category="wellness"
          categoryLabel="Wellness"
          icon="💆"
        />
        <MemorySection
          memories={memories}
          category="travel"
          categoryLabel="Travel"
          icon="✈️"
        />
        <MemorySection
          memories={memories}
          category="social"
          categoryLabel="Social"
          icon="👥"
        />

        {/* Data Sources */}
        <Text style={styles.sectionHeaderText}>Data Sources</Text>
        <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.dataSourcesCard}>
          <Text style={styles.dataSourcesIntro}>
            REZ uses these data sources to personalize your experience:
          </Text>
          {dataSources.map((source) => (
            <DataSourceToggle
              key={source.id}
              source={source}
              onToggle={handleDataToggle}
            />
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.actionsCard}>
          <Pressable style={styles.actionButton} onPress={() => router.push('/smart-onboarding')}>
            <Ionicons name="refresh" size={20} color={colors.brand.primary} />
            <Text style={styles.actionButtonText}>Retake Preferences</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => router.push('/legal/privacy')}>
            <Ionicons name="shield-checkmark" size={20} color={colors.brand.primary} />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={handleResetMemory}>
            <Ionicons name="trash" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Reset REZ Memory</Text>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
          <Text style={styles.footerText}>
            Your data is encrypted and stored securely.
          </Text>
          <Text style={styles.footerText}>
            We never sell your personal information.
          </Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Intro
  intro: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  insightCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  insightIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  insightValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  insightTitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 2,
  },
  insightSubtitle: {
    fontSize: 10,
    color: colors.text.tertiary,
  },

  // Personalization
  personalizationCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  personalizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalizationTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  personalizationSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  personalizationWarning: {
    fontSize: typography.caption.fontSize,
    color: colors.warning,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },

  // Section Headers
  sectionHeaderText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },

  // Memory Sections
  section: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  memoryItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  memoryContent: {
    marginBottom: spacing.xs,
  },
  memoryStatement: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
    marginBottom: 2,
  },
  memoryEvidence: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  memoryMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },

  // Data Sources
  dataSourcesCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  dataSourcesIntro: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  dataSource: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  dataSourceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  dataSourceName: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
  },
  dataSourceDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Actions
  actionsCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  actionButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.brand.primary,
    marginLeft: spacing.md,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: colors.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
