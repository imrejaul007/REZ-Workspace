// Habixo Rent Screen - Long-term premium rentals
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURED_RENTALS = [
  {
    id: 'r1',
    title: 'Fully Furnished 2BHK in Koramangala',
    location: 'Koramangala, Bangalore',
    price: 25000,
    deposit: 50000,
    bedrooms: 2,
    bathrooms: 2,
    area: '1200 sqft',
    furnished: true,
    image: 'https://picsum.photos/400/300?random=10',
    features: ['WiFi', 'AC', 'Gym', 'Security'],
    verified: true,
  },
  {
    id: 'r2',
    title: 'Modern Studio near Metro',
    location: 'HSR Layout, Bangalore',
    price: 18000,
    deposit: 36000,
    bedrooms: 1,
    bathrooms: 1,
    area: '450 sqft',
    furnished: true,
    image: 'https://picsum.photos/400/300?random=11',
    features: ['WiFi', 'AC', 'Parking'],
    verified: true,
  },
  {
    id: 'r3',
    title: 'Spacious 3BHK with Balcony',
    location: 'Whitefield, Bangalore',
    price: 35000,
    deposit: 70000,
    bedrooms: 3,
    bathrooms: 2,
    area: '1800 sqft',
    furnished: true,
    image: 'https://picsum.photos/400/300?random=12',
    features: ['WiFi', 'AC', 'Pool', 'Gym', 'Security'],
    verified: true,
  },
];

const LEASE_BENEFITS = [
  { icon: '🏠', title: 'No Brokerage', desc: 'Direct from owners' },
  { icon: '✅', title: 'Verified Homes', desc: '58-point inspection' },
  { icon: '🔧', title: 'Maintenance', desc: 'Full-service support' },
  { icon: '📅', title: 'Flexible Lease', desc: '3-12 month terms' },
];

export default function HabixoRentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Find Your Perfect Rental</Text>
          <Text style={styles.heroSubtitle}>
            Fully furnished homes with no brokerage
          </Text>

          {/* Search Bar */}
          <TouchableOpacity style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Search by location, area, or property type...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustIcon}>🛡️</Text>
          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Habixo Trust Guarantee</Text>
            <Text style={styles.trustDesc}>Every home verified with 58-point quality check</Text>
          </View>
        </View>

        {/* Lease Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Rent with Habixo?</Text>
          <View style={styles.benefitsGrid}>
            {LEASE_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.steps}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Search & Visit</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Book Online</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Move In</Text>
            </View>
          </View>
        </View>

        {/* Featured Rentals */}
        <View style={styles.rentalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Rentals</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {FEATURED_RENTALS.map((rental) => (
            <TouchableOpacity
              key={rental.id}
              style={styles.rentalCard}
              onPress={() => router.push(`/habixo/property/${rental.id}`)}
            >
              <Image
                source={{ uri: rental.image }}
                style={styles.rentalImage}
              />
              {rental.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
              <View style={styles.rentalContent}>
                <View style={styles.rentalHeader}>
                  <Text style={styles.rentalLocation}>{rental.location}</Text>
                  <View style={styles.furnishedTag}>
                    <Text style={styles.furnishedText}>Furnished</Text>
                  </View>
                </View>
                <Text style={styles.rentalTitle}>{rental.title}</Text>
                <View style={styles.rentalDetails}>
                  <Text>{rental.bedrooms} bed</Text>
                  <Text>•</Text>
                  <Text>{rental.bathrooms} bath</Text>
                  <Text>•</Text>
                  <Text>{rental.area}</Text>
                </View>
                <View style={styles.rentalFeatures}>
                  {rental.features.slice(0, 3).map((feature, index) => (
                    <Text key={index} style={styles.featureTag}>{feature}</Text>
                  ))}
                </View>
                <View style={styles.rentalFooter}>
                  <View>
                    <Text style={styles.rentalPrice}>₹{rental.price.toLocaleString()}/month</Text>
                    <Text style={styles.deposit}>Deposit: ₹{rental.deposit.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactButton}>
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Match CTA */}
        <View style={styles.matchCTA}>
          <Text style={styles.matchTitle}>👥 Looking for a Roommate?</Text>
          <Text style={styles.matchDesc}>
            Find compatible flatmates with our lifestyle matching algorithm
          </Text>
          <TouchableOpacity
            style={styles.matchButton}
            onPress={() => router.push('/habixo/match')}
          >
            <Text style={styles.matchButtonText}>Find Flatmates →</Text>
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
  hero: {
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  trustIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  trustContent: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
  },
  trustDesc: {
    fontSize: 13,
    color: '#065f46',
  },
  benefitsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: '47%',
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
  benefitIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  howItWorks: {
    padding: 16,
    backgroundColor: '#fff',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#374151',
  },
  rentalsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  rentalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rentalImage: {
    width: '100%',
    height: 180,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10b981',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rentalContent: {
    padding: 16,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rentalLocation: {
    fontSize: 13,
    color: '#6b7280',
  },
  furnishedTag: {
    backgroundColor: '#fef3c7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  furnishedText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  rentalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  rentalDetails: {
    flexDirection: 'row',
    gap: 8,
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  rentalFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 11,
    color: '#374151',
  },
  rentalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deposit: {
    fontSize: 12,
    color: '#6b7280',
  },
  contactButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  matchCTA: {
    backgroundColor: '#dbeafe',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  matchDesc: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 16,
  },
  matchButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  matchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
