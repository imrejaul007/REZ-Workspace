// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Linking,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookingData {
  bookingId: string;
  trialId: string;
  title: string;
  merchant: string;
  merchantImage?: string;
  image: string;
  distance?: number;
  distanceUnit?: string;
  qrToken: string;
  qrExpiresAt: string;
  validUntil: string;
  status: 'active' | 'completed' | 'expired';
  rewards?: {
    coinsEarned: number;
    brandedCoinsEarned: number;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUsed, setIsUsed] = useState(false);

  // ─── Load booking data ─────────────────────────────────────────────────────

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      setError('Invalid booking ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try fetching booking details first
      let data = await tryApi.getBookingDetails(bookingId);

      // Fallback to history search if booking details not found
      if (!data) {
        const history = await tryApi.getHistory();
        const matched = history.find((h) => h.bookingId === bookingId);
        if (matched) {
          data = {
            bookingId: matched.bookingId,
            trialId: matched.trialId,
            title: matched.title,
            merchant: matched.merchant,
            merchantImage: matched.merchantImage,
            image: matched.image,
            qrToken: matched.qrToken || `qr_${matched.bookingId}`,
            qrExpiresAt: matched.qrExpiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            validUntil: matched.validUntil || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            status: matched.status,
            rewards: { coinsEarned: 50, brandedCoinsEarned: 20 },
          };
        }
      }

      // Use mock data in development if still no data
      if (!data && __DEV__) {
        data = createMockBooking(bookingId);
      }

      if (data) {
        setBooking(data);
        setIsExpired(data.status === 'expired');
        setIsUsed(data.status === 'completed');
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      if (__DEV__) logger.error('Failed to load booking:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // ─── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!booking) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(booking.qrExpiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleNavigate = () => {
    if (!booking?.merchant) return;
    const query = encodeURIComponent(booking.merchant);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps. Please try again.');
    });
  };

  const handleShare = async () => {
    if (!booking) return;
    try {
      await Share.share({
        title: 'My ReZ Trial Booking',
        message: `I'm visiting ${booking.merchant} for my ReZ trial: ${booking.title}. Show this QR at the store!`,
        url: undefined,
      });
    } catch (err) {
      if (__DEV__) logger.error('Share failed:', err);
    }
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const formatExpiryTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDistance = () => {
    if (!booking?.distance) return null;
    return `${booking.distance} ${booking.distanceUnit || 'km'} away`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
          <Text style={styles.loadingText}>Loading your booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>{error || 'Booking Not Found'}</Text>
          <Pressable style={styles.primaryButton} onPress={loadBooking}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/try')}>
            <Text style={styles.secondaryButtonText}>Back to Explore</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/try')} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Confirmed!</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Status Badge */}
        {isUsed && (
          <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.statusText}>Visit Completed</Text>
          </View>
        )}
        {isExpired && !isUsed && (
          <View style={[styles.statusBadge, styles.statusBadgeExpired]}>
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.statusText}>Expired</Text>
          </View>
        )}

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrCard}>
            {!isExpired && !isUsed ? (
              <>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={booking.qrToken}
                    size={200}
                    color={colors.text.primary}
                    backgroundColor="#fff"
                  />
                </View>
                <Text style={styles.qrHint}>Show this at the store</Text>

                {/* Timer */}
                <View style={styles.timerContainer}>
                  <Text style={styles.timerLabel}>Valid for 2 hours</Text>
                  <Text style={styles.timerValue}>Expires: {formatExpiryTime(booking.qrExpiresAt)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.expiredState}>
                <Ionicons
                  name={isUsed ? 'checkmark-circle' : 'time'}
                  size={64}
                  color={isUsed ? colors.success : colors.error}
                />
                <Text style={[styles.expiredTitle, isUsed && styles.usedTitle]}>
                  {isUsed ? 'Visit Completed!' : 'QR Code Expired'}
                </Text>
                <Text style={styles.expiredSubtext}>
                  {isUsed
                    ? 'Thank you for visiting! Check your rewards below.'
                    : 'This QR code is no longer valid.'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Merchant Info */}
        <View style={styles.merchantSection}>
          <Text style={styles.merchantName}>{booking.merchant}</Text>
          {formatDistance() && (
            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.distanceText}>{formatDistance()}</Text>
            </View>
          )}
          <Pressable style={styles.navigateButton} onPress={handleNavigate}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Rewards Preview */}
        {!isUsed && booking.rewards && (
          <View style={styles.rewardsSection}>
            <Text style={styles.rewardsTitle}>AFTER YOUR VISIT</Text>
            <View style={styles.rewardsList}>
              <View style={styles.rewardItem}>
                <Ionicons name="add-circle" size={18} color={colors.success} />
                <Text style={styles.rewardText}>+ {booking.rewards.coinsEarned} ReZ Coins</Text>
              </View>
              <View style={styles.rewardItem}>
                <Ionicons name="add-circle" size={18} color={colors.brand.purple} />
                <Text style={styles.rewardText}>+ {booking.rewards.brandedCoinsEarned} Trial Coins</Text>
              </View>
            </View>
            <Pressable style={styles.reviewLink}>
              <Ionicons name="star" size={16} color={colors.lightMustard} />
              <Text style={styles.reviewLinkText}>Leave a review (optional)</Text>
            </Pressable>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Pressable style={styles.actionButton} onPress={handleNavigate}>
            <Ionicons name="navigate" size={20} color={colors.brand.purple} />
            <Text style={styles.actionButtonText}>Navigate</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={colors.brand.purple} />
            <Text style={styles.actionButtonText}>Share</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Back to Explore */}
        <Pressable style={styles.backLink} onPress={() => router.push('/try')}>
          <Ionicons name="arrow-back" size={16} color={colors.text.secondary} />
          <Text style={styles.backLinkText}>Back to explore more trials</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function createMockBooking(bookingId: string): BookingData {
  return {
    bookingId,
    trialId: 'trial_001',
    title: 'Swedish Relaxation Massage — 60 min',
    merchant: 'Serenity Spa & Wellness',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800',
    distance: 1.2,
    distanceUnit: 'km',
    qrToken: `booking_${bookingId}_qr`,
    qrExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    rewards: { coinsEarned: 50, brandedCoinsEarned: 20 },
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Header
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
  },
  statusBadgeCompleted: {
    backgroundColor: colors.success,
  },
  statusBadgeExpired: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // QR Section
  qrSection: {
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
  },
  qrHint: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    width: '100%',
  },
  timerLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  timerValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  // Expired State
  expiredState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  expiredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
  },
  usedTitle: {
    color: colors.success,
  },
  expiredSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },

  // Merchant Section
  merchantSection: {
    gap: spacing.sm,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distanceText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brand.purple,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Rewards Section
  rewardsSection: {
    gap: spacing.md,
  },
  rewardsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  rewardsList: {
    gap: spacing.sm,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rewardText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  reviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  reviewLinkText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.tint.purple,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.brand.purple,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.purple,
  },

  // Back Link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  backLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Buttons
  primaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.brand.purple,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
