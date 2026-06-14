import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { platformAlertConfirm } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface SurpriseData {
  category: string;
  categoryEmoji?: string;
  distance: string;
  expiresAt: string;
  merchant?: {
    id: string;
    name: string;
    image?: string;
  };
  trial?: {
    id: string;
    title: string;
    image?: string;
    coinPrice: number;
    originalPrice: number;
  };
  isBooked?: boolean;
}

export default function SurpriseScreen() {
  const router = useRouter();
  const [data, setData] = useState<SurpriseData | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    loadSurpriseData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);
    updateCountdown();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const loadSurpriseData = async () => {
    try {
      const surpriseData = await tryApi.getSurpriseTrial();
      setData(surpriseData);
      setRevealed(!!surpriseData.merchant);
    } catch (err) {
      if (__DEV__) logger.error('Failed to load surprise:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!data) return;
    const now = new Date();
    const expiry = new Date(data.expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expired');
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m left`);
    }
  };

  const handleReveal = () => {
    platformAlertConfirm(
      'Reveal Surprise',
      'This will redeem coins to reveal your personalized surprise. Continue?',
      async () => {
        setRevealing(true);
        try {
          const revealed = await tryApi.revealSurpriseTrial();
          setData(revealed);
          setRevealed(true);
        } catch (err) {
          if (__DEV__) logger.error('Failed to reveal surprise:', err);
        } finally {
          setRevealing(false);
        }
      },
      'Confirm',
      'Cancel',
    );
  };

  const handleBookNow = () => {
    if (data?.trial) {
      router.push(`/try/${data.trial.id}`);
    }
  };

  const handleSkip = () => {
    setRevealed(false);
    setData((prev) => (prev ? { ...prev, merchant: undefined, trial: undefined } : null));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Weekly Surprise</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Weekly Surprise</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load surprise</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Weekly Surprise</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!revealed ? (
          // Before Reveal State
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.surpriseContainer}
          >
            {/* Sparkles Background */}
            <View style={styles.sparklesOverlay}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.sparkle,
                    {
                      left: `${(Date.now() * 7 + i * 31) % 100}%`,
                      top: `${(Date.now() * 13 + i * 47) % 100}%`,
                    },
                  ]}
                >
                  <Text style={styles.sparkleText}>✨</Text>
                </View>
              ))}
            </View>

            {/* Content */}
            <View style={styles.surpriseContent}>
              <Text style={styles.surpriseHeading}>🎁 Your Weekly Surprise</Text>

              {/* Category Info */}
              <View style={styles.infoCard}>
                <Text style={styles.categoryLabel}>
                  {data.categoryEmoji} {data.category}
                </Text>
                <Text style={styles.distanceLabel}>~{data.distance} away</Text>
              </View>

              {/* Countdown */}
              <View style={styles.countdownCard}>
                <Ionicons name="hourglass" size={20} color="#FFD700" />
                <Text style={styles.countdownText}>Expires {timeRemaining}</Text>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Ionicons name="help-circle" size={20} color="#fff" />
                <Text style={styles.infoText}>
                  We pick one trial you've never tried each week. Tap to reveal the merchant!
                </Text>
              </View>

              {/* Reveal Button */}
              <Pressable style={styles.revealButton} onPress={handleReveal} disabled={revealing}>
                {revealing ? (
                  <ActivityIndicator size="small" color={colors.brand.purple} />
                ) : (
                  <>
                    <Text style={styles.revealButtonText}>✨ REVEAL</Text>
                  </>
                )}
              </Pressable>
            </View>
          </LinearGradient>
        ) : data.merchant && data.trial ? (
          // After Reveal State
          <View style={styles.revealedContainer}>
            {/* Trial Card */}
            <View style={styles.trialCard}>
              {data.trial.image && (
                <ImageBackground source={{ uri: data.trial.image }} style={styles.trialImage} resizeMode="cover">
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.trialImageOverlay} />
                </ImageBackground>
              )}

              <View style={styles.trialContent}>
                <Text style={styles.trialTitle}>{data.trial.title}</Text>
                <Text style={styles.merchantName}>{data.merchant.name}</Text>

                {/* Pricing */}
                <View style={styles.pricingSection}>
                  <View style={styles.coinPrice}>
                    <Text style={styles.coinPriceText}>{data.trial.coinPrice} 🪙</Text>
                  </View>
                  <Text style={styles.originalPrice}>₹{data.trial.originalPrice}</Text>
                </View>

                {/* Distance */}
                <View style={styles.distanceRow}>
                  <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                  <Text style={styles.distanceText}>{data.distance}</Text>
                </View>
              </View>
            </View>

            {/* Booked State */}
            {data.isBooked && (
              <View style={styles.bookedBanner}>
                <Ionicons name="checkmark-circle" size={20} color={colors.successScale[500]} />
                <Text style={styles.bookedText}>Already Booked ✓</Text>
                <Pressable style={styles.bookedLink} onPress={() => router.push('/try/history')}>
                  <Text style={styles.bookedLinkText}>View QR →</Text>
                </Pressable>
              </View>
            )}

            {/* Actions */}
            {!data.isBooked && (
              <View style={styles.actions}>
                <Pressable style={styles.bookButton} onPress={handleBookNow}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </Pressable>

                <Pressable style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip this week</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Surprise not available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  // Before Reveal
  surpriseContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 400,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sparklesOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 20,
    opacity: 0.6,
  },
  surpriseContent: {
    gap: spacing.lg,
    zIndex: 1,
  },
  surpriseHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  distanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoSection: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  revealButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  revealButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.purple,
  },
  // After Reveal
  revealedContainer: {
    gap: spacing.lg,
  },
  trialCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  trialImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.secondary,
  },
  trialImageOverlay: {
    flex: 1,
  },
  trialContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  merchantName: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  coinPrice: {
    backgroundColor: colors.brand.purple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  coinPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  originalPrice: {
    fontSize: 12,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  distanceText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  bookedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successScale[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.successScale[200],
  },
  bookedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  bookedLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.successScale[500],
    borderRadius: borderRadius.md,
  },
  bookedLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    gap: spacing.md,
  },
  bookButton: {
    backgroundColor: colors.brand.purple,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
