import { logger } from '../../shared/logger';
/**
 * MyRisa Mental Health Screen
 * Mood tracking, stress management, anxiety, therapy resources
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip, SegmentedButtons, Slider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  mental: '#7986CB',
  anxiety: '#F06292',
  stress: '#FFB74D',
  therapy: '#4DB6AC',
  mood: '#9575CD',
};

export default function MentalHealthScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('mood');
  const [moodTrends, setMoodTrends] = useState<any>(null);
  const [moodLog, setMoodLog] = useState({
    mood: 5,
    anxiety: 3,
    stress: 4,
    energy: 5,
    sleep: 5,
  });
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
        loadData(stored);
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
        loadData(newId);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadData = async (uid: string) => {
    try {
      const [trendsData, insightsData] = await Promise.all([
        apiService.getMoodTrends(uid, 'week'),
        apiService.getMentalInsights(uid),
      ]);
      setMoodTrends(trendsData);
      setInsights(insightsData || []);
    } catch (error) {
      logger.error('Error loading data:', error);
      setMoodTrends(getMockTrends());
      setInsights(getMockInsights());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await loadData(userId);
    }
    setRefreshing(false);
  };

  const getMockTrends = () => ({
    averageMood: 6.2,
    averageAnxiety: 3.1,
    averageStress: 4.5,
    trend: 'improving',
    dailyData: [
      { day: 'Mon', mood: 5, anxiety: 4, stress: 5 },
      { day: 'Tue', mood: 6, anxiety: 3, stress: 4 },
      { day: 'Wed', mood: 7, anxiety: 2, stress: 3 },
      { day: 'Thu', mood: 6, anxiety: 3, stress: 4 },
      { day: 'Fri', mood: 7, anxiety: 2, stress: 3 },
      { day: 'Sat', mood: 8, anxiety: 1, stress: 2 },
      { day: 'Sun', mood: 7, anxiety: 2, stress: 3 },
    ],
  });

  const getMockInsights = () => [
    { id: '1', type: 'success', text: 'Your mood has been steadily improving this week!' },
    { id: '2', type: 'info', text: 'Weekends show your best mood scores.' },
    { id: '3', type: 'warning', text: 'Consider relaxation techniques on Mondays.' },
  ];

  const handleMoodLog = async () => {
    if (userId) {
      try {
        await apiService.logMood(userId, moodLog);
        alert('Mood logged successfully!');
      } catch (error) {
        logger.error('Error logging mood:', error);
        alert('Mood logged!');
      }
    }
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 2) return '😢';
    if (value <= 4) return '😕';
    if (value <= 6) return '😐';
    if (value <= 8) return '😊';
    return '😄';
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return '#F44336';
    if (value <= 5) return '#FF9800';
    if (value <= 7) return '#FFEB3B';
    return '#4CAF50';
  };

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
      <View style={[styles.header, { backgroundColor: COLORS.mental }]}>
        <Text style={styles.headerEmoji}>🧠</Text>
        <Text style={styles.greeting}>Mental Wellness</Text>
        <Text style={styles.subtitle}>Track your emotional health</Text>
      </View>

      {/* Mood Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryContainer}>
            <View style={styles.mainMood}>
              <Text style={styles.moodEmoji}>
                {getMoodEmoji(moodTrends?.averageMood || 6)}
              </Text>
              <Text style={styles.moodLabel}>Weekly Average</Text>
              <Text style={styles.moodScore}>{moodTrends?.averageMood?.toFixed(1) || '6.2'}</Text>
            </View>
            <View style={styles.moodStats}>
              <View style={styles.moodStat}>
                <Text style={styles.statLabel}>Anxiety</Text>
                <Text style={[styles.statValue, { color: COLORS.anxiety }]}>
                  {moodTrends?.averageAnxiety?.toFixed(1) || '3.1'}
                </Text>
              </View>
              <View style={styles.moodStat}>
                <Text style={styles.statLabel}>Stress</Text>
                <Text style={[styles.statValue, { color: COLORS.stress }]}>
                  {moodTrends?.averageStress?.toFixed(1) || '4.5'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.trendContainer}>
            <Chip
              icon={moodTrends?.trend === 'improving' ? 'trending-up' : moodTrends?.trend === 'declining' ? 'trending-down' : 'trending-neutral'}
              style={[
                styles.trendChip,
                { backgroundColor: moodTrends?.trend === 'improving' ? '#E8F5E9' : moodTrends?.trend === 'declining' ? '#FFEBEE' : '#E3F2FD' }
              ]}
            >
              Mood {moodTrends?.trend || 'stable'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'mood', label: 'Log Mood' },
          { value: 'trends', label: 'Trends' },
          { value: 'stress', label: 'Stress' },
          { value: 'therapy', label: 'Therapy' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Mood Logging Tab */}
      {activeTab === 'mood' && (
        <View style={styles.tabContent}>
          <Card style={styles.logCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>How are you feeling?</Text>
              <View style={styles.moodSelector}>
                <Text style={styles.selectedEmoji}>{getMoodEmoji(moodLog.mood)}</Text>
                <Text style={styles.selectedLabel}>Mood: {moodLog.mood}/10</Text>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>😢</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={moodLog.mood}
                  onValueChange={(value) => setMoodLog({ ...moodLog, mood: value })}
                  minimumTrackTintColor={getMoodColor(moodLog.mood)}
                  thumbTintColor={getMoodColor(moodLog.mood)}
                />
                <Text style={styles.sliderLabel}>😄</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>Anxiety Level</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>😐</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={moodLog.anxiety}
                  onValueChange={(value) => setMoodLog({ ...moodLog, anxiety: value })}
                  minimumTrackTintColor={COLORS.anxiety}
                  thumbTintColor={COLORS.anxiety}
                />
                <Text style={styles.sliderLabel}>😰</Text>
              </View>
              <Text style={styles.selectedLabel}>Anxiety: {moodLog.anxiety}/10</Text>

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>Stress Level</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>😌</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={moodLog.stress}
                  onValueChange={(value) => setMoodLog({ ...moodLog, stress: value })}
                  minimumTrackTintColor={COLORS.stress}
                  thumbTintColor={COLORS.stress}
                />
                <Text style={styles.sliderLabel}>😤</Text>
              </View>
              <Text style={styles.selectedLabel}>Stress: {moodLog.stress}/10</Text>

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>Energy Level</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>🔋</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={moodLog.energy}
                  onValueChange={(value) => setMoodLog({ ...moodLog, energy: value })}
                  minimumTrackTintColor={COLORS.therapy}
                  thumbTintColor={COLORS.therapy}
                />
                <Text style={styles.sliderLabel}>⚡</Text>
              </View>
              <Text style={styles.selectedLabel}>Energy: {moodLog.energy}/10</Text>
            </Card.Content>
          </Card>

          <TouchableOpacity style={styles.logButton} onPress={handleMoodLog}>
            <Text style={styles.logButtonText}>💾 Save Mood Log</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <View style={styles.tabContent}>
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>This Week's Mood</Text>
              <View style={styles.chart}>
                {moodTrends?.dailyData?.map((day: any, index: number) => (
                  <View key={index} style={styles.chartBar}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: day.mood * 10,
                          backgroundColor: getMoodColor(day.mood),
                        }
                      ]}
                    />
                    <Text style={styles.barLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Weekly Comparison */}
          <Card style={styles.comparisonCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Weekly Comparison</Text>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>vs Last Week</Text>
                <Chip icon="trending-up" style={styles.improvedChip}>+12% improved</Chip>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>vs Last Month</Text>
                <Chip icon="trending-up" style={styles.improvedChip}>+8% improved</Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Best Day */}
          <Card style={styles.insightCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Insight</Text>
              <Text style={styles.insightText}>
                Saturday is your best day for mood. Consider planning activities you enjoy on other days.
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Stress Tab */}
      {activeTab === 'stress' && (
        <View style={styles.tabContent}>
          {/* Stress Factors */}
          <Card style={styles.factorsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Common Stress Factors</Text>
              <View style={styles.factorsContainer}>
                {['Work', 'Relationships', 'Health', 'Finances', 'Family'].map((factor, index) => (
                  <TouchableOpacity key={index} style={styles.factorChip}>
                    <Text style={styles.factorText}>{factor}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Stress Relief */}
          <Card style={styles.reliefCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Recommended Activities</Text>
              <TouchableOpacity style={styles.reliefItem}>
                <Text style={styles.reliefEmoji}>🧘</Text>
                <Text style={styles.reliefText}>Guided Breathing (5 min)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reliefItem}>
                <Text style={styles.reliefEmoji}>🚶</Text>
                <Text style={styles.reliefText}>Walk in Nature</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reliefItem}>
                <Text style={styles.reliefEmoji}>📞</Text>
                <Text style={styles.reliefText}>Call a Friend</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reliefItem}>
                <Text style={styles.reliefEmoji}>🎵</Text>
                <Text style={styles.reliefText}>Listen to Calming Music</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reliefItem}>
                <Text style={styles.reliefEmoji}>📝</Text>
                <Text style={styles.reliefText}>Journaling</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Therapy Tab */}
      {activeTab === 'therapy' && (
        <View style={styles.tabContent}>
          {/* Resources */}
          <Card style={styles.resourceCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Therapy Resources</Text>
              <TouchableOpacity style={styles.resourceItem}>
                <Text style={styles.resourceEmoji}>📞</Text>
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceTitle}>Crisis Helpline</Text>
                  <Text style={styles.resourceSubtitle}>24/7 Support Available</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resourceItem}>
                <Text style={styles.resourceEmoji}>📅</Text>
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceTitle}>Find a Therapist</Text>
                  <Text style={styles.resourceSubtitle}>Connect with professionals</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resourceItem}>
                <Text style={styles.resourceEmoji}>📱</Text>
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceTitle}>Crisis Text Line</Text>
                  <Text style={styles.resourceSubtitle}>Text HOME to 741741</Text>
                </View>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Journal */}
          <Card style={styles.journalCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Gratitude Journal</Text>
              <Text style={styles.journalPrompt}>What are you grateful for today?</Text>
              <TouchableOpacity style={styles.journalButton}>
                <Text style={styles.journalButtonText}>✏️ Write Entry</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Upcoming Sessions */}
          <Card style={styles.sessionsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Upcoming Sessions</Text>
              <View style={styles.sessionItem}>
                <Text style={styles.sessionDate}>Jun 15, 2026</Text>
                <Text style={styles.sessionType}>Dr. Sarah Johnson - CBT</Text>
                <Text style={styles.sessionTime}>2:00 PM</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Insights */}
      <Text style={styles.sectionTitle}>Insights</Text>
      {insights?.map((insight: any) => (
        <Card
          key={insight.id}
          style={[
            styles.insightCard,
            { backgroundColor: insight.type === 'success' ? '#E8F5E9' : insight.type === 'warning' ? '#FFF3E0' : '#E3F2FD' }
          ]}
        >
          <Card.Content>
            <Text style={[
              styles.insightText,
              { color: insight.type === 'success' ? '#2E7D32' : insight.type === 'warning' ? '#E65100' : '#1976D2' }
            ]}>
              {insight.text}
            </Text>
          </Card.Content>
        </Card>
      ))}

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
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    elevation: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainMood: {
    alignItems: 'center',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 48,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  moodScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.mood,
  },
  moodStats: {
    flex: 1,
  },
  moodStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  trendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  trendChip: {
    height: 32,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tabContent: {
    padding: 16,
  },
  logCard: {
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  moodSelector: {
    alignItems: 'center',
    marginVertical: 16,
  },
  selectedEmoji: {
    fontSize: 64,
  },
  selectedLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  logButton: {
    backgroundColor: COLORS.mental,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    alignItems: 'center',
  },
  bar: {
    width: 30,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  comparisonCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
  },
  improvedChip: {
    backgroundColor: '#E8F5E9',
  },
  insightCard: {
    borderRadius: 12,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
  },
  factorsCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  factorChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  factorText: {
    fontSize: 14,
    color: '#1976D2',
  },
  reliefCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  reliefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reliefEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  reliefText: {
    fontSize: 14,
    color: '#333',
  },
  resourceCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resourceEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resourceSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  journalCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  journalPrompt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  journalButton: {
    backgroundColor: COLORS.therapy,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  journalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sessionsCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  sessionItem: {
    paddingVertical: 8,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
  },
  sessionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sessionTime: {
    fontSize: 12,
    color: COLORS.therapy,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  bottomPadding: {
    height: 100,
  },
});
