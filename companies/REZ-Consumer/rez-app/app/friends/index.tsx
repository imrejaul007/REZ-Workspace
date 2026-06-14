// @ts-nocheck
// Friends & Invite Screen
// "Invite Friends, Earn Together" — displays the user's referral code,
// earnings summary, and sharing options (WhatsApp deep link + native share).

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Share as RNShare,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '@/services/apiClient';
import { platformAlertSimple } from '@/utils/platformAlert';
import { BRAND } from '@/constants/brand';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

interface MyReferralData {
  referralCode: string;
  referralCount: number;
  coinsEarned: number;
}

const HOW_IT_WORKS = [
  {
    icon: 'share-social-outline' as const,
    label: 'Invite',
    desc: 'Share your code with friends',
  },
  {
    icon: 'person-add-outline' as const,
    label: 'They Join',
    desc: 'Friend signs up using your code',
  },
  {
    icon: 'logo-bitcoin' as const,
    label: 'Both Earn',
    desc: 'You both receive REZ coins',
  },
];

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isMounted = useIsMounted();

  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [data, setData] = useState<MyReferralData>({
    referralCode: '',
    referralCount: 0,
    coinsEarned: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<unknown>('/referral/my-code');
      const payload = (response as unknown)?.data?.data ?? (response as unknown)?.data ?? null;

      if (payload && isMounted()) {
        setData({
          referralCode: payload.referralCode || payload.code || '',
          referralCount: payload.referralCount ?? payload.totalReferrals ?? 0,
          coinsEarned: payload.coinsEarned ?? payload.totalCoinsEarned ?? 0,
        });
      }
    } catch {
      // Non-critical — keep defaults
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, [isMounted]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopy = async () => {
    if (!data.referralCode) return;
    await Clipboard.setStringAsync(data.referralCode);
    if (!isMounted()) return;
    setIsCopied(true);
    platformAlertSimple('Copied!', 'Referral code copied to clipboard');
    setTimeout(() => {
      if (isMounted()) setIsCopied(false);
    }, 3000);
  };

  const buildShareMessage = () =>
    `Join me on ${BRAND.APP_NAME} and earn coins every time you shop! Use my code: ${data.referralCode}. Download the app and start saving today.`;

  const handleWhatsApp = async () => {
    const msg = buildShareMessage();
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await RNShare.share({ message: msg, title: `Join ${BRAND.APP_NAME}` });
    }
  };

  const handleShare = async () => {
    await RNShare.share({
      message: buildShareMessage(),
      title: `Join ${BRAND.APP_NAME}`,
    }).catch((err) => {
      // R2-H1 FIX: Log Share failure so attribution can be retried.
      if (__DEV__) logger.warn('[friends] Share failed:', { error: err });
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as unknown))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Invite Friends</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Invite Friends, Earn Together</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Referral Code Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Referral Code</Text>
            <Text style={styles.codeText}>{data.referralCode || '—'}</Text>

            <View style={styles.codeActions}>
              <Pressable
                style={styles.codeBtn}
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel="Copy referral code"
              >
                <Ionicons name={isCopied ? 'checkmark' : 'copy-outline'} size={18} color="#7C3AED" />
                <Text style={styles.codeBtnText}>{isCopied ? 'Copied!' : 'Copy Code'}</Text>
              </Pressable>

              <Pressable
                style={[styles.codeBtn, styles.codeBtnFilled]}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share referral code"
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={[styles.codeBtnText, { color: '#fff' }]}>Share</Text>
              </Pressable>
            </View>
          </View>

          {/* How it works */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How it Works</Text>
            <View style={styles.stepsRow}>
              {HOW_IT_WORKS.map((step, idx) => (
                <React.Fragment key={step.label}>
                  <View style={styles.step}>
                    <View style={styles.stepIcon}>
                      <Ionicons name={step.icon} size={22} color="#7C3AED" />
                    </View>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" style={styles.stepArrow} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Earnings Summary */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Earnings</Text>
            <View style={styles.earningsRow}>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsNumber}>{data.referralCount}</Text>
                <Text style={styles.earningsLabel}>Friends Referred</Text>
              </View>
              <View style={styles.earningsDivider} />
              <View style={styles.earningsStat}>
                <Text style={styles.earningsNumber}>{data.coinsEarned}</Text>
                <Text style={styles.earningsLabel}>REZ Coins Earned</Text>
              </View>
            </View>
            {data.referralCount > 0 && (
              <Text style={styles.earningsSummary}>
                You've referred {data.referralCount} friend
                {data.referralCount !== 1 ? 's' : ''} and earned {data.coinsEarned} REZ coins together.
              </Text>
            )}
          </View>

          {/* Share via WhatsApp */}
          {data.referralCode ? (
            <Pressable
              style={styles.whatsappBtn}
              onPress={handleWhatsApp}
              accessibilityRole="button"
              accessibilityLabel="Share via WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              <Text style={styles.whatsappBtnText}>Share via WhatsApp</Text>
            </Pressable>
          ) : null}

          {/* Native Share */}
          <Pressable
            style={styles.nativeShareBtn}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share with other apps"
          >
            <Ionicons name="share-outline" size={20} color="#7C3AED" />
            <Text style={styles.nativeShareText}>Share with other apps</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFC857',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a3a52',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  codeBtnFilled: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  codeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 15,
  },
  stepArrow: {
    marginTop: 14,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  earningsStat: {
    alignItems: 'center',
    flex: 1,
  },
  earningsNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#7C3AED',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  earningsDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E5E7EB',
  },
  earningsSummary: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 14,
  },
  whatsappBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  nativeShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 12,
  },
  nativeShareText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
