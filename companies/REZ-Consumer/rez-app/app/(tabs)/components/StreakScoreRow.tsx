import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakScoreRowProps {
  streakDays?: number;
  score?: number;
}

export default function StreakScoreRow({ streakDays = 0, score = 0 }: StreakScoreRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.streak}>
        <Text style={styles.label}>Streak</Text>
        <Text style={styles.value}>{streakDays} days</Text>
      </View>
      <View style={styles.score}>
        <Text style={styles.label}>Score</Text>
        <Text style={styles.value}>{score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  streak: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  score: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
});
