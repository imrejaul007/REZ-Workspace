// Habixo Match Screen - Flatmate matching with lifestyle algorithm
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const FLATMATE_PROFILES = [
  {
    id: 'f1',
    name: 'Priya S.',
    age: 26,
    occupation: 'Software Engineer',
    location: 'Koramangala, Bangalore',
    vibeTags: ['chill', 'professional', 'fitness'],
    compatibility: 95,
    budget: '₹15,000-20,000',
    image: 'https://i.pravatar.cc/150?img=1',
    lifestyle: {
      sleep: 'Night Owl',
      smoke: 'Never',
      drink: 'Socially',
      pets: false,
      workFromHome: true,
    },
  },
  {
    id: 'f2',
    name: 'Rahul M.',
    age: 28,
    occupation: 'Product Manager',
    location: 'Indiranagar, Bangalore',
    vibeTags: ['chill', 'foodie'],
    compatibility: 88,
    budget: '₹18,000-25,000',
    image: 'https://i.pravatar.cc/150?img=3',
    lifestyle: {
      sleep: 'Flexible',
      smoke: 'Never',
      drink: 'Occasionally',
      pets: true,
      workFromHome: false,
    },
  },
  {
    id: 'f3',
    name: 'Sneha K.',
    age: 25,
    occupation: 'UX Designer',
    location: 'HSR Layout, Bangalore',
    vibeTags: ['creative', 'outdoors'],
    compatibility: 82,
    budget: '₹12,000-18,000',
    image: 'https://i.pravatar.cc/150?img=5',
    lifestyle: {
      sleep: 'Early Bird',
      smoke: 'Never',
      drink: 'Socially',
      pets: false,
      workFromHome: true,
    },
  },
];

const VIBE_TAGS = [
  { name: 'Chill', icon: '😌' },
  { name: 'Party', icon: '🎉' },
  { name: 'Professional', icon: '💼' },
  { name: 'Fitness', icon: '💪' },
  { name: 'Foodie', icon: '🍕' },
  { name: 'Creative', icon: '🎨' },
  { name: 'Outdoors', icon: '🏔️' },
  { name: 'Gamer', icon: '🎮' },
];

export default function HabixoMatchScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Find Your Perfect Flatmate</Text>
          <Text style={styles.heroSubtitle}>
            Lifestyle-based matching algorithm
          </Text>

          {/* Create Profile CTA */}
          <TouchableOpacity style={styles.createProfileButton}>
            <Text style={styles.createProfileText}>+ Create Profile</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How Matching Works</Text>
          <View style={styles.matchingSteps}>
            <View style={styles.matchingStep}>
              <Text style={styles.stepIcon}>1️⃣</Text>
              <Text style={styles.stepText}>Create your profile</Text>
            </View>
            <View style={styles.matchingStep}>
              <Text style={styles.stepIcon}>2️⃣</Text>
              <Text style={styles.stepText}>Set your vibe</Text>
            </View>
            <View style={styles.matchingStep}>
              <Text style={styles.stepIcon}>3️⃣</Text>
              <Text style={styles.stepText}>Get matched!</Text>
            </View>
          </View>
        </View>

        {/* Vibe Tags */}
        <View style={styles.vibeSection}>
          <Text style={styles.sectionTitle}>Browse by Vibe</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {VIBE_TAGS.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.vibeTag}>
                <Text style={styles.vibeIcon}>{tag.icon}</Text>
                <Text style={styles.vibeName}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Matches */}
        <View style={styles.matchesSection}>
          <View style={styles.matchesHeader}>
            <Text style={styles.sectionTitle}>Top Matches</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {FLATMATE_PROFILES.map((profile) => (
            <TouchableOpacity key={profile.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Image
                  source={{ uri: profile.image }}
                  style={styles.profileImage}
                />
                <View style={styles.matchInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <View style={styles.compatibilityBadge}>
                      <Text style={styles.compatibilityText}>
                        {profile.compatibility}% match
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.profileMeta}>
                    {profile.age} • {profile.occupation}
                  </Text>
                  <Text style={styles.profileLocation}>📍 {profile.location}</Text>
                </View>
              </View>

              {/* Vibe Tags */}
              <View style={styles.vibeTags}>
                {profile.vibeTags.map((tag, index) => (
                  <View key={index} style={styles.profileVibeTag}>
                    <Text style={styles.profileVibeText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Budget */}
              <Text style={styles.budget}>💰 {profile.budget}/month</Text>

              {/* Lifestyle */}
              <View style={styles.lifestyleRow}>
                <View style={styles.lifestyleItem}>
                  <Text style={styles.lifestyleLabel}>Sleep</Text>
                  <Text style={styles.lifestyleValue}>{profile.lifestyle.sleep}</Text>
                </View>
                <View style={styles.lifestyleItem}>
                  <Text style={styles.lifestyleLabel}>Smoke</Text>
                  <Text style={styles.lifestyleValue}>{profile.lifestyle.smoke}</Text>
                </View>
                <View style={styles.lifestyleItem}>
                  <Text style={styles.lifestyleLabel}>Drink</Text>
                  <Text style={styles.lifestyleValue}>{profile.lifestyle.drink}</Text>
                </View>
                <View style={styles.lifestyleItem}>
                  <Text style={styles.lifestyleLabel}>WFH</Text>
                  <Text style={styles.lifestyleValue}>
                    {profile.lifestyle.workFromHome ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>

              {/* Action */}
              <View style={styles.matchActions}>
                <TouchableOpacity style={styles.connectButton}>
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.passButton}>
                  <Text style={styles.passButtonText}>Pass</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <Text style={styles.trustIcon}>🛡️</Text>
          <Text style={styles.trustTitle}>Habixo Trust</Text>
          <Text style={styles.trustDesc}>
            Every profile is verified. Every match is vetted.
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
  hero: {
    backgroundColor: '#6366f1',
    padding: 20,
    alignItems: 'center',
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
  createProfileButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  createProfileText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  howItWorks: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  matchingSteps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  matchingStep: {
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#6b7280',
  },
  vibeSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  vibeTag: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
  },
  vibeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  vibeName: {
    fontSize: 12,
    color: '#374151',
  },
  matchesSection: {
    padding: 16,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: '#6366f1',
    fontWeight: '600',
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  compatibilityBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  profileMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileLocation: {
    fontSize: 13,
    color: '#6b7280',
  },
  vibeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  profileVibeTag: {
    backgroundColor: '#ede9fe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  profileVibeText: {
    fontSize: 12,
    color: '#5b21b6',
    fontWeight: '500',
  },
  budget: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  lifestyleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  lifestyleItem: {
    alignItems: 'center',
  },
  lifestyleLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 2,
  },
  lifestyleValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  passButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  passButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  trustSection: {
    backgroundColor: '#ecfdf5',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  trustIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  trustDesc: {
    fontSize: 14,
    color: '#065f46',
    textAlign: 'center',
  },
});
