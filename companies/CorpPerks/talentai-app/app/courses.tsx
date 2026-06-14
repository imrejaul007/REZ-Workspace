/**
 * TalentAI - Courses Screen
 */

import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Chip, ProgressBar, Button } from 'react-native-paper';

const COURSES = [
  { id: 1, title: 'Product Strategy Masterclass', provider: 'Coursera', progress: 0.65, duration: '12 hours' },
  { id: 2, title: 'Data Analytics for PMs', provider: 'Udemy', progress: 0.30, duration: '8 hours' },
  { id: 3, title: 'Leadership Essentials', provider: 'LinkedIn', progress: 0, duration: '6 hours' },
];

export default function CoursesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={COURSES}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.title}</Text>
              <Text variant="bodySmall" style={styles.provider}>{item.provider}</Text>
              <Text variant="bodySmall" style={styles.duration}>⏱️ {item.duration}</Text>
              {item.progress > 0 && (
                <ProgressBar progress={item.progress} color="#6366f1" style={styles.progress} />
              )}
              <Button mode={item.progress > 0 ? 'outlined' : 'contained'} style={styles.btn}>
                {item.progress > 0 ? 'Continue' : 'Start'}
              </Button>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: { margin: 16, backgroundColor: '#fff' },
  provider: { color: '#6366f1', marginTop: 4 },
  duration: { color: '#64748b', marginTop: 4 },
  progress: { marginVertical: 12, borderRadius: 4 },
  btn: { marginTop: 12, borderColor: '#6366f1' },
});