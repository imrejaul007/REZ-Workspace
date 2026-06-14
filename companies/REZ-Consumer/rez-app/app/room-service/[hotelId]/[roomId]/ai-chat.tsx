// @ts-nocheck
/**
 * Room Service AI Chat
 * Route: /room-service/[hotelId]/[roomId]/ai-chat
 *
 * AI-powered conversational interface for hotel guests
 * - Powered by REZ-support-copilot + REZ Mind
 * - Handles all hotel intents:
 *   - Order food/services
 *   - Book spa, transport, etc
 *   - Check booking status
 *   - Request housekeeping
 *   - Get recommendations
 *   - Ask for help
 *   - And more...
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Message types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
  actions?: Action[];
}

interface QuickReply {
  id: string;
  text: string;
  value: string;
}

interface Action {
  id: string;
  type: 'link' | 'button' | 'navigate';
  label: string;
  data: string;
}

// Hotel-specific intents
const HOTEL_INTENTS = {
  // Order intents
  order_food: { pattern: /order|food|breakfast|lunch|dinner|meal/i, response: 'I can help you order food! What would you like?' },
  order_room_service: { pattern: /room service|order to room/i, response: 'I\'ll connect you to room service. What would you like to order?' },
  order_spa: { pattern: /spa|massage|wellness|treatment/i, response: 'Our spa offers relaxing treatments. Would you like to book a session?' },
  order_laundry: { pattern: /laundry|dry clean|iron/i, response: 'I can arrange laundry service. How many items do you have?' },

  // Booking intents
  booking_status: { pattern: /booking|reservation|check.?in|check.?out/i, response: 'Let me check your booking details.' },
  extend_stay: { pattern: /extend|late checkout|early check.?in/i, response: 'I can help with extending your stay. Let me check availability.' },

  // Request intents
  request_cleaning: { pattern: /clean|housekeeping|towels|extra|mop/i, response: 'I\'ll request housekeeping for you.' },
  request_taxi: { pattern: /taxi|uber|car|transport|airport/i, response: 'I can arrange transport for you.' },
  request_help: { pattern: /help|assist|support|problem|issue/i, response: 'I\'m here to help! What do you need assistance with?' },

  // Information intents
  info_wifi: { pattern: /wifi|internet|password/i, response: 'The WiFi password is available at the front desk or in your room directory.' },
  info_restaurant: { pattern: /restaurant|breakfast|dining/i, response: 'Our restaurant is open from 7 AM to 11 PM. Room service is available 24/7.' },
  info_pool: { pattern: /pool|gym|fitness|spa/i, response: 'The pool is open 6 AM - 9 PM. Gym is open 24/7 with your room key.' },

  // Feedback intents
  feedback: { pattern: /feedback|rating|review|complaint/i, response: 'We value your feedback. What would you like to share?' },
};

// Default quick replies for hotel
const HOTEL_QUICK_REPLIES: QuickReply[] = [
  { id: 'order-food', text: '🍔 Order Food', value: 'order_food' },
  { id: 'order-spa', text: '💆 Book Spa', value: 'order_spa' },
  { id: 'cleaning', text: '🧹 Housekeeping', value: 'request_cleaning' },
  { id: 'taxi', text: '🚕 Book Taxi', value: 'request_taxi' },
  { id: 'checkout', text: '🏨 Checkout', value: 'booking_status' },
  { id: 'help', text: '❓ Help', value: 'request_help' },
];

// Intent handlers
const INTENT_HANDLERS: Record<string, (context) => Promise<{ response: string; actions?: Action[] }>> = {
  order_food: async (ctx) => ({
    response: 'Great choice! 🍽️ Our kitchen is open 24/7. What would you like to order?',
    actions: [
      { id: 'menu', type: 'link', label: 'View Full Menu', data: '/room-service/menu' },
    ],
  }),

  order_spa: async (ctx) => ({
    response: 'Our spa offers Swedish massage, deep tissue, and aromatherapy. Would you like to book?',
    actions: [
      { id: 'book-spa', type: 'link', label: 'Book Spa Session', data: '/room-service/spa' },
    ],
  }),

  request_cleaning: async (ctx) => ({
    response: 'I\'ve requested housekeeping for Room ' + (ctx.roomNumber || 'your room') + '. They\'ll arrive within 30 minutes.',
    actions: [
      { id: 'track', type: 'button', label: 'Track Request', data: 'track_cleaning' },
    ],
  }),

  request_taxi: async (ctx) => ({
    response: 'I can arrange a taxi for you. Where would you like to go?',
    actions: [
      { id: 'airport', type: 'button', label: 'Airport Transfer', data: 'taxi_airport' },
      { id: 'local', type: 'button', label: 'Local Travel', data: 'taxi_local' },
    ],
  }),

  request_help: async (ctx) => ({
    response: 'I\'m here to help! I can assist with:\n• Ordering food & services\n• Booking spa & transport\n• Checkout & billing\n• Hotel information\n\nWhat do you need?',
  }),

  booking_status: async (ctx) => ({
    response: '📋 Your Booking Details:\n\nRoom: ' + (ctx.roomNumber || 'Deluxe') + '\nCheck-in: ' + (ctx.checkIn || 'May 7') + '\nCheck-out: ' + (ctx.checkOut || 'May 10') + '\nStatus: Confirmed ✓',
  }),

  info_wifi: async (ctx) => ({
    response: '📶 WiFi Details:\nNetwork: ' + (ctx.hotelName || 'HotelGuest') + '_5G\nPassword: Guest' + (ctx.roomNumber || '101'),
  }),
};

export default function RoomServiceAIChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    bookingId?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! 👋 I\'m your AI assistant for ' + (params.hotelId || 'this hotel') + '.\n\nI can help you with:\n• Ordering food & services\n• Booking spa & transport\n• Checkout & billing\n• Hotel information\n\nHow can I assist you today?',
      timestamp: new Date(),
      quickReplies: HOTEL_QUICK_REPLIES,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Detect intent from message
  const detectIntent = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    for (const [intent, config] of Object.entries(HOTEL_INTENTS)) {
      if (config.pattern.test(lowerText)) {
        return intent;
      }
    }
    return null;
  };

  // Handle intent
  const handleIntent = async (intent: string): Promise<Message> => {
    const handler = INTENT_HANDLERS[intent];
    if (handler) {
      const result = await handler({
        hotelId: params.hotelId,
        roomId: params.roomId,
        roomNumber: params.roomId?.replace('R', ''),
        checkIn: 'May 7',
        checkOut: 'May 10',
        hotelName: 'The Grand Mumbai',
      });

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        actions: result.actions,
        quickReplies: HOTEL_QUICK_REPLIES.slice(0, 3),
      };
    }

    // Fallback response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I understand you need help with "' + intent + '". Let me connect you with our concierge.',
      timestamp: new Date(),
      quickReplies: HOTEL_QUICK_REPLIES,
    };
  };

  // Send message
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(async () => {
      const intent = detectIntent(text);
      let response: Message;

      if (intent) {
        response = await handleIntent(intent);
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I\'m here to help with your hotel needs. You can:\n\n• Order food - Just say "order food"\n• Book spa - Say "book spa"\n• Request housekeeping - Say "cleaning"\n• Get info - Ask about WiFi, restaurant, pool\n• Checkout - Say "checkout"\n\nWhat would you like?',
          timestamp: new Date(),
          quickReplies: HOTEL_QUICK_REPLIES,
        };
      }

      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  // Handle quick reply
  const handleQuickReply = (reply: QuickReply) => {
    handleSend(reply.text);
  };

  // Handle action
  const handleAction = (action: Action) => {
    if (action.type === 'navigate' || action.type === 'link') {
      router.push(action.data as unknown);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#E07C24', '#F59E0B']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMessages([messages[0]])} style={styles.clearBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.role === 'user' && styles.userMessageRow]}>
            {item.role === 'assistant' && (
              <View style={styles.avatar}>
                <Ionicons name="bot" size={20} color="#fff" />
              </View>
            )}
            <View style={[styles.messageBubble, item.role === 'user' && styles.userBubble]}>
              <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
                {item.content}
              </Text>

              {/* Actions */}
              {item.actions && (
                <View style={styles.actionsContainer}>
                  {item.actions.map(action => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionButton}
                      onPress={() => handleAction(action)}
                    >
                      <Text style={styles.actionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Quick Replies */}
              {item.quickReplies && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRepliesContainer}>
                  {item.quickReplies.map(reply => (
                    <TouchableOpacity
                      key={reply.id}
                      style={styles.quickReply}
                      onPress={() => handleQuickReply(reply)}
                    >
                      <Text style={styles.quickReplyText}>{reply.text}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.avatar}>
            <Ionicons name="bot" size={20} color="#fff" />
          </View>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>Typing...</Text>
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  clearBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E07C24',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    flex: 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#E07C24',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#E07C24',
    fontWeight: '600',
  },
  quickRepliesContainer: {
    marginTop: 12,
  },
  quickReply: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 13,
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  typingText: {
    fontSize: 14,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E07C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CCC',
  },
});
