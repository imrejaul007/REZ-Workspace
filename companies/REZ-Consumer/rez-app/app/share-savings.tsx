// @ts-nocheck
/**
 * SavingsShareScreen
 * Phase 3.1 — Social Proof & Sharing
 *
 * Full screen share flow:
 * 1. Renders SavingsShareCard (capturable via ViewShot)
 * 2. Shows share buttons: WhatsApp, Instagram, Twitter, Copy Link
 * 3. Triggered from post-payment flow and profile page
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Share,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import SavingsShareCard, { generateShareImage } from '@/components/social/SavingsShareCard';
import StreakShareCard from '@/components/social/StreakShareCard';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Spacing, BorderRadius, Typography, Colors } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CardMode = 'savings' | 'streak';

interface ShareTarget {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const SHARE_TARGETS: ShareTarget[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'twitter', label: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'copy', label: 'Copy Link', icon: 'link-outline', color: '#64748b' },
  { id: 'more', label: 'More', icon: 'share-social', color: '#1a3a52' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
function SavingsShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<unknown>();

  const viewShotRef = useRef<unknown>(null);
  const [capturing, setCapturing] = useState(false);
  const [cardMode, setCardMode] = useState<CardMode>((params.mode as CardMode) || 'savings');

  // Parse props from URL params (passed from post-payment flow or profile)
  const savings = parseInt(params.savings ?? '0', 10);
  const score = parseInt(params.score ?? '650', 10);
  const streakDays = parseInt(params.streakDays ?? '7', 10);
  const tier = params.tier ?? 'Super Saver';
  const referralCode = params.referralCode ?? 'REZ0000';
  const referralLink = `https://app.rezpay.in/join?ref=${referralCode}`;

  const buildShareText = (): string => {
    if (cardMode === 'streak') {
      return (
        `I'm on a ${streakDays}-day savings streak on ${BRAND.APP_NAME}! 🔥\n` +
        `Join me and start saving on every local spend.\n${referralLink}`
      );
    }
    return (
      `I saved Rs.${savings.toLocaleString('en-IN')} this month with ${BRAND.APP_NAME}! 💰\n` +
      `REZ Score: ${score} | ${streakDays}-day streak\n` +
      `Join me: ${referralLink}`
    );
  };

  const captureAndShare = async (targetId: string) => {
    setCapturing(true);
    try {
      // Attempt image capture — falls back to text-only if ViewShot unavailable
      const imageUri = await generateShareImage(viewShotRef);
      const text = buildShareText();

      switch (targetId) {
        case 'whatsapp': {
          const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
          } else {
            await Share.share({ message: text });
          }
          break;
        }

        case 'instagram': {
          // Instagram doesn't support direct text deep-link; open native share
          // with the image if available, otherwise text fallback
          if (imageUri) {
            await Share.share({ url: imageUri, message: text });
          } else {
            await Share.share({ message: text });
          }
          break;
        }

        case 'twitter': {
          const tweetText = encodeURIComponent(text.slice(0, 270));
          const twitterUrl = `twitter://post?message=${tweetText}`;
          const canTw = await Linking.canOpenURL(twitterUrl);
          if (canTw) {
            await Linking.openURL(twitterUrl);
          } else {
            await Linking.openURL(`https://twitter.com/intent/tweet?text=${tweetText}`);
          }
          break;
        }

        case 'copy': {
          await Clipboard.setStringAsync(referralLink);
          platformAlertSimple('Copied!', 'Referral link copied to clipboard');
          break;
        }

        default: {
          // Native share sheet
          if (imageUri) {
            await Share.share({ url: imageUri, message: text });
          } else {
            await Share.share({ message: text });
          }
        }
      }
    } catch (err) {
      if (err?.message !== 'User did not share') {
        platformAlertSimple('Error', 'Could not open share dialog');
      }
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#FFC857']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Share Your Savings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeTab, cardMode === 'savings' && styles.modeTabActive]}
            onPress={() => setCardMode('savings')}
          >
            <Text style={[styles.modeTabText, cardMode === 'savings' && styles.modeTabTextActive]}>Savings Card</Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, cardMode === 'streak' && styles.modeTabActive]}
            onPress={() => setCardMode('streak')}
          >
            <Text style={[styles.modeTabText, cardMode === 'streak' && styles.modeTabTextActive]}>Streak Card</Text>
          </Pressable>
        </View>

        {/* Card preview */}
        <View style={styles.cardContainer} collapsable={false} ref={viewShotRef}>
          {cardMode === 'savings' ? (
            <SavingsShareCard
              savings={savings}
              score={score}
              streakDays={streakDays}
              tier={tier}
              referralCode={referralCode}
            />
          ) : (
            <StreakShareCard streakDays={streakDays} tier={tier} />
          )}
        </View>

        {/* Share buttons */}
        <View style={styles.shareSection}>
          <Text style={styles.shareSectionTitle}>Share via</Text>
          <View style={styles.shareGrid}>
            {SHARE_TARGETS.map((target) => (
              <Pressable
                key={target.id}
                style={styles.shareTarget}
                onPress={() => captureAndShare(target.id)}
                disabled={capturing}
                accessibilityLabel={`Share via ${target.label}`}
                accessibilityRole="button"
              >
                <View style={[styles.shareIconCircle, { backgroundColor: target.color }]}>
                  {capturing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name={target.icon as unknown} size={24} color="#fff" />
                  )}
                </View>
                <Text style={styles.shareTargetLabel}>{target.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Referral code display */}
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeValue}>{referralCode}</Text>
          <Pressable
            onPress={() => captureAndShare('copy')}
            style={styles.copyCodeBtn}
            accessibilityLabel="Copy referral code"
            accessibilityRole="button"
          >
            <Ionicons name="copy-outline" size={16} color="#1a3a52" />
            <Text style={styles.copyCodeText}>Copy Code</Text>
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: '#fff',
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    alignSelf: 'stretch',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modeTabTextActive: { color: '#1a3a52' },

  // Card preview
  cardContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    alignSelf: 'stretch',
  },

  // Share section
  shareSection: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  shareSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: Spacing.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
    justifyContent: 'center',
  },
  shareTarget: {
    alignItems: 'center',
    width: 64,
  },
  shareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  shareTargetLabel: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },

  // Referral code box
  codeBox: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a3a52',
    letterSpacing: 4,
    marginBottom: 12,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e8f0f7',
    borderRadius: BorderRadius.sm,
  },
  copyCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3a52',
  },
});

export default withErrorBoundary(SavingsShareScreen, 'SavingsShare');
