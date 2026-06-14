import { logger } from '../../shared/logger';
/**
 * MyRisa Women's Health Screen
 * Cycle tracking, fertility, pregnancy, PCOS management
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  primary: '#E57373',
  secondary: '#BA68C8',
  fertility: '#F06292',
  pregnancy: '#81C784',
  pcos: '#FFB74D',
};

export default function WomensHealthScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('cycle');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
        loadProfile(stored);
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
        loadProfile(newId);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadProfile = async (uid: string) => {
    try {
      const data = await apiService.getWomensHealthProfile(uid);
      setProfile(data);
    } catch (error) {
      logger.error('Error loading profile:', error);
      setProfile(getMockProfile());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await loadProfile(userId);
    }
    setRefreshing(false);
  };

  const getMockProfile = () => ({
    cycleLength: 28,
    periodLength: 5,
    lastPeriod: '2026-05-28',
    nextPeriod: '2026-06-25',
    fertileWindow: { start: '2026-06-08', end: '2026-06-12' },
    ovulation: '2026-06-10',
    phase: 'follicular',
    phaseDay: 12,
    cycleDay: 18,
    symptoms: [
      { name: 'Cramps', severity: 'mild' },
      { name: 'Bloating', severity: 'moderate' },
      { name: 'Fatigue', severity: 'mild' },
    ],
    insights: [
      { type: 'info', text: 'You are in your follicular phase. Energy levels are rising.' },
      { type: 'warning', text: 'Period expected in 7 days. Consider tracking symptoms.' },
    ],
    pregnancy: null,
    pcos: null,
    fertility: {
      score: 85,
      factors: [
        { name: 'Cycle Regularity', value: 90 },
        { name: 'Hormone Balance', value: 80 },
        { name: 'Lifestyle Factors', value: 85 },
      ],
    },
    recentLogs: [
      { date: '2026-06-10', type: 'symptom', value: 'Cramping' },
      { date: '2026-06-08', type: 'flow', value: 'Light' },
      { date: '2026-05-28', type: 'period', value: 'Started' },
    ],
  });

  const getPhaseInfo = (phase: string) => {
    const phases: Record<string, { emoji: string; description: string; color: string }> = {
      menstrual: { emoji: '🌸', description: 'Menstrual Phase - Rest and reflect', color: COLORS.primary },
      follicular: { emoji: '🌱', description: 'Follicular Phase - Rising energy', color: COLORS.secondary },
      ovulation: { emoji: '🌺', description: 'Ovulation - Peak fertility', color: COLORS.fertility },
      luteal: { emoji: '🌾', description: 'Luteal Phase - Wind down', color: '#9575CD' },
    };
    return phases[phase] || phases.follicular;
  };

  const phaseInfo = getPhaseInfo(profile?.phase || 'follicular');

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
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.headerEmoji}>🌸</Text>
        <Text style={styles.greeting}>Women's Health</Text>
        <Text style={styles.subtitle}>Track your cycle and wellness</Text>
      </View>

      {/* Cycle Phase Card */}
      <Card style={styles.phaseCard}>
        <Card.Content>
          <View style={styles.phaseContainer}>
            <View style={[styles.phaseCircle, { backgroundColor: phaseInfo.color }]}>
              <Text style={styles.phaseEmoji}>{phaseInfo.emoji}</Text>
            </View>
            <View style={styles.phaseDetails}>
              <Text style={styles.phaseName}>{phaseInfo.description}</Text>
              <Text style={styles.cycleDay}>Day {profile?.cycleDay} of {profile?.cycleLength}</Text>
            </View>
          </View>
          <ProgressBar
            progress={(profile?.cycleDay || 1) / (profile?.cycleLength || 28)}
            color={COLORS.primary}
            style={styles.cycleProgress}
          />
          <View style={styles.cycleLabels}>
            <Text style={styles.cycleLabel}>Start</Text>
            <Text style={styles.cycleLabel}>Ovulation</Text>
            <Text style={styles.cycleLabel}>End</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'cycle', label: 'Cycle' },
          { value: 'fertility', label: 'Fertility' },
          { value: 'pcos', label: 'PCOS' },
          { value: 'pregnancy', label: 'Pregnancy' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Cycle Tab */}
      {activeTab === 'cycle' && (
        <View style={styles.tabContent}>
          {/* Next Period */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Next Period</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateValue}>{profile?.nextPeriod || '2026-06-25'}</Text>
                <Chip style={styles.countdownChip}>
                  {Math.ceil((new Date(profile?.nextPeriod).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Fertile Window */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Fertile Window</Text>
              <Text style={styles.dateRange}>
                {profile?.fertileWindow?.start} - {profile?.fertileWindow?.end}
              </Text>
              <Text style={styles.ovulationText}>
                Ovulation expected: {profile?.ovulation}
              </Text>
            </Card.Content>
          </Card>

          {/* Symptoms */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Current Symptoms</Text>
              <View style={styles.symptomsContainer}>
                {profile?.symptoms?.map((symptom: any, index: number) => (
                  <Chip
                    key={index}
                    style={[
                      styles.symptomChip,
                      {
                        backgroundColor: symptom.severity === 'mild' ? '#E8F5E9' :
                                        symptom.severity === 'moderate' ? '#FFF3E0' : '#FFEBEE'
                      }
                    ]}
                  >
                    {symptom.name}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Log Period Button */}
          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logButtonText}>📝 Log Period</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logButtonSecondary}>
            <Text style={styles.logButtonSecondaryText}>📝 Log Symptoms</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fertility Tab */}
      {activeTab === 'fertility' && (
        <View style={styles.tabContent}>
          <Card style={styles.scoreCard}>
            <Card.Content>
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreCircle, { backgroundColor: COLORS.fertility }]}>
                  <Text style={styles.scoreNumber}>{profile?.fertility?.score || 85}</Text>
                  <Text style={styles.scoreLabel}>Fertility Score</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Fertility Factors */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Fertility Factors</Text>
              {profile?.fertility?.factors?.map((factor: any, index: number) => (
                <View key={index} style={styles.factorRow}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <View style={styles.factorBar}>
                    <View style={[styles.factorProgress, { width: `${factor.value}%` }]} />
                  </View>
                  <Text style={styles.factorValue}>{factor.value}%</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logButtonText}>📊 Track Fertility Signs</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PCOS Tab */}
      {activeTab === 'pcos' && (
        <View style={styles.tabContent}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>PCOS Management</Text>
              <Text style={styles.cardDescription}>
                Track symptoms and manage your PCOS with personalized insights.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Common Symptoms to Track</Text>
              <View style={styles.symptomsContainer}>
                {['Irregular periods', 'Hirsutism', 'Acne', 'Weight changes', 'Hair loss'].map((symptom, index) => (
                  <Chip key={index} style={styles.symptomChip}>{symptom}</Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logButtonText}>📝 Log PCOS Symptoms</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pregnancy Tab */}
      {activeTab === 'pregnancy' && (
        <View style={styles.tabContent}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Pregnancy Tracking</Text>
              <Text style={styles.cardDescription}>
                Track your pregnancy journey with week-by-week updates.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.pregnancyAction}>
                <Text style={styles.pregnancyActionText}>🤰 Log Pregnancy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pregnancyAction}>
                <Text style={styles.pregnancyActionText}>📅 Track Appointments</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pregnancyAction}>
                <Text style={styles.pregnancyActionText}>💊 Log Prenatal Vitamins</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pregnancyAction}>
                <Text style={styles.pregnancyActionText}>👶 Track Baby Movements</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Insights */}
      {profile?.insights?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Insights</Text>
          {profile?.insights?.map((insight: any, index: number) => (
            <Card
              key={index}
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
        </>
      )}

      {/* Recent Logs */}
      <Text style={styles.sectionTitle}>Recent Logs</Text>
      <Card style={styles.logsCard}>
        <Card.Content>
          {profile?.recentLogs?.map((log: any, index: number) => (
            <View key={index} style={styles.logItem}>
              <Text style={styles.logDate}>{log.date}</Text>
              <Text style={styles.logType}>{log.type}</Text>
              <Text style={styles.logValue}>{log.value}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

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
  phaseCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    elevation: 4,
  },
  phaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseEmoji: {
    fontSize: 32,
  },
  phaseDetails: {
    marginLeft: 16,
    flex: 1,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cycleDay: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cycleProgress: {
    height: 8,
    borderRadius: 4,
  },
  cycleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cycleLabel: {
    fontSize: 10,
    color: '#999',
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  countdownChip: {
    backgroundColor: '#FCE4EC',
  },
  dateRange: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  ovulationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symptomChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  logButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  factorName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  factorBar: {
    width: 100,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  factorProgress: {
    height: '100%',
    backgroundColor: COLORS.fertility,
    borderRadius: 4,
  },
  factorValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  pregnancyAction: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pregnancyActionText: {
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
  logsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logDate: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  logType: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  logValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});
