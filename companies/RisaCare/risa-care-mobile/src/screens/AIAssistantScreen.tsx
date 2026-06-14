// RisaCare Mobile - AI Assistant Screen

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';

const quickQuestions = [
  'Explain my CBC report',
  'What do my cholesterol levels mean?',
  'Track my Vitamin D trend',
  'Find a cardiologist',
  'Symptom check'
];

export default function AIAssistantScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Health Assistant</Text>
          <Text style={styles.subtitle}>
            Get personalized insights about your health reports, symptoms, and more.
          </Text>
        </View>

        <View style={styles.assistantCard}>
          <Text style={styles.assistantIcon}>🤖</Text>
          <Text style={styles.assistantGreeting}>
            Hi! I'm your RisaCare AI assistant. I can help you:
          </Text>
          <View style={styles.capabilityList}>
            <Text style={styles.capability}>• Understand your health reports</Text>
            <Text style={styles.capability}>• Track biomarker trends over time</Text>
            <Text style={styles.capability}>• Assess symptoms (not a diagnosis)</Text>
            <Text style={styles.capability}>• Find the right doctor for you</Text>
          </View>
          <Text style={styles.disclaimer}>
            Remember: I'm not a doctor. Always consult healthcare professionals for medical advice.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {quickQuestions.map((question, index) => (
          <TouchableOpacity key={index} style={styles.questionCard}>
            <Text style={styles.questionText}>{question}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.chatInput}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about your health..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
  assistantCard: {
    backgroundColor: '#5856D620',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center'
  },
  assistantIcon: { fontSize: 48, marginBottom: 12 },
  assistantGreeting: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 16 },
  capabilityList: { alignSelf: 'stretch' },
  capability: { fontSize: 14, color: '#555', marginVertical: 4 },
  disclaimer: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 12 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  questionText: { fontSize: 15, color: '#007AFF' },
  chatInput: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  sendButton: { backgroundColor: '#007AFF', borderRadius: 22, paddingHorizontal: 20, justifyContent: 'center' },
  sendButtonText: { color: '#fff', fontWeight: '600' }
});
