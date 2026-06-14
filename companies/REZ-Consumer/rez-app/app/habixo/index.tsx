// @ts-nocheck
// Habixo Home Screen - Smart Living OS powered by ReZ
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURED_STAYS = [
  {
    id: '1',
    title: 'Modern Apartment in Koramangala',
    location: 'Bangalore',
    price: 2500,
    rating: 4.8,
    reviews: 127,
    image: 'https://picsum.photos/400/300?random=1',
    type: 'Entire Apartment',
  },
  {
    id: '2',
    title: 'Cozy Room in Indiranagar',
    location: 'Bangalore',
    price: 1200,
    rating: 4.9,
    reviews: 89,
    image: 'https://picsum.photos/400/300?random=2',
    type: 'Private Room',
  },
  {
    id: '3',
    title: 'Luxury Penthouse with Pool',
    location: 'Mumbai',
    price: 8500,
    rating: 4.7,
    reviews: 56,
    image: 'https://picsum.photos/400/300?random=3',
    type: 'Entire Place',
  },
];

const POPULAR_AREAS = [
  { name: 'Koramangala', properties: 234 },
  { name: 'Indiranagar', properties: 189 },
  { name: 'HSR Layout', properties: 156 },
  { name: 'Whitefield', properties: 312 },
  { name: 'Marathahalli', properties: 278 },
];

const QUICK_ACTIONS = [
  { name: 'Search Stays', icon: '🔍', href: '/habixo/stays' },
  { name: 'Find Rentals', icon: '🏠', href: '/habixo/rent' },
  { name: 'Find Flatmates', icon: '👥', href: '/habixo/match' },
  { name: 'My Bookings', icon: '📅', href: '/habixo/bookings' },
];

export default function HabixoHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>🏠 Habixo</Text>
            <Text style={styles.tagline}>Smart Living OS powered by ReZ</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/habixo/search')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search destinations, properties, areas...
          </Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => router.push(action.href as unknown)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionName}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Habixo Stay */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏨 Habixo Stay</Text>
            <TouchableOpacity onPress={() => router.push('/habixo/stays')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Short-term rentals with dynamic pricing
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FEATURED_STAYS.map((stay) => (
              <TouchableOpacity
                key={stay.id}
                style={styles.propertyCard}
                onPress={() => router.push(`/habixo/property/${stay.id}`)}
              >
                <Image
                  source={{ uri: stay.image }}
                  style={styles.propertyImage}
                />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {stay.title}
                  </Text>
                  <Text style={styles.propertyLocation}>{stay.location}</Text>
                  <View style={styles.propertyMeta}>
                    <Text style={styles.propertyPrice}>₹{stay.price}/night</Text>
                    <View style={styles.rating}>
                      <Text>⭐ {stay.rating}</Text>
                      <Text style={styles.reviewCount}>({stay.reviews})</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Popular Areas</Text>
          <View style={styles.areasGrid}>
            {POPULAR_AREAS.map((area, index) => (
              <TouchableOpacity
                key={index}
                style={styles.areaCard}
                onPress={() => router.push(`/habixo/stays?city=${area.name}`)}
              >
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.areaCount}>{area.properties} properties</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habixo Rent */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏢 Habixo Rent</Text>
            <TouchableOpacity onPress={() => router.push('/habixo/rent')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Long-term rentals with no brokerage
          </Text>

          <View style={styles.rentHighlight}>
            <View style={styles.rentHighlightContent}>
              <Text style={styles.rentHighlightTitle}>
                No Brokerage. No Hassle.
              </Text>
              <Text style={styles.rentHighlightDesc}>
                Fully furnished homes starting at ₹15,000/month
              </Text>
              <TouchableOpacity
                style={styles.rentHighlightButton}
                onPress={() => router.push('/habixo/rent')}
              >
                <Text style={styles.rentHighlightButtonText}>Find Your Home →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Habixo Match */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Habixo Match</Text>
            <TouchableOpacity onPress={() => router.push('/habixo/match')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Lifestyle-based flatmate matching
          </Text>

          <View style={styles.matchHighlight}>
            <Text style={styles.matchTitle}>🎯 Find Your Perfect Roommate</Text>
            <View style={styles.matchFeatures}>
              <Text>✓ Lifestyle matching algorithm</Text>
              <Text>✓ Compatibility scoring</Text>
              <Text>✓ Browse by vibe</Text>
            </View>
            <TouchableOpacity
              style={styles.matchButton}
              onPress={() => router.push('/habixo/match')}
            >
              <Text style={styles.matchButtonText}>Get Matched →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustTitle}>🛡️ Habixo Trust</Text>
          <Text style={styles.trustDesc}>
            Every property verified. Every host trusted. Every guest vetted.
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366f1',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 12,
    color: '#e0e7ff',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionName: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  propertyCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 160,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  areaCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  areaCount: {
    fontSize: 11,
    color: '#6b7280',
  },
  rentHighlight: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  rentHighlightContent: {},
  rentHighlightTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  rentHighlightDesc: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 16,
  },
  rentHighlightButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rentHighlightButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  matchHighlight: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  matchFeatures: {
    marginBottom: 16,
  },
  matchButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  matchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  trustBanner: {
    backgroundColor: '#ecfdf5',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
  },
  trustDesc: {
    fontSize: 14,
    color: '#065f46',
  },
});
