/**
 * TalentAI - Home Screen
 * Dashboard with career insights and quick actions
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, Chip, FAB, useTheme } from 'react-native-paper';

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();

  const quickActions = [
    { icon: '📄', title: 'Resume', subtitle: 'AI Builder', color: '#6366f1' },
    { icon: '🎯', title: 'Interview', subtitle: 'AI Prep', color: '#8b5cf6' },
    { icon: '💼', title: 'Jobs', subtitle: 'Matched', color: '#ec4899' },
    { icon: '📚', title: 'Courses', subtitle: 'Learning', color: '#10b981' },
  ];

  const insights = [
    { title: 'Your Match Score', value: '87%', subtitle: 'For Senior PM roles' },
    { title: 'Skills Gap', value: '3', subtitle: 'Need to learn' },
    { title: 'Market Value', value: '+12%', subtitle: 'This quarter' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.greeting}>Good morning!</Text>
            <Text variant="headlineSmall" style={styles.userName}>Sarah Johnson</Text>
          </View>
          <Avatar.Text size={48} label="SJ" style={{ backgroundColor: theme.colors.primary }} />
        </View>

        {/* AI Insights Cards */}
        <View style={styles.insightsContainer}>
          {insights.map((item, index) => (
            <Card key={index} style={styles.insightCard}>
              <Card.Content>
                <Text variant="labelSmall" style={styles.insightLabel}>{item.title}</Text>
                <Text variant="headlineMedium" style={[styles.insightValue, { color: theme.colors.primary }]}>
                  {item.value}
                </Text>
                <Text variant="bodySmall" style={styles.insightSubtitle}>{item.subtitle}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: action.color }]}
              onPress={() => navigation.navigate(action.title)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Jobs */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Recommended for You</Text>
        <Card style={styles.jobCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <View>
                <Text variant="titleMedium">Senior Product Manager</Text>
                <Text variant="bodySmall" style={styles.company}>Google</Text>
              </View>
              <Chip mode="outlined" style={{ backgroundColor: '#dcfce7' }}>92% Match</Chip>
            </View>
            <View style={styles.jobDetails}>
              <Text variant="bodySmall">💼 Full-time • 📍 Remote • 💰 ₹35-50 LPA</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.jobCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <View>
                <Text variant="titleMedium">Product Lead</Text>
                <Text variant="bodySmall" style={styles.company}>Amazon</Text>
              </View>
              <Chip mode="outlined" style={{ backgroundColor: '#dbeafe' }}>88% Match</Chip>
            </View>
            <View style={styles.jobDetails}>
              <Text variant="bodySmall">💼 Full-time • 📍 Bangalore • 💰 ₹45-60 LPA</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* AI Chat FAB */}
      <FAB
        icon="chat"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Chat')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    color: '#64748b',
  },
  userName: {
    fontWeight: 'bold',
  },
  insightsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  insightLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
  },
  insightValue: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  insightSubtitle: {
    color: '#64748b',
    fontSize: 11,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  jobCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  company: {
    color: '#64748b',
    marginTop: 4,
  },
  jobDetails: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});