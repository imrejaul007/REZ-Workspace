// RisaCare Mobile - Home Screen

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  screen: string;
}

const quickActions: QuickAction[] = [
  { id: '1', title: 'Upload Report', icon: '📤', color: '#007AFF', screen: 'Upload' },
  { id: '2', title: 'Find Doctor', icon: '👨‍⚕️', color: '#34C759', screen: 'Doctors' },
  { id: '3', title: 'Book Test', icon: '🧪', color: '#FF9500', screen: 'Tests' },
  { id: '4', title: 'AI Assistant', icon: '🤖', color: '#5856D6', screen: 'AI' },
  { id: '5', title: 'Family', icon: '👨‍👩‍👧', color: '#FF2D55', screen: 'Family' },
  { id: '6', title: 'Wellness', icon: '💪', color: '#00C7BE', screen: 'Wellness' }
];

interface HealthMetric {
  id: string;
  label: string;
  value: string;
  icon: string;
  trend: 'up' | 'down' | 'stable';
}

const healthMetrics: HealthMetric[] = [
  { id: '1', label: 'Health Score', value: '78', icon: '📊', trend: 'up' },
  { id: '2', label: 'Checkups', value: '3', icon: '🏥', trend: 'stable' },
  { id: '3', label: 'Reports', value: '12', icon: '📋', trend: 'up' },
  { id: '4', label: 'Day Streak', value: '7', icon: '🔥', trend: 'up' }
];

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Rahul 👋</Text>
            <Text style={styles.subGreeting}>Your health at a glance</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Health Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Your Health Score</Text>
            <Text style={styles.scoreTrend}>↑ 5% this month</Text>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>78</Text>
            <Text style={styles.scoreLabel}>Good</Text>
          </View>
          <View style={styles.scoreBreakdown}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemValue}>B+</Text>
              <Text style={styles.scoreItemLabel}>Grade</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemValue}>12</Text>
              <Text style={styles.scoreItemLabel}>Reports</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemValue}>7</Text>
              <Text style={styles.scoreItemLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickAction, { backgroundColor: action.color + '15' }]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#34C75920' }]}>
              <Text>📋</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>CBC Report Uploaded</Text>
              <Text style={styles.activitySubtitle}>Apollo Diagnostics • 2 days ago</Text>
            </View>
            <Text style={styles.activityStatus}>✅</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#007AFF20' }]}>
              <Text>👨‍⚕️</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Dr. Priya Consultation</Text>
              <Text style={styles.activitySubtitle}>Tomorrow, 10:00 AM</Text>
            </View>
            <Text style={styles.activityStatus}>📅</Text>
          </View>
        </View>

        {/* Upcoming */}
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <View style={styles.upcomingCard}>
          <View style={styles.upcomingItem}>
            <View style={styles.upcomingDate}>
              <Text style={styles.upcomingDay}>15</Text>
              <Text style={styles.upcomingMonth}>Mar</Text>
            </View>
            <View style={styles.upcomingContent}>
              <Text style={styles.upcomingTitle}>Lipid Profile Test</Text>
              <Text style={styles.upcomingSubtitle}>Home Collection • 9:00 AM</Text>
            </View>
          </View>
        </View>

        {/* AI Insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Your Vitamin D levels have been consistently low across 3 tests.
            Consider discussing supplementation with your doctor.
          </Text>
          <TouchableOpacity style={styles.insightButton}>
            <Text style={styles.insightButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  notificationIcon: {
    fontSize: 20
  },
  scoreCard: {
    backgroundColor: '#007AFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center'
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  scoreTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  scoreTrend: {
    color: '#90D5FF',
    fontSize: 12
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20
  },
  scoreValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold'
  },
  scoreLabel: {
    color: '#90D5FF',
    fontSize: 14
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10
  },
  scoreItem: {
    alignItems: 'center'
  },
  scoreItemValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  scoreItemLabel: {
    color: '#90D5FF',
    fontSize: 12,
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16
  },
  quickAction: {
    width: '30%',
    margin: '1.5%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  activityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityContent: {
    flex: 1,
    marginLeft: 12
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  activityStatus: {
    fontSize: 16
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12
  },
  upcomingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  upcomingDate: {
    width: 50,
    height: 50,
    backgroundColor: '#FF950020',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  upcomingDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9500'
  },
  upcomingMonth: {
    fontSize: 10,
    color: '#FF9500'
  },
  upcomingContent: {
    flex: 1,
    marginLeft: 12
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  upcomingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  insightCard: {
    backgroundColor: '#5856D620',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#5856D6'
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5856D6'
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  insightButton: {
    marginTop: 12,
    alignSelf: 'flex-start'
  },
  insightButtonText: {
    color: '#5856D6',
    fontWeight: '600'
  }
});
