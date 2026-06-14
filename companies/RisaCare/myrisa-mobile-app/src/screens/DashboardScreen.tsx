import { logger } from '../../shared/logger';
/**
 * MyRisa Dashboard Screen
 * Full dashboard with all domain scores and comprehensive health overview
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, ProgressBar, Chip } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

// Domain colors
const COLORS = {
  primary: '#E57373',
  secondary: '#BA68C8',
  mental: '#7986CB',
  sleep: '#5C6BC0',
  lifestyle: '#4DB6AC',
  worklife: '#FFB74D',
  relationships: '#EF5350',
  overall: '#9575CD',
};

interface DomainScore {
  domain: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  label: string;
  icon: string;
}

export default function DashboardScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
        loadDashboard(stored);
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
        loadDashboard(newId);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadDashboard = async (uid: string) => {
    try {
      const data = await apiService.getDashboard(uid);
      setDashboard(data);
    } catch (error) {
      logger.error('Error loading dashboard:', error);
      setDashboard(getMockDashboard());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await loadDashboard(userId);
    }
    setRefreshing(false);
  };

  const getMockDashboard = () => ({
    overallScore: 78,
    greeting: 'Good morning!',
    todayFocus: 'Track your wellbeing today.',
    overallTrend: 'up',
    weeklyChange: 3,
    domainScores: [
      { domain: 'mental', score: 82, trend: 'up', label: 'Mental Wellness', icon: '🧠' },
      { domain: 'womens', score: 75, trend: 'stable', label: "Women's Health", icon: '🌸' },
      { domain: 'sleep', score: 68, trend: 'down', label: 'Sleep Quality', icon: '😴' },
      { domain: 'work', score: 80, trend: 'up', label: 'Work-Life Balance', icon: '⚡' },
      { domain: 'lifestyle', score: 72, trend: 'stable', label: 'Lifestyle', icon: '🌿' },
      { domain: 'relationships', score: 85, trend: 'up', label: 'Relationships', icon: '❤️' },
    ],
    quickActions: [
      { id: '1', label: 'Log Mood', icon: '😊', color: COLORS.mental, screen: 'Mind' },
      { id: '2', label: 'Track Sleep', icon: '😴', color: COLORS.sleep, screen: 'Sleep' },
      { id: '3', label: "Women's Health", icon: '🌸', color: COLORS.primary, screen: 'Health' },
      { id: '4', label: 'Work Check-in', icon: '⚡', color: COLORS.worklife, screen: 'Life' },
      { id: '5', label: 'Lifestyle', icon: '🌿', color: COLORS.lifestyle, screen: 'Lifestyle' },
      { id: '6', label: 'Relationships', icon: '❤️', color: COLORS.relationships, screen: 'Relationships' },
    ],
    insights: [
      { id: '1', type: 'success', title: 'Your mental wellness score improved by 5 points this week!' },
      { id: '2', type: 'warning', title: 'Sleep quality has decreased. Consider a bedtime routine.' },
      { id: '3', type: 'info', title: 'You have a doctor consultation in 3 days.' },
    ],
    upcomingConsultations: [
      { id: '1', provider: 'Dr. Priya Sharma', type: 'Gynecologist', date: '2026-06-14', time: '10:00 AM' },
    ],
    recentActivity: [
      { id: '1', type: 'mood', label: 'Mood logged', time: '2 hours ago', value: 'Happy' },
      { id: '2', type: 'sleep', label: 'Sleep logged', time: '8 hours ago', value: '7.5 hours' },
      { id: '3', type: 'period', label: 'Period tracked', time: 'Yesterday', value: 'Day 2' },
    ],
  });

  const navigateToScreen = (screen: string) => {
    navigation.navigate(screen);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{dashboard?.greeting || 'Welcome!'}</Text>
        <Text style={styles.subtitle}>Your Complete Health Dashboard</Text>
      </View>

      {/* Overall Score Card */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{dashboard?.overallScore || 75}</Text>
              <Text style={styles.scoreLabel}>Overall</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.focusText}>{dashboard?.todayFocus}</Text>
              <View style={styles.trendContainer}>
                <Chip
                  icon={dashboard?.overallTrend === 'up' ? 'trending-up' : dashboard?.overallTrend === 'down' ? 'trending-down' : 'trending-neutral'}
                  style={[
                    styles.trendChip,
                    { backgroundColor: dashboard?.overallTrend === 'up' ? '#E8F5E9' : dashboard?.overallTrend === 'down' ? '#FFEBEE' : '#E3F2FD' }
                  ]}
                  textStyle={styles.trendChipText}
                >
                  {dashboard?.overallTrend === 'up' ? '+' : ''}{dashboard?.weeklyChange || 0} this week
                </Chip>
              </View>
              <TouchableOpacity
                style={styles.twinButton}
                onPress={() => navigation.navigate('Twin')}
              >
                <Text style={styles.twinButtonText}>View Your Twin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {dashboard?.quickActions?.map((action: any) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, { backgroundColor: action.color + '20' }]}
            onPress={() => navigateToScreen(action.screen)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All Domain Scores */}
      <Text style={styles.sectionTitle}>Health Domains</Text>
      {dashboard?.domainScores?.map((domain: any, index: number) => (
        <Card
          key={index}
          style={styles.domainCard}
          onPress={() => {
            if (domain.domain === 'mental') navigation.navigate('Mind');
            else if (domain.domain === 'womens') navigation.navigate('Health');
            else if (domain.domain === 'sleep') navigation.navigate('Sleep');
            else if (domain.domain === 'work') navigation.navigate('Life');
            else if (domain.domain === 'lifestyle') navigation.navigate('Lifestyle');
            else if (domain.domain === 'relationships') navigation.navigate('Relationships');
          }}
        >
          <Card.Content>
            <View style={styles.domainHeader}>
              <View style={styles.domainInfo}>
                <Text style={styles.domainIcon}>{domain.icon}</Text>
                <Text style={styles.domainLabel}>{domain.label}</Text>
              </View>
              <View style={styles.domainScore}>
                <Text style={styles.domainScoreNumber}>{domain.score}</Text>
                <Text style={[
                  styles.domainTrend,
                  { color: domain.trend === 'up' ? '#4CAF50' : domain.trend === 'down' ? '#F44336' : '#666' }
                ]}>
                  {domain.trend === 'up' ? '↑' : domain.trend === 'down' ? '↓' : '→'}
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={domain.score / 100}
              color={COLORS[domain.domain as keyof typeof COLORS] || COLORS.overall}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      ))}

      {/* Insights */}
      <Text style={styles.sectionTitle}>Health Insights</Text>
      {dashboard?.insights?.map((insight: any) => (
        <Card
          key={insight.id}
          style={[
            styles.insightCard,
            {
              backgroundColor: insight.type === 'success' ? '#E8F5E9' :
                              insight.type === 'warning' ? '#FFF3E0' : '#E3F2FD'
            }
          ]}
        >
          <Card.Content>
            <Text style={[
              styles.insightTitle,
              {
                color: insight.type === 'success' ? '#2E7D32' :
                       insight.type === 'warning' ? '#E65100' : '#1976D2'
              }
            ]}>
              {insight.title}
            </Text>
          </Card.Content>
        </Card>
      ))}

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Card style={styles.activityCard}>
        <Card.Content>
          {dashboard?.recentActivity?.map((activity: any, index: number) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{activity.label}</Text>
                <Text style={styles.activityValue}>{activity.value}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Consultation Button */}
      <TouchableOpacity
        style={styles.consultButton}
        onPress={() => navigation.navigate('Consultation')}
      >
        <Text style={styles.consultButtonText}>📅 Prepare for Doctor Visit</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.overall,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scoreCard: {
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    elevation: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.overall,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#fff',
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 16,
  },
  focusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  trendContainer: {
    marginBottom: 8,
  },
  trendChip: {
    alignSelf: 'flex-start',
    height: 28,
  },
  trendChipText: {
    fontSize: 12,
  },
  twinButton: {
    backgroundColor: COLORS.overall,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  twinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  actionButton: {
    width: '30%',
    margin: '1.5%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  domainCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  domainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  domainScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainScoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  domainTrend: {
    fontSize: 16,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  insightCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.overall,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activityValue: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  consultButton: {
    margin: 16,
    backgroundColor: COLORS.lifestyle,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  consultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});
