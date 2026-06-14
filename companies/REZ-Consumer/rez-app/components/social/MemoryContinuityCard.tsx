/**
 * Memory Continuity Card Component
 *
 * Displays natural memory references to create longitudinal intelligence feeling.
 *
 * Examples:
 * - "You liked Korean food last week"
 * - "You usually shop on Fridays"
 * - "Last month you saved ₹420 on cafés"
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useMemoryContinuity, MemoryEntry } from '@/hooks/useMemoryContinuity';

// ============================================================================
// TYPES
// ============================================================================

interface MemoryCardProps {
  memory: MemoryEntry;
  onActionPress?: (route?: string) => void;
  variant?: 'compact' | 'expanded' | 'inline';
}

interface MemoryInsightProps {
  category: 'savings' | 'preference' | 'pattern' | 'behavior';
  title: string;
  subtitle: string;
  icon: string;
  value?: string;
  onPress?: () => void;
}

// ============================================================================
// COMPONENTS
// ============================================================================

export function MemoryCard({ memory, onActionPress, variant = 'compact' }: MemoryCardProps) {
  const getIcon = () => {
    switch (memory.category) {
      case 'dining':
        return '🍽️';
      case 'shopping':
        return '🛍️';
      case 'travel':
        return '✈️';
      case 'wellness':
        return '💆';
      case 'social':
        return '👥';
      case 'finance':
        return '💰';
      default:
        return '✨';
    }
  };

  const getTypeLabel = () => {
    switch (memory.type) {
      case 'preference':
        return 'Your preference';
      case 'behavior':
        return 'Your habit';
      case 'savings':
        return 'Your savings';
      case 'pattern':
        return 'Your pattern';
      case 'milestone':
        return 'Achievement';
      default:
        return 'Insight';
    }
  };

  const getConfidenceColor = () => {
    if (memory.confidence >= 0.8) return colors.success;
    if (memory.confidence >= 0.6) return colors.brand.primary;
    return colors.text.tertiary;
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.memoryCard, variant === 'expanded' && styles.memoryCardExpanded]}
    >
      <View style={styles.memoryHeader}>
        <Text style={styles.memoryIcon}>{getIcon()}</Text>
        <View style={styles.memoryMeta}>
          <Text style={styles.memoryType}>{getTypeLabel()}</Text>
          <View style={styles.confidenceIndicator}>
            <View
              style={[
                styles.confidenceDot,
                { backgroundColor: getConfidenceColor() },
              ]}
            />
          </View>
        </View>
      </View>

      <Text style={styles.memoryStatement}>{memory.statement}</Text>

      {variant === 'expanded' && (
        <Text style={styles.memoryEvidence}>
          Based on: {memory.evidence}
        </Text>
      )}

      {memory.type === 'savings' && memory.evidence && (
        <View style={styles.savingsHighlight}>
          <Text style={styles.savingsHighlightText}>{memory.evidence}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export function MemoryInsight({
  category,
  title,
  subtitle,
  icon,
  value,
  onPress,
}: MemoryInsightProps) {
  const getCategoryStyle = () => {
    switch (category) {
      case 'savings':
        return { bg: '#E8F5E9', color: colors.success };
      case 'preference':
        return { bg: '#E3F2FD', color: '#2196F3' };
      case 'pattern':
        return { bg: '#FFF3E0', color: '#FF9800' };
      case 'behavior':
        return { bg: '#FCE4EC', color: '#E91E63' };
      default:
        return { bg: '#F5F5F5', color: colors.text.secondary };
    }
  };

  const style = getCategoryStyle();

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        entering={FadeInRight.duration(300)}
        style={[styles.insightCard, { backgroundColor: style.bg }]}
      >
        <View style={styles.insightHeader}>
          <Text style={styles.insightIcon}>{icon}</Text>
          <View>
            <Text style={[styles.insightTitle, { color: style.color }]}>{title}</Text>
            <Text style={styles.insightSubtitle}>{subtitle}</Text>
          </View>
        </View>
        {value && (
          <View style={styles.insightValue}>
            <Text style={styles.insightValueText}>{value}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

interface MemoryRecallProps {
  statement: string;
  type: 'recall' | 'anticipation' | 'recommendation';
  onDismiss?: () => void;
}

export function MemoryRecall({ statement, type, onDismiss }: MemoryRecallProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'recall':
        return '🧠';
      case 'anticipation':
        return '🔮';
      case 'recommendation':
        return '💡';
      default:
        return '✨';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'recall':
        return 'Remember';
      case 'anticipation':
        return 'Coming up';
      case 'recommendation':
        return 'For you';
      default:
        return 'Based on habits';
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.recallCard}>
      <View style={styles.recallHeader}>
        <Text style={styles.recallIcon}>{getTypeIcon()}</Text>
        <Text style={styles.recallType}>{getTypeLabel()}</Text>
        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={16} color={colors.text.tertiary} />
          </Pressable>
        )}
      </View>
      <Text style={styles.recallStatement}>{statement}</Text>
    </Animated.View>
  );
}

interface MemorySummaryProps {
  summary: string;
  compact?: boolean;
}

export function MemorySummary({ summary, compact = false }: MemorySummaryProps) {
  if (!summary) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.summaryCard, compact && styles.summaryCardCompact]}
    >
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryIcon}>🧠</Text>
        {!compact && <Text style={styles.summaryLabel}>REZ remembers</Text>}
      </View>
      <Text style={[styles.summaryText, compact && styles.summaryTextCompact]}>
        {summary}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// MEMORY CONTINUITY SECTION COMPONENT
// ============================================================================

interface MemoryContinuitySectionProps {
  variant?: 'insights' | 'recalls' | 'summary';
  maxItems?: number;
}

export function MemoryContinuitySection({
  variant = 'insights',
  maxItems = 3,
}: MemoryContinuitySectionProps) {
  const { memories, references, generateMemorySummary, isLoading } = useMemoryContinuity();

  // Show loading skeleton
  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
          </View>
        ))}
      </View>
    );
  }

  // Summary variant
  if (variant === 'summary') {
    const summary = generateMemorySummary();
    return <MemorySummary summary={summary} />;
  }

  // Recall variant - most relevant recent memories
  if (variant === 'recalls') {
    const recentMemories = memories
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, maxItems);

    return (
      <View style={styles.recallsContainer}>
        {recentMemories.map((memory, index) => (
          <MemoryCard key={memory.id} memory={memory} variant="compact" />
        ))}
      </View>
    );
  }

  // Insights variant - categorized memory cards
  const savingsMemories = memories
    .filter((m) => m.type === 'savings')
    .slice(0, 1);
  const preferenceMemories = memories
    .filter((m) => m.type === 'preference')
    .slice(0, 1);
  const patternMemories = memories
    .filter((m) => m.type === 'pattern')
    .slice(0, 1);

  return (
    <View style={styles.insightsContainer}>
      {savingsMemories.map((memory) => (
        <MemoryInsight
          key={memory.id}
          category="savings"
          title="Your savings"
          subtitle={memory.statement}
          icon="💰"
          value={memory.evidence}
        />
      ))}
      {preferenceMemories.map((memory) => (
        <MemoryInsight
          key={memory.id}
          category="preference"
          title="Your preference"
          subtitle={memory.statement}
          icon="🎯"
        />
      ))}
      {patternMemories.map((memory) => (
        <MemoryInsight
          key={memory.id}
          category="pattern"
          title="Your pattern"
          subtitle={memory.statement}
          icon="📊"
        />
      ))}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Memory Card
  memoryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memoryCardExpanded: {
    padding: spacing.lg,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memoryIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  memoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memoryType: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  confidenceIndicator: {
    marginLeft: spacing.xs,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memoryStatement: {
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
    lineHeight: 22,
  },
  memoryEvidence: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  savingsHighlight: {
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  savingsHighlightText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Memory Insight
  insightsContainer: {
    gap: spacing.sm,
  },
  insightCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  insightTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  insightSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
    marginTop: 2,
  },
  insightValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  insightValueText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },

  // Memory Recall
  recallsContainer: {
    gap: spacing.sm,
  },
  recallCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  recallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recallIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  recallType: {
    fontSize: typography.caption.fontSize,
    color: colors.brand.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  recallStatement: {
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
  },

  // Memory Summary
  summaryCard: {
    backgroundColor: colors.primary[100] + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  summaryCardCompact: {
    padding: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.brand.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
    lineHeight: 24,
  },
  summaryTextCompact: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: 20,
  },

  // Skeleton
  skeletonContainer: {
    gap: spacing.sm,
  },
  skeletonCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    width: '80%',
    marginBottom: spacing.xs,
  },
});

export default MemoryContinuitySection;
