/**
 * Airzy Flights Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  FlightSearch: undefined;
  FlightDetails: { offerId: string };
};

export default function FlightsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchType, setSearchType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>('economy');

  const recentSearches = [
    { id: '1', origin: 'BLR', destination: 'DEL', date: 'May 25' },
    { id: '2', origin: 'DEL', destination: 'BOM', date: 'Jun 10' },
    { id: '3', origin: 'MAA', destination: 'BLR', date: 'May 30' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Book Flights</Text>
        <Text style={styles.subtitle}>Find the best deals</Text>
      </View>

      {/* Search Type Toggle */}
      <View style={styles.searchTypeContainer}>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'oneway' && styles.searchTypeActive]}
          onPress={() => setSearchType('oneway')}
        >
          <Text style={[styles.searchTypeText, searchType === 'oneway' && styles.searchTypeTextActive]}>
            One Way
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'roundtrip' && styles.searchTypeActive]}
          onPress={() => setSearchType('roundtrip')}
        >
          <Text style={[styles.searchTypeText, searchType === 'roundtrip' && styles.searchTypeTextActive]}>
            Round Trip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Form */}
      <View style={styles.searchForm}>
        {/* Origin */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>From</Text>
          <TextInput
            style={styles.input}
            placeholder="Airport code (e.g., BLR)"
            placeholderTextColor="#9CA3AF"
            value={origin}
            onChangeText={setOrigin}
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton}>
          <Text style={styles.swapIcon}>⇄</Text>
        </TouchableOpacity>

        {/* Destination */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>To</Text>
          <TextInput
            style={styles.input}
            placeholder="Airport code (e.g., DEL)"
            placeholderTextColor="#9CA3AF"
            value={destination}
            onChangeText={setDestination}
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Departure</Text>
          <TextInput
            style={styles.input}
            placeholder="Select date"
            placeholderTextColor="#9CA3AF"
            value={date}
            onChangeText={setDate}
          />
        </View>

        {/* Return Date */}
        {searchType === 'roundtrip' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Return</Text>
            <TextInput
              style={styles.input}
              placeholder="Select date"
              placeholderTextColor="#9CA3AF"
              value={returnDate}
              onChangeText={setReturnDate}
            />
          </View>
        )}

        {/* Passengers */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Passengers</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPassengers(Math.max(1, passengers - 1))}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{passengers}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setPassengers(Math.min(9, passengers + 1))}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cabin Class */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cabin Class</Text>
          <View style={styles.cabinClassContainer}>
            {['economy', 'business', 'first'].map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[styles.cabinClassButton, cabinClass === cls && styles.cabinClassActive]}
                onPress={() => setCabinClass(cls as unknown)}
              >
                <Text style={[styles.cabinClassText, cabinClass === cls && styles.cabinClassTextActive]}>
                  {cls.charAt(0).toUpperCase() + cls.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('FlightSearch')}
        >
          <Text style={styles.searchButtonText}>Search Flights</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Searches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        {recentSearches.map((search) => (
          <TouchableOpacity key={search.id} style={styles.recentSearchCard}>
            <View style={styles.recentSearchRoute}>
              <Text style={styles.recentSearchCode}>{search.origin}</Text>
              <Text style={styles.recentSearchArrow}>→</Text>
              <Text style={styles.recentSearchCode}>{search.destination}</Text>
            </View>
            <Text style={styles.recentSearchDate}>{search.date}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { from: 'BLR', to: 'DEL', price: '₹5,999' },
            { from: 'DEL', to: 'BOM', price: '₹6,499' },
            { from: 'MAA', to: 'BLR', price: '₹3,999' },
            { from: 'HYD', to: 'CCU', price: '₹7,299' },
          ].map((route, index) => (
            <TouchableOpacity key={index} style={styles.popularRouteCard}>
              <Text style={styles.popularRouteFrom}>{route.from}</Text>
              <Text style={styles.popularRouteArrow}>→</Text>
              <Text style={styles.popularRouteTo}>{route.to}</Text>
              <Text style={styles.popularRoutePrice}>{route.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    backgroundColor: '#6366F1',
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
    color: '#C7D2FE',
    marginTop: 4,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  searchTypeActive: {
    backgroundColor: '#FFFFFF',
  },
  searchTypeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchTypeTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  searchForm: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
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
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  swapButton: {
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 1,
  },
  swapIcon: {
    fontSize: 18,
    color: '#6366F1',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    color: '#6366F1',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    color: '#111827',
  },
  cabinClassContainer: {
    flexDirection: 'row',
  },
  cabinClassButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: -1,
  },
  cabinClassActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  cabinClassText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cabinClassTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#6366F1',
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
  recentSearchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  recentSearchRoute: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSearchCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recentSearchArrow: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  recentSearchDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  popularRouteCard: {
    backgroundColor: '#FFFFFF',
    marginLeft: 20,
    marginRight: 4,
    padding: 16,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  popularRouteFrom: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  popularRouteArrow: {
    fontSize: 14,
    color: '#6366F1',
    marginVertical: 4,
  },
  popularRouteTo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  popularRoutePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 8,
  },
  bottomPadding: {
    height: 100,
  },
});
