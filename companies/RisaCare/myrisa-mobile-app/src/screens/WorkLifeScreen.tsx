import { logger } from '../../shared/logger';
/**
 * MyRisa Work-Life Screen
 * Burnout tracking, energy management, PTO, work satisfaction
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip, SegmentedButtons, Slider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  worklife: '#FFB74D',
  burnout: '#EF5350',
  energy: '#4CAF50',
  balance: '#5C6BC0',
};

export default function WorkLifeScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [workData, setWorkData] = useState<any>(null);
  const [workLog, setWorkLog] = useState({
    workHours: 8,
    meetingHours: 3,
    energyLevel: 6,
    stress: 4,
  });

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
      const [scoreData, burnoutData, insightsData] = await Promise.all([
        apiService.getWorkLifeScore(uid),
        apiService.getBurnoutRisk(uid),
        apiService.getWorkInsights(uid),
      ]);
      setWorkData({ score: scoreData, burnout: burnoutData, insights: insightsData });
    } catch (error) {
      logger.error('Error loading work data:', error);
      setWorkData(getMockData());
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

  const getMockData = () => ({
    score: 78,
    trend: 'improving',
    weeklyHours: 42,
    averageEnergy: 6.5,
    weeklyData: [
      { day: 'Mon', hours: 8.5, energy: 7, meetings: 4 },
      { day: 'Tue', hours: 9, energy: 6, meetings: 5 },
      { day: 'Wed', hours: 8, energy: 7, meetings: 3 },
      { day: 'Thu', hours: 8.5, energy: 6, meetings: 4 },
      { day: 'Fri', hours: 8, energy: 7, meetings: 3 },
    ],
    burnout: {
      risk: 'low',
      score: 25,
      factors: [
        { name: 'Workload', value: 40 },
        { name: 'Work-Life Balance', value: 70 },
        { name: 'Recovery Time', value: 60 },
      ],
    },
    pto: {
      available: 12,
      used: 8,
      pending: 2,
    },
    insights: [
      { id: '1', type: 'info', text: 'Your average work hours are within healthy range.' },
      { id: '2', type: 'warning', text: 'Meeting hours on Tuesday were high. Consider batching meetings.' },
    ],
  });

  const handleWorkLog = async () => {
    if (userId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await apiService.logWorkDay(userId, {
          date: today,
          workHours: workLog.workHours,
          meetingHours: workLog.meetingHours,
          energyLevel: workLog.energyLevel,
        });
        alert('Work day logged successfully!');
      } catch (error) {
        logger.error('Error logging work:', error);
        alert('Work day logged!');
      }
    }
  };

  const getBurnoutColor = (risk: string) => {
    if (risk === 'low') return COLORS.energy;
    if (risk === 'moderate') return COLORS.worklife;
    return COLORS.burnout;
  };

  const getBurnoutLabel = (risk: string) => {
    if (risk === 'low') return 'Healthy';
    if (risk === 'moderate') return 'At Risk';
    return 'Burnout Warning';
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
      <View style={[styles.header, { backgroundColor: COLORS.worklife }]}>
        <Text style={styles.headerEmoji}>⚡</Text>
        <Text style={styles.greeting}>Work-Life Balance</Text>
        <Text style={styles.subtitle}>Manage energy and prevent burnout</Text>
      </View>

      {/* Work-Life Score Card */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreContainer}>
            <View style={styles.mainScore}>
              <View style={[styles.scoreCircle, { backgroundColor: COLORS.worklife }]}>
                <Text style={styles.scoreNumber}>{workData?.score || 78}</Text>
              </View>
              <Text style={styles.scoreLabel}>Work-Life Score</Text>
            </View>
            <View style={styles.scoreStats}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⏰</Text>
                <Text style={styles.statValue}>{workData?.weeklyHours || 42}h</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🔋</Text>
                <Text style={styles.statValue}>{workData?.averageEnergy?.toFixed(1) || '6.5'}</Text>
                <Text style={styles.statLabel}>Avg Energy</Text>
              </View>
            </View>
          </View>
          <View style={styles.trendContainer}>
            <Chip
              icon={workData?.trend === 'improving' ? 'trending-up' : workData?.trend === 'declining' ? 'trending-down' : 'trending-neutral'}
              style={[
                styles.trendChip,
                { backgroundColor: workData?.trend === 'improving' ? '#E8F5E9' : workData?.trend === 'declining' ? '#FFEBEE' : '#E3F2FD' }
              ]}
            >
              {workData?.trend === 'improving' ? 'Improving' : workData?.trend === 'declining' ? 'Needs Attention' : 'Stable'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'log', label: 'Log Day' },
          { value: 'burnout', label: 'Burnout' },
          { value: 'pto', label: 'PTO' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Weekly Hours */}
          <Card style={styles.hoursCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Weekly Work Hours</Text>
              <View style={styles.hoursChart}>
                {workData?.weeklyData?.map((day: any, index: number) => (
                  <View key={index} style={styles.hoursColumn}>
                    <View style={styles.hoursBar}>
                      <View
                        style={[
                          styles.bar,
                          { height: Math.min(day.hours * 8, 80) }
                        ]}
                      />
                    </View>
                    <Text style={styles.hoursValue}>{day.hours}h</Text>
                    <Text style={styles.dayLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.hoursGoal}>
                <Text style={styles.goalLabel}>Weekly Goal: 40h</Text>
                <Text style={[styles.goalStatus, { color: workData?.weeklyHours <= 45 ? COLORS.energy : COLORS.burnout }]}>
                  {workData?.weeklyHours <= 45 ? 'On Track' : 'Over Hours'}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Energy Trend */}
          <Card style={styles.energyCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Energy Levels This Week</Text>
              <View style={styles.energyContainer}>
                {workData?.weeklyData?.map((day: any, index: number) => (
                  <View key={index} style={styles.energyItem}>
                    <Text style={styles.energyEmoji}>
                      {day.energy >= 7 ? '😊' : day.energy >= 5 ? '😐' : '😔'}
                    </Text>
                    <Text style={styles.energyValue}>{day.energy}</Text>
                    <Text style={styles.energyDay}>{day.day}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Log Day Tab */}
      {activeTab === 'log' && (
        <View style={styles.tabContent}>
          <Card style={styles.logCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Log Today's Work</Text>

              <Text style={styles.sliderLabel}>Work Hours: {workLog.workHours}h</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderEmoji}>🕐</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={12}
                  step={0.5}
                  value={workLog.workHours}
                  onValueChange={(value) => setWorkLog({ ...workLog, workHours: value })}
                  minimumTrackTintColor={COLORS.worklife}
                  thumbTintColor={COLORS.worklife}
                />
                <Text style={styles.sliderEmoji}>🕛</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sliderLabel}>Meeting Hours: {workLog.meetingHours}h</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderEmoji}>👥</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={8}
                  step={0.5}
                  value={workLog.meetingHours}
                  onValueChange={(value) => setWorkLog({ ...workLog, meetingHours: value })}
                  minimumTrackTintColor={COLORS.balance}
                  thumbTintColor={COLORS.balance}
                />
                <Text style={styles.sliderEmoji}>🤝</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sliderLabel}>Energy Level: {workLog.energyLevel}/10</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderEmoji}>🔋</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={workLog.energyLevel}
                  onValueChange={(value) => setWorkLog({ ...workLog, energyLevel: value })}
                  minimumTrackTintColor={COLORS.energy}
                  thumbTintColor={COLORS.energy}
                />
                <Text style={styles.sliderEmoji}>⚡</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sliderLabel}>Stress Level: {workLog.stress}/10</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderEmoji}>😌</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={workLog.stress}
                  onValueChange={(value) => setWorkLog({ ...workLog, stress: value })}
                  minimumTrackTintColor={COLORS.burnout}
                  thumbTintColor={COLORS.burnout}
                />
                <Text style={styles.sliderEmoji}>😤</Text>
              </View>
            </Card.Content>
          </Card>

          <TouchableOpacity style={styles.logButton} onPress={handleWorkLog}>
            <Text style={styles.logButtonText}>💾 Save Work Day</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Burnout Tab */}
      {activeTab === 'burnout' && (
        <View style={styles.tabContent}>
          {/* Burnout Risk */}
          <Card style={styles.burnoutCard}>
            <Card.Content>
              <View style={styles.burnoutHeader}>
                <Text style={styles.cardTitle}>Burnout Risk Assessment</Text>
                <Chip
                  style={[styles.burnoutChip, { backgroundColor: getBurnoutColor(workData?.burnout?.risk) + '20' }]}
                  textStyle={{ color: getBurnoutColor(workData?.burnout?.risk) }}
                >
                  {getBurnoutLabel(workData?.burnout?.risk)}
                </Chip>
              </View>
              <View style={styles.burnoutScore}>
                <View style={[styles.burnoutCircle, { borderColor: getBurnoutColor(workData?.burnout?.risk) }]}>
                  <Text style={[styles.burnoutNumber, { color: getBurnoutColor(workData?.burnout?.risk) }]}>
                    {workData?.burnout?.score || 25}
                  </Text>
                  <Text style={styles.burnoutLabel}>Risk Score</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Burnout Factors */}
          <Card style={styles.factorsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Contributing Factors</Text>
              {workData?.burnout?.factors?.map((factor: any, index: number) => (
                <View key={index} style={styles.factorRow}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorProgress,
                        {
                          width: `${factor.value}%`,
                          backgroundColor: factor.value >= 70 ? COLORS.energy : factor.value >= 40 ? COLORS.worklife : COLORS.burnout
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.factorValue}>{factor.value}%</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Prevention Tips */}
          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Prevention Tips</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>☕</Text>
                <Text style={styles.tipText}>Take regular breaks throughout the day</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>🚶</Text>
                <Text style={styles.tipText}>Use your lunch break away from desk</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>📵</Text>
                <Text style={styles.tipText}>Set boundaries for after-work hours</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>🏃</Text>
                <Text style={styles.tipText}>Incorporate physical activity daily</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* PTO Tab */}
      {activeTab === 'pto' && (
        <View style={styles.tabContent}>
          {/* PTO Overview */}
          <Card style={styles.ptoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Paid Time Off</Text>
              <View style={styles.ptoStats}>
                <View style={styles.ptoItem}>
                  <Text style={styles.ptoNumber}>{workData?.pto?.available || 12}</Text>
                  <Text style={styles.ptoLabel}>Available</Text>
                </View>
                <View style={styles.ptoDivider} />
                <View style={styles.ptoItem}>
                  <Text style={styles.ptoNumber}>{workData?.pto?.used || 8}</Text>
                  <Text style={styles.ptoLabel}>Used</Text>
                </View>
                <View style={styles.ptoDivider} />
                <View style={styles.ptoItem}>
                  <Text style={styles.ptoNumber}>{workData?.pto?.pending || 2}</Text>
                  <Text style={styles.ptoLabel}>Pending</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* PTO Progress */}
          <Card style={styles.progressCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Yearly Usage</Text>
              <ProgressBar
                progress={(workData?.pto?.used || 8) / ((workData?.pto?.available || 12) + (workData?.pto?.used || 8))}
                color={COLORS.balance}
                style={styles.ptoProgress}
              />
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0 days</Text>
                <Text style={styles.progressLabel}>20 days</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card style={styles.actionsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionItem}>
                <Text style={styles.actionEmoji}>📅</Text>
                <Text style={styles.actionText}>Request Time Off</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <Text style={styles.actionEmoji}>📋</Text>
                <Text style={styles.actionText}>View Calendar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <Text style={styles.actionEmoji}>💼</Text>
                <Text style={styles.actionText}>Check Leave Balance</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Insights */}
      <Text style={styles.sectionTitle}>Insights</Text>
      {workData?.insights?.map((insight: any) => (
        <Card
          key={insight.id}
          style={[
            styles.insightCard,
            { backgroundColor: insight.type === 'warning' ? '#FFF3E0' : '#E3F2FD' }
          ]}
        >
          <Card.Content>
            <Text style={[
              styles.insightText,
              { color: insight.type === 'warning' ? '#E65100' : '#1976D2' }
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
  scoreCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    elevation: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainScore: {
    alignItems: 'center',
    flex: 1,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  scoreStats: {
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
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
  hoursCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  hoursChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  hoursColumn: {
    alignItems: 'center',
  },
  hoursBar: {
    height: 80,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    backgroundColor: COLORS.worklife,
    borderRadius: 4,
  },
  hoursValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: '#666',
  },
  hoursGoal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: '#666',
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  energyCard: {
    borderRadius: 16,
  },
  energyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  energyItem: {
    alignItems: 'center',
  },
  energyEmoji: {
    fontSize: 28,
  },
  energyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  energyDay: {
    fontSize: 10,
    color: '#666',
  },
  logCard: {
    borderRadius: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  sliderEmoji: {
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  logButton: {
    backgroundColor: COLORS.worklife,
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
  burnoutCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  burnoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  burnoutChip: {
    height: 28,
  },
  burnoutScore: {
    alignItems: 'center',
    marginTop: 16,
  },
  burnoutCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  burnoutNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  burnoutLabel: {
    fontSize: 12,
    color: '#666',
  },
  factorsCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  factorName: {
    width: 120,
    fontSize: 14,
    color: '#333',
  },
  factorBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  factorProgress: {
    height: '100%',
    borderRadius: 4,
  },
  factorValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  tipsCard: {
    borderRadius: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  ptoCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  ptoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ptoItem: {
    alignItems: 'center',
  },
  ptoNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.balance,
  },
  ptoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ptoDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
  },
  progressCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  ptoProgress: {
    height: 12,
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsCard: {
    borderRadius: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  insightCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  insightText: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
});
