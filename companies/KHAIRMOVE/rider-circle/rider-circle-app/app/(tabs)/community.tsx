import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useRouter } from 'react-native';
import { useRouter } from 'expo-router';

export default function CommunityScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* My Groups */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        <GroupCard
          name="Bangalore Riders Club"
          members={1247}
          type="Club"
          unread={3}
        />
        <GroupCard
          name="RE Himalayan Owners"
          members={856}
          type="Brand"
          unread={0}
        />
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        <EventCard
          title="Sunday Morning Ride"
          date="June 8, 6:00 AM"
          location="Indiranagar, Bangalore"
          participants={24}
          going
        />
        <EventCard
          title="Night Ride to Nandi Hills"
          date="June 14, 8:00 PM"
          location="Koramangala, Bangalore"
          participants={32}
          going={false}
        />
      </View>

      {/* Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feed</Text>
        <FeedCard
          user="Rajesh Kumar"
          avatar="RK"
          time="2 hours ago"
          content="Amazing ride to Coorg this weekend! The weather was perfect and the roads were scenic. Thanks to everyone who joined! 🏍️"
          likes={47}
          comments={12}
        />
        <FeedCard
          user="Priya Sharma"
          avatar="PS"
          time="5 hours ago"
          content="New helmet alert! Just got the Shoei RF-1400. Can't wait to try it on the next ride. Anyone want to join for a test ride?"
          likes={23}
          comments={8}
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/event/create')}
      >
        <Text style={styles.createButtonText}>+ Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function GroupCard({
  name,
  members,
  type,
  unread,
}: {
  name: string;
  members: number;
  type: string;
  unread: number;
}) {
  return (
    <TouchableOpacity style={styles.groupCard}>
      <View style={styles.groupAvatar}>
        <Text style={styles.groupAvatarText}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{name}</Text>
        <Text style={styles.groupMeta}>{type} • {members} members</Text>
      </View>
      {unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function EventCard({
  title,
  date,
  location,
  participants,
  going,
}: {
  title: string;
  date: string;
  location: string;
  participants: number;
  going: boolean;
}) {
  return (
    <TouchableOpacity style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{title}</Text>
        {going && (
          <View style={styles.goingBadge}>
            <Text style={styles.goingText}>Going</Text>
          </View>
        )}
      </View>
      <Text style={styles.eventDate}>📅 {date}</Text>
      <Text style={styles.eventLocation}>📍 {location}</Text>
      <View style={styles.eventFooter}>
        <Text style={styles.eventParticipants}>👥 {participants} riders</Text>
        {!going && (
          <TouchableOpacity style={styles.rsvpButton}>
            <Text style={styles.rsvpText}>RSVP</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FeedCard({
  user,
  avatar,
  time,
  content,
  likes,
  comments,
}: {
  user: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
}) {
  return (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedAvatar}>
          <Text style={styles.feedAvatarText}>{avatar}</Text>
        </View>
        <View>
          <Text style={styles.feedUser}>{user}</Text>
          <Text style={styles.feedTime}>{time}</Text>
        </View>
      </View>
      <Text style={styles.feedContent}>{content}</Text>
      <View style={styles.feedActions}>
        <TouchableOpacity style={styles.feedAction}>
          <Text style={styles.feedActionText}>❤️ {likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction}>
          <Text style={styles.feedActionText}>💬 {comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction}>
          <Text style={styles.feedActionText}>↗️ Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  section: {
    padding: 16,
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
  },
  seeAll: {
    color: '#e94560',
    fontSize: 14,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  unreadBadge: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  goingBadge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  goingText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventParticipants: {
    fontSize: 14,
    color: '#fff',
  },
  rsvpButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rsvpText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feedCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedTime: {
    fontSize: 12,
    color: '#888',
  },
  feedContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
  },
  feedActions: {
    flexDirection: 'row',
    gap: 24,
  },
  feedAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedActionText: {
    color: '#888',
    fontSize: 14,
  },
  createButton: {
    margin: 16,
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});