/**
 * StayOwn Staff App - Messages Screen
 * Guest messaging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';

const CONVERSATIONS = [
  {
    id: '1',
    guest: 'John Smith',
    room: '102',
    lastMessage: 'Thank you for the extra towels!',
    time: '10:30 AM',
    unread: 2,
    avatar: '👤',
  },
  {
    id: '2',
    guest: 'Sarah Johnson',
    room: '205',
    lastMessage: 'Is early check-in possible?',
    time: '09:45 AM',
    unread: 0,
    avatar: '👩',
  },
  {
    id: '3',
    guest: 'Mike Brown',
    room: '302',
    lastMessage: 'The AC is still not working...',
    time: 'Yesterday',
    unread: 1,
    avatar: '👨',
  },
  {
    id: '4',
    guest: 'Emily Davis',
    room: '104',
    lastMessage: 'Looking forward to my stay!',
    time: 'Yesterday',
    unread: 0,
    avatar: '👩‍🦰',
  },
];

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = CONVERSATIONS.filter(c =>
    c.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.room.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests or rooms..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Replies */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplies}>
        {['Thank you! 🏨', 'On my way! 🚶', 'No problem 😊', 'Will do! ✅', 'Got it 👍'].map((reply, i) => (
          <TouchableOpacity key={i} style={styles.quickReply}>
            <Text style={styles.quickReplyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Conversations */}
      <ScrollView style={styles.list}>
        <Text style={styles.sectionTitle}>Guest Conversations</Text>

        {filteredConversations.map((conv) => (
          <TouchableOpacity key={conv.id} style={styles.conversationCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{conv.avatar}</Text>
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.guestName}>{conv.guest}</Text>
                <Text style={styles.time}>{conv.time}</Text>
              </View>
              <View style={styles.roomRow}>
                <Text style={styles.roomBadge}>Room {conv.room}</Text>
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conv.lastMessage}
              </Text>
            </View>

            {conv.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conv.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Guest Lookup */}
      <View style={styles.lookupBanner}>
        <Text style={styles.lookupIcon}>🔍</Text>
        <View style={styles.lookupContent}>
          <Text style={styles.lookupTitle}>Guest Lookup</Text>
          <Text style={styles.lookupText}>Search guest history and preferences</Text>
        </View>
        <TouchableOpacity style={styles.lookupButton}>
          <Text style={styles.lookupButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickReplies: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickReply: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickReplyText: {
    color: '#4F46E5',
    fontSize: 14,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  roomRow: {
    marginBottom: 4,
  },
  roomBadge: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lookupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  lookupIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  lookupContent: {
    flex: 1,
  },
  lookupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  lookupText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  lookupButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lookupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
