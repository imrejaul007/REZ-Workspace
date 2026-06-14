// @ts-nocheck
/**
 * AI Concierge Screen
 * Conversational shopping assistant with voice support
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthUser } from '@/stores/selectors';
import { useConversationMemory } from '@/hooks/useMemory';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useContextEngine } from '@/hooks/useContextEngine';
import { useVoiceInput, useVoiceCommands } from '@/hooks/useVoiceInput';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: {
    label: string;
    route: string;
    icon?: string;
  };
  suggestions?: string[];
}

const SUGGESTED_QUERIES = [
  'Find me dinner under ₹700 nearby',
  'Best salon for hair spa today',
  'Cheapest protein options',
  'My usual Friday order?',
  'Suggest gifts under ₹2K',
  'Book my regular barber',
];

export default function AIAssistantScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const { addMessage, getConversationHistory } = useConversationMemory();
  const { recommendations } = usePersonalization();
  const { getUserContext } = useContextEngine();

  // Voice input hooks
  const {
    isListening,
    isSpeaking,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceInput();
  const { processCommand } = useVoiceCommands();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${user?.profile?.firstName?.split(' ')[0] || 'there'}! 👋 I'm your REZ AI assistant. I can help you find products, discover deals, book services, and save money. What are you looking for today?`,
      suggestions: SUGGESTED_QUERIES.slice(0, 3),
    },
  ]);

  // Pulse animation for voice indicator
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    if (isListening) {
      pulseAnim.value = withRepeat(withTiming(1.3, { duration: 500 }), -1, true);
    } else {
      pulseAnim.value = 1;
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Process voice transcript
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
      // Auto-submit after voice input
      processQuery(transcript);
    }
  }, [transcript]);

  const handleVoicePress = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  const processQuery = useCallback(async (query: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInputText('');

    // Simulate AI processing
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();

      let response: Message;
      let action: Message['action'];

      if (lowerQuery.includes('dinner') || lowerQuery.includes('food') || lowerQuery.includes('restaurant')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I found some great dinner options near you! Here are restaurants with the best cashback:',
          action: { label: 'View Restaurants', route: '/restaurant', icon: 'restaurant' },
          suggestions: ['Book a table', 'View menu', 'Order delivery'],
        };
      } else if (lowerQuery.includes('salon') || lowerQuery.includes('spa') || lowerQuery.includes('hair')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Here are the top-rated salons near you with great deals:',
          action: { label: 'Browse Salons', route: '/salon', icon: 'cut' },
          suggestions: ['Hair spa deals', 'Book appointment', 'View reviews'],
        };
      } else if (lowerQuery.includes('protein') || lowerQuery.includes('supplement') || lowerQuery.includes('gym')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I found some affordable protein options with high cashback:',
          action: { label: 'View Products', route: '/product-page?id=protein-1', icon: 'barbell' },
          suggestions: ['Under ₹500', 'Whey protein', 'Pre-workout'],
        };
      } else if (lowerQuery.includes('gift') || lowerQuery.includes('present')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Here are some gift ideas that match your preferences and budget:',
          action: { label: 'Browse Gifts', route: '/shop?category=gifts', icon: 'gift' },
          suggestions: ['For her', 'For him', 'Under ₹500', 'Under ₹2000'],
        };
      } else if (lowerQuery.includes('usual') || lowerQuery.includes('regular')) {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Based on your order history, here\'s what you usually order on Fridays:',
          action: { label: 'Reorder', route: '/cart', icon: 'repeat' },
          suggestions: ['Same as last time', 'View history', 'Customize order'],
        };
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I found some great options for "${query}"! Here are personalized recommendations:`,
          action: { label: 'View Results', route: '/search', icon: 'search' },
          suggestions: ['Sort by price', 'Filter by rating', 'Show nearby only'],
        };
      }

      setMessages(prev => [...prev, response]);
      setLoading(false);

      // Store in memory
      addMessage('user', query);
      addMessage('assistant', response.content);
    }, 1500);
  }, [user, addMessage]);

  const handleSend = () => {
    if (inputText.trim()) {
      processQuery(inputText.trim());
    }
  };

  const handleSuggestion = (suggestion: string) => {
    processQuery(suggestion);
  };

  const renderMessage = (message: Message, index: number) => (
    <Animated.View
      key={message.id}
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={[
        styles.messageContainer,
        message.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {message.role === 'assistant' && (
        <View style={styles.assistantAvatar}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}>
        <Text style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText,
        ]}>
          {message.content}
        </Text>
        {message.action && (
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push(message.action!.route as unknown)}
          >
            <Ionicons
              name={message.action.icon as unknown || 'arrow-forward'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>{message.action.label}</Text>
          </Pressable>
        )}
      </View>
      {message.role === 'user' && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>REZ AI</Text>
            <Text style={styles.headerSubtitle}>Your shopping assistant</Text>
          </View>
          <Pressable style={styles.micButton}>
            <Ionicons name="mic" size={24} color={colors.brand.primary} />
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {messages.map((message, index) => renderMessage(message, index))}

          {loading && (
            <Animated.View entering={FadeIn} style={styles.typingIndicator}>
              <View style={styles.assistantAvatar}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
            </Animated.View>
          )}

          {!loading && messages.length === 1 && (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              {SUGGESTED_QUERIES.map((query, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(query)}
                >
                  <Text style={styles.suggestionText}>{query}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          {/* Voice Input Button */}
          <Animated.View style={pulseStyle}>
            <Pressable
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonActive,
              ]}
              onPress={handleVoicePress}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={20}
                color={isListening ? '#FFFFFF' : colors.brand.primary}
              />
            </Pressable>
          </Animated.View>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {/* Voice indicator when listening */}
          {isListening && (
            <View style={styles.listeningIndicator}>
              <View style={styles.listeningDot} />
            </View>
          )}

          {/* Send Button */}
          <Pressable
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons
              name={loading ? 'hourglass' : 'send'}
              size={20}
              color={inputText.trim() && !loading ? '#FFFFFF' : colors.text.tertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitleText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },
  micButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary[100] + '20',
    borderRadius: borderRadius.full,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.background.secondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  typingBubble: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 60,
    alignItems: 'center',
  },
  suggestions: {
    marginTop: spacing.lg,
  },
  suggestionsTitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.brand.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  voiceButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  listeningIndicator: {
    position: 'absolute',
    left: spacing.md + 50,
    bottom: spacing.md + 12,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.secondary,
  },
});
