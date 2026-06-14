import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function DiscoverScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes, places, groups..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.categories}>
          <CategoryCard icon="🗺️" label="Routes" color="#e94560" />
          <CategoryCard icon="🏪" label="Stops" color="#0f3460" />
          <CategoryCard icon="⛽" label="Fuel" color="#f97316" />
          <CategoryCard icon="🔧" label="Service" color="#8b5cf6" />
          <CategoryCard icon="🏨" label="Hotels" color="#06b6d4" />
          <CategoryCard icon="☕" label="Cafes" color="#84cc16" />
        </View>
      </View>

      {/* Popular Routes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        <RouteCard
          name="Nandi Hills Sunrise"
          distance={85}
          difficulty="Moderate"
          rating={4.8}
          rides={1247}
        />
        <RouteCard
          name="Mysore Express"
          distance={145}
          difficulty="Easy"
          rating={4.6}
          rides={892}
        />
        <RouteCard
          name="Coorg Adventure"
          distance={320}
          difficulty="Hard"
          rating={4.9}
          rides={567}
        />
      </View>

      {/* Nearby Places */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Places</Text>
        <PlaceCard
          name="Rasta Cafe"
          type="Cafe"
          distance={2.5}
          rating={4.7}
        />
        <PlaceCard
          name="Benny's Bikes"
          type="Service Center"
          distance={3.2}
          rating={4.5}
        />
        <PlaceCard
          name="HP Petrol Pump"
          type="Fuel Station"
          distance={1.1}
          rating={4.2}
        />
      </View>

      {/* For You */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>For You</Text>
        <View style={styles.forYouGrid}>
          <TouchableOpacity style={styles.forYouCard}>
            <Text style={styles.forYouIcon}>🌅</Text>
            <Text style={styles.forYouTitle}>Best Sunrise Spots</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.forYouCard}>
            <Text style={styles.forYouIcon}>🏔️</Text>
            <Text style={styles.forYouTitle}>Mountain Roads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.forYouCard}>
            <Text style={styles.forYouIcon}>🌊</Text>
            <Text style={styles.forYouTitle}>Coastal Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.forYouCard}>
            <Text style={styles.forYouIcon}>🌲</Text>
            <Text style={styles.forYouTitle}>Forest Trails</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function CategoryCard({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: color }]}>
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={styles.categoryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RouteCard({
  name,
  distance,
  difficulty,
  rating,
  rides,
}: {
  name: string;
  distance: number;
  difficulty: string;
  rating: number;
  rides: number;
}) {
  const difficultyColor = {
    Easy: '#4ade80',
    Moderate: '#facc15',
    Hard: '#f87171',
  }[difficulty] || '#888';

  return (
    <TouchableOpacity style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{name}</Text>
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>{difficulty}</Text>
        </View>
      </View>
      <View style={styles.routeMeta}>
        <Text style={styles.routeDistance}>📍 {distance} km</Text>
        <Text style={styles.routeRating}>⭐ {rating}</Text>
        <Text style={styles.routeRides}>🚴 {rides} rides</Text>
      </View>
    </TouchableOpacity>
  );
}

function PlaceCard({
  name,
  type,
  distance,
  rating,
}: {
  name: string;
  type: string;
  distance: number;
  rating: number;
}) {
  return (
    <TouchableOpacity style={styles.placeCard}>
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{name}</Text>
        <Text style={styles.placeType}>{type}</Text>
      </View>
      <View style={styles.placeMeta}>
        <Text style={styles.placeDistance}>{distance} km</Text>
        <Text style={styles.placeRating}>⭐ {rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  seeAll: {
    color: '#e94560',
    fontSize: 14,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  routeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  routeDistance: {
    fontSize: 12,
    color: '#888',
  },
  routeRating: {
    fontSize: 12,
    color: '#888',
  },
  routeRides: {
    fontSize: 12,
    color: '#888',
  },
  placeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeType: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  placeMeta: {
    alignItems: 'flex-end',
  },
  placeDistance: {
    fontSize: 12,
    color: '#888',
  },
  placeRating: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  forYouGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  forYouCard: {
    width: '48%',
    aspectRatio: 1.5,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  forYouIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  forYouTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});