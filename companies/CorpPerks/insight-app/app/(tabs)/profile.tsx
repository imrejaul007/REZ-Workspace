/**
 * InsightCampus - Profile Screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Avatar, Card, Text, List, Divider, Button } from 'react-native-paper';

export default function ProfileScreen() {
  const stats = [
    { label: 'Attendance', value: '92%' },
    { label: 'CGPA', value: '8.5' },
    { label: 'Credits', value: '156' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Image size={100} source={{ uri: 'https://i.pravatar.cc/200' }} />
        <Text variant="headlineSmall" style={styles.name}>Alex Student</Text>
        <Text variant="bodyMedium" style={styles.course}>B.Tech Computer Science</Text>
        <Text variant="bodySmall" style={styles.rollNo}>Roll No: 2021CS101</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statValue}>{stat.value}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Info */}
      <Card style={styles.card}>
        <Card.Content>
          <List.Item title="Email" description="alex@university.edu" left={(props) => <List.Icon {...props} icon="email" />} />
          <Divider />
          <List.Item title="Phone" description="+91 98765 43210" left={(props) => <List.Icon {...props} icon="phone" />} />
          <Divider />
          <List.Item title="Semester" description="6th Semester" left={(props) => <List.Icon {...props} icon="school" />} />
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <List.Item title="Results" left={(props) => <List.Icon {...props} icon="chart-bar" />} right={(props) => <List.Icon {...props} icon="chevron-right" />} />
          <Divider />
          <List.Item title="Assignments" left={(props) => <List.Icon {...props} icon="file-document" />} right={(props) => <List.Icon {...props} icon="chevron-right" />} />
          <Divider />
          <List.Item title="Settings" left={(props) => <List.Icon {...props} icon="cog" />} right={(props) => <List.Icon {...props} icon="chevron-right" />} />
        </Card.Content>
      </Card>

      <Button mode="outlined" style={styles.logoutBtn} textColor="#ef4444">Logout</Button>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#10b981' },
  name: { color: '#fff', fontWeight: 'bold', marginTop: 12 },
  course: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  rollNo: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  statValue: { color: '#10b981', fontWeight: 'bold' },
  statLabel: { color: '#64748b', marginTop: 4 },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#fff' },
  logoutBtn: { margin: 16, borderColor: '#ef4444' },
});