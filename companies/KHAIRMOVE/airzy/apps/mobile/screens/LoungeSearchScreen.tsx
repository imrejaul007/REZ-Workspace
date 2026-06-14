/**
 * Airzy Lounge Search Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LoungeSearchScreen() {
  const navigation = useNavigation();
  const [selectedAirport, setSelectedAirport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [guests, setGuests] = useState(1);

  const airports = [
    { code: 'BLR', name: 'Bangalore', terminals: 2 },
    { code: 'DEL', name: 'Delhi', terminals: 3 },
    { code: 'BOM', name: 'Mumbai', terminals: 2 },
    { code: 'MAA', name: 'Chennai', terminals: 2 },
    { code: 'HYD', name: 'Hyderabad', terminals: 2 },
  ];

  const sampleLounges = [
    {
      id: '1',
      name: 'Plaza Premium Lounge',
      airport: 'BLR',
      terminal: 'T2',
      rating: 4.5,
      reviews: 234,
      amenities: ['WiFi', 'Shower', 'Spa', 'Food', 'Bar'],
      price: 1500,
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6',
    },
    {
      id: '2',
      name: 'VIP Business Lounge',
      airport: 'BLR',
      terminal: 'T1',
      rating: 4.2,
      reviews: 156,
      amenities: ['WiFi', 'Food', 'Charging'],
      price: 999,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    },
    {
      id: '3',
      name: 'First Class Lounge',
      airport: 'DEL',
      terminal: 'T3',
      rating: 4.8,
      reviews: 567,
      amenities: ['WiFi', 'Shower', 'Spa', 'Fine Dining', 'Private Suites'],
      price: 2500,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Airport Lounges</Text>
        <Text style={styles.subtitle}>Relax before your flight</Text>
      </View>

      {/* Search Form */}
      <View style={styles.searchForm}>
        {/* Airport Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Airport</Text>
          <View style={styles.airportGrid}>
            {airports.map((airport) => (
              <TouchableOpacity
                key={airport.code}
                style={[
                  styles.airportButton,
                  selectedAirport === airport.code && styles.airportButtonActive,
                ]}
                onPress={() => setSelectedAirport(airport.code)}
              >
                <Text
                  style={[
                    styles.airportCode,
                    selectedAirport === airport.code && styles.airportCodeActive,
                  ]}
                >
                  {airport.code}
                </Text>
                <Text
                  style={[
                    styles.airportName,
                    selectedAirport === airport.code && styles.airportNameActive,
                  ]}
                >
                  {airport.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="Select date"
            placeholderTextColor="#9CA3AF"
            value={selectedDate}
            onChangeText={setSelectedDate}
          />
        </View>

        {/* Guests */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Number of Guests</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setGuests(Math.max(1, guests - 1))}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{guests}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setGuests(Math.min(10, guests + 1))}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Find Lounges</Text>
        </TouchableOpacity>
      </View>

      {/* Lounge List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Lounges</Text>
        {sampleLounges.map((lounge) => (
          <TouchableOpacity key={lounge.id} style={styles.loungeCard}>
            <Image source={{ uri: lounge.image }} style={styles.loungeImage} />
            <View style={styles.loungeContent}>
              <View style={styles.loungeHeader}>
                <Text style={styles.loungeName}>{lounge.name}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>⭐ {lounge.rating}</Text>
                  <Text style={styles.reviews}>({lounge.reviews})</Text>
                </View>
              </View>
              <Text style={styles.loungeLocation}>
                {lounge.airport} • Terminal {lounge.terminal}
              </Text>
              <View style={styles.amenitiesContainer}>
                {lounge.amenities.slice(0, 4).map((amenity, index) => (
                  <View key={index} style={styles.amenityBadge}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.loungeFooter}>
                <View>
                  <Text style={styles.loungePrice}>₹{lounge.price}</Text>
                  <Text style={styles.loungePriceLabel}>per person</Text>
                </View>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Membership Banner */}
      <View style={styles.membershipBanner}>
        <View>
          <Text style={styles.membershipTitle}>Airzy Elite Members</Text>
          <Text style={styles.membershipSubtitle}>
            Get 5 free lounge visits per year!
          </Text>
        </View>
        <TouchableOpacity style={styles.membershipButton}>
          <Text style={styles.membershipButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F59E0B',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FEF3C7',
    marginTop: 4,
  },
  searchForm: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  airportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  airportButton: {
    width: '31%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 8,
  },
  airportButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  airportCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  airportCodeActive: {
    color: '#FFFFFF',
  },
  airportName: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  airportNameActive: {
    color: '#FEF3C7',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    color: '#F59E0B',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 24,
  },
  searchButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  loungeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loungeImage: {
    width: '100%',
    height: 140,
  },
  loungeContent: {
    padding: 16,
  },
  loungeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loungeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviews: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  loungeLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  amenityBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amenityText: {
    fontSize: 11,
    color: '#6B7280',
  },
  loungeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  loungePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loungePriceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bookButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  membershipBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  membershipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  membershipSubtitle: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 2,
  },
  membershipButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  membershipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  bottomPadding: {
    height: 100,
  },
});
