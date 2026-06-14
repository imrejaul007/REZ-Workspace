/**
 * TalentAI - Career Path Screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

export default function CareerPathScreen() {
  const path = [
    { role: 'Product Manager L1', current: true },
    { role: 'Senior PM', current: false },
    { role: 'Product Lead', current: false },
    { role: 'Director of Product', current: false },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>Your Career Path</Text>
      {path.map((step, i) => (
        <Card key={i} style={[styles.card, step.current && styles.currentCard]}>
          <Card.Content>
            <View style={styles.step}>
              <View style={[styles.dot, step.current && styles.currentDot]} />
              <View style={styles.line} />
            </View>
            <View style={styles.content}>
              <Text variant="titleMedium">{step.role}</Text>
              {step.current && <Text variant="bodySmall" style={styles.current}>You are here</Text>}
            </View>
          </Card.Content>
        </Card>
      ))}
      <Button mode="contained" style={styles.btn}>Get AI Roadmap</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { padding: 16, fontWeight: 'bold' },
  card: { margin: 16, marginTop: 0, backgroundColor: '#fff' },
  currentCard: { borderColor: '#6366f1', borderWidth: 2 },
  step: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#e2e8f0', marginRight: 16 },
  currentDot: { backgroundColor: '#6366f1' },
  line: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginLeft: -24 },
  content: { flex: 1 },
  current: { color: '#6366f1', marginTop: 4 },
  btn: { margin: 16, backgroundColor: '#6366f1' },
});