// @ts-nocheck
/**
 * StudentMicroPrepaidPacks
 *
 * 3 horizontal cards: Rs.49, Rs.79, Rs.99 micro prepaid packs.
 * Student-friendly orange/amber colours matching the student persona palette.
 *
 * Each card shows: price, "Worth Rs.{value}", savings%, category.
 * CTA: "Buy Now" → navigates to deal purchase flow.
 */

import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { getStudentMicroPacks, StudentMicroPack } from '@/services/studentHomepageApi';
import { useIsMounted } from '@/hooks/useIsMounted';

const CARD_WIDTH = 165;
const CARD_GAP = 12;

// ─── Sub-components ────────────────────────────────────────────────────────────

interface PackCardProps {
  pack: StudentMicroPack;
  onPress: (pack: StudentMicroPack) => void;
}

// eslint-disable-next-line react/display-name
const PackCard: React.FC<PackCardProps> = memo(({ pack, onPress }) => {
  // Gradient based on pack category
  const gradients: Record<string, [string, string]> = {
    food: ['#FFC857', '#FBBF24'],
    grooming: ['#9333EA', '#C084FC'],
    entertainment: ['#D97706', '#F59E0B'],
  };
  const gradient = gradients[pack.category] ?? ['#FFC857', '#FBBF24'];

  return (
    <Pressable
      style={[styles.card, { backgroundColor: pack.color }]}
      onPress={() => onPress(pack)}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
    >
      {/* Savings pill at top */}
      <View style={[styles.savingsPill, { backgroundColor: pack.accentColor + '22' }]}>
        <Text style={[styles.savingsPillText, { color: pack.accentColor }]}>
          Save {pack.savingsPercent}%
        </Text>
      </View>

      {/* Emoji + pack info */}
      <Text style={styles.packEmoji}>{pack.emoji}</Text>
      <Text style={styles.packTitle}>{pack.title}</Text>

      {/* Price */}
      <Text style={[styles.packPrice, { color: pack.accentColor }]}>₹{pack.price}</Text>

      {/* Worth value */}
      <Text style={styles.worthText}>Worth ₹{pack.worthValue}</Text>

      {/* Buy Now CTA */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaText}>Buy Now</Text>
        <Ionicons name="arrow-forward" size={12} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
});

// ─── Main component ────────────────────────────────────────────────────────────

const StudentMicroPrepaidPacks: React.FC = () => {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [packs, setPacks] = useState<StudentMicroPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentMicroPacks()
      .then((data) => {
        if (!isMounted()) return;
        setPacks(data);
      })
      .finally(() => {
        if (!isMounted()) return;
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePackPress = (pack: StudentMicroPack) => {
    // L-10 FIX: Route to pack purchase flow passing the pack ID so the payment
    // screen can load the correct pack details.
    router.push(`/checkout/pack-purchase?packId=${pack.id}` as unknown);
  };

  if (!loading && packs.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Micro Packs for You 🎒</Text>
          <Text style={styles.subtitle}>Tiny spend, big value</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFC857" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
        >
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} onPress={handlePackPress} />
          ))}
        </ScrollView>
      )}

      {/* Info strip */}
      <View style={styles.infoStrip}>
        <Ionicons name="shield-checkmark" size={13} color="#15803D" />
        <Text style={styles.infoText}>Packs auto-applied at checkout · No expiry for 60 days</Text>
      </View>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nileBlue,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral?.[500] || '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  savingsPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  savingsPillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  packEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  packTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nileBlue,
    fontFamily: 'Inter-Bold',
  },
  packPrice: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
  },
  worthText: {
    fontSize: 11,
    color: colors.neutral?.[500] || '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    lineHeight: 15,
  },
});

export default memo(StudentMicroPrepaidPacks);
