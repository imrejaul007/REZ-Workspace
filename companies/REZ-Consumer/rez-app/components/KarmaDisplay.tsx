/**
 * KarmaDisplay
 * Shows karma points, level, and streak in header
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import karmaService from '@/services/karmaService';

interface KarmaDisplayProps {
  userId?: string;
  showLevel?: boolean;
  showStreak?: boolean;
  compact?: boolean;
  style?: object;
  onPress?: () => void;
}

interface KarmaProfile {
  userId: string;
  points: number;
  level: number;
  streak: number;
  badges: Array<{ id: string; name: string; earned: boolean }>;
}

const LEVEL_COLORS = {
  1: { bg: '#E5E5EA', text: '#8E8E93', label: 'Bronze' },
  2: { bg: '#FFD70020', text: '#B8860B', label: 'Silver' },
  3: { bg: '#007AFF20', text: '#007AFF', label: 'Gold' },
  4: { bg: '#AF52DE20', text: '#AF52DE', label: 'Platinum' },
};

const KarmaDisplay: React.FC<KarmaDisplayProps> = ({
  userId,
  showLevel = true,
  showStreak = true,
  compact = false,
  style,
  onPress,
}) => {
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchKarma();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchKarma = async () => {
    if (!userId) return;

    try {
      const result = await karmaService.getKarmaProfile(userId);
      if (result.success && result.data) {
        // @ts-ignore - type mismatch between local and imported KarmaProfile
        setProfile(result.data as KarmaProfile);
      }
    } catch {
      // Service unavailable
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loading, style]}>
        <ActivityIndicator size="small" color="#5856D6" />
      </View>
    );
  }

  if (!profile) {
    // Return placeholder
    return (
      <Pressable style={[styles.container, styles.placeholder, style]} onPress={onPress}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⭐</Text>
        </View>
        {!compact && <Text style={styles.placeholderText}>Earn Karma</Text>}
      </Pressable>
    );
  }

  const levelColor = LEVEL_COLORS[profile.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1];

  if (compact) {
    return (
      <Pressable style={[styles.container, styles.compact, style]} onPress={onPress}>
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>⭐</Text>
          <Text style={styles.compactPoints}>{profile.points.toLocaleString()}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.container, style]} onPress={onPress}>
      {/* Points */}
      <View style={styles.mainSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⭐</Text>
        </View>
        <View style={styles.mainInfo}>
          <Text style={styles.points}>{profile.points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>Karma Points</Text>
        </View>
      </View>

      {/* Level & Streak */}
      {(showLevel || showStreak) && (
        <View style={styles.badges}>
          {showLevel && (
            <View style={[styles.badge, { backgroundColor: levelColor.bg }]}>
              <Text style={[styles.badgeText, { color: levelColor.text }]}>
                {levelColor.label}
              </Text>
            </View>
          )}
          {showStreak && profile.streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#FF9500" />
              <Text style={styles.streakText}>{profile.streak}</Text>
            </View>
          )}
        </View>
      )}

      {/* Badges count */}
      {profile.badges && profile.badges.length > 0 && (
        <View style={styles.badgesCount}>
          <Ionicons name="medal" size={14} color="#8E8E93" />
          <Text style={styles.badgesCountText}>{profile.badges.length}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  loading: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  placeholder: {
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
  },
  mainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainInfo: {
    marginLeft: 4,
  },
  points: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: -2,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  badgesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
    gap: 4,
  },
  badgesCountText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactIcon: {
    fontSize: 14,
  },
  compactPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default KarmaDisplay;
