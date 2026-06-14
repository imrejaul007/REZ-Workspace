// Habixo Calendar Screen for Merchant - Full calendar view of bookings
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useState, useCallback } from 'react';
import { BookingCalendar, CalendarBooking } from '../components/BookingCalendar';

// Mock bookings for calendar
const MOCK_BOOKINGS: CalendarBooking[] = [
  {
    id: 'b1',
    guestName: 'Priya M.',
    status: 'confirmed',
    checkIn: new Date(2026, 4, 10), // May 10, 2026
    checkOut: new Date(2026, 4, 15),
  },
  {
    id: 'b2',
    guestName: 'Amit K.',
    status: 'confirmed',
    checkIn: new Date(2026, 4, 12),
    checkOut: new Date(2026, 4, 14),
  },
  {
    id: 'b3',
    guestName: 'Sneha J.',
    status: 'pending',
    checkIn: new Date(2026, 4, 18),
    checkOut: new Date(2026, 4, 25),
  },
  {
    id: 'b4',
    guestName: 'Rahul V.',
    status: 'confirmed',
    checkIn: new Date(2026, 4, 20),
    checkOut: new Date(2026, 4, 22),
  },
  {
    id: 'b5',
    guestName: 'Neha S.',
    status: 'confirmed',
    checkIn: new Date(2026, 4, 25),
    checkOut: new Date(2026, 4, 30),
  },
];

export default function HabixoCalendar() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const properties = [
    { id: 'all', name: 'All Properties' },
    { id: 'p1', name: 'Modern Apartment Koramangala' },
    { id: 'p2', name: 'Cozy Room Indiranagar' },
    { id: 'p3', name: 'Beach Villa Goa' },
  ];

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback((month: Date) => {
    console.log('Month changed to:', month.toLocaleDateString());
  }, []);

  // Filter bookings for selected property
  const filteredBookings = selectedProperty && selectedProperty !== 'all'
    ? MOCK_BOOKINGS // In real app, filter by propertyId
    : MOCK_BOOKINGS;

  return (
    <SafeAreaView style={styles.container}>
      {/* Property Filter */}
      <View style={styles.propertyFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={[
                styles.propertyChip,
                (selectedProperty === property.id ||
                  (selectedProperty === null && property.id === 'all')) &&
                  styles.propertyChipActive,
              ]}
              onPress={() => setSelectedProperty(property.id === 'all' ? null : property.id)}
            >
              <Text
                style={[
                  styles.propertyChipText,
                  (selectedProperty === property.id ||
                    (selectedProperty === null && property.id === 'all')) &&
                    styles.propertyChipTextActive,
                ]}
              >
                {property.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Calendar */}
      <ScrollView style={styles.calendarContainer}>
        <BookingCalendar
          bookings={filteredBookings}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          selectedPropertyId={selectedProperty || undefined}
        />

        {/* Selected Date Bookings */}
        {selectedDate && (
          <View style={styles.selectedDateSection}>
            <Text style={styles.selectedDateTitle}>
              Bookings on {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.noBookingsText}>
              <Text>Tap a date to see bookings</Text>
            </View>
          </View>
        )}

        {/* Legend & Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Calendar Tips</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>
              Green borders indicate confirmed bookings
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏳</Text>
            <Text style={styles.infoText}>
              Yellow borders indicate pending requests
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👆</Text>
            <Text style={styles.infoText}>
              Tap unknown date to view or manage bookings
            </Text>
          </View>
        </View>

        {/* Upcoming Section */}
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingTitle}>Upcoming This Month</Text>
          {filteredBookings
            .filter((b) => b.checkIn.getMonth() === new Date().getMonth())
            .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
            .map((booking) => (
              <View key={booking.id} style={styles.upcomingItem}>
                <View style={styles.upcomingDate}>
                  <Text style={styles.upcomingDay}>
                    {booking.checkIn.getDate()}
                  </Text>
                  <Text style={styles.upcomingMonth}>
                    {booking.checkIn.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingGuest}>{booking.guestName}</Text>
                  <Text style={styles.upcomingDates}>
                    {booking.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {booking.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.upcomingStatus,
                    {
                      backgroundColor:
                        booking.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.upcomingStatusText,
                      {
                        color:
                          booking.status === 'confirmed' ? '#166534' : '#92400e',
                      },
                    ]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>
            ))}
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
  propertyFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  propertyChip: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  propertyChipActive: {
    backgroundColor: '#6366f1',
  },
  propertyChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  propertyChipTextActive: {
    color: '#fff',
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  selectedDateSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  noBookingsText: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  upcomingSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  upcomingDate: {
    width: 48,
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  upcomingMonth: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingGuest: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  upcomingDates: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  upcomingStatus: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  upcomingStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
