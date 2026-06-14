// ==========================================
// MyTalent - AI Copilot Screen
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card } from '../../src/components';
import { sendChatMessage } from '../../src/services/aiCopilotService';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; }

export default function AICopilotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I'm your MyTalent AI assistant. I can help you with HR queries, benefits, payroll, career guidance, and more. How can I assist you today?", timestamp: new Date().toISOString() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = ['My benefits info', 'Leave balance', 'Payroll query', 'Career advice'];

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    const result = await sendChatMessage('EMP001', inputText);
    if (result.success) {
      const asstMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.message || 'I can help you with that.', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, asstMsg]);
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            {msg.role === 'assistant' && <Text style={styles.assistantLabel}>🤖 AI Copilot</Text>}
            <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
          </View>
        ))}
        {isLoading && <View style={[styles.bubble, styles.assistantBubble]}><Text>Typing...</Text></View>}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Quick Questions</Text>
            <View style={styles.suggestionsList}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => setInputText(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.textInput} placeholder="Ask me anything..." placeholderTextColor={Colors.textMuted} value={inputText} onChangeText={setInputText} multiline />
          <TouchableOpacity style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!inputText.trim()}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  messagesList: { flex: 1 },
  messagesContent: { padding: Spacing.md },
  bubble: { maxWidth: '85%', marginBottom: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: Colors.card },
  assistantLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary, marginBottom: Spacing.xs },
  messageText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  userText: { color: Colors.textInverse },
  suggestions: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  suggestionsTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  suggestionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestionChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  suggestionText: { fontSize: FontSize.sm, color: Colors.textInverse, fontWeight: FontWeight.semibold },
  inputContainer: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.borderLight, padding: Spacing.md },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: Colors.backgroundDark, borderRadius: BorderRadius.lg, padding: Spacing.sm },
  textInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, maxHeight: 100, paddingVertical: Spacing.sm },
  sendBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, marginLeft: Spacing.sm },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { color: Colors.textInverse, fontWeight: FontWeight.semibold },
});
