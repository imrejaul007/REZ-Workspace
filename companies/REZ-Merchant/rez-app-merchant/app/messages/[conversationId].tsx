import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { messagingService, MerchantMessage, MerchantConversation } from '@/services/api/messaging';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<MerchantMessage[]>([]);
  const [conversation, setConversation] = useState<MerchantConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!conversationId) return;
      try {
        if (pageNum === 1 && !append) setLoading(true);
        const result = await messagingService.getMessages(conversationId, pageNum, 50);
        const items = result.messages ?? [];
        // Messages come newest-first from API; we reverse for display
        setMessages((prev) => (append ? [...prev, ...items] : items));
        setConversation(result.conversation ?? null);
        setHasMore(result.pagination?.current < result.pagination?.pages);
        setPage(pageNum);
      } catch {
        if (!append) setMessages([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    fetchMessages(1);
    // Mark as read when opening
    if (conversationId) {
      messagingService.markAsRead(conversationId).catch((e) => console.warn('[Messages] Mark as read failed:', e));
    }
  }, [fetchMessages, conversationId]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchMessages(page + 1, true);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !conversationId || sending) return;

    setSending(true);
    setInputText('');

    // Optimistic: add message immediately
    const tempMsg: MerchantMessage = {
      _id: `temp-${Date.now()}`,
      conversationId,
      senderId: 'me',
      senderType: 'store',
      type: 'text',
      content: text,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [tempMsg, ...prev]);

    try {
      const sent = await messagingService.sendMessage(conversationId, text);
      // Replace temp with real message
      setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? sent : m)));
    } catch {
      // Revert on failure
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateStr: string): string => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: MerchantMessage; index: number }) => {
      const isStore = item.senderType === 'store';
      const isSystem = item.senderType === 'system';

      // Show date header if different day from next message (messages are newest-first)
      const nextMsg = messages[index + 1];
      const showDate =
        !nextMsg ||
        new Date(item.sentAt).toDateString() !== new Date(nextMsg.sentAt).toDateString();

      return (
        <View>
          {showDate && (
            <View style={styles.dateHeader}>
              <ThemedText style={styles.dateHeaderText}>{formatDateHeader(item.sentAt)}</ThemedText>
            </View>
          )}

          {isSystem ? (
            <View style={styles.systemMessage}>
              <ThemedText style={styles.systemText}>{item.content}</ThemedText>
            </View>
          ) : (
            <View style={[styles.messageBubbleRow, isStore && styles.messageBubbleRowRight]}>
              <View
                style={[styles.messageBubble, isStore ? styles.storeBubble : styles.customerBubble]}
              >
                {item.type === 'product' && item.product && (
                  <View style={styles.productRef}>
                    <Ionicons name="cube-outline" size={14} color={Colors.light.primary} />
                    <ThemedText style={styles.productRefText}>{item.product.name}</ThemedText>
                  </View>
                )}
                {item.type === 'order' && item.order && (
                  <View style={styles.productRef}>
                    <Ionicons name="receipt-outline" size={14} color={Colors.light.primary} />
                    <ThemedText style={styles.productRefText}>
                      Order #{item.order.orderNumber}
                    </ThemedText>
                  </View>
                )}
                <ThemedText style={[styles.messageText, isStore && styles.storeMessageText]}>
                  {item.content}
                </ThemedText>
                <View style={styles.messageFooter}>
                  <ThemedText style={[styles.messageTime, isStore && styles.storeMessageTime]}>
                    {formatTime(item.sentAt)}
                  </ThemedText>
                  {isStore && (
                    <Ionicons
                      name={
                        item.status === 'read'
                          ? 'checkmark-done'
                          : item.status === 'delivered'
                            ? 'checkmark-done'
                            : 'checkmark'
                      }
                      size={14}
                      color={item.status === 'read' ? '#34D399' : 'rgba(255,255,255,0.6)'}
                    />
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      );
    },
    [messages]
  );

  const customerName =
    conversation?.customerId?.fullName || conversation?.customerId?.phoneNumber || 'Customer';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <ThemedText style={styles.headerAvatarText}>
            {customerName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerName} numberOfLines={1}>
            {customerName}
          </ThemedText>
          <ThemedText style={styles.headerStatus}>
            {conversation?.status === 'active' ? 'Active' : conversation?.status || ''}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.archiveButton}
          onPress={async () => {
            if (!conversationId) return;
            try {
              if (conversation?.status === 'archived') {
                await messagingService.unarchiveConversation(conversationId);
              } else {
                await messagingService.archiveConversation(conversationId);
              }
              router.back();
            } catch (e) {
              logger.warn('Message grouping error:', e);
            }
          }}
        >
          <Ionicons
            name={conversation?.status === 'archived' ? 'archive' : 'archive-outline'}
            size={22}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          inverted
          contentContainerStyle={styles.messagesList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.light.primary}
                style={{ padding: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={48}
                color={Colors.light.textSecondary}
              />
              <ThemedText style={styles.emptyChatText}>No messages yet</ThemedText>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={Colors.light.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 10,
  },
  backButton: { padding: 4 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  headerStatus: { fontSize: 12, color: Colors.light.textSecondary },
  archiveButton: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: 12, paddingVertical: 8 },
  dateHeader: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  systemMessage: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 12, color: Colors.light.textSecondary, fontStyle: 'italic' },
  messageBubbleRow: { marginBottom: 4, alignItems: 'flex-start' },
  messageBubbleRowRight: { alignItems: 'flex-end' },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  customerBubble: {
    backgroundColor: Colors.light.background,
    borderBottomLeftRadius: 4,
  },
  storeBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  productRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  productRefText: { fontSize: 12, fontWeight: '600', color: Colors.light.primary },
  messageText: { fontSize: 15, color: Colors.light.text, lineHeight: 20 },
  storeMessageText: { color: '#fff' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10, color: Colors.light.textSecondary },
  storeMessageTime: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
