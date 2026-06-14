import { logger } from '../../shared/logger';
/**
 * MyRisa Home Screen
 * Dashboard with quick actions and today's focus
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

// Domain colors
const COLORS = {
  primary: '#E57373', // Women's Health
  secondary: '#BA68C8', // Sexual Wellness
  mental: '#7986CB', // Mental Health
  sleep: '#5C6BC0', // Sleep
  lifestyle: '#4DB6AC', // Lifestyle
  worklife: '#FFB74D', // Work-Life
  relationships: '#EF5350', // Relationships
};

export default function HomeScreen({ navigation }: any) {
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
      // Use mock data if API not available
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
    domainScores: [
      { domain: 'mental', score: 75, trend: 'stable', label: 'Mental Wellness' },
      { domain: 'work', score: 80, trend: 'stable', label: 'Work-Life' },
      { domain: 'sleep', score: 70, trend: 'stable', label: 'Sleep' },
      { domain: 'relationships', score: 75, trend: 'stable', label: 'Relationships' },
    ],
    quickActions: [
      { id: '1', label: 'Log Mood', icon: '😊', color: '#FFB74D' },
      { id: '2', label: 'Track Sleep', icon: '😴', color: '#7986CB' },
      { id: '3', label: 'Log Period', icon: '🌸', color: '#E57373' },
      { id: '4', label: 'Work Check-in', icon: '⚡', color: '#4DB6AC' },
    ],
    insights: [
      { id: '1', type: 'info', title: 'Your sleep quality has been good this week!' },
      { id: '2', type: 'info', title: 'Remember to take breaks during work' },
    ],
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.subtitle}>Your Health. Understood.</Text>
      </View>

      {/* Overall Score Card */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{dashboard?.overallScore || 75}</Text>
              <Text style={styles.scoreLabel}>Overall Score</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.focusText}>{dashboard?.todayFocus}</Text>
              <TouchableOpacity
                style={styles.twinButton}
                onPress={() => navigation.navigate('Twin')}
              >
                <Text style={styles.twinButtonText}>View Your Twin →</Text>
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
            onPress={() => {
              if (action.label.includes('Mood')) {
                navigation.navigate('Mind');
              } else if (action.label.includes('Sleep')) {
                navigation.navigate('Sleep');
              } else if (action.label.includes('Period')) {
                navigation.navigate('Health');
              } else if (action.label.includes('Work')) {
                navigation.navigate('Life');
              }
            }}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Domain Scores */}
      <Text style={styles.sectionTitle}>Your Wellbeing</Text>
      {dashboard?.domainScores?.map((domain: any, index: number) => (
        <Card key={index} style={styles.domainCard}>
          <Card.Content>
            <View style={styles.domainHeader}>
              <Text style={styles.domainLabel}>{domain.label}</Text>
              <View style={styles.domainScore}>
                <Text style={styles.domainScoreNumber}>{domain.score}</Text>
                <Text style={styles.domainTrend}>
                  {domain.trend === 'up' ? '↑' : domain.trend === 'down' ? '↓' : '→'}
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={domain.score / 100}
              color={COLORS[domain.domain as keyof typeof COLORS] || COLORS.mental}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      ))}

      {/* Insights */}
      <Text style={styles.sectionTitle}>Insights</Text>
      {dashboard?.insights?.map((insight: any) => (
        <Card key={insight.id} style={styles.insightCard}>
          <Card.Content>
            <Text style={styles.insightTitle}>{insight.title}</Text>
          </Card.Content>
        </Card>
      ))}

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
    backgroundColor: '#E57373',
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
    backgroundColor: '#E57373',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 10,
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
  twinButton: {
    backgroundColor: '#E57373',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    width: '45%',
    margin: '2.5%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
    color: '#666',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  insightCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  insightTitle: {
    fontSize: 14,
    color: '#1976D2',
  },
  consultButton: {
    margin: 16,
    backgroundColor: '#4DB6AC',
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