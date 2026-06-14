/**
 * TalentAI - AI Insights Screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AIInsightsScreen() {
  const insights = [
    { title: 'Market Trend', desc: 'Product roles increased 23% this quarter', icon: '📈' },
    { title: 'Skill Demand', desc: 'Data Analysis is trending +45%', icon: '🔥' },
    { title: 'Salary Insight', desc: 'Your expected salary: ₹35-50 LPA', icon: '💰' },
    { title: 'Next Step', desc: 'Add AWS certification to boost profile', icon: '🎯' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>🔮 AI Insights</Text>
      {insights.map((insight, i) => (
        <Card key={i} style={styles.card}>
          <Card.Content>
            <Text style={styles.icon}>{insight.icon}</Text>
            <Text variant="titleMedium">{insight.title}</Text>
            <Text variant="bodyMedium" style={styles.desc}>{insight.desc}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { padding: 16, fontWeight: 'bold' },
  card: { margin: 16, marginTop: 0, backgroundColor: '#fff' },
  icon: { fontSize: 32, marginBottom: 8 },
  desc: { color: '#64748b', marginTop: 4 },
});