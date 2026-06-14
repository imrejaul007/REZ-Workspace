import { logger } from '../../shared/logger';
/**
 * MyRisa Relationships Screen
 * Partner tracking, quality time, relationship insights
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, ProgressBar, Chip, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  relationships: '#EF5350',
  love: '#E91E63',
  quality: '#9C27B0',
  communication: '#673AB7',
};

export default function RelationshipsScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [relationshipsData, setRelationshipsData] = useState<any>(null);

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
      const data = await apiService.getRelationships(uid);
      setRelationshipsData(data);
    } catch (error) {
      logger.error('Error loading relationships:', error);
      setRelationshipsData(getMockData());
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
    overallScore: 85,
    partner: {
      name: 'Amit',
      type: 'partner',
      daysTogether: 365,
      relationshipScore: 82,
      communicationScore: 78,
      qualityTimeScore: 88,
      lastInteraction: '2026-06-10',
      interactionQuality: 'great',
      recentInteractions: [
        { date: '2026-06-10', type: 'call', duration: 30, quality: 'great' },
        { date: '2026-06-09', type: 'video', duration: 45, quality: 'good' },
        { date: '2026-06-08', type: 'in_person', duration: 120, quality: 'excellent' },
        { date: '2026-06-07', type: 'message', duration: 0, quality: 'good' },
      ],
      nextDate: '2026-06-14',
      dateIdeas: [
        { emoji: '🍽️', title: 'Dinner Date', description: 'Try that new restaurant' },
        { emoji: '🎬', title: 'Movie Night', description: 'Watch a film together' },
        { emoji: '🏃', title: 'Morning Walk', description: 'Start the day together' },
        { emoji: '🎨', title: 'Art Class', description: 'Try something new' },
      ],
    },
    weeklyQualityTime: {
      target: 3,
      completed: 2,
      activities: [
        { day: 'Mon', activity: 'Dinner together', completed: true },
        { day: 'Wed', activity: 'Movie night', completed: true },
        { day: 'Fri', activity: 'Date night', completed: false },
        { day: 'Sun', activity: 'Brunch', completed: false },
      ],
    },
    insights: [
      { id: '1', type: 'success', text: 'Your communication score has improved this week!' },
      { id: '2', type: 'info', text: 'You had quality time together 2 times this week.' },
      { id: '3', type: 'warning', text: 'No in-person interaction in 2 days. Plan something!' },
    ],
    milestones: [
      { title: 'Anniversary', days: 365, emoji: '💕' },
      { title: 'First Trip', days: 180, emoji: '✈️' },
      { title: 'Moved In', days: 90, emoji: '🏠' },
    ],
  });

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#4CAF50';
      case 'great': return '#8BC34A';
      case 'good': return '#FF9800';
      case 'neutral': return '#9E9E9E';
      case 'poor': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getQualityEmoji = (quality: string) => {
    switch (quality) {
      case 'excellent': return '🌟';
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'neutral': return '😐';
      case 'poor': return '😔';
      default: return '😐';
    }
  };

  const getInteractionEmoji = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'video': return '📹';
      case 'in_person': return '👫';
      case 'message': return '💬';
      default: return '👤';
    }
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
      <View style={[styles.header, { backgroundColor: COLORS.relationships }]}>
        <Text style={styles.headerEmoji}>❤️</Text>
        <Text style={styles.greeting}>Relationships</Text>
        <Text style={styles.subtitle}>Strengthen your connections</Text>
      </View>

      {/* Relationship Score Card */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { backgroundColor: COLORS.relationships }]}>
              <Text style={styles.scoreNumber}>{relationshipsData?.overallScore || 85}</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Relationship Health</Text>
              <Text style={styles.partnerInfo}>
                {relationshipsData?.partner?.daysTogether || 365} days together
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'partner', label: 'Partner' },
          { value: 'quality', label: 'Quality Time' },
          { value: 'ideas', label: 'Date Ideas' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <Card style={[styles.quickStatCard, { backgroundColor: COLORS.love + '20' }]}>
              <View style={styles.quickStatContent}>
                <Text style={styles.quickStatEmoji}>💕</Text>
                <Text style={styles.quickStatValue}>{relationshipsData?.partner?.relationshipScore || 82}%</Text>
                <Text style={styles.quickStatLabel}>Connection</Text>
              </View>
            </Card>
            <Card style={[styles.quickStatCard, { backgroundColor: COLORS.communication + '20' }]}>
              <View style={styles.quickStatContent}>
                <Text style={styles.quickStatEmoji}>💬</Text>
                <Text style={styles.quickStatValue}>{relationshipsData?.partner?.communicationScore || 78}%</Text>
                <Text style={styles.quickStatLabel}>Communication</Text>
              </View>
            </Card>
            <Card style={[styles.quickStatCard, { backgroundColor: COLORS.quality + '20' }]}>
              <View style={styles.quickStatContent}>
                <Text style={styles.quickStatEmoji}>⏰</Text>
                <Text style={styles.quickStatValue}>{relationshipsData?.partner?.qualityTimeScore || 88}%</Text>
                <Text style={styles.quickStatLabel}>Quality Time</Text>
              </View>
            </Card>
          </View>

          {/* Recent Interaction */}
          <Card style={styles.interactionCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Last Interaction</Text>
              <View style={styles.lastInteraction}>
                <View style={styles.interactionIcon}>
                  <Text style={styles.interactionEmoji}>
                    {getInteractionEmoji(relationshipsData?.partner?.recentInteractions?.[0]?.type)}
                  </Text>
                </View>
                <View style={styles.interactionDetails}>
                  <Text style={styles.interactionType}>
                    {relationshipsData?.partner?.recentInteractions?.[0]?.type?.replace('_', ' ')}
                  </Text>
                  <Text style={styles.interactionMeta}>
                    {relationshipsData?.partner?.recentInteractions?.[0]?.duration || 0} min
                  </Text>
                </View>
                <View style={[
                  styles.qualityBadge,
                  { backgroundColor: getQualityColor(relationshipsData?.partner?.recentInteractions?.[0]?.quality) + '20' }
                ]}>
                  <Text style={styles.qualityBadgeText}>
                    {getQualityEmoji(relationshipsData?.partner?.recentInteractions?.[0]?.quality)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Milestones */}
          <Card style={styles.milestonesCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Milestones</Text>
              <View style={styles.milestonesContainer}>
                {relationshipsData?.milestones?.map((milestone: any, index: number) => (
                  <View key={index} style={styles.milestoneItem}>
                    <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={styles.milestoneDays}>{milestone.days} days</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Partner Tab */}
      {activeTab === 'partner' && (
        <View style={styles.tabContent}>
          {/* Partner Profile */}
          <Card style={styles.partnerCard}>
            <Card.Content>
              <View style={styles.partnerHeader}>
                <View style={styles.partnerAvatar}>
                  <Text style={styles.partnerInitial}>
                    {relationshipsData?.partner?.name?.charAt(0) || 'A'}
                  </Text>
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{relationshipsData?.partner?.name || 'Amit'}</Text>
                  <Chip style={styles.partnerTypeChip}>
                    {relationshipsData?.partner?.type || 'Partner'}
                  </Chip>
                </View>
              </View>
              <View style={styles.partnerStats}>
                <View style={styles.partnerStat}>
                  <Text style={styles.partnerStatValue}>{relationshipsData?.partner?.daysTogether || 365}</Text>
                  <Text style={styles.partnerStatLabel}>Days Together</Text>
                </View>
                <View style={styles.partnerStat}>
                  <Text style={styles.partnerStatValue}>
                    {getQualityEmoji(relationshipsData?.partner?.interactionQuality)}
                  </Text>
                  <Text style={styles.partnerStatLabel}>Last Quality</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Interaction History */}
          <Card style={styles.historyCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Recent Interactions</Text>
              {relationshipsData?.partner?.recentInteractions?.map((interaction: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyEmoji}>
                    {getInteractionEmoji(interaction.type)}
                  </Text>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyType}>
                      {interaction.type.replace('_', ' ')}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {interaction.duration > 0 ? `${interaction.duration} min` : 'Chat'}
                    </Text>
                  </View>
                  <Chip
                    style={[
                      styles.historyQualityChip,
                      { backgroundColor: getQualityColor(interaction.quality) + '20' }
                    ]}
                    textStyle={{ color: getQualityColor(interaction.quality), fontSize: 10 }}
                  >
                    {interaction.quality}
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Add Interaction */}
          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logButtonText}>➕ Log Interaction</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quality Time Tab */}
      {activeTab === 'quality' && (
        <View style={styles.tabContent}>
          {/* Weekly Goal */}
          <Card style={styles.goalCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Weekly Quality Time Goal</Text>
              <View style={styles.goalProgress}>
                <View style={styles.goalCircle}>
                  <Text style={styles.goalValue}>
                    {relationshipsData?.weeklyQualityTime?.completed || 2}/{relationshipsData?.weeklyQualityTime?.target || 3}
                  </Text>
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Sessions this week</Text>
                  <ProgressBar
                    progress={(relationshipsData?.weeklyQualityTime?.completed || 2) / (relationshipsData?.weeklyQualityTime?.target || 3)}
                    color={COLORS.quality}
                    style={styles.goalProgressBar}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Weekly Activities */}
          <Card style={styles.activitiesCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>This Week's Plan</Text>
              {relationshipsData?.weeklyQualityTime?.activities?.map((activity: any, index: number) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[
                    styles.activityDay,
                    { backgroundColor: activity.completed ? COLORS.quality + '20' : '#f0f0f0' }
                  ]}>
                    <Text style={styles.activityDayText}>{activity.day}</Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={[
                      styles.activityName,
                      { color: activity.completed ? '#666' : '#333' }
                    ]}>
                      {activity.activity}
                    </Text>
                  </View>
                  <Text style={styles.activityStatus}>
                    {activity.completed ? '✓' : '○'}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Tips */}
          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Quality Time Tips</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>📵</Text>
                <Text style={styles.tipText}>Put away phones during quality time</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>👂</Text>
                <Text style={styles.tipText}>Practice active listening</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>🎁</Text>
                <Text style={styles.tipText}>Small gestures make big impacts</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>💌</Text>
                <Text style={styles.tipText}>Leave surprise notes or messages</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Date Ideas Tab */}
      {activeTab === 'ideas' && (
        <View style={styles.tabContent}>
          {/* Next Date */}
          <Card style={styles.nextDateCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Next Date</Text>
              <View style={styles.nextDateContainer}>
                <Text style={styles.nextDateEmoji}>💕</Text>
                <View style={styles.nextDateInfo}>
                  <Text style={styles.nextDateLabel}>{relationshipsData?.partner?.nextDate || '2026-06-14'}</Text>
                  <Text style={styles.nextDateText}>Plan something special!</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Date Ideas */}
          <Card style={styles.ideasCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Date Ideas</Text>
              {relationshipsData?.partner?.dateIdeas?.map((idea: any, index: number) => (
                <TouchableOpacity key={index} style={styles.ideaItem}>
                  <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
                  <View style={styles.ideaDetails}>
                    <Text style={styles.ideaTitle}>{idea.title}</Text>
                    <Text style={styles.ideaDescription}>{idea.description}</Text>
                  </View>
                  <Text style={styles.ideaArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          {/* Quick Add */}
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>➕ Suggest Date Idea</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Insights */}
      <Text style={styles.sectionTitle}>Insights</Text>
      {relationshipsData?.insights?.map((insight: any) => (
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
  scoreInfo: {
    flex: 1,
    marginLeft: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  partnerInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tabContent: {
    padding: 16,
  },
  quickStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickStatCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  quickStatContent: {
    alignItems: 'center',
    padding: 12,
  },
  quickStatEmoji: {
    fontSize: 24,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  interactionCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  lastInteraction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactionEmoji: {
    fontSize: 24,
  },
  interactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  interactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  interactionMeta: {
    fontSize: 12,
    color: '#666',
  },
  qualityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityBadgeText: {
    fontSize: 20,
  },
  milestonesCard: {
    borderRadius: 16,
  },
  milestonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  milestoneDays: {
    fontSize: 10,
    color: '#666',
  },
  partnerCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.relationships,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  partnerInfo: {
    marginLeft: 16,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  partnerTypeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  partnerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  partnerStat: {
    alignItems: 'center',
  },
  partnerStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.relationships,
  },
  partnerStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  historyCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  historyMeta: {
    fontSize: 12,
    color: '#666',
  },
  historyQualityChip: {
    height: 24,
  },
  logButton: {
    backgroundColor: COLORS.relationships,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.quality,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  activitiesCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.quality,
  },
  tipsCard: {
    borderRadius: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
  },
  nextDateCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  nextDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextDateEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  nextDateInfo: {
    flex: 1,
  },
  nextDateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.relationships,
  },
  nextDateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  ideasCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ideaEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  ideaDetails: {
    flex: 1,
  },
  ideaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ideaDescription: {
    fontSize: 12,
    color: '#666',
  },
  ideaArrow: {
    fontSize: 18,
    color: '#999',
  },
  addButton: {
    backgroundColor: COLORS.quality,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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