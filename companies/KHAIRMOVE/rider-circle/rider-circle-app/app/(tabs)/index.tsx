import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useRouter } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Rider! 👋</Text>
        <Text style={styles.date}>Sunday, June 7, 2026</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickAction
          icon="🚀"
          label="Start Ride"
          color="#e94560"
          onPress={() => router.push('/(tabs)/ride')}
        />
        <QuickAction
          icon="🗺️"
          label="Explore"
          color="#0f3460"
          onPress={() => router.push('/(tabs)/discover')}
        />
        <QuickAction
          icon="👥"
          label="Groups"
          color="#533483"
          onPress={() => router.push('/(tabs)/community')}
        />
        <QuickAction
          icon="🤖"
          label="Genie"
          color="#16213e"
          onPress={() => router.push('/genie')}
        />
      </View>

      {/* Live Presence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Live Near You</Text>
        <View style={styles.presenceCard}>
          <Text style={styles.presenceCount}>47</Text>
          <Text style={styles.presenceLabel}>Riders Active</Text>
          <Text style={styles.presenceLocation}>in Bangalore</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See all riders →</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <EventCard
            title="Sunday Morning Ride"
            date="June 8"
            location="Indiranagar"
            participants={24}
          />
          <EventCard
            title="Monsoon Prep Ride"
            date="June 12"
            location="Whitefield"
            participants={18}
          />
          <EventCard
            title="Night Ride to Nandi"
            date="June 14"
            location="Koramangala"
            participants={32}
          />
        </ScrollView>
      </View>

      {/* Nearby Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Nearby Groups</Text>
        <GroupCard
          name="Bangalore Riders Club"
          members={1247}
          type="Club"
        />
        <GroupCard
          name="KTMM Dominar Owners"
          members={456}
          type="Brand"
        />
      </View>

      {/* Ride Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Rides" value="127" />
          <StatCard label="Distance" value="8,420 km" />
          <StatCard label="Trust Score" value="78" />
          <StatCard label="Groups" value="5" />
        </View>
      </View>
    </ScrollView>
  );
}

// Components
function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.quickAction, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function EventCard({
  title,
  date,
  location,
  participants,
}: {
  title: string;
  date: string;
  location: string;
  participants: number;
}) {
  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventDate}>{date}</Text>
      <Text style={styles.eventLocation}>📍 {location}</Text>
      <Text style={styles.eventParticipants}>👥 {participants} riders</Text>
    </View>
  );
}

function GroupCard({
  name,
  members,
  type,
}: {
  name: string;
  members: number;
  type: string;
}) {
  return (
    <TouchableOpacity style={styles.groupCard}>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{name}</Text>
        <Text style={styles.groupMeta}>{type} • {members} members</Text>
      </View>
      <Text style={styles.groupArrow}>→</Text>
    </TouchableOpacity>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  presenceCard: {
    backgroundColor: '#e94560',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  presenceCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  presenceLabel: {
    fontSize: 16,
    color: '#fff',
  },
  presenceLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  seeAllButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  seeAllText: {
    color: '#e94560',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#e94560',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 12,
    color: '#888',
  },
  eventParticipants: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  groupCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  groupArrow: {
    fontSize: 20,
    color: '#e94560',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});