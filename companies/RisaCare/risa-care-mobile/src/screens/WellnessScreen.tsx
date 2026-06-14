// RisaCare Mobile - Wellness Screen

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

export default function WellnessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Wellness</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Overall Wellness</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>78</Text>
            <Text style={styles.scoreText}>Good</Text>
          </View>
        </View>

        <View style={styles.habitsGrid}>
          <View style={styles.habitCard}>
            <Text style={styles.habitIcon}>💧</Text>
            <Text style={styles.habitValue}>6/8</Text>
            <Text style={styles.habitLabel}>Glasses Water</Text>
          </View>
          <View style={styles.habitCard}>
            <Text style={styles.habitIcon}>😴</Text>
            <Text style={styles.habitValue}>7.5h</Text>
            <Text style={styles.habitLabel}>Sleep</Text>
          </View>
          <View style={styles.habitCard}>
            <Text style={styles.habitIcon}>🚶</Text>
            <Text style={styles.habitValue}>8.2k</Text>
            <Text style={styles.habitLabel}>Steps</Text>
          </View>
          <View style={styles.habitCard}>
            <Text style={styles.habitIcon}>🧘</Text>
            <Text style={styles.habitValue}>15m</Text>
            <Text style={styles.habitLabel}>Meditation</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active Challenges</Text>
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>🚰</Text>
            <View>
              <Text style={styles.challengeName}>7-Day Hydration</Text>
              <Text style={styles.challengeProgress}>Day 4 of 7</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '57%' }]} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  scoreCard: { backgroundColor: '#34C759', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  scoreLabel: { color: '#fff', fontSize: 16, marginBottom: 12 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2DB84D', alignItems: 'center', justifyContent: 'center' },
  scoreValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  scoreText: { color: '#90EE90', fontSize: 14 },
  habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  habitCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  habitIcon: { fontSize: 32, marginBottom: 8 },
  habitValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  habitLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 12 },
  challengeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  challengeIcon: { fontSize: 32, marginRight: 12 },
  challengeName: { fontSize: 16, fontWeight: '600', color: '#333' },
  challengeProgress: { fontSize: 12, color: '#666', marginTop: 2 },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 }
});
