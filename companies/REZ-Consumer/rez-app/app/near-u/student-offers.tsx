/**
 * /near-u/student-offers
 *
 * Filtered view for verified-student exclusive deals.
 * Shows stores/offers that have student discounts or ID-verified perks.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { STUDENT_EXTRA_COINS_PERCENT, STUDENT_VERIFIED_BADGE_TEXT } from '@/constants/appConstants';

const STUDENT_CATEGORIES = [
  { id: 'food', emoji: '🍕', label: 'Food & Drinks', sublabel: 'Meals under ₹149', color: colors.tint.orange },
  { id: 'cafe', emoji: '☕', label: 'Cafes', sublabel: 'Study spots & brews', color: colors.tint.amber },
  { id: 'stationery', emoji: '📓', label: 'Stationery', sublabel: 'Books & supplies', color: colors.tint.amberLight },
  { id: 'gym', emoji: '💪', label: 'Fitness', sublabel: 'Student memberships', color: colors.tint.orange },
  { id: 'salon', emoji: '✂️', label: 'Grooming', sublabel: 'Budget hair & skin', color: colors.tint.amber },
  { id: 'try', emoji: '🔍', label: 'Try Free', sublabel: 'Risk-free trials', color: colors.warningScale[50] },
];

export default function StudentOffersScreen() {
  const router = useRouter();
  const { statedIdentity, segment } = useUserIdentityStore();
  const isStudent = segment === 'verified_student' || statedIdentity === 'student';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Student Offers</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero banner */}
        <LinearGradient
          colors={[colors.nileBlue, colors.brand.goldWarm]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.blobDecor} />
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroTitle}>🎓 Made for Students</Text>
              <Text style={styles.heroSub}>
                {isStudent
                  ? 'Your ID is verified — enjoy exclusive perks!'
                  : 'Verify your student ID to unlock extra coins & deals'}
              </Text>
            </View>
            <Text style={styles.heroEmoji}>📚</Text>
          </View>
          {isStudent && (
            <View style={styles.heroBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.text.inverse} />
              <Text style={styles.heroBadgeText}>{STUDENT_VERIFIED_BADGE_TEXT(STUDENT_EXTRA_COINS_PERCENT)}</Text>
            </View>
          )}
          {!isStudent && (
            <Pressable
              style={styles.verifyBtn}
              onPress={() => router.push('/profile/verification?zone=student' as unknown as string)}
            >
              <Text style={styles.verifyBtnText}>Verify Student ID →</Text>
            </Pressable>
          )}
        </LinearGradient>

        {/* Category grid */}
        <Text style={styles.sectionTitle}>Browse by category</Text>
        <View style={styles.grid}>
          {STUDENT_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: cat.color }]}
              onPress={() =>
                router.push({
                  pathname: '/StoreListPage',
                  params: { category: cat.id, audience: 'student', sort: 'discount_high' },
                } as unknown as string)
              }
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
              <Text style={styles.catSublabel}>{cat.sublabel}</Text>
            </Pressable>
          ))}
        </View>

        {/* TRY nudge */}
        <Pressable style={styles.tryNudge} onPress={() => router.push('/try' as unknown as string)}>
          <LinearGradient
            colors={[colors.nileBlue, colors.brand.nileBlueLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tryNudgeGradient}
          >
            <Ionicons name="flask" size={20} color={colors.text.inverse} />
            <View style={styles.tryNudgeText}>
              <Text style={styles.tryNudgeTitle}>Try Before You Buy</Text>
              <Text style={styles.tryNudgeSub}>Commit ₹1 • Experience it free • Get refund back</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { width: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text?.primary || '#111' },
  headerRight: { width: 32 },
  content: { paddingBottom: 40 },

  heroBanner: {
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: 20,
    overflow: 'hidden',
  },
  blobDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.text.inverse, marginBottom: 4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', maxWidth: '80%', lineHeight: 18 },
  heroEmoji: { fontSize: 40, opacity: 0.9 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroBadgeText: { fontSize: 11, color: colors.text.inverse, fontWeight: '600' },
  verifyBtn: {
    backgroundColor: colors.background.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifyBtnText: { fontSize: 13, fontWeight: '700', color: colors.nileBlue },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text?.primary || '#111',
    marginHorizontal: spacing.lg,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  categoryCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  catEmoji: { fontSize: 28, marginBottom: 6 },
  catLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 },
  catSublabel: { fontSize: 11, color: colors.slateGray },

  tryNudge: { marginHorizontal: spacing.lg, marginTop: 20, borderRadius: borderRadius.xl, overflow: 'hidden' },
  tryNudgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tryNudgeText: { flex: 1 },
  tryNudgeTitle: { fontSize: 14, fontWeight: '700', color: colors.text.inverse, marginBottom: 2 },
  tryNudgeSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
});
