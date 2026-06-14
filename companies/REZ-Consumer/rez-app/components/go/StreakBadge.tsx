import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StreakInfo } from './GoContext';

interface StreakBadgeProps {
  streak: StreakInfo | null;
  compact?: boolean;
}

export function StreakBadge({ streak, compact = false }: StreakBadgeProps) {
  if (!streak) return null;

  const { currentStreak, bonusPercent, lastVisit } = streak;

  const getStreakEmoji = () => {
    if (currentStreak >= 7) return '🔥';
    if (currentStreak >= 5) return '⭐';
    if (currentStreak >= 3) return '✨';
    return '🌟';
  };

  const getStreakColor = () => {
    if (currentStreak >= 7) return '#EF4444';
    if (currentStreak >= 5) return '#F59E0B';
    if (currentStreak >= 3) return '#22C55E';
    return '#6B7280';
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderColor: getStreakColor() }]}>
        <Text style={styles.compactEmoji}>{getStreakEmoji()}</Text>
        <Text style={[styles.compactText, { color: getStreakColor() }]}>
          {currentStreak} day streak
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{getStreakEmoji()}</Text>
        <View style={styles.info}>
          <Text style={[styles.title, { color: getStreakColor() }]}>
            {currentStreak} Day Streak!
          </Text>
          <Text style={styles.subtitle}>
            {currentStreak >= 7
              ? "You're on fire! 🔥"
              : currentStreak >= 5
              ? 'Keep it going!'
              : 'Building momentum!'}
          </Text>
        </View>
      </View>

      {bonusPercent > 0 && (
        <View style={styles.bonusContainer}>
          <View style={styles.bonusBadge}>
            <Text style={styles.bonusText}>+{bonusPercent}% cashback bonus</Text>
          </View>
          <Text style={styles.bonusHint}>
            {currentStreak >= 7
              ? 'Max streak bonus unlocked!'
              : `${7 - currentStreak} days to max bonus`}
          </Text>
        </View>
      )}

      {lastVisit && (
        <Text style={styles.lastVisit}>
          Last visit: {new Date(lastVisit).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  compactEmoji: {
    fontSize: 14,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 40,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bonusContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  bonusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bonusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  bonusHint: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
  },
  lastVisit: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default StreakBadge;
