// ==========================================
// MyTalent - AI Chat Screen
// Chat with a specific AI agent
// ==========================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAIAgents } from '../../src/hooks/useAIAgents';
import { useAppStore } from '../../src/store/useAppStore';
import { Message, AgentId, AgentAction } from '../../src/services/aiAgentsService';

// ==========================================
// Constants
// ==========================================

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  cardLight: '#334155',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
  userBubble: '#6366F1',
  assistantBubble: '#334155',
};

// ==========================================
// Types
// ==========================================

interface ChatMessageProps {
  message: Message;
  agentColor: string;
  onSuggestionPress?: (suggestion: string) => void;
  onActionPress?: (action: AgentAction) => void;
}

interface SuggestionChipProps {
  text: string;
  onPress: () => void;
}

// ==========================================
// Suggestion Chip Component
// ==========================================

const SuggestionChip: React.FC<SuggestionChipProps> = ({ text, onPress }) => (
  <TouchableOpacity style={styles.suggestionChip} onPress={onPress}>
    <Text style={styles.suggestionText}>{text}</Text>
  </TouchableOpacity>
);

// ==========================================
// Action Button Component
// ==========================================

interface ActionButtonProps {
  action: AgentAction;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onPress }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'navigate': return 'arrow-forward';
      case 'open_url': return 'open-outline';
      case 'show_benefit': return 'card-outline';
      case 'calculate': return 'calculator-outline';
      case 'book': return 'calendar-outline';
      case 'notify': return 'notifications-outline';
      default: return 'arrow-forward';
    }
  };

  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={getIcon(action.type) as any} size={16} color={COLORS.primary} />
      <Text style={styles.actionText}>{action.label}</Text>
      <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

// ==========================================
// Chat Message Component
// ==========================================

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  agentColor,
  onSuggestionPress,
  onActionPress,
}) => {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
      ]}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: agentColor + '30' }]}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}

      <View style={styles.messageContent}>
        {/* Message bubble */}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>
        </View>

        {/* Suggestions */}
        {!isUser && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <Animated.View entering={FadeInUp.duration(200)} style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Quick replies:</Text>
            <View style={styles.suggestionsRow}>
              {message.metadata.suggestions.slice(0, 2).map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  text={suggestion}
                  onPress={() => onSuggestionPress?.(suggestion)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Actions */}
        {!isUser && message.metadata?.actions && message.metadata.actions.length > 0 && (
          <Animated.View entering={FadeInUp.duration(200)} style={styles.actionsContainer}>
            {message.metadata.actions.map((action, index) => (
              <ActionButton
                key={index}
                action={action}
                onPress={() => onActionPress?.(action)}
              />
            ))}
          </Animated.View>
        )}
      </View>

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );
};

// ==========================================
// Typing Indicator Component
// ==========================================

const TypingIndicator: React.FC<{ agentColor: string }> = ({ agentColor }) => (
  <View style={styles.typingContainer}>
    <View style={[styles.avatar, { backgroundColor: agentColor + '30' }]}>
      <Text style={styles.avatarText}>AI</Text>
    </View>
    <View style={styles.typingBubble}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, { backgroundColor: COLORS.textMuted }]} />
        <View style={[styles.typingDot, { backgroundColor: COLORS.textMuted }]} />
        <View style={[styles.typingDot, { backgroundColor: COLORS.textMuted }]} />
      </View>
    </View>
  </View>
);

// ==========================================
// Main Chat Screen
// ==========================================

export default function AIChatScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const {
    agents,
    messages,
    isTyping,
    sendMessage,
    clearChat,
    selectAgent,
    loadConversations,
  } = useAIAgents();

  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Get current agent
  const agent = agents.find(a => a.id === agentId);

  // Initialize agent
  useEffect(() => {
    if (agentId) {
      selectAgent(agentId as AgentId);
      loadConversations();
    }
  }, [agentId, selectAgent, loadConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Handle send message
  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    sendMessage(inputText.trim());
    setInputText('');
    setShowSuggestions(false);

    // Hide keyboard
    inputRef.current?.blur();
  }, [inputText, sendMessage]);

  // Handle suggestion press
  const handleSuggestionPress = useCallback((suggestion: string) => {
    sendMessage(suggestion);
    setShowSuggestions(false);
  }, [sendMessage]);

  // Handle action press
  const handleActionPress = useCallback((action: AgentAction) => {
    switch (action.type) {
      case 'navigate':
        // Navigate to screen
        if (action.data.screen) {
          router.push(`/${action.data.screen}`);
        }
        break;
      case 'open_url':
        // Open URL (would need expo-linking)
        Alert.alert('Opening', action.data.url || 'URL');
        break;
      case 'show_benefit':
        // Navigate to benefits
        router.push('/benefits');
        break;
      case 'calculate':
        // Navigate to relevant calculator
        router.push('/wealth');
        break;
      case 'book':
        // Navigate to booking
        router.push('/work/leave');
        break;
      default:
        Alert.alert('Action', action.label);
    }
  }, [router]);

  // Handle back press
  const handleBack = () => {
    router.back();
  };

  // Handle clear chat
  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChat },
      ]
    );
  };

  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading agent...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: agent.color + '20' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: agent.color + '30' }]}>
            <Text style={styles.headerIconText}>{agent.icon}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{agent.name}</Text>
            <Text style={styles.headerSubtitle}>
              {agent.status === 'online' ? 'Online' : 'Busy'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={handleClearChat}>
          <Ionicons name="trash-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              agentColor={agent.color}
              onSuggestionPress={handleSuggestionPress}
              onActionPress={handleActionPress}
            />
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Typing indicator */}
        {isTyping && (
          <TypingIndicator agentColor={agent.color} />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {showSuggestions && messages.length <= 1 && !isTyping && (
            <View style={styles.quickSuggestions}>
              {agent.suggestions.slice(0, 3).map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  text={suggestion}
                  onPress={() => handleSuggestionPress(suggestion)}
                />
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? COLORS.text : COLORS.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIconText: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  menuButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.assistantBubble,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 8,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: COLORS.assistantBubble,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  inputContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.cardLight,
  },
});
