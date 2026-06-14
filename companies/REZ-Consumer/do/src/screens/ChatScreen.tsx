/**
 * ChatScreen - DO App Main Chat Interface
 *
 * UPDATED: Integrated with HOJAI Flow + Genie
 *
 * Features:
 * - Natural language chat (via REZ Mind)
 * - Voice input (via useFlowVoice - HOJAI Flow)
 * - Memory/Preferences (via useGenieMemory - HOJAI Genie)
 * - Hybrid AI (combined Flow + Genie + REZ Mind)
 *
 * Usage Example:
 * - "Book my usual" → Genie recalls, Hybrid processes, Flow speaks response
 * - "Find Italian restaurants" → REZ Mind detects intent, shows results
 * - "Order same as last time" → Genie recalls last order, books it
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/theme/ThemeProvider';
import { useChatStore, Message, Entity } from '@/stores';
import { useUserStore } from '@/stores';
import { useAI } from '@/hooks'; // NEW: AI hooks
import { rezApi } from '@/services/rezApi';
import logger from '@/utils/logger';

import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { EntityCard } from '@/components/chat/EntityCard';
import { RewardCard } from '@/components/chat/RewardCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { VoiceInputButton } from '@/components/VoiceInputButton';

// Style advisor quick actions
const STYLE_ACTIONS = [
  { text: "I'm bored", icon: '🤔' },
  { text: "I'm hungry", icon: '🍽️' },
  { text: 'Suggest something romantic', icon: '💕' },
  { text: 'Need to relax', icon: '🧘' },
];

// General quick actions
const GENERAL_ACTIONS = [
  'Book dinner',
  'Show my coins',
  'Find nearby',
];

// NEW: "Usual" quick action (powered by Genie)
const USUAL_ACTIONS = [
  { text: 'My usual', icon: '✨', description: 'Order your usual' },
  { text: 'Same as last time', icon: '🔄', description: 'Repeat last order' },
];

export const ChatScreen: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStyleMode, setShowStyleMode] = useState(false);

  // ============================================
  // HOJAI AI INTEGRATION
  // ============================================
  const {
    flow,           // useFlowVoice - Real STT/TTS
    genie,          // useGenieMemory - Personal memory
    hybrid,         // useHybridAI - Combined AI
    userId,
    isAuthenticated,
  } = useAI();

  // Store state
  const {
    messages,
    sessionId,
    isTyping,
    location,
    initializeSession,
    addMessage,
    setTyping,
    setLocation,
  } = useChatStore();

  const { karma, wallet, isAuthenticated: userAuth } = useUserStore();

  // ============================================
  // HOJAI CONTEXT LOADING
  // ============================================
  useEffect(() => {
    if (userId && isAuthenticated) {
      // Load Genie context on mount
      logger.info('[ChatScreen] Loading Genie context for user:', userId);
    }
  }, [userId, isAuthenticated]);

  // ============================================
  // LOCATION
  // ============================================
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (error) {
        logger.warn('[ChatScreen] Location error:', error);
      }
    };

    getLocation();
    initializeSession();
  }, []);

  // ============================================
  // VOICE HANDLING (via HOJAI Flow)
  // ============================================
  const handleVoicePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (flow.isListening) {
        // Stop recording and process
        const transcript = await flow.stopListening();

        if (transcript) {
          // Process voice command with Hybrid AI
          const response = await hybrid.handleVoiceCommand(
            // Note: audioUri would come from flow recording
            // For now, using transcript directly
          );

          // Add user message
          addMessage({
            type: 'user',
            content: transcript,
          });

          // Add AI response
          addMessage({
            type: 'bot',
            content: response.text,
            suggestions: response.suggestions,
          });

          // Learn from interaction (if booking/order)
          // This happens automatically via hybrid.handleTextCommand
        }
      } else {
        // Start recording
        await flow.startListening();
      }
    } catch (error) {
      logger.error('[ChatScreen] Voice error:', error);
      Alert.alert('Voice Error', 'Failed to process voice. Please try again.');
    }
  }, [flow, hybrid, addMessage]);

  // ============================================
  // TEXT MESSAGE HANDLING (via Hybrid AI)
  // ============================================
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      logger.info('[ChatScreen] Message:', text);

      // Add user message
      addMessage({
        type: 'user',
        content: text,
      });

      setTyping(true);

      try {
        // Check for "usual" patterns and use Genie
        const isUsualPattern =
          text.toLowerCase().includes('usual') ||
          text.toLowerCase().includes('same as') ||
          text.toLowerCase().includes('like last');

        if (isUsualPattern && userId) {
          // Use Genie to recall "usual"
          const usual = await genie.getUsual();

          if (usual && usual.merchant) {
            // Show usual order
            addMessage({
              type: 'bot',
              content: `Your usual is ${usual.merchant}${usual.cuisine ? ` (${usual.cuisine})` : ''}${usual.amount ? `, around ₹${usual.amount}` : ''}. Should I book it?`,
              suggestions: [
                `Yes, book ${usual.merchant}`,
                'Show menu',
                'Find another option',
              ],
              metadata: { usual },
            });

            setTyping(false);
            return;
          }
        }

        // Process with Hybrid AI (Flow + Genie + REZ Mind)
        const response = await hybrid.handleTextCommand(text);

        // Add AI response
        addMessage({
          type: 'bot',
          content: response.text,
          suggestions: response.suggestions,
          metadata: response.actions,
        });

        // Learn from successful booking/order
        if (response.actions?.[0]?.type === 'book' && userId) {
          const bookingData = response.actions[0].data;
          await genie.rememberBooking({
            merchantName: bookingData.merchant || 'Unknown',
            date: new Date().toISOString().split('T')[0],
            time: bookingData.time,
            partySize: bookingData.partySize,
            amount: bookingData.amount,
          });
        }
      } catch (error) {
        logger.error('[ChatScreen] Error:', error);

        // Fallback to original workflow
        try {
          const response = await rezApi.chat.sendMessage(sessionId, text, location);
          addMessage({
            type: 'bot',
            content: response.message || 'Something went wrong',
            suggestions: response.suggestions,
          });
        } catch (apiError) {
          addMessage({
            type: 'bot',
            content: 'Sorry, something went wrong. Please try again.',
          });
        }
      }

      setTyping(false);
    },
    [sessionId, location, addMessage, setTyping, genie, hybrid, userId]
  );

  // ============================================
  // QUICK ACTIONS
  // ============================================
  const handleQuickAction = useCallback(
    (action: string) => {
      if (action === 'My usual' || action === 'Same as last time') {
        // Use Genie to recall usual
        handleSend("Order my usual");
      } else {
        handleSend(action);
      }
    },
    [handleSend]
  );

  const handleStyleAction = useCallback(
    (action: string) => {
      const styleMap: Record<string, string> = {
        "I'm bored": 'Show me something interesting nearby',
        "I'm hungry": 'Find restaurants near me',
        'Suggest something romantic': 'Find romantic restaurants',
        'Need to relax': 'Find spas or cafes',
      };

      const message = styleMap[action] || action;
      handleSend(message);
      setShowStyleMode(false);
    },
    [handleSend]
  );

  // ============================================
  // PULL TO REFRESH
  // ============================================
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hybrid.refreshContext?.();
    setRefreshing(false);
  }, [hybrid]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>D</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>DO</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              AI Commerce
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* NEW: Genie indicator */}
          {hybrid.context?.usual && (
            <TouchableOpacity
              style={[styles.genieIndicator, { backgroundColor: colors.primary + '20' }]}
              onPress={() =>
                addMessage({
                  type: 'bot',
                  content: `Your usual: ${hybrid.context.usual.merchant}${hybrid.context.usual.cuisine ? ` (${hybrid.context.usual.cuisine})` : ''}`,
                  suggestions: [`Book ${hybrid.context.usual.merchant}`, 'Find others'],
                })
              }
            >
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.genieText, { color: colors.primary }]}>Genie</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.karmaButton}
            onPress={() =>
              addMessage({ type: 'bot', content: `Your karma: ${karma} coins` })
            }
          >
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.karmaText}>{karma}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            {item.type === 'reward' ? (
              <RewardCard
                amount={item.amount || 0}
                reason={item.reason || 'Earned'}
                onDismiss={() => {}}
              />
            ) : item.type === 'entity' ? (
              <EntityCard
                entity={item.entity as Entity}
                onPress={() => {}}
                onSave={() => {}}
              />
            ) : (
              <MessageBubble
                message={item}
                onSuggestionPress={handleQuickAction}
              />
            )}
          </Animated.View>
        )}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Hey! 👋 How can I help?
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try saying "Book my usual" or "Find Italian restaurants"
            </Text>
          </View>
        }
        ListFooterComponent={
          isTyping ? <TypingIndicator /> : null
        }
      />

      {/* Style Mode Toggle */}
      {showStyleMode && (
        <Animated.View
          entering={SlideInDown}
          style={[styles.styleModeContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.styleModeTitle, { color: colors.text }]}>
            How are you feeling?
          </Text>
          <View style={styles.styleModeActions}>
            {STYLE_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.text}
                style={[styles.styleAction, { backgroundColor: colors.background }]}
                onPress={() => handleStyleAction(action.text)}
              >
                <Text style={styles.styleActionIcon}>{action.icon}</Text>
                <Text style={[styles.styleActionText, { color: colors.text }]}>
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {/* NEW: Usual quick actions (powered by Genie) */}
        {hybrid.context?.usual && (
          <TouchableOpacity
            style={[styles.quickAction, styles.usualAction, { borderColor: colors.primary }]}
            onPress={() => handleQuickAction('My usual')}
          >
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.primary }]}>
              My usual
            </Text>
          </TouchableOpacity>
        )}

        {GENERAL_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action}
            style={[styles.quickAction, { borderColor: colors.border }]}
            onPress={() => handleQuickAction(action)}
          >
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              {action}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.quickAction, { borderColor: colors.border }]}
          onPress={() => setShowStyleMode(!showStyleMode)}
        >
          <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
            I'm feeling...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Input with Voice */}
      <ChatInput
        onSend={handleSend}
        placeholder="Ask anything or say 'Book my usual'"
        onVoicePress={handleVoicePress}
        isVoiceActive={flow.isListening}
        voiceState={flow}
      />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genieIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genieText: {
    fontSize: 11,
    fontWeight: '600',
  },
  karmaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF8E1',
  },
  karmaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  styleModeContainer: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  styleModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  styleModeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  styleActionIcon: {
    fontSize: 16,
  },
  styleActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  usualAction: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  quickActionText: {
    fontSize: 13,
  },
});

export default ChatScreen;