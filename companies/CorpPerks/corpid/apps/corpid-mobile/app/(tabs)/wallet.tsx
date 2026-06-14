'use client';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award, Shield, CheckCircle, Star, Rocket, Heart, Users, FileCheck,
  TrendingUp, Filter, Lock
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const { badges, initializeMockData } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'verification' | 'achievement' | 'trust' | 'engagement'>('all');

  useEffect(() => {
    if (badges.length === 0) {
      initializeMockData();
    }
  }, []);

  const filteredBadges = activeFilter === 'all'
    ? badges
    : badges.filter(badge => badge.category === activeFilter);

  const getBadgeIcon = (icon: string) => {
    switch (icon) {
      case 'shield-check':
        return <Shield size={28} color="#6366f1" />;
      case 'briefcase':
        return <Award size={28} color="#22c55e" />;
      case 'award':
        return <Star size={28} color="#f59e0b" />;
      case 'rocket':
        return <Rocket size={28} color="#8b5cf6" />;
      case 'heart':
        return <Heart size={28} color="#ec4899" />;
      case 'users':
        return <Users size={28} color="#06b6d4" />;
      case 'file-check':
        return <FileCheck size={28} color="#22c55e" />;
      case 'trending-up':
        return <TrendingUp size={28} color="#FFD700" />;
      default:
        return <Award size={28} color="#6366f1" />;
    }
  };

  const getBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return { primary: '#E5E4E2', secondary: '#8E8E8D', glow: 'rgba(229, 228, 226, 0.3)' };
      case 'gold':
        return { primary: '#FFD700', secondary: '#DAA520', glow: 'rgba(255, 215, 0, 0.3)' };
      case 'silver':
        return { primary: '#C0C0C0', secondary: '#A8A8A8', glow: 'rgba(192, 192, 192, 0.3)' };
      case 'bronze':
        return { primary: '#CD7F32', secondary: '#B87333', glow: 'rgba(205, 127, 50, 0.3)' };
      default:
        return { primary: '#6366f1', secondary: '#4f46e5', glow: 'rgba(99, 102, 241, 0.3)' };
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'verification', label: 'Verified' },
    { key: 'achievement', label: 'Achievements' },
    { key: 'trust', label: 'Trust' },
    { key: 'engagement', label: 'Engagement' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Trust Wallet</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={18} color="#6366f1" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Your earned badges and achievements
        </Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{badges.length}</Text>
          <Text style={styles.statLabel}>Total Badges</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{badges.filter(b => b.tier === 'platinum' || b.tier === 'gold').length}</Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{badges.filter(b => b.category === 'verification').length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.filterTab, activeFilter === option.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(option.key as typeof activeFilter)}
          >
            <Text style={[styles.filterTabText, activeFilter === option.key && styles.filterTabTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Badges Grid */}
      <ScrollView style={styles.badgesContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.badgesGrid}>
          {filteredBadges.map((badge) => {
            const colors = getBadgeColor(badge.tier);
            return (
              <TouchableOpacity
                key={badge.id}
                style={[styles.badgeCard, { borderColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <View style={[styles.badgeGlow, { backgroundColor: colors.glow }]} />
                <View style={[styles.badgeIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  {getBadgeIcon(badge.icon)}
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDescription} numberOfLines={2}>
                  {badge.description}
                </Text>
                {badge.tier && (
                  <View style={[styles.tierBadge, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={[styles.tierText, { color: colors.primary }]}>
                      {badge.tier.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.badgeDate}>
                  Earned {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Featured Badge */}
        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>Featured Achievement</Text>
          <View style={styles.featuredCard}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredBadgeIcon}>
                  <TrendingUp size={32} color="#fff" />
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredBadgeName}>Top Performer</Text>
                  <Text style={styles.featuredDescription}>
                    Ranked in top 10% of CorpID users by CI Score
                  </Text>
                  <View style={styles.featuredMeta}>
                    <CheckCircle size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.featuredMetaText}>Verified Achievement</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Lock size={14} color="#666" />
          <Text style={styles.privacyText}>
            Your badges are private by default. Control who can see your achievements.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  badgesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  badgeCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  badgeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeDate: {
    color: '#666',
    fontSize: 10,
  },
  featuredSection: {
    marginBottom: 20,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  featuredGradient: {
    padding: 20,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBadgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredBadgeName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  featuredDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  featuredMetaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 32,
  },
});
