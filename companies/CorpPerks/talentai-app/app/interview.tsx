/**
 * TalentAI - Interview Prep
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';

export default function InterviewScreen() {
  const questions = [
    { q: 'Tell me about yourself', type: 'Common', difficulty: 'Easy' },
    { q: 'Why do you want to be a PM?', type: 'Motivation', difficulty: 'Medium' },
    { q: 'Design Netflix for seniors', type: 'Product Design', difficulty: 'Hard' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="displaySmall" style={styles.statValue}>23</Text>
            <Text variant="bodySmall">Practice Sessions</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="displaySmall" style={styles.statValue}>156</Text>
            <Text variant="bodySmall">Questions Done</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="displaySmall" style={styles.statValue}>87%</Text>
            <Text variant="bodySmall">Confidence</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Start Practice */}
      <Card style={styles.startCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.startTitle}>🎯 AI Interview Coach</Text>
          <Text variant="bodyMedium" style={styles.startDesc}>
            Practice with AI-powered mock interviews. Get real-time feedback and tips.
          </Text>
          <Button mode="contained" style={styles.startButton}>
            Start Practice Interview
          </Button>
        </Card.Content>
      </Card>

      {/* Question Categories */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Practice Questions</Text>
      {questions.map((q, i) => (
        <Card key={i} style={styles.questionCard}>
          <Card.Content>
            <View style={styles.questionHeader}>
              <Chip mode="outlined" style={styles.typeChip}>{q.type}</Chip>
              <Chip style={[styles.diffChip, {
                backgroundColor: q.difficulty === 'Easy' ? '#dcfce7' : q.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2'
              }]}>
                {q.difficulty}
              </Chip>
            </View>
            <Text variant="titleMedium" style={styles.questionText}>{q.q}</Text>
            <Button mode="outlined" compact style={styles.practiceButton}>
              Practice Answer
            </Button>
          </Card.Content>
        </Card>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  startCard: {
    margin: 16,
    backgroundColor: '#6366f1',
  },
  startTitle: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  startDesc: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  startButton: {
    marginTop: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 8,
    fontWeight: '600',
  },
  questionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  questionHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    borderColor: '#6366f1',
  },
  diffChip: {},
  questionText: {
    marginBottom: 12,
  },
  practiceButton: {
    borderColor: '#6366f1',
  },
});