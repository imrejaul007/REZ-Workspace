/**
 * Travel Screen
 *
 * Airzy travel integration for DO App
 * Features: Flights, Hotels, Rides, Itinerary
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { airzyClient } from '../services/clients';

interface Props {
  navigation?: any;
}

const TravelScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'rides' | 'bookings'>('flights');
  const [userId] = useState('USER001');

  // Search state
  const [from, setFrom] = useState('Mumbai');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const searchFlights = async () => {
    if (!from || !to || !date) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await airzyClient.searchFlights({
        from,
        to,
        date,
        passengers: 1,
      });
      setFlights(result?.flights || []);
    } catch (error) {
      console.error('Search flights error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchHotels = async () => {
    if (!to || !date) {
      alert('Please fill destination and check-in date');
      return;
    }

    setLoading(true);
    try {
      const result = await airzyClient.searchHotels({
        city: to,
        checkIn: date,
        checkOut: date,
        guests: 1,
      });
      setHotels(result?.hotels || []);
    } catch (error) {
      console.error('Search hotels error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await airzyClient.getUpcomingBookings(userId);
      setBookings(result?.bookings || []);
    } catch (error) {
      console.error('Load bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [activeTab]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Travel</Text>
        <Text style={styles.headerSubtitle}>Book flights, hotels& rides</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {['flights', 'hotels', 'rides', 'bookings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={styles.tabIcon}>
              {tab === 'flights' ? '✈️' : tab === 'hotels' ? '🏨' : tab === 'rides' ? '🚗' : '📋'}
            </Text>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Flights Tab */}
        {activeTab === 'flights' && (
          <View>
            <View style={styles.searchCard}>
              <Text style={styles.cardTitle}>Search Flights</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>From</Text>
                <TextInput
                  style={styles.input}
                  value={from}
                  onChangeText={setFrom}
                  placeholder="City or Airport"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>To</Text>
                <TextInput
                  style={styles.input}
                  value={to}
                  onChangeText={setTo}
                  placeholder="City or Airport"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity style={styles.searchButton} onPress={searchFlights}>
                <Text style={styles.searchButtonText}>Search Flights</Text>
              </TouchableOpacity>
            </View>

            {/* Flight Results */}
            {loading ? (
              <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
            ) : (
              flights.map((flight, index) => (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.flightHeader}>
                    <Text style={styles.airline}>{flight.airline}</Text>
                    <Text style={styles.price}>₹{flight.price}</Text>
                  </View>
                  <View style={styles.flightDetails}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.time}>{flight.departure}</Text>
                      <Text style={styles.city}>{from}</Text>
                    </View>
                    <View style={styles.duration}>
                      <Text style={styles.durationText}>{flight.duration}</Text>
                      <View style={styles.flightLine} />
                    </View>
                    <View style={styles.timeBlock}>
                      <Text style={styles.time}>{flight.arrival}</Text>
                      <Text style={styles.city}>{to}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Hotels Tab */}
        {activeTab === 'hotels' && (
          <View>
            <View style={styles.searchCard}>
              <Text style={styles.cardTitle}>Search Hotels</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={to}
                  onChangeText={setTo}
                  placeholder="Enter city"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Check-in</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity style={styles.searchButton} onPress={searchHotels}>
                <Text style={styles.searchButtonText}>Search Hotels</Text>
              </TouchableOpacity>
            </View>

            {/* Hotel Results */}
            {loading ? (
              <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
            ) : (
              hotels.map((hotel, index) => (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.hotelHeader}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    <View style={styles.rating}>
                      <Text style={styles.ratingText}>⭐ {hotel.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.hotelAddress}>{hotel.address}</Text>
                  <View style={styles.hotelFooter}>
                    <Text style={styles.hotelPrice}>₹{hotel.price}/night</Text>
                    <TouchableOpacity style={styles.bookButton}>
                      <Text style={styles.bookButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <View>
            <View style={styles.searchCard}>
              <Text style={styles.cardTitle}>Book a Ride</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter pickup address"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Drop Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter drop address"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Find Cabs</Text>
              </TouchableOpacity>
            </View>

            {/* Ride Options */}
            <View style={styles.rideOptions}>
              {[
                { type: 'Economy', price: '₹250', eta: '3 min', icon: '🚗' },
                { type: 'Premium', price: '₹450', eta: '5 min', icon: '🚙' },
                { type: 'SUV', price: '₹650', eta: '7 min', icon: '🚐' },
              ].map((ride, index) => (
                <TouchableOpacity key={index} style={styles.rideCard}>
                  <Text style={styles.rideIcon}>{ride.icon}</Text>
                  <View style={styles.rideInfo}>
                    <Text style={styles.rideType}>{ride.type}</Text>
                    <Text style={styles.rideEta}>{ride.eta} away</Text>
                  </View>
                  <Text style={styles.ridePrice}>{ride.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
            ) : bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <View key={index} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingType}>
                      {booking.type === 'flight' ? '✈️ Flight' : booking.type === 'hotel' ? '🏨 Hotel' : '🚗 Ride'}
                    </Text>
                    <Text style={styles.bookingStatus}>{booking.status}</Text>
                  </View>
                  <Text style={styles.bookingDetails}>{booking.details}</Text>
                  <Text style={styles.bookingDate}>{booking.date}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No upcoming bookings</Text>
                <TouchableOpacity style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>Book Your Trip</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  searchCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  airline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  flightDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeBlock: {
    alignItems: 'center',
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  city: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  duration: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  flightLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rating: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#FF9800',
  },
  hotelAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotelPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rideOptions: {
    marginTop: 8,
  },
  rideCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  rideInfo: {
    flex: 1,
  },
  rideType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rideEta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookingStatus: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default TravelScreen;
