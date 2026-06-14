/**
 * TalentAI - AI Resume Builder
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, FAB, List, Divider, ProgressBar } from 'react-native-paper';

export default function ResumeScreen() {
  const sections = [
    { title: 'Personal Info', score: 95, color: '#22c55e' },
    { title: 'Work Experience', score: 80, color: '#6366f1' },
    { title: 'Skills', score: 90, color: '#8b5cf6' },
    { title: 'Education', score: 85, color: '#ec4899' },
    { title: 'Certifications', score: 70, color: '#f59e0b' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* AI Score */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreHeader}>
              <Text variant="labelLarge">Overall Resume Score</Text>
              <Text variant="displaySmall" style={styles.scoreValue}>87%</Text>
            </View>
            <ProgressBar progress={0.87} color="#6366f1" style={styles.progressBar} />
            <Text variant="bodySmall" style={styles.scoreHint}>
              Your resume is ATS-optimized. Consider adding more quantifiable achievements.
            </Text>
          </Card.Content>
        </Card>

        {/* Sections */}
        {sections.map((section, index) => (
          <Card key={index} style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium">{section.title}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: section.color }]}>
                  <Text style={styles.scoreBadgeText}>{section.score}%</Text>
                </View>
              </View>
              <ProgressBar progress={section.score / 100} color={section.color} style={styles.sectionProgress} />
            </Card.Content>
          </Card>
        ))}

        {/* AI Suggestions */}
        <Card style={styles.suggestionsCard}>
          <Card.Title title="🔮 AI Suggestions" />
          <Card.Content>
            <List.Item
              title="Add metrics to achievements"
              description="Quantify results with numbers"
              left={(props) => <List.Icon {...props} icon="chart-line" />}
            />
            <Divider />
            <List.Item
              title="Include keywords"
              description="Add 'Agile', 'Scrum', 'Product Strategy'"
              left={(props) => <List.Icon {...props} icon="tag" />}
            />
            <Divider />
            <List.Item
              title="Update certifications"
              description="Add AWS or Google certificates"
              left={(props) => <List.Icon {...props} icon="certificate" />}
            />
          </Card.Content>
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="auto-fix" label="AI Optimize" style={styles.fab} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scoreCard: {
    margin: 16,
    backgroundColor: '#6366f1',
  },
  scoreHeader: {
    alignItems: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressBar: {
    marginVertical: 16,
    borderRadius: 4,
  },
  scoreHint: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionProgress: {
    marginTop: 12,
    borderRadius: 4,
  },
  suggestionsCard: {
    margin: 16,
    backgroundColor: '#fff',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6366f1',
  },
});