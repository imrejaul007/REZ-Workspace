// @ts-nocheck
/**
 * app/invite-friends.tsx
 *
 * Invite Friends screen — shows the user's referral code, a share button,
 * referral stats, and a "How it works" explanation.
 *
 * Route: /invite-friends
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { getReferralCode, getReferralStats, ReferralStats } from '@/services/referralApi';
import { platformAlertSimple } from '@/utils/platformAlert';

const DOWNLOAD_URL = 'https://rez.money';

// ── How it works step ─────────────────────────────────────────────────────────

function HowItWorksStep({
  step,
  icon,
  title,
  subtitle,
}: {
  step: number;
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step}</Text>
      </View>
      <View style={styles.stepIcon}>
        <Ionicons name={icon as unknown} size={22} color={colors.lightMustard} />
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function InviteFriendsScreen() {
  const [code, setCode] = useState('');
  const [codeLink, setCodeLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getReferralCode(), getReferralStats()])
      .then(([codeRes, statsRes]) => {
        if (!mounted) return;
        setCode(codeRes.referralCode);
        setCodeLink(codeRes.referralLink || DOWNLOAD_URL);
        setStats(statsRes);
      })
      .catch(() => {
        // silently degrade — still render the screen
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(async () => {
    if (!code) return;
    const message = `Join me on REZ! Use my code ${code} to earn 100 bonus REZ coins when you sign up. Download: ${codeLink}`;
    try {
      await Share.share({ message, url: codeLink });
    } catch (err) {
      if (err?.message !== 'User did not share') {
        platformAlertSimple('Share failed', 'Could not open the share sheet.');
      }
    }
  }, [code, codeLink]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Invite Friends', headerBackTitle: 'Back' }} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.nileBlue} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift-outline" size={40} color={colors.lightMustard} />
            </View>
            <Text style={styles.heroTitle}>Invite Friends, Earn Coins</Text>
            <Text style={styles.heroSub}>
              You and your friend each earn 100 REZ coins when they sign up using your code.
            </Text>
          </View>

          {/* Referral code card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <Pressable
              style={styles.codeBox}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={`Copy referral code ${code}`}
              accessibilityHint="Tap to copy code to clipboard"
            >
              <Text style={styles.codeText}>{code || '–'}</Text>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={22}
                color={copied ? '#10B981' : colors.nileBlue}
              />
            </Pressable>
            {copied && <Text style={styles.copiedMsg}>Copied to clipboard!</Text>}

            <Pressable
              style={styles.shareBtn}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share referral code"
            >
              <Ionicons name="share-social-outline" size={20} color={colors.nileBlue} />
              <Text style={styles.shareBtnText}>Share with Friends</Text>
            </Pressable>
          </View>

          {/* Stats */}
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                <Text style={styles.statLabel}>Friends Invited</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalEarned}</Text>
                <Text style={styles.statLabel}>Coins Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.completedReferrals}</Text>
                <Text style={styles.statLabel}>Joined</Text>
              </View>
            </View>
          )}

          {/* How it works */}
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>How it works</Text>
            <HowItWorksStep
              step={1}
              icon="share-social-outline"
              title="Share your code"
              subtitle="Send your unique referral code to friends."
            />
            <HowItWorksStep
              step={2}
              icon="person-add-outline"
              title="Friend signs up"
              subtitle="They use your code when creating an account."
            />
            <HowItWorksStep
              step={3}
              icon="sparkles-outline"
              title="Both earn 100 coins"
              subtitle="Coins are credited once they complete their first transaction."
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,205,87,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.nileBlue,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: colors.midGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Code card
  codeCard: {
    marginHorizontal: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,205,87,0.2)',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.midGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,205,87,0.08)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lightMustard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.nileBlue,
    letterSpacing: 3,
  },
  copiedMsg: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lightMustard,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: 16,
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.nileBlue,
  },
  statLabel: {
    fontSize: 11,
    color: colors.midGray,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 4,
  },
  // How it works
  howCard: {
    marginHorizontal: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  howTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.nileBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background.primary,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,205,87,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.nileBlue,
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 13,
    color: colors.midGray,
    lineHeight: 18,
  },
});
