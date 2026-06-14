// Habixo Bookings Screen - User's booking history
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';

const BOOKINGS = [
  {
    id: 'b1',
    type: 'habixo_stay',
    status: 'confirmed',
    title: 'Modern Apartment in Koramangala',
    location: 'Koramangala, Bangalore',
    image: 'https://picsum.photos/400/300?random=20',
    checkIn: 'May 15, 2026',
    checkOut: 'May 18, 2026',
    guests: 2,
    total: '₹8,500',
    earnedCoins: 50,
    host: 'Rahul S.',
  },
  {
    id: 'b2',
    type: 'habixo_rent',
    status: 'active',
    title: 'Cozy Room in Indiranagar',
    location: 'Indiranagar, Bangalore',
    image: 'https://picsum.photos/400/300?random=21',
    leaseStart: 'April 1, 2026',
    leaseEnd: 'September 30, 2026',
    monthlyRent: '₹18,000',
    deposit: '₹36,000',
    landlord: 'Priya M.',
  },
  {
    id: 'b3',
    type: 'habixo_stay',
    status: 'completed',
    title: 'Beach Villa in Goa',
    location: 'Anjuna, Goa',
    image: 'https://picsum.photos/400/300?random=22',
    checkIn: 'March 20, 2026',
    checkOut: 'March 25, 2026',
    guests: 4,
    total: '₹27,500',
    earnedCoins: 100,
    host: 'Ana G.',
    reviewSubmitted: false,
  },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#dcfce7', text: '#166534' },
  active: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#f3f4f6', text: '#374151' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
};

export default function HabixoBookingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{BOOKINGS.length}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {BOOKINGS.filter((b) => b.status === 'active' || b.status === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{(BOOKINGS.reduce((sum, b) => sum + (b.total ? parseInt(b.total.replace(/[₹,]/g, '')) : 0), 0).toLocaleString())}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
        </View>

        {/* Segments */}
        <View style={styles.segments}>
          <TouchableOpacity style={[styles.segment, styles.segmentActive]}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.segment}>
            <Text style={styles.segmentText}>Stays</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.segment}>
            <Text style={styles.segmentText}>Rentals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.segment}>
            <Text style={styles.segmentText}>Flatmates</Text>
          </TouchableOpacity>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsList}>
          {BOOKINGS.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => router.push(`/habixo/booking/${booking.id}`)}
            >
              <Image
                source={{ uri: booking.image }}
                style={styles.bookingImage}
              />
              <View style={styles.bookingContent}>
                <View style={styles.bookingHeader}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>
                      {booking.type === 'habixo_stay' ? '🏨 Stay' : '🏢 Rent'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_STYLES[booking.status].bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_STYLES[booking.status].text },
                      ]}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bookingTitle} numberOfLines={1}>
                  {booking.title}
                </Text>
                <Text style={styles.bookingLocation}>📍 {booking.location}</Text>

                {booking.type === 'habixo_stay' ? (
                  <View style={styles.datesRow}>
                    <Text style={styles.dateText}>
                      📅 {booking.checkIn} → {booking.checkOut}
                    </Text>
                    <Text style={styles.guestsText}>👤 {booking.guests} guests</Text>
                  </View>
                ) : (
                  <View style={styles.datesRow}>
                    <Text style={styles.dateText}>
                      📅 {booking.leaseStart} → {booking.leaseEnd}
                    </Text>
                    <Text style={styles.guestsText}>Monthly: {booking.monthlyRent}</Text>
                  </View>
                )}

                <View style={styles.bookingFooter}>
                  <Text style={styles.totalText}>
                    {booking.type === 'habixo_stay'
                      ? booking.total
                      : booking.monthlyRent}
                    /month
                  </Text>
                  {booking.earnedCoins && (
                    <View style={styles.coinsBadge}>
                      <Text style={styles.coinsText}>+{booking.earnedCoins} coins</Text>
                    </View>
                  )}
                </View>

                {/* Review Prompt for completed bookings */}
                {booking.status === 'completed' && !('reviewSubmitted' in booking && booking.reviewSubmitted) && (
                  <TouchableOpacity style={styles.reviewPrompt}>
                    <Text style={styles.reviewPromptText}>Leave a Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State Design (shown when no bookings) */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No upcoming bookings</Text>
          <Text style={styles.emptyDesc}>
            Start exploring properties and find your next stay!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/habixo/stays')}
          >
            <Text style={styles.exploreButtonText}>Explore Stays →</Text>
          </TouchableOpacity>
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
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  segments: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  segmentText: {
    fontSize: 13,
    color: '#6b7280',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  bookingsList: {
    padding: 16,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingImage: {
    width: '100%',
    height: 150,
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#374151',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookingLocation: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#374151',
  },
  guestsText: {
    fontSize: 13,
    color: '#6b7280',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  coinsBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  coinsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  reviewPrompt: {
    marginTop: 12,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewPromptText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
