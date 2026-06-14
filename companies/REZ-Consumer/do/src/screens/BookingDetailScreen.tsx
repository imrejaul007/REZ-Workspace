import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Calendar, Clock, Users, QrCode, Share2, X, Phone, Navigation, CalendarPlus } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { rezApi, Booking } from '@/services/rezApi';
import * as Haptics from 'expo-haptics';

export const BookingDetailScreen: React.FC = () => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const data = await rezApi.getBooking(id as string);
      setBooking(data);
    } catch (error) {
      logger.error('Booking load error:', error);
      Alert.alert('Error', 'Failed to load booking');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = async () => {
    try {
      const response = await rezApi.getBookingQR(id as string);
      if (response) {
        setQrCode(response);
        setShowQR(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load QR code');
    }
  };

  const handleShare = async () => {
    if (!booking) return;

    try {
      await Share.share({
        message: `I've booked ${booking.entityName} for ${formatDate(booking.dateTime)}. Confirmation: ${booking.confirmationCode}`,
        title: 'My Booking',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await rezApi.cancelBooking(id as string);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleGetDirections = async () => {
    if (!booking?.address) {
      Alert.alert('Error', 'No address available');
      return;
    }

    const address = encodeURIComponent(booking.address);
    const url = Platform.select({
      ios: `maps://?daddr=${address}`,
      android: `google.navigation:?q=${address}`,
    });

    if (url) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Could not open maps');
      }
    }
  };

  const handleContactVenue = () => {
    if (!booking?.phone) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    Alert.alert(
      'Contact Venue',
      `Call ${booking.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            const url = `tel:${booking.phone}`;
            try {
              await Linking.openURL(url);
            } catch (error) {
              Alert.alert('Error', 'Could not open phone');
            }
          },
        },
      ]
    );
  };

  const handleAddToCalendar = async () => {
    if (!booking?.dateTime) return;

    const date = new Date(booking.dateTime);
    const startDate = date.toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000) // +2 hours
      .toISOString()
      .replace(/-|:|\.\d+/g, '');

    const title = encodeURIComponent(`Booking at ${booking.entityName}`);
    const details = encodeURIComponent(`Confirmation: ${booking.confirmationCode}`);
    const location = encodeURIComponent(booking.address || '');

    const url = Platform.select({
      ios: `calshow:${date.getTime()}`,
      android: `content://com.android.calendar/event?title=${title}&details=${details}&location=${location}&begin=${startDate}&end=${endDate}`,
    });

    try {
      if (url) {
        await Linking.openURL(url);
      }
    } catch (error) {
      // Fallback: copy date to clipboard
      Alert.alert(
        'Booking Date',
        `Your booking is on ${formatDate(booking.dateTime)} at ${formatTime(booking.dateTime)}`
      );
    }
  };

  const handleReschedule = () => {
    Alert.alert(
      'Reschedule Booking',
      'Contact the venue to reschedule your booking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Venue',
          onPress: handleContactVenue,
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.systemGreen;
      case 'pending': return colors.systemOrange;
      case 'completed': return colors.primary;
      case 'cancelled': return colors.systemRed;
      default: return colors.gray;
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loading}>
          <Text style={{ color: colors.labelSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.label} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.label, ...typography.titleMedium }]}>
          Booking Details
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Share2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <Animated.View entering={FadeIn} style={styles.statusContainer}>
          <Badge
            label={booking.status.toUpperCase()}
            variant={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'error' : 'default'}
            size="medium"
          />
        </Animated.View>

        {/* Venue Image */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.imageContainer, { backgroundColor: colors.fill }]}>
            {booking.entityImage ? (
              <Image source={{ uri: booking.entityImage }} style={styles.image} />
            ) : (
              <Text style={styles.imagePlaceholder}>📍</Text>
            )}
          </View>
        </Animated.View>

        {/* Venue Info */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.content, { padding: spacing.screenPadding }]}>
          <Text style={[styles.venueName, { color: colors.label, ...typography.titleLarge }]}>
            {booking.entityName}
          </Text>

          {/* Details Card */}
          <Card variant="default" style={{ marginTop: spacing.lg }}>
            <View style={styles.detailRow}>
              <Calendar size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.labelSecondary }]}>Date</Text>
                <Text style={[styles.detailValue, { color: colors.label }]}>
                  {formatDate(booking.dateTime)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.separator }]} />

            <View style={styles.detailRow}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.labelSecondary }]}>Time</Text>
                <Text style={[styles.detailValue, { color: colors.label }]}>
                  {formatTime(booking.dateTime)}
                </Text>
              </View>
            </View>

            {booking.partySize && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.separator }]} />
                <View style={styles.detailRow}>
                  <Users size={20} color={colors.primary} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.labelSecondary }]}>Guests</Text>
                    <Text style={[styles.detailValue, { color: colors.label }]}>
                      {booking.partySize} people
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* Confirmation Code */}
          {booking.confirmationCode && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <Card variant="elevated" style={{ marginTop: spacing.md, backgroundColor: colors.primary + '10' }}>
                <View style={styles.codeContainer}>
                  <Text style={[styles.codeLabel, { color: colors.labelSecondary }]}>
                    Confirmation Code
                  </Text>
                  <Text style={[styles.codeValue, { color: colors.primary }]}>
                    {booking.confirmationCode}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Rewards Earned */}
          {booking.coinsEarned && (
            <Animated.View entering={FadeInDown.delay(400)}>
              <Card variant="filled" style={{ marginTop: spacing.md, backgroundColor: colors.gold + '15' }}>
                <View style={styles.rewardRow}>
                  <Text style={[styles.rewardText, { color: colors.gold }]}>
                    🎉 +{booking.coinsEarned} coins earned!
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(500)} style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button variant="primary" size="large" onPress={handleShowQR} fullWidth>
              <QrCode size={20} color={colors.white} />
              <Text style={{ color: colors.white, marginLeft: 8 }}>Show QR Code</Text>
            </Button>

            {booking.status === 'confirmed' && (
              <>
                <Button variant="secondary" size="large" onPress={handleShare} fullWidth>
                  <Share2 size={20} color={colors.primary} />
                  <Text style={{ color: colors.primary, marginLeft: 8 }}>Share Booking</Text>
                </Button>

                {booking.address && (
                  <Button variant="secondary" size="large" onPress={handleGetDirections} fullWidth>
                    <Navigation size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, marginLeft: 8 }}>Get Directions</Text>
                  </Button>
                )}

                {booking.phone && (
                  <Button variant="secondary" size="large" onPress={handleContactVenue} fullWidth>
                    <Phone size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, marginLeft: 8 }}>Call Venue</Text>
                  </Button>
                )}

                <Button variant="secondary" size="large" onPress={handleAddToCalendar} fullWidth>
                  <CalendarPlus size={20} color={colors.primary} />
                  <Text style={{ color: colors.primary, marginLeft: 8 }}>Add to Calendar</Text>
                </Button>

                <Button variant="ghost" size="medium" onPress={handleReschedule}>
                  <CalendarPlus size={16} color={colors.systemOrange} />
                  <Text style={{ color: colors.systemOrange, marginLeft: 4 }}>Reschedule</Text>
                </Button>

                <Button variant="ghost" size="medium" onPress={handleCancel}>
                  <Text style={{ color: colors.systemRed }}>Cancel Booking</Text>
                </Button>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* QR Modal */}
      {showQR && (
        <Animated.View entering={ZoomIn} style={styles.qrOverlay}>
          <TouchableOpacity
            style={styles.qrBackdrop}
            onPress={() => setShowQR(false)}
            activeOpacity={1}
          />
          <View style={[styles.qrModal, { backgroundColor: colors.backgroundElevated }]}>
            <TouchableOpacity
              style={[styles.qrClose, { backgroundColor: colors.fill }]}
              onPress={() => setShowQR(false)}
            >
              <X size={20} color={colors.label} />
            </TouchableOpacity>

            <Text style={[styles.qrTitle, { color: colors.label, ...typography.titleMedium }]}>
              Show this at the venue
            </Text>

            <View style={[styles.qrCode, { backgroundColor: colors.white }]}>
              <Text style={styles.qrPlaceholder}>
                {booking.confirmationCode}
              </Text>
            </View>

            <Text style={[styles.qrCodeText, { color: colors.labelSecondary }]}>
              {booking.confirmationCode}
            </Text>

            <Text style={[styles.qrHint, { color: colors.labelTertiary, ...typography.captionMedium }]}>
              Present this QR code or confirmation number at the venue
            </Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: 8,
    marginRight: -8,
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  imageContainer: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    fontSize: 64,
  },
  content: {},
  venueName: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    marginVertical: 12,
  },
  codeContainer: {
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
  rewardRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  qrBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  qrModal: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  qrClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
  },
  qrCodeText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
  },
  qrHint: {
    marginTop: 16,
    textAlign: 'center',
  },
});
