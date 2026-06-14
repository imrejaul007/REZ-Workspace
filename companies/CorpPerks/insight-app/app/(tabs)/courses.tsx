/**
 * InsightCampus - Courses Screen
 */

import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Chip, ProgressBar, Button } from 'react-native-paper';

const COURSES = [
  { id: 1, name: 'Data Structures', code: 'CS201', credits: 4, progress: 0.75, grade: 'A' },
  { id: 2, name: 'Database Systems', code: 'CS301', credits: 4, progress: 0.45, grade: 'B+' },
  { id: 3, name: 'Web Development', code: 'CS401', credits: 3, progress: 0.90, grade: 'A+' },
  { id: 4, name: 'Machine Learning', code: 'CS501', credits: 4, progress: 0.30, grade: 'B' },
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
              <View style={styles.header}>
                <View>
                  <Text variant="titleMedium">{item.name}</Text>
                  <Text variant="bodySmall" style={styles.code}>{item.code}</Text>
                </View>
                <Chip style={{ backgroundColor: '#dcfce7' }}>{item.credits} Credits</Chip>
              </View>
              <View style={styles.progressRow}>
                <ProgressBar progress={item.progress} color="#10b981" style={styles.progress} />
                <Text variant="bodySmall" style={styles.progressText}>{Math.round(item.progress * 100)}%</Text>
              </View>
              <View style={styles.footer}>
                <Text variant="bodySmall">Grade: {item.grade}</Text>
                <Button mode="outlined" compact>View</Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  code: { color: '#64748b', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  progress: { flex: 1, borderRadius: 4 },
  progressText: { marginLeft: 8, color: '#10b981', fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});