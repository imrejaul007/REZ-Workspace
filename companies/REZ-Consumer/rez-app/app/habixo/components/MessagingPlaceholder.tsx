// Habixo In-App Messaging Placeholder
// Placeholder for future messaging feature implementation
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';

// Message types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'booking' | 'system';
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'host' | 'guest';
  lastMessage?: Message;
  unreadCount: number;
  propertyId?: string;
  propertyName?: string;
  updatedAt: Date;
}

// Placeholder data for conversations
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    participantId: 'host1',
    participantName: 'Rahul S.',
    participantAvatar: 'https://i.pravatar.cc/50?img=12',
    participantRole: 'host',
    unreadCount: 2,
    propertyId: 'p1',
    propertyName: 'Modern Apartment Koramangala',
    updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'conv2',
    participantId: 'host2',
    participantName: 'Priya M.',
    participantAvatar: 'https://i.pravatar.cc/50?img=5',
    participantRole: 'host',
    unreadCount: 0,
    propertyId: 'p2',
    propertyName: 'Cozy Room Indiranagar',
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: 'conv3',
    participantId: 'guest1',
    participantName: 'Amit K.',
    participantAvatar: 'https://i.pravatar.cc/50?img=3',
    participantRole: 'guest',
    unreadCount: 1,
    propertyId: 'p3',
    propertyName: 'Beach Villa Goa',
    updatedAt: new Date(Date.now() - 7200000), // 2 hours ago
  },
];

// Mock messages for a conversation
const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'guest1',
    senderName: 'You',
    receiverId: 'host1',
    content: 'Hi! I have a question about the apartment. Is early check-in available?',
    timestamp: new Date(Date.now() - 7200000),
    read: true,
    type: 'text',
  },
  {
    id: 'm2',
    senderId: 'host1',
    senderName: 'Rahul S.',
    receiverId: 'guest1',
    content: 'Hi! Yes, we can arrange early check-in from 11 AM if the previous guests have checked out. Would that work?',
    timestamp: new Date(Date.now() - 5400000),
    read: true,
    type: 'text',
  },
  {
    id: 'm3',
    senderId: 'guest1',
    senderName: 'You',
    receiverId: 'host1',
    content: 'Perfect! 11 AM works great. Also, is there parking available?',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    type: 'text',
  },
  {
    id: 'm4',
    senderId: 'host1',
    senderName: 'Rahul S.',
    receiverId: 'guest1',
    content: 'Yes! We have a dedicated parking spot in the building basement. I\'ll include the access card in your welcome kit.',
    timestamp: new Date(Date.now() - 1800000),
    read: false,
    type: 'text',
  },
  {
    id: 'm5',
    senderId: 'host1',
    senderName: 'Rahul S.',
    receiverId: 'guest1',
    content: 'Anything else I can help you with before your arrival?',
    timestamp: new Date(Date.now() - 900000),
    read: false,
    type: 'text',
  },
];

// Current user ID (placeholder - would come from auth context)
const CURRENT_USER_ID = 'guest1';

// Format timestamp for display
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// MessagingPlaceholder Component - List of conversations
export function MessagingPlaceholder() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/habixo/messages/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        {item.participantAvatar ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.participantName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.participantName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>{item.participantName}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.updatedAt)}</Text>
        </View>
        {item.propertyName && (
          <Text style={styles.propertyName} numberOfLines={1}>
            Re: {item.propertyName}
          </Text>
        )}
        {item.lastMessage && (
          <Text
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage.senderId === CURRENT_USER_ID ? 'You: ' : ''}
            {item.lastMessage.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Unread indicator */}
      {totalUnread > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadBarText}>
            {totalUnread} unread conversation{totalUnread > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Conversations List */}
      <FlashList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Your conversations with hosts and guests will appear here
            </Text>
          </View>
        }
        estimatedItemSize={80}
      />

      {/* Placeholder Notice */}
      <View style={styles.placeholderNotice}>
        <Text style={styles.noticeText}>
          Full messaging coming soon. Currently showing placeholder data.
        </Text>
      </View>
    </View>
  );
}

// MessageBubble Component - Individual message
export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View style={[styles.bubbleContainer, isOwn && styles.bubbleContainerOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
          {formatTimestamp(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// QuickReplies Component - Suggested responses
export function QuickReplies({ onSelect }: { onSelect: (reply: string) => void }) {
  const quickReplies = [
    'Thanks for letting me know!',
    'Sounds good!',
    'I\'ll check and get back to you',
    'Can you share more details?',
  ];

  return (
    <View style={styles.quickReplies}>
      {quickReplies.map((reply, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickReplyButton}
          onPress={() => onSelect(reply)}
        >
          <Text style={styles.quickReplyText}>{reply}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// BookingActionMessage Component - Special booking-related messages
export function BookingActionMessage({ type }: { type: 'request' | 'confirmed' | 'cancelled' }) {
  const configs = {
    request: {
      icon: '📋',
      title: 'Booking Request Sent',
      description: 'The host will respond within 24 hours',
      color: '#f59e0b',
    },
    confirmed: {
      icon: '✅',
      title: 'Booking Confirmed!',
      description: 'Your stay has been confirmed. Check your email for details.',
      color: '#10b981',
    },
    cancelled: {
      icon: '❌',
      title: 'Booking Cancelled',
      description: 'This booking has been cancelled.',
      color: '#ef4444',
    },
  };

  const config = configs[type];

  return (
    <View style={[styles.actionMessage, { borderColor: config.color }]}>
      <Text style={styles.actionIcon}>{config.icon}</Text>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{config.title}</Text>
        <Text style={styles.actionDescription}>{config.description}</Text>
      </View>
    </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  unreadBar: {
    backgroundColor: '#e0e7ff',
    padding: 8,
    alignItems: 'center',
  },
  unreadBarText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  propertyName: {
    fontSize: 12,
    color: '#6366f1',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  placeholderNotice: {
    backgroundColor: '#fef3c7',
    padding: 12,
    alignItems: 'center',
  },
  noticeText: {
    fontSize: 12,
    color: '#92400e',
  },
  // Bubble styles
  bubbleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  bubbleContainerOwn: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bubbleText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Quick replies
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickReplyText: {
    fontSize: 13,
    color: '#374151',
  },
  // Action message
  actionMessage: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default MessagingPlaceholder;
