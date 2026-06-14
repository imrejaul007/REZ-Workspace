/**
 * InsightCampus - Home Screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, Chip, FAB } from 'react-native-paper';

export default function HomeScreen({ navigation }: any) {
  const cards = [
    { title: 'Attendance', value: '92%', icon: '✅', color: '#10b981' },
    { title: 'Assignments', value: '8/10', icon: '📝', color: '#3b82f6' },
    { title: 'CGPA', value: '8.5', icon: '🎓', color: '#8b5cf6' },
  ];

  const tasks = [
    { title: 'Math Assignment', due: 'Due Tomorrow', priority: 'High' },
    { title: 'Project Presentation', due: 'Due in 3 days', priority: 'Medium' },
    { title: 'Lab Report', due: 'Due in 5 days', priority: 'Low' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.greeting}>Good morning!</Text>
            <Text variant="headlineSmall" style={styles.userName}>Alex Student</Text>
          </View>
          <Avatar.Text size={48} label="AS" style={{ backgroundColor: theme.colors.primary }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {cards.map((card, i) => (
            <Card key={i} style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statIcon}>{card.icon}</Text>
                <Text variant="headlineMedium" style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                <Text variant="bodySmall">{card.title}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Tasks */}
        <Text variant="titleMedium" style={styles.sectionTitle}>📋 Upcoming Tasks</Text>
        {tasks.map((task, i) => (
          <Card key={i} style={styles.taskCard}>
            <Card.Content>
              <View style={styles.taskHeader}>
                <Text variant="titleMedium">{task.title}</Text>
                <Chip mode="outlined" compact>{task.priority}</Chip>
              </View>
              <Text variant="bodySmall" style={styles.due}>{task.due}</Text>
            </Card.Content>
          </Card>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
      <FAB icon="chat" style={styles.fab} color="#fff" />
    </View>
  );
}

const theme = { colors: { primary: '#10b981' } };
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  greeting: { color: '#64748b' },
  userName: { fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff' },
  statIcon: { fontSize: 24, textAlign: 'center' },
  statValue: { fontWeight: 'bold', textAlign: 'center', marginVertical: 4 },
  sectionTitle: { paddingHorizontal: 16, marginTop: 16, fontWeight: '600' },
  taskCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  due: { color: '#64748b', marginTop: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#10b981' },
});