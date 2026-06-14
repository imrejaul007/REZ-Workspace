// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHomeTab } from '@/contexts/HomeTabContext';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;

const NAVY    = '#1a3a52';
const MUSTARD = '#FFC857';
const BORDER  = '#E2E8F0';
const BODY    = '#475569';
const MUTED   = '#94A3B8';
const LIGHT   = '#F8F9FA';
const CARD_BG = '#FFFFFF';

const EarnRezCoinsSection: React.FC = () => {
  const router = useRouter();
  const homeTab = useHomeTab();
  const setActiveTab = homeTab?.setActiveTab;
  const scrollToTop = homeTab?.scrollToTop;

  const handleViewAll = () => {
    router.push('/(tabs)/earn');
  };

  const handleOnlineShoppingPress = () => {
    setActiveTab?.('cash');
    if (scrollToTop) {
      setTimeout(() => scrollToTop(), 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="wallet" size={20} color={NAVY} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Earn {BRAND.COIN_NAME}</Text>
            <Text style={styles.headerSubtitle}>Multiple ways to earn rewards</Text>
          </View>
        </View>
        <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={14} color={NAVY} />
        </Pressable>
      </View>

      {/* Bento Grid */}
      <View style={styles.bentoGrid}>
        {/* Top Row */}
        <View style={styles.topRow}>
          {/* Large Card: Online Shopping */}
          <Pressable
            style={styles.largeCard}
            onPress={handleOnlineShoppingPress}
          >
            {/* Mustard accent top bar */}
            <View style={styles.largeCardAccent} />
            <View style={styles.largeCardInner}>
              <View style={styles.largeCardHeader}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.largeEmoji}>🛒</Text>
                </View>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>⭐ Popular</Text>
                </View>
              </View>
              <View style={styles.largeCardFooter}>
                <Text style={styles.largeCardTitle}>Online Shopping</Text>
                <Text style={styles.largeCardDesc}>2500+ brands available</Text>
                <View style={styles.cashbackBadge}>
                  <Text style={styles.cashbackText}>Up to 25% cashback</Text>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Pay in Store */}
            <Pressable
              style={styles.payCard}
              onPress={() => router.push('/pay-in-store' as unknown)}
            >
              <View style={styles.payIconBox}>
                <Ionicons name="card-outline" size={20} color={NAVY} />
              </View>
              <View style={styles.payTextContent}>
                <Text style={styles.payCardTitle}>Pay in Store</Text>
                <Text style={styles.payCardDesc}>Scan & earn instantly</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </Pressable>

            {/* Small Cards Row */}
            <View style={styles.smallCardsRow}>
              <Pressable
                style={styles.smallCard}
                onPress={() => router.push('/playandearn' as unknown)}
              >
                <Text style={styles.smallEmoji}>🎮</Text>
                <Text style={styles.smallCardText}>Play</Text>
              </Pressable>
              <Pressable
                style={styles.smallCard}
                onPress={() => router.push('/referral' as unknown)}
              >
                <Text style={styles.smallEmoji}>👥</Text>
                <Text style={styles.smallCardText}>Refer</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.bottomRow}>
          <Pressable
            style={styles.socialCard}
            onPress={() => router.push('/social-impact' as unknown)}
          >
            <View style={styles.socialIconBox}>
              <Text style={styles.socialEmoji}>🤝</Text>
            </View>
            <View style={styles.socialTextContent}>
              <Text style={styles.socialTitle}>Social Impact</Text>
              <Text style={styles.socialDesc}>CSR events</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.miniCard}
            onPress={() => router.push('/surveys' as unknown)}
          >
            <Text style={styles.miniEmoji}>📋</Text>
            <Text style={styles.miniCardText}>Surveys</Text>
          </Pressable>

          <Pressable
            style={styles.miniCard}
            onPress={() => router.push('/my-reviews' as unknown)}
          >
            <Text style={styles.miniEmoji}>⭐</Text>
            <Text style={styles.miniCardText}>Reviews</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
}) ?? {};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BODY,
    marginTop: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },

  // Bento Grid
  bentoGrid: {
    gap: CARD_GAP,
  },
  topRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    height: 170,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    height: 70,
  },

  // Large Card
  largeCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    ...cardShadow,
  },
  largeCardAccent: {
    height: 4,
    backgroundColor: MUSTARD,
  },
  largeCardInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  largeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  largeEmoji: {
    fontSize: 22,
  },
  popularBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  largeCardFooter: {
    gap: 3,
  },
  largeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },
  largeCardDesc: {
    fontSize: 11,
    color: BODY,
  },
  cashbackBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '600',
    color: NAVY,
  },

  // Right Column
  rightColumn: {
    flex: 1,
    gap: CARD_GAP,
  },

  // Pay in Store
  payCard: {
    height: 66,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    ...cardShadow,
  },
  payIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  payTextContent: {
    flex: 1,
  },
  payCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  payCardDesc: {
    fontSize: 10,
    color: BODY,
    marginTop: 1,
  },

  // Small Cards
  smallCardsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  smallCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    ...cardShadow,
  },
  smallEmoji: {
    fontSize: 22,
  },
  smallCardText: {
    fontSize: 11,
    fontWeight: '600',
    color: NAVY,
  },

  // Social Impact
  socialCard: {
    flex: 1.5,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    ...cardShadow,
  },
  socialIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  socialEmoji: {
    fontSize: 18,
  },
  socialTextContent: {
    flex: 1,
  },
  socialTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  socialDesc: {
    fontSize: 10,
    color: BODY,
    marginTop: 1,
  },

  // Mini Cards
  miniCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    ...cardShadow,
  },
  miniEmoji: {
    fontSize: 20,
  },
  miniCardText: {
    fontSize: 10,
    fontWeight: '600',
    color: NAVY,
  },
});

export default React.memo(EarnRezCoinsSection);
