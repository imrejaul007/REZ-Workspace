// AI Chat Screen
// Provides AI-powered support chat interface

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import { PROFILE_COLORS } from '@/types/profile.types';
import { BorderRadius, Spacing } from '@/constants/DesignSystem';
import AIChatBubble from '@/components/AIChatBubble';
import { AIChatProvider, useAIChat } from '@/contexts/AIChatContext';
import { useAuthUser } from '@/stores/selectors';
import { AIChatMessage, QuickReply } from '@/services/aiSupportService';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

function AIChatContent() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [inputText, setInputText] = useState('');

  const {
    messages,
    isTyping,
    isConnected,
    error,
    sendMessage,
    sendQuickReply,
    clearMessages,
  } = useAIChat();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleBackPress = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  }, [router]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  }, [inputText, sendMessage]);

  const handleQuickReply = useCallback(async (reply: QuickReply) => {
    await sendQuickReply(reply);
  }, [sendQuickReply]);

  const handleClearChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const renderMessage = useCallback(({ item }: { item: AIChatMessage }) => (
    <AIChatBubble
      message={item}
      isOwnMessage={item.sender === 'user'}
      onQuickReplyPress={handleQuickReply}
    />
  ), [handleQuickReply]);

  const renderTypingIndicator = useCallback(() => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <ActivityIndicator size="small" color={PROFILE_COLORS.primary} />
          <ThemedText style={styles.typingText}>AI is typing...</ThemedText>
        </View>
      </View>
    );
  }, [isTyping]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.text.tertiary} />
      <ThemedText style={styles.emptyText}>Start a conversation</ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Ask me anything about your orders, refunds, or general inquiries
      </ThemedText>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PROFILE_COLORS.primary} translucent={false} />

      {/* Header */}
      <LinearGradient
        colors={[PROFILE_COLORS.primary, PROFILE_COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.headerButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <View style={styles.aiIconContainer}>
                <Ionicons name="bulb" size={20} color={PROFILE_COLORS.primary} />
              </View>
              <ThemedText style={styles.headerTitle}>AI Support</ThemedText>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isConnected ? styles.statusOnline : styles.statusOffline]} />
              <ThemedText style={styles.statusText}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </ThemedText>
            </View>
          </View>

          <Pressable style={styles.headerButton} onPress={handleClearChat}>
            <Ionicons name="trash-outline" size={22} color="white" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={PROFILE_COLORS.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderTypingIndicator}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? 'white' : colors.text.tertiary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AIChatScreen() {
  const user = useAuthUser();

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthenticated}>
          <Ionicons name="lock-closed" size={48} color={colors.text.tertiary} />
          <ThemedText style={styles.notAuthenticatedText}>
            Please log in to use AI Support
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AIChatProvider
      merchantId="rez-app"
      userId={user.id}
      userName={user.profile?.firstName || user.profile?.lastName || 'User'}
      userEmail={user.email}
    >
      <AIChatContent />
    </AIChatProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#FFC107',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorScale[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.errorScale[600],
    flex: 1,
  },
  messageList: {
    flexGrow: 1,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  inputContainer: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PROFILE_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  notAuthenticated: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default withErrorBoundary(AIChatScreen, 'AIChat');
