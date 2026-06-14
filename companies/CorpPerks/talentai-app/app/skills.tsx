/**
 * TalentAI - Skills Screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, ProgressBar } from 'react-native-paper';

const SKILLS = [
  { name: 'Product Strategy', level: 90, category: 'Core' },
  { name: 'Agile/Scrum', level: 85, category: 'Core' },
  { name: 'Data Analysis', level: 75, category: 'Technical' },
  { name: 'User Research', level: 80, category: 'Design' },
  { name: 'Communication', level: 95, category: 'Soft' },
];

export default function SkillsScreen() {
  return (
    <ScrollView style={styles.container}>
      {SKILLS.map((skill, i) => (
        <Card key={i} style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="titleMedium">{skill.name}</Text>
              <Chip style={{ backgroundColor: '#ede9fe' }} compact>{skill.category}</Chip>
            </View>
            <ProgressBar progress={skill.level / 100} color="#6366f1" style={styles.progress} />
            <Text variant="bodySmall" style={styles.level}>{skill.level}%</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: { margin: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { marginVertical: 12, borderRadius: 4 },
  level: { color: '#6366f1', fontWeight: 'bold', marginTop: 4 },
});