// ==========================================
// CorpPerks Client App - Messages List Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, EmptyState } from '../../src/components';
import { api } from '../../src/services/api';
import { useStore } from '../../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
} from '../../src/utils/theme';
import { Conversation, Message } from '../../src/types';

export default function MessagesListScreen() {
  const navigation = useNavigation<any>();
  const { setConversations } = useStore();
  const [conversations, setConversationsData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  const loadConversations = async () => {
    try {
      const response = await api.getConversations();
      if (response.success && response.data) {
        setConversationsData(response.data);
        setFilteredConversations(response.data);
        setConversations(response.data);
      }
    } catch (error) {
      logger.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter(
          (conv) =>
            conv.projectName?.toLowerCase().includes(query) ||
            conv.lastMessage?.content.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.role !== 'client');
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(item);
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, hasUnread && styles.conversationUnread]}
        onPress={() =>
          navigation.navigate('Messages', {
            screen: 'Chat',
            params: { conversationId: item.id },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            uri={otherParticipant?.avatar}
            name={otherParticipant?.name || 'Team'}
            size="lg"
          />
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, hasUnread && styles.unreadText]}>
              {otherParticipant?.name || 'Team Member'}
            </Text>
            <Text style={styles.timestamp}>
              {item.lastMessage && formatDate(item.lastMessage.timestamp, 'relative')}
            </Text>
          </View>

          {item.projectName && (
            <Text style={styles.projectName}>{item.projectName}</Text>
          )}

          {item.lastMessage && (
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage.senderName === 'Rahul Mehta' ? 'You: ' : ''}
              {item.lastMessage.content}
            </Text>
          )}
        </View>

        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>search</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chat"
            title="No Messages"
            description={
              searchQuery
                ? 'No conversations match your search.'
                : 'No messages yet. Start a conversation from your project page.'
            }
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.card,
  },
  conversationUnread: {
    backgroundColor: Colors.primary + '08',
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  unreadText: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  projectName: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadCount: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 76,
  },
});
