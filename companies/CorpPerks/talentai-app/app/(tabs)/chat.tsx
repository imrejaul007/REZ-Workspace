/**
 * TalentAI - Chat Screen
 * AI-powered career assistant
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton, Surface } from 'react-native-paper';

const SUGGESTIONS = [
  'Help me improve my resume',
  'What skills do I need for PM roles?',
  'Prepare me for my interview',
  'What courses should I take?',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '👋 Hi! I\'m your AI career assistant. How can I help you today?',
      isBot: true,
      time: '10:30 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: 'Based on your profile, I recommend focusing on data analysis and leadership skills. Would you like me to suggest some courses?',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>AI Career Assistant</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>Powered by HOJAI AI</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.isBot ? styles.botBubble : styles.userBubble,
            ]}
          >
            <Text style={msg.isBot ? styles.botText : styles.userText}>{msg.text}</Text>
            <Text style={styles.time}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Suggestions */}
      {messages.length === 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((suggestion, index) => (
            <Surface
              key={index}
              style={styles.suggestionChip}
              onTouchEnd={() => setInputText(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Surface>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Ask me anything about your career..."
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={sendMessage}
              disabled={!inputText.trim()}
            />
          }
          onSubmitEditing={sendMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#6366f1',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botText: {
    color: '#1e293b',
  },
  userText: {
    color: '#fff',
  },
  time: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
  },
  suggestionText: {
    color: '#6366f1',
    fontSize: 14,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    backgroundColor: '#f8fafc',
  },
});