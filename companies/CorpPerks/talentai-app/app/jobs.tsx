/**
 * TalentAI - Jobs Screen
 */

import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';

const JOBS = [
  { id: 1, title: 'Senior Product Manager', company: 'Google', salary: '₹45-60 LPA', match: 92 },
  { id: 2, title: 'Product Lead', company: 'Amazon', salary: '₹50-70 LPA', match: 88 },
  { id: 3, title: 'VP of Product', company: 'Flipkart', salary: '₹80-120 LPA', match: 75 },
];

export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={JOBS}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium">{item.title}</Text>
                <Chip style={{ backgroundColor: '#dcfce7' }}>{item.match}%</Chip>
              </View>
              <Text variant="bodyMedium" style={styles.company}>{item.company}</Text>
              <Text variant="bodySmall" style={styles.salary}>{item.salary}</Text>
              <Button mode="contained" style={styles.applyBtn}>Apply Now</Button>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  company: { color: '#64748b', marginTop: 4 },
  salary: { color: '#10b981', marginTop: 8 },
  applyBtn: { marginTop: 12, backgroundColor: '#6366f1' },
});