/**
 * InsightCampus - Schedule Screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, List, Divider } from 'react-native-paper';

const SCHEDULE = [
  { time: '09:00 AM', subject: 'Data Structures', room: 'Room 301', type: 'Lecture' },
  { time: '11:00 AM', subject: 'Database Lab', room: 'Lab 2', type: 'Practical' },
  { time: '02:00 PM', subject: 'Mathematics', room: 'Room 205', type: 'Lecture' },
  { time: '04:00 PM', subject: 'Web Dev Workshop', room: 'Lab 1', type: 'Workshop' },
];

export default function ScheduleScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.dateTitle}>Today - Monday</Text>
      {SCHEDULE.map((item, i) => (
        <Card key={i} style={styles.card}>
          <Card.Content>
            <View style={styles.timeColumn}>
              <Text variant="titleMedium" style={styles.time}>{item.time}</Text>
            </View>
            <View style={styles.detailsColumn}>
              <Text variant="titleMedium">{item.subject}</Text>
              <Text variant="bodySmall" style={styles.meta}>📍 {item.room} • {item.type}</Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  dateTitle: { padding: 16, fontWeight: '600' },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff' },
  cardContent: { flexDirection: 'row' },
  timeColumn: { marginRight: 16, alignItems: 'center' },
  time: { color: '#10b981', fontWeight: 'bold' },
  detailsColumn: { flex: 1 },
  meta: { color: '#64748b', marginTop: 4 },
});