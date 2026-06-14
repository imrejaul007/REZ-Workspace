import { logger } from '../../shared/logger';
/**
 * MyRisa Twin Screen
 * Human Twin visualization and health digital twin
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Card, Button, ProgressBar, Chip } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  twin: '#7E57C2',
  health: '#4CAF50',
  mental: '#7986CB',
  physical: '#E57373',
  social: '#EF5350',
  lifestyle: '#4DB6AC',
};

export default function TwinScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [twinData, setTwinData] = useState<any>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadUser();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

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
      const data = await apiService.getHumanTwin(uid);
      setTwinData(data);
    } catch (error) {
      logger.error('Error loading twin data:', error);
      setTwinData(getMockData());
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
    twinScore: 82,
    twinLevel: 'Advanced',
    overallHealth: 85,
    mentalHealth: 78,
    physicalHealth: 82,
    socialHealth: 88,
    lifestyleScore: 80,
    personality: {
      type: 'Balanced Achiever',
      traits: ['Optimistic', 'Organized', 'Empathetic', 'Ambitious'],
      communication: 'Open and supportive',
    },
    strengths: [
      { name: 'Strong Work-Life Balance', score: 88 },
      { name: 'Good Emotional Regulation', score: 82 },
      { name: 'Healthy Relationships', score: 85 },
      { name: 'Consistent Self-Care', score: 78 },
    ],
    areas: [
      { name: 'Sleep Quality', score: 68, focus: 'medium' },
      { name: 'Stress Management', score: 72, focus: 'medium' },
      { name: 'Physical Activity', score: 75, focus: 'low' },
      { name: 'Nutrition', score: 80, focus: 'low' },
    ],
    recommendations: [
      { priority: 'high', text: 'Focus on improving sleep quality - target 8 hours nightly' },
      { priority: 'medium', text: 'Incorporate 30 min daily exercise into routine' },
      { priority: 'low', text: 'Try mindfulness meditation for stress reduction' },
    ],
    healthPredictions: {
      energyLevel: 'High',
      riskFactors: ['Low water intake', 'Irregular sleep schedule'],
      projectedWellness: 'Improving',
    },
    insights: [
      { id: '1', type: 'success', text: 'Your mental health score has improved by 8% this month!' },
      { id: '2', type: 'info', text: 'Your twin shows strong alignment in work-life balance.' },
      { id: '3', type: 'warning', text: 'Sleep patterns show room for improvement.' },
    ],
    comparisonData: {
      you: 82,
      similar: 78,
      optimal: 90,
    },
    lastUpdated: '2026-06-11T10:30:00',
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.health;
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading Your Twin...</Text>
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
      <View style={[styles.header, { backgroundColor: COLORS.twin }]}>
        <Text style={styles.headerEmoji}>👤</Text>
        <Text style={styles.greeting}>Your Human Twin</Text>
        <Text style={styles.subtitle}>AI-powered health digital twin</Text>
      </View>

      {/* Twin Visualization */}
      <Card style={styles.twinCard}>
        <Card.Content>
          <View style={styles.twinVisualization}>
            <Animated.View
              style={[
                styles.twinOrb,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={[styles.twinCore, { borderColor: getScoreColor(twinData?.twinScore || 82) }]}>
                <Text style={styles.twinCoreEmoji}>🧬</Text>
                <Text style={styles.twinScoreValue}>{twinData?.twinScore || 82}</Text>
              </View>
            </Animated.View>
            <View style={styles.twinInfo}>
              <Text style={styles.twinLevel}>{twinData?.twinLevel || 'Advanced'} Twin</Text>
              <Chip style={styles.statusChip}>
                {twinData?.healthPredictions?.projectedWellness || 'Improving'}
              </Chip>
            </View>
          </View>

          {/* Health Rings */}
          <View style={styles.healthRings}>
            <View style={styles.ringContainer}>
              <View style={[styles.ring, styles.ringOuter, { borderColor: COLORS.mental + '40' }]} />
              <View style={[styles.ring, styles.ringMiddle, { borderColor: COLORS.physical + '40' }]} />
              <View style={[styles.ring, styles.ringInner, { borderColor: COLORS.social + '40' }]} />
              <View style={styles.ringCenter}>
                <Text style={styles.ringLabel}>Overall</Text>
                <Text style={[styles.ringScore, { color: getScoreColor(twinData?.overallHealth || 85) }]}>
                  {twinData?.overallHealth || 85}
                </Text>
              </View>
            </View>
          </View>

          {/* Mini Stats */}
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatIcon}>🧠</Text>
              <Text style={styles.miniStatValue}>{twinData?.mentalHealth || 78}</Text>
              <Text style={styles.miniStatLabel}>Mental</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatIcon}>💪</Text>
              <Text style={styles.miniStatValue}>{twinData?.physicalHealth || 82}</Text>
              <Text style={styles.miniStatLabel}>Physical</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatIcon}>❤️</Text>
              <Text style={styles.miniStatValue}>{twinData?.socialHealth || 88}</Text>
              <Text style={styles.miniStatLabel}>Social</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatIcon}>🌿</Text>
              <Text style={styles.miniStatValue}>{twinData?.lifestyleScore || 80}</Text>
              <Text style={styles.miniStatLabel}>Lifestyle</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Personality Type */}
      <Card style={styles.personalityCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Personality Profile</Text>
          <View style={styles.personalityType}>
            <Text style={styles.personalityEmoji}>🎯</Text>
            <Text style={styles.personalityName}>{twinData?.personality?.type || 'Balanced Achiever'}</Text>
          </View>
          <View style={styles.traitsContainer}>
            {twinData?.personality?.traits?.map((trait: string, index: number) => (
              <Chip key={index} style={styles.traitChip}>
                {trait}
              </Chip>
            ))}
          </View>
          <View style={styles.communicationStyle}>
            <Text style={styles.communicationLabel}>Communication Style:</Text>
            <Text style={styles.communicationValue}>
              {twinData?.personality?.communication || 'Open and supportive'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Strengths */}
      <Card style={styles.strengthsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Your Strengths</Text>
          {twinData?.strengths?.map((strength: any, index: number) => (
            <View key={index} style={styles.strengthItem}>
              <View style={styles.strengthInfo}>
                <Text style={styles.strengthName}>{strength.name}</Text>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthProgress,
                      {
                        width: `${strength.score}%`,
                        backgroundColor: getScoreColor(strength.score)
                      }
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.strengthScore, { color: getScoreColor(strength.score) }]}>
                {strength.score}%
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Areas for Improvement */}
      <Card style={styles.areasCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Focus Areas</Text>
          {twinData?.areas?.map((area: any, index: number) => (
            <View key={index} style={styles.areaItem}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaName}>{area.name}</Text>
                <Chip
                  style={[styles.focusChip, { backgroundColor: getFocusColor(area.focus) + '20' }]}
                  textStyle={{ color: getFocusColor(area.focus), fontSize: 10 }}
                >
                  {area.focus} focus
                </Chip>
              </View>
              <View style={styles.areaProgress}>
                <ProgressBar
                  progress={area.score / 100}
                  color={getScoreColor(area.score)}
                  style={styles.areaBar}
                />
                <Text style={[styles.areaScore, { color: getScoreColor(area.score) }]}>
                  {area.score}%
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Recommendations */}
      <Card style={styles.recommendationsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>AI Recommendations</Text>
          {twinData?.recommendations?.map((rec: any, index: number) => (
            <View key={index} style={[
              styles.recommendationItem,
              { borderLeftColor: getFocusColor(rec.priority) }
            ]}>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getFocusColor(rec.priority) + '20' }
              ]}>
                <Text style={[styles.priorityText, { color: getFocusColor(rec.priority) }]}>
                  {rec.priority.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.recommendationText}>{rec.text}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Health Predictions */}
      <Card style={styles.predictionsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Health Predictions</Text>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Energy Level</Text>
            <Text style={styles.predictionValue}>
              {twinData?.healthPredictions?.energyLevel || 'High'}
            </Text>
          </View>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Projected Wellness</Text>
            <Chip style={styles.wellnessChip}>
              {twinData?.healthPredictions?.projectedWellness || 'Improving'}
            </Chip>
          </View>
          {twinData?.healthPredictions?.riskFactors?.length > 0 && (
            <View style={styles.riskFactorsContainer}>
              <Text style={styles.riskFactorsTitle}>⚠️ Risk Factors</Text>
              {twinData?.healthPredictions?.riskFactors?.map((risk: string, index: number) => (
                <Text key={index} style={styles.riskFactorItem}>• {risk}</Text>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Comparison */}
      <Card style={styles.comparisonCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Your Twin vs Others</Text>
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonBar, { width: `${twinData?.comparisonData?.you || 82}%`, backgroundColor: COLORS.twin }]} />
              <Text style={styles.comparisonLabel}>You</Text>
              <Text style={styles.comparisonValue}>{twinData?.comparisonData?.you || 82}</Text>
            </View>
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonBar, { width: `${twinData?.comparisonData?.similar || 78}%`, backgroundColor: '#9E9E9E' }]} />
              <Text style={styles.comparisonLabel}>Similar</Text>
              <Text style={styles.comparisonValue}>{twinData?.comparisonData?.similar || 78}</Text>
            </View>
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonBar, { width: `${twinData?.comparisonData?.optimal || 90}%`, backgroundColor: COLORS.health }]} />
              <Text style={styles.comparisonLabel}>Optimal</Text>
              <Text style={styles.comparisonValue}>{twinData?.comparisonData?.optimal || 90}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Insights */}
      <Text style={styles.sectionTitle}>Insights</Text>
      {twinData?.insights?.map((insight: any) => (
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

      {/* Update Info */}
      <Text style={styles.updateInfo}>
        Last updated: {twinData?.lastUpdated || 'Just now'}
      </Text>

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
  twinCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    elevation: 4,
  },
  twinVisualization: {
    alignItems: 'center',
    marginBottom: 20,
  },
  twinOrb: {
    marginBottom: 16,
  },
  twinCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  twinCoreEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  twinScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  twinInfo: {
    alignItems: 'center',
  },
  twinLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.twin,
    marginBottom: 8,
  },
  statusChip: {
    backgroundColor: '#E8F5E9',
  },
  healthRings: {
    alignItems: 'center',
    marginVertical: 20,
  },
  ringContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 60,
    borderWidth: 3,
  },
  ringOuter: {
    width: 120,
    height: 120,
  },
  ringMiddle: {
    width: 90,
    height: 90,
  },
  ringInner: {
    width: 60,
    height: 60,
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringLabel: {
    fontSize: 10,
    color: '#666',
  },
  ringScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  miniStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  personalityCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  personalityType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  personalityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.twin,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  traitChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.twin + '20',
  },
  communicationStyle: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  communicationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  communicationValue: {
    fontSize: 14,
    color: '#333',
  },
  strengthsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthInfo: {
    flex: 1,
  },
  strengthName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  strengthProgress: {
    height: '100%',
    borderRadius: 3,
  },
  strengthScore: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'right',
  },
  areasCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  areaItem: {
    marginBottom: 16,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  focusChip: {
    height: 24,
  },
  areaProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  areaScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  recommendationItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  predictionsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predictionLabel: {
    fontSize: 14,
    color: '#666',
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  wellnessChip: {
    backgroundColor: '#E8F5E9',
  },
  riskFactorsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  riskFactorItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  comparisonContainer: {
    marginTop: 8,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonBar: {
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  comparisonLabel: {
    width: 60,
    fontSize: 12,
    color: '#666',
  },
  comparisonValue: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
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
  updateInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    marginBottom: 20,
  },
  bottomPadding: {
    height: 100,
  },
});