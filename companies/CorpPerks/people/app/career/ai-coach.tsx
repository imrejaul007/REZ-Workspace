// ==========================================
// MyTalent - AI Career Coach Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card } from '../../src/components';
import { sendChatMessage } from '../../src/services/aiCopilotService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AICoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Career Coach. I can help you with:\n\n• Career planning and growth\n• Skill development\n• Promotion readiness\n• Interview preparation\n\nWhat would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    'Am I promotion ready?',
    'What skills should I learn?',
    'What roles suit me?',
    'How to grow faster?',
  ];

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage('EMP001', inputText, 'career');

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message || 'I can help you with career guidance.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      logger.error('AI Coach error:', error);
    }

    setIsLoading(false);
  };

  const handleSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.assistantHeader}>
                <Text style={styles.assistantAvatar}>🤖</Text>
                <Text style={styles.assistantLabel}>AI Coach</Text>
              </View>
            )}
            <Text style={[styles.messageText, message.role === 'user' && styles.userText]}>
              {message.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.loadingDots}>
              <Text style={styles.loadingDot}>.</Text>
              <Text style={styles.loadingDot}>.</Text>
              <Text style={styles.loadingDot}>.</Text>
            </View>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick Questions</Text>
            <View style={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about your career..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '85%',
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
    padding: Spacing.md,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  assistantAvatar: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  assistantLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  userText: {
    color: Colors.textInverse,
  },
  loadingDots: {
    flexDirection: 'row',
  },
  loadingDot: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  suggestionsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  suggestionsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});
