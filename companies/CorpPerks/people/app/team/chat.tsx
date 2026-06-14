// ==========================================
// MyTalent - Team Chat Screen
// Channel Messages View
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors } from '../../components/Badge';
import { teamCollabService, Message } from '../../services/teamCollabService';

type ChatRouteParams = {
  Chat: {
    channel: {
      channelId: string;
      name: string;
      description?: string;
      type: string;
    };
  };
};

const REACTIONS = ['👍', '❤️', '🎉', '🚀', '👀'];

export default function ChatScreen() {
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const { channel } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages(before?: string) {
    try {
      const response = await teamCollabService.getMessages(channel.channelId, {
        before,
        limit: 50,
      });

      if (before) {
        setMessages((prev) => [...response.items.reverse(), ...prev]);
      } else {
        setMessages(response.items.reverse());
      }

      setHasMore(response.hasMore);
    } catch (error) {
      logger.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadMessages();
  }

  async function onEndReached() {
    if (!hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    await loadMessages(oldestMessage.createdAt);
  }

  async function sendMessage() {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      const newMessage = await teamCollabService.sendMessage({
        channelId: channel.channelId,
        content: messageText,
      });

      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      // Restore input if failed
      setInputText(messageText);
    }
  }

  async function addReaction(messageId: string, emoji: string) {
    try {
      await teamCollabService.addReaction(messageId, emoji);
      setShowReactions(null);
      // Refresh to get updated reactions
      const response = await teamCollabService.getMessages(channel.channelId, { limit: 50 });
      setMessages(response.items.reverse());
    } catch (error) {
      logger.error('Failed to add reaction:', error);
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = !prevMessage ||
      new Date(item.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

    const groupedWithPrevious = prevMessage &&
      prevMessage.senderId === item.senderId &&
      new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 60000;

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}

        {!groupedWithPrevious ? (
          <View style={styles.messageContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{item.senderName}</Text>
                <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.messageText}>{item.content}</Text>

              {/* Reactions */}
              {item.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {Array.from(new Set(item.reactions.map((r) => r.emoji))).map((emoji) => {
                    const count = item.reactions.filter((r) => r.emoji === emoji).length;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.reactionBadge}
                        onPress={() => addReaction(item.messageId, emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        <Text style={styles.reactionCount}>{count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Reply count */}
              {item.replyCount > 0 && (
                <TouchableOpacity style={styles.replyIndicator}>
                  <Text style={styles.replyText}>
                    💬 {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Reaction picker */}
              {showReactions === item.messageId && (
                <View style={styles.reactionPicker}>
                  {REACTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.reactionOption}
                      onPress={() => addReaction(item.messageId, emoji)}
                    >
                      <Text style={styles.reactionOptionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowReactions(showReactions === item.messageId ? null : item.messageId)}
            >
              <Text style={styles.moreButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupedMessageContainer}>
            <Text style={styles.groupedMessageText}>{item.content}</Text>

            {/* Reactions for grouped message */}
            {item.reactions.length > 0 && (
              <View style={styles.reactionsContainer}>
                {Array.from(new Set(item.reactions.map((r) => r.emoji))).map((emoji) => {
                  const count = item.reactions.filter((r) => r.emoji === emoji).length;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.reactionBadge}
                      onPress={() => addReaction(item.messageId, emoji)}
                    >
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                      <Text style={styles.reactionCount}>{count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {showReactions === item.messageId && (
              <View style={styles.reactionPicker}>
                {REACTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionOption}
                    onPress={() => addReaction(item.messageId, emoji)}
                  >
                    <Text style={styles.reactionOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.messageId}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to say something!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={10000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
    marginLeft: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  replyIndicator: {
    marginTop: 6,
  },
  replyText: {
    fontSize: 12,
    color: Colors.primary,
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 6,
    marginTop: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reactionOption: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  reactionOptionText: {
    fontSize: 20,
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  groupedMessageContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 46,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
  },
  groupedMessageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
