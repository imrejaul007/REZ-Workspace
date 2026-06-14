// Habixo Booking Detail Screen
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { getBooking, cancelBooking, type HabixoBooking } from '../api';

// Mock data for development/fallback
const MOCK_BOOKING: HabixoBooking = {
  id: 'b1',
  propertyId: '1',
  property: {
    id: '1',
    title: 'Modern Apartment in Koramangala',
    location: 'Koramangala',
    city: 'Bangalore',
    price: 2500,
    rating: 4.8,
    reviews: 127,
    images: ['https://picsum.photos/800/600?random=30', 'https://picsum.photos/800/600?random=31'],
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    type: 'Entire Apartment',
    amenities: ['WiFi', 'AC', 'TV'],
    host: { name: 'Rahul S.', rating: 4.9, responseRate: 98 },
    brand: 'habixo_stay',
    status: 'active',
  },
  checkIn: '2026-05-15T14:00:00Z',
  checkOut: '2026-05-18T11:00:00Z',
  nights: 3,
  guests: 2,
  total: 8950,
  status: 'confirmed',
  paymentStatus: 'paid',
  createdAt: '2026-05-10T10:00:00Z',
};

// Price breakdown constants
const CLEANING_FEE = 500;
const SERVICE_FEE_RATE = 0.1; // 10%
const TAX_RATE = 0.18; // 18% GST

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
  confirmed: { bg: '#dcfce7', text: '#166534', icon: '✅' },
  completed: { bg: '#f3f4f6', text: '#374151', icon: '🎉' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', icon: '❌' },
};

const PAYMENT_METHODS: Record<string, { icon: string; name: string }> = {
  card: { icon: '💳', name: 'Credit/Debit Card' },
  upi: { icon: '📱', name: 'UPI' },
  netbanking: { icon: '🏦', name: 'Net Banking' },
  wallet: { icon: '👛', name: 'Wallet' },
};

function formatDate(dateString: string): { date: string; time: string } {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<HabixoBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Try to fetch from API
      const result = await getBooking(id);
      if (result.success && result.data) {
        setBooking(result.data);
      } else {
        // Fallback to mock data
        setBooking({ ...MOCK_BOOKING, id });
      }
    } catch {
      // Fallback to mock data
      setBooking({ ...MOCK_BOOKING, id });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No, Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!booking) return;

            setCancelling(true);
            try {
              const result = await cancelBooking(booking.id);
              if (result.success) {
                setBooking({ ...booking, status: 'cancelled' });
                Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel booking');
              }
            } catch {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleContactHost = () => {
    Alert.alert('Contact Host', `Messaging ${booking?.property.host.name || 'Host'}...`);
  };

  const handleGetDirections = () => {
    Alert.alert('Get Directions', 'Opening maps to navigate to the property...');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Booking Details' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Booking Details' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorDesc}>The booking you're looking for doesn't exist.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const checkInInfo = formatDate(booking.checkIn);
  const checkOutInfo = formatDate(booking.checkOut);

  // Calculate price breakdown
  const nightlyRate = booking.property.price;
  const accommodationTotal = nightlyRate * booking.nights;
  const serviceFee = Math.round(accommodationTotal * SERVICE_FEE_RATE);
  const taxes = Math.round((accommodationTotal + CLEANING_FEE + serviceFee) * TAX_RATE);
  const totalAmount = accommodationTotal + CLEANING_FEE + serviceFee + taxes;

  // Calculate coins earned (10 coins per 100 rupees spent)
  const coinsEarned = Math.floor(totalAmount / 100);

  // Mock payment and transaction info
  const paymentInfo = {
    method: 'card' as keyof typeof PAYMENT_METHODS,
    transactionId: `TXN${Date.now().toString().slice(-10)}`,
  };

  // Check if cancellation is allowed (only for confirmed/pending, not within 24 hours of check-in)
  const canCancel =
    (booking.status === 'confirmed' || booking.status === 'pending') &&
    new Date(booking.checkIn).getTime() - Date.now() > 24 * 60 * 60 * 1000;

  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Booking Details' }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Property Image */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: booking.property.images[0] || 'https://picsum.photos/800/400?random=99' }}
            style={styles.propertyImage}
          />
          <View style={styles.imageOverlay}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={styles.statusIcon}>{statusStyle.icon}</Text>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Property Info */}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle}>{booking.property.title}</Text>
            <Text style={styles.propertyLocation}>
              📍 {booking.property.location}, {booking.property.city}
            </Text>
            <View style={styles.propertyMeta}>
              <Text style={styles.propertyType}>{booking.property.type}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {booking.property.rating}</Text>
              </View>
            </View>
          </View>

          {/* Coins Earned Badge */}
          {(booking.status === 'completed' || booking.status === 'confirmed') && (
            <View style={styles.coinsEarnedBadge}>
              <Text style={styles.coinsIcon}>🪙</Text>
              <View style={styles.coinsInfo}>
                <Text style={styles.coinsTitle}>Coins Earned!</Text>
                <Text style={styles.coinsValue}>+{coinsEarned} coins</Text>
              </View>
            </View>
          )}

          {/* Dates & Guests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Text style={styles.detailIconText}>📅</Text>
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Check-in</Text>
                  <Text style={styles.detailValue}>{checkInInfo.date}</Text>
                  <Text style={styles.detailTime}>From {checkInInfo.time}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Text style={styles.detailIconText}>📅</Text>
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Check-out</Text>
                  <Text style={styles.detailValue}>{checkOutInfo.date}</Text>
                  <Text style={styles.detailTime}>By {checkOutInfo.time}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Text style={styles.detailIconText}>👥</Text>
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>
                    {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Text style={styles.detailIconText}>🌙</Text>
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {booking.nights} night{booking.nights > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>

            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {formatCurrency(nightlyRate)} x {booking.nights} nights
                </Text>
                <Text style={styles.priceValue}>{formatCurrency(accommodationTotal)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cleaning fee</Text>
                <Text style={styles.priceValue}>{formatCurrency(CLEANING_FEE)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service fee</Text>
                <Text style={styles.priceValue}>{formatCurrency(serviceFee)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & fees (18% GST)</Text>
                <Text style={styles.priceValue}>{formatCurrency(taxes)}</Text>
              </View>

              <View style={styles.priceDivider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>

            <View style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentIcon}>
                  {PAYMENT_METHODS[paymentInfo.method].icon}
                </Text>
                <Text style={styles.paymentMethod}>
                  {PAYMENT_METHODS[paymentInfo.method].name}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentLabel}>Transaction ID</Text>
                  <Text style={styles.transactionId}>{paymentInfo.transactionId}</Text>
                </View>
                <View style={[styles.paymentStatusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.paymentStatusText, { color: statusStyle.text }]}>
                    {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Entry Pass QR Code */}
          {(booking.status === 'confirmed' || booking.status === 'completed') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entry Pass</Text>

              <View style={styles.qrCard}>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrIcon}>📱</Text>
                  <Text style={styles.qrText}>QR Code</Text>
                </View>
                <View style={styles.qrInfo}>
                  <Text style={styles.qrTitle}>Show this at check-in</Text>
                  <Text style={styles.qrDesc}>
                    Present the QR code on your phone at the property entrance or share the
                    booking confirmation with your host.
                  </Text>
                  <Text style={styles.bookingIdText}>Booking ID: {booking.id}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Host Contact Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Host</Text>

            <View style={styles.hostCard}>
              <Image
                source={{
                  uri: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70)}`,
                }}
                style={styles.hostImage}
              />
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{booking.property.host.name}</Text>
                <View style={styles.hostStats}>
                  <Text style={styles.hostStat}>
                    ⭐ {booking.property.host.rating} rating
                  </Text>
                  <Text style={styles.hostStat}>
                    📊 {booking.property.host.responseRate}% response
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.messageButton} onPress={handleContactHost}>
                <Text style={styles.messageButtonText}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetDirections}>
              <Text style={styles.primaryButtonIcon}>🗺️</Text>
              <Text style={styles.primaryButtonText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleContactHost}>
              <Text style={styles.secondaryButtonIcon}>📞</Text>
              <Text style={styles.secondaryButtonText}>Contact Host</Text>
            </TouchableOpacity>

            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#991b1b" />
                ) : (
                  <>
                    <Text style={styles.cancelButtonIcon}>✕</Text>
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Booking Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Timeline</Text>

            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Booking Confirmed</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {booking.status !== 'cancelled' && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      booking.status === 'completed' || booking.status === 'confirmed'
                        ? styles.timelineDotActive
                        : styles.timelineDotPending,
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Check-in</Text>
                    <Text style={styles.timelineDate}>
                      {checkInInfo.date} at {checkInInfo.time}
                    </Text>
                  </View>
                </View>
              )}

              {booking.status === 'completed' && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotActive]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Check-out</Text>
                    <Text style={styles.timelineDate}>
                      {checkOutInfo.date} at {checkOutInfo.time}
                    </Text>
                  </View>
                </View>
              )}

              {booking.status === 'cancelled' && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotCancelled]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Booking Cancelled</Text>
                    <Text style={styles.timelineDate}>
                      {new Date().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imageSection: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 250,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  propertyInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  propertyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyType: {
    fontSize: 13,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ratingBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  coinsEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  coinsIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  coinsInfo: {
    flex: 1,
  },
  coinsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  coinsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#b45309',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIconText: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  detailTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#374151',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethod: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  paymentStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  qrIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  qrText: {
    fontSize: 12,
    color: '#6b7280',
  },
  qrInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  qrDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  bookingIdText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  hostCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  hostImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  hostStats: {
    flexDirection: 'row',
    gap: 12,
  },
  hostStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 20,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  secondaryButtonIcon: {
    fontSize: 18,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  cancelButtonIcon: {
    fontSize: 16,
    color: '#991b1b',
  },
  cancelButtonText: {
    color: '#991b1b',
    fontSize: 16,
    fontWeight: '600',
  },
  timeline: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: '#6366f1',
  },
  timelineDotPending: {
    backgroundColor: '#d1d5db',
  },
  timelineDotCancelled: {
    backgroundColor: '#ef4444',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomSpacer: {
    height: 32,
  },
});
