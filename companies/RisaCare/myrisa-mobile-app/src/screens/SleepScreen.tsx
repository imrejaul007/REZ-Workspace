import { logger } from '../../shared/logger';
/**
 * MyRisa Sleep Screen
 * Sleep logging, analysis, and insights
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  sleep: '#5C6BC0',
  good: '#4CAF50',
  fair: '#FF9800',
  poor: '#F44336',
};

export default function SleepScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('log');
  const [sleepAnalysis, setSleepAnalysis] = useState<any>(null);
  const [sleepLog, setSleepLog] = useState({
    bedtime: '22:30',
    wakeTime: '06:30',
    quality: 7,
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
      const data = await apiService.getSleepAnalysis(uid, 30);
      setSleepAnalysis(data);
    } catch (error) {
      logger.error('Error loading sleep data:', error);
      setSleepAnalysis(getMockAnalysis());
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

  const getMockAnalysis = () => ({
    averageHours: 7.2,
    averageQuality: 72,
    sleepScore: 75,
    trend: 'stable',
    weeklyData: [
      { day: 'Mon', hours: 7.5, quality: 80 },
      { day: 'Tue', hours: 6.8, quality: 65 },
      { day: 'Wed', hours: 7.2, quality: 75 },
      { day: 'Thu', hours: 7.0, quality: 70 },
      { day: 'Fri', hours: 7.8, quality: 85 },
      { day: 'Sat', hours: 8.2, quality: 90 },
      { day: 'Sun', hours: 6.5, quality: 60 },
    ],
    insights: [
      { id: '1', type: 'info', text: 'You sleep best on weekends. Try maintaining a consistent schedule.' },
      { id: '2', type: 'warning', text: 'Friday shows excellent sleep quality. What helps on Fridays?' },
    ],
    tips: [
      'Keep a consistent sleep schedule',
      'Avoid screens 1 hour before bed',
      'Keep your room cool (65-68°F)',
      'Limit caffeine after 2 PM',
    ],
    recentLogs: [
      { date: '2026-06-10', bedtime: '22:30', wakeTime: '06:30', hours: 8, quality: 85 },
      { date: '2026-06-09', bedtime: '23:00', wakeTime: '06:00', hours: 7, quality: 70 },
      { date: '2026-06-08', bedtime: '22:45', wakeTime: '06:15', hours: 7.5, quality: 75 },
    ],
  });

  const handleSleepLog = async () => {
    if (userId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await apiService.logSleep(userId, {
          date: today,
          bedtime: sleepLog.bedtime,
          wakeTime: sleepLog.wakeTime,
          quality: sleepLog.quality,
        });
        alert('Sleep logged successfully!');
      } catch (error) {
        logger.error('Error logging sleep:', error);
        alert('Sleep logged!');
      }
    }
  };

  const getSleepQualityColor = (quality: number) => {
    if (quality >= 80) return COLORS.good;
    if (quality >= 60) return COLORS.fair;
    return COLORS.poor;
  };

  const getSleepQualityLabel = (quality: number) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    if (quality >= 40) return 'Fair';
    return 'Poor';
  };

  const calculateSleepHours = () => {
    const [bedHour, bedMin] = sleepLog.bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = sleepLog.wakeTime.split(':').map(Number);

    let bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;

    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const totalMinutes = wakeMinutes - bedMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
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
      <View style={[styles.header, { backgroundColor: COLORS.sleep }]}>
        <Text style={styles.headerEmoji}>😴</Text>
        <Text style={styles.greeting}>Sleep Tracker</Text>
        <Text style={styles.subtitle}>Rest well, live better</Text>
      </View>

      {/* Sleep Score Card */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreContainer}>
            <View style={styles.mainScore}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{sleepAnalysis?.sleepScore || 75}</Text>
              </View>
              <Text style={styles.scoreLabel}>Sleep Score</Text>
            </View>
            <View style={styles.scoreStats}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⏰</Text>
                <Text style={styles.statValue}>{sleepAnalysis?.averageHours?.toFixed(1) || '7.2'}h</Text>
                <Text style={styles.statLabel}>Avg Sleep</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statValue}>{sleepAnalysis?.averageQuality || 72}%</Text>
                <Text style={styles.statLabel}>Avg Quality</Text>
              </View>
            </View>
          </View>
          <View style={styles.trendContainer}>
            <Chip
              icon={sleepAnalysis?.trend === 'improving' ? 'trending-up' : sleepAnalysis?.trend === 'declining' ? 'trending-down' : 'trending-neutral'}
              style={[
                styles.trendChip,
                { backgroundColor: sleepAnalysis?.trend === 'improving' ? '#E8F5E9' : sleepAnalysis?.trend === 'declining' ? '#FFEBEE' : '#E3F2FD' }
              ]}
            >
              Sleep {sleepAnalysis?.trend || 'stable'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'log', label: 'Log Sleep' },
          { value: 'analysis', label: 'Analysis' },
          { value: 'tips', label: 'Tips' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Log Sleep Tab */}
      {activeTab === 'log' && (
        <View style={styles.tabContent}>
          <Card style={styles.logCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Log Last Night's Sleep</Text>

              <View style={styles.timeRow}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Bedtime</Text>
                  <TouchableOpacity style={styles.timeButton}>
                    <Text style={styles.timeValue}>{sleepLog.bedtime}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeArrow}>→</Text>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Wake Time</Text>
                  <TouchableOpacity style={styles.timeButton}>
                    <Text style={styles.timeValue}>{sleepLog.wakeTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.durationContainer}>
                <Text style={styles.durationLabel}>Sleep Duration</Text>
                <Text style={styles.durationValue}>{calculateSleepHours()}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>Sleep Quality</Text>
              <View style={styles.qualitySelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.qualityDot,
                      {
                        backgroundColor: sleepLog.quality >= value ? getSleepQualityColor(sleepLog.quality) : '#e0e0e0',
                      }
                    ]}
                    onPress={() => setSleepLog({ ...sleepLog, quality: value })}
                  />
                ))}
              </View>
              <Text style={[styles.qualityLabel, { color: getSleepQualityColor(sleepLog.quality) }]}>
                {getSleepQualityLabel(sleepLog.quality)}
              </Text>
            </Card.Content>
          </Card>

          <TouchableOpacity style={styles.logButton} onPress={handleSleepLog}>
            <Text style={styles.logButtonText}>💾 Save Sleep Log</Text>
          </TouchableOpacity>

          {/* Quick Log Options */}
          <Text style={styles.quickLogTitle}>Quick Log Options</Text>
          <View style={styles.quickLogContainer}>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={() => setSleepLog({ bedtime: '22:00', wakeTime: '06:00', quality: 8 })}
            >
              <Text style={styles.quickLogEmoji}>🌙</Text>
              <Text style={styles.quickLogText}>Early Night</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={() => setSleepLog({ bedtime: '23:30', wakeTime: '07:00', quality: 5 })}
            >
              <Text style={styles.quickLogEmoji}>🌃</Text>
              <Text style={styles.quickLogText}>Late Night</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={() => setSleepLog({ bedtime: '22:30', wakeTime: '07:30', quality: 7 })}
            >
              <Text style={styles.quickLogEmoji}>😌</Text>
              <Text style={styles.quickLogText}>Weekend</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <View style={styles.tabContent}>
          {/* Weekly Chart */}
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>This Week</Text>
              <View style={styles.chart}>
                {sleepAnalysis?.weeklyData?.map((day: any, index: number) => (
                  <View key={index} style={styles.chartColumn}>
                    <View style={styles.chartBars}>
                      <View
                        style={[
                          styles.hoursBar,
                          { height: day.hours * 10 }
                        ]}
                      />
                      <View
                        style={[
                          styles.qualityBar,
                          { height: day.quality / 5, backgroundColor: getSleepQualityColor(day.quality) }
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{day.day}</Text>
                    <Text style={styles.chartValue}>{day.hours}h</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.sleep }]} />
                  <Text style={styles.legendText}>Hours</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.good }]} />
                  <Text style={styles.legendText}>Quality</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Best/Worst Days */}
          <Card style={styles.daysCard}>
            <Card.Content>
              <View style={styles.daysRow}>
                <View style={styles.dayItem}>
                  <Text style={styles.dayEmoji}>🏆</Text>
                  <Text style={styles.dayLabel}>Best Day</Text>
                  <Text style={styles.dayValue}>Saturday</Text>
                  <Text style={styles.dayStats}>8.2h, 90% quality</Text>
                </View>
                <View style={styles.dayItem}>
                  <Text style={styles.dayEmoji}>⚠️</Text>
                  <Text style={styles.dayLabel}>Needs Work</Text>
                  <Text style={styles.dayValue}>Sunday</Text>
                  <Text style={styles.dayStats}>6.5h, 60% quality</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <View style={styles.tabContent}>
          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Sleep Hygiene Tips</Text>
              {sleepAnalysis?.tips?.map((tip: string, index: number) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipNumber}>{index + 1}</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Bedtime Routine */}
          <Card style={styles.routineCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Recommended Bedtime Routine</Text>
              <View style={styles.routineItem}>
                <Text style={styles.routineTime}>1h before</Text>
                <Text style={styles.routineText}>Stop screen time</Text>
              </View>
              <View style={styles.routineItem}>
                <Text style={styles.routineTime}>30min before</Text>
                <Text style={styles.routineText}>Dim lights, read a book</Text>
              </View>
              <View style={styles.routineItem}>
                <Text style={styles.routineTime}>15min before</Text>
                <Text style={styles.routineText}>Practice relaxation</Text>
              </View>
              <View style={styles.routineItem}>
                <Text style={styles.routineTime}>Bedtime</Text>
                <Text style={styles.routineText}>Lights off, sleep</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Ideal Sleep Schedule */}
          <Card style={styles.scheduleCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Your Ideal Sleep Schedule</Text>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleEmoji}>🌙</Text>
                  <Text style={styles.scheduleTime}>10:30 PM</Text>
                  <Text style={styles.scheduleLabel}>Bedtime</Text>
                </View>
                <View style={styles.scheduleArrow}>→</View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleEmoji}>☀️</Text>
                  <Text style={styles.scheduleTime}>6:30 AM</Text>
                  <Text style={styles.scheduleLabel}>Wake up</Text>
                </View>
              </View>
              <Text style={styles.scheduleDuration}>8 hours of sleep</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Recent Logs */}
      <Text style={styles.sectionTitle}>Recent Sleep Logs</Text>
      {sleepAnalysis?.recentLogs?.map((log: any, index: number) => (
        <Card key={index} style={styles.logEntryCard}>
          <Card.Content>
            <View style={styles.logEntryHeader}>
              <Text style={styles.logEntryDate}>{log.date}</Text>
              <Chip
                style={[
                  styles.qualityChip,
                  { backgroundColor: getSleepQualityColor(log.quality) + '20' }
                ]}
                textStyle={{ color: getSleepQualityColor(log.quality) }}
              >
                {log.quality}%
              </Chip>
            </View>
            <View style={styles.logEntryDetails}>
              <Text style={styles.logEntryTime}>{log.bedtime} → {log.wakeTime}</Text>
              <Text style={styles.logEntryHours}>{log.hours} hours</Text>
            </View>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.sleep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
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
  logCard: {
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.sleep,
  },
  timeArrow: {
    fontSize: 24,
    color: '#999',
  },
  durationContainer: {
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 12,
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
  },
  durationValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.sleep,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  qualitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  qualityDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  qualityLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  logButton: {
    backgroundColor: COLORS.sleep,
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
  quickLogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  quickLogContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLogButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickLogEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  quickLogText: {
    fontSize: 12,
    color: '#666',
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
    paddingTop: 10,
  },
  chartColumn: {
    alignItems: 'center',
  },
  chartBars: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hoursBar: {
    width: 20,
    backgroundColor: COLORS.sleep,
    borderRadius: 4,
    marginBottom: 2,
  },
  qualityBar: {
    width: 20,
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  daysCard: {
    borderRadius: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayItem: {
    alignItems: 'center',
    padding: 16,
  },
  dayEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
  },
  dayValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  tipsCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.sleep,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  routineCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routineTime: {
    width: 80,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  routineText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  scheduleCard: {
    borderRadius: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleItem: {
    alignItems: 'center',
    padding: 16,
  },
  scheduleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduleArrow: {
    fontSize: 24,
    color: '#999',
    marginHorizontal: 16,
  },
  scheduleDuration: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.sleep,
    fontWeight: '600',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  logEntryCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  logEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logEntryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qualityChip: {
    height: 28,
  },
  logEntryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logEntryTime: {
    fontSize: 12,
    color: '#666',
  },
  logEntryHours: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.sleep,
  },
  bottomPadding: {
    height: 100,
  },
});
