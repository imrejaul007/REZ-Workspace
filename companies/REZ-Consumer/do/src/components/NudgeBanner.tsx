/**
 * NudgeBanner Component
 * Shows real-time AI nudges to users
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Sparkles, TrendingUp, Heart } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useNudgeEngine } from '@/hooks/useReZMind';
import { Nudge } from '@/services/nudgeEngine';

interface NudgeBannerProps {
  maxVisible?: number;
}

const getNudgeIcon = (type: Nudge['type']) => {
  switch (type) {
    case 'dormancy':
      return '💝';
    case 'trend':
      return '🔥';
    case 'personalized':
      return '✨';
    case 'social':
      return '👥';
    case 'urgency':
      return '⚡';
    default:
      return '💡';
  }
};

const getNudgeColor = (type: Nudge['type'], colors) => {
  switch (type) {
    case 'dormancy':
      return colors.systemPink;
    case 'trend':
      return colors.systemOrange;
    case 'personalized':
      return colors.primary;
    case 'social':
      return colors.systemGreen;
    case 'urgency':
      return colors.systemRed;
    default:
      return colors.primary;
  }
};

export const NudgeBanner: React.FC<NudgeBannerProps> = ({ maxVisible = 3 }) => {
  const { colors, borderRadius } = useTheme();
  const router = useRouter();
  const { nudges, dismissNudge } = useNudgeEngine();

  const visibleNudges = nudges.slice(0, maxVisible);

  if (visibleNudges.length === 0) return null;

  const handlePress = (nudge: Nudge) => {
    if (nudge.action?.route) {
      router.push(nudge.action.route);
      dismissNudge(nudge.id);
    }
  };

  return (
    <View style={styles.container}>
      {visibleNudges.map((nudge, index) => (
        <Animated.View
          key={nudge.id}
          entering={{ fadeIn: true, slideInFromRight: true }}
          style={[
            styles.nudgeCard,
            {
              backgroundColor: getNudgeColor(nudge.type, colors) + '15',
              borderLeftColor: getNudgeColor(nudge.type, colors),
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.nudgeContent}
            onPress={() => handlePress(nudge)}
            activeOpacity={0.8}
          >
            <View style={styles.nudgeHeader}>
              <Text style={styles.nudgeIcon}>{getNudgeIcon(nudge.type)}</Text>
              <Text
                style={[
                  styles.nudgeTitle,
                  { color: getNudgeColor(nudge.type, colors) },
                ]}
              >
                {nudge.title}
              </Text>
            </View>

            <Text style={[styles.nudgeMessage, { color: colors.label }]} numberOfLines={2}>
              {nudge.message}
            </Text>

            {nudge.action && (
              <View style={styles.nudgeAction}>
                <Text
                  style={[
                    styles.actionLabel,
                    { color: getNudgeColor(nudge.type, colors) },
                  ]}
                >
                  {nudge.action.label} →
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => dismissNudge(nudge.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={colors.labelSecondary} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

// Inline Nudge Card Component
interface InlineNudgeCardProps {
  nudge: Nudge;
  onDismiss: () => void;
  onPress?: () => void;
}

export const InlineNudgeCard: React.FC<InlineNudgeCardProps> = ({
  nudge,
  onDismiss,
  onPress,
}) => {
  const { colors, borderRadius, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.inlineCard,
        {
          backgroundColor: getNudgeColor(nudge.type, colors) + '10',
          borderRadius: borderRadius.lg,
          padding: spacing.md,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.inlineContent}>
        <Text style={styles.inlineIcon}>{getNudgeIcon(nudge.type)}</Text>
        <View style={styles.inlineText}>
          <Text style={[styles.inlineTitle, { color: colors.label }]}>
            {nudge.title}
          </Text>
          <Text
            style={[styles.inlineMessage, { color: colors.labelSecondary }]}
            numberOfLines={1}
          >
            {nudge.message}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onDismiss}>
        <X size={18} color={colors.labelSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Nudge List Component
interface NudgeListProps {
  onSelect?: (nudge: Nudge) => void;
}

export const NudgeList: React.FC<NudgeListProps> = ({ onSelect }) => {
  const { colors, borderRadius } = useTheme();
  const { nudges, dismissNudge } = useNudgeEngine();

  if (nudges.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.fill }]}>
        <Sparkles size={24} color={colors.labelSecondary} />
        <Text style={[styles.emptyText, { color: colors.labelSecondary }]}>
          No updates right now
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {nudges.map((nudge) => (
        <InlineNudgeCard
          key={nudge.id}
          nudge={nudge}
          onDismiss={() => dismissNudge(nudge.id)}
          onPress={() => onSelect?.(nudge)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderLeftWidth: 3,
    position: 'relative',
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  nudgeIcon: {
    fontSize: 16,
  },
  nudgeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  nudgeMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  nudgeAction: {
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  inlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  inlineIcon: {
    fontSize: 20,
  },
  inlineText: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  inlineMessage: {
    fontSize: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});

export default NudgeBanner;
