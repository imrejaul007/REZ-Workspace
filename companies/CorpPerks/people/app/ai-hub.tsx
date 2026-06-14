// ==========================================
// MyTalent - AI Hub Screen
// Central hub for all AI agents
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAIAgents } from '../src/hooks/useAIAgents';
import { useAppStore } from '../src/store/useAppStore';
import { Agent } from '../src/services/aiAgentsService';

// ==========================================
// Constants
// ==========================================

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  cardHover: '#334155',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

// ==========================================
// Agent Card Component
// ==========================================

interface AgentCardProps {
  agent: Agent;
  onPress: () => void;
  index: number;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onPress, index }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return COLORS.success;
      case 'busy': return COLORS.warning;
      default: return COLORS.textMuted;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={[styles.cardContainer, animatedStyle]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[agent.color + '20', 'transparent']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(agent.status) }]} />
            <Text style={styles.statusText}>{agent.status}</Text>
          </View>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: agent.color + '30' }]}>
            <Text style={styles.icon}>{agent.icon}</Text>
          </View>

          {/* Content */}
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription} numberOfLines={2}>
            {agent.description}
          </Text>

          {/* Quick action */}
          <TouchableOpacity style={styles.chatButton}>
            <Ionicons name="chatbubbles-outline" size={14} color={COLORS.primary} />
            <Text style={styles.chatButtonText}>Chat Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==========================================
// Recent Conversation Component
// ==========================================

interface RecentConversationProps {
  agent: Agent;
  lastMessage: string;
  timestamp: string;
  onPress: () => void;
}

const RecentConversation: React.FC<RecentConversationProps> = ({
  agent,
  lastMessage,
  timestamp,
  onPress,
}) => {
  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.recentItem} onPress={onPress}>
      <View style={[styles.recentIcon, { backgroundColor: agent.color + '30' }]}>
        <Text style={styles.recentIconText}>{agent.icon}</Text>
      </View>
      <View style={styles.recentContent}>
        <Text style={styles.recentName}>{agent.name}</Text>
        <Text style={styles.recentMessage} numberOfLines={1}>{lastMessage}</Text>
      </View>
      <Text style={styles.recentTime}>{formatTime(timestamp)}</Text>
    </TouchableOpacity>
  );
};

// ==========================================
// Insight Card Component
// ==========================================

interface InsightCardProps {
  type: string;
  title: string;
  description: string;
  score?: number;
  onPress: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  description,
  score,
  onPress,
}) => {
  const getIcon = (t: string) => {
    switch (t) {
      case 'productivity': return 'flash';
      case 'career': return 'trending-up';
      case 'wellness': return 'heart';
      case 'financial': return 'cash';
      case 'learning': return 'book';
      default: return 'bulb';
    }
  };

  const getColor = (t: string) => {
    switch (t) {
      case 'productivity': return COLORS.warning;
      case 'career': return COLORS.primary;
      case 'wellness': return COLORS.error;
      case 'financial': return COLORS.success;
      case 'learning': return '#8B5CF6';
      default: return COLORS.textMuted;
    }
  };

  return (
    <TouchableOpacity style={styles.insightCard} onPress={onPress}>
      <View style={[styles.insightIcon, { backgroundColor: getColor(type) + '20' }]}>
        <Ionicons name={getIcon(type) as any} size={20} color={getColor(type)} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription} numberOfLines={1}>{description}</Text>
      </View>
      {score && (
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getColor(type) }]}>{score}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ==========================================
// Main AI Hub Screen
// ==========================================

export default function AIHubScreen() {
  const router = useRouter();
  const {
    agents,
    conversations,
    isLoadingAgents,
    refreshAgents,
    selectAgent,
    dailyInsights,
    loadInsights,
    isLoadingInsights,
  } = useAIAgents();

  const employee = useAppStore((state) => state.user.employee);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data on mount
  useEffect(() => {
    refreshAgents();
    loadInsights();
  }, [refreshAgents, loadInsights]);

  // Filter agents by search
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get recent conversations
  const recentConversations = conversations
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    .slice(0, 5)
    .map(conv => {
      const agent = agents.find(a => a.id === conv.agentId);
      const lastMessage = conv.messages[conv.messages.length - 1];
      return {
        agent,
        conversation: conv,
        lastMessage: lastMessage?.content || '',
        timestamp: conv.lastMessageAt,
      };
    })
    .filter(item => item.agent);

  // Handle agent press
  const handleAgentPress = (agent: Agent) => {
    selectAgent(agent.id);
    router.push(`/ai-chat/${agent.id}`);
  };

  // Handle insights press
  const handleInsightsPress = () => {
    router.push('/ai-insights');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingAgents}
            onRefresh={refreshAgents}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              Hello, {employee?.name?.split(' ')[0] || 'there'}!
            </Text>
            <Text style={styles.subtitle}>
              Your personal AI assistant for work life
            </Text>
          </View>
          <TouchableOpacity
            style={styles.insightsButton}
            onPress={handleInsightsPress}
          >
            <Ionicons name="analytics-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search agents..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* AI Agents Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Assistants</Text>
            <Text style={styles.sectionCount}>{agents.length} available</Text>
          </View>
        </Animated.View>

        <View style={styles.agentsGrid}>
          {filteredAgents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              onPress={() => handleAgentPress(agent)}
            />
          ))}
        </View>

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Chats</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentContainer}>
              {recentConversations.map((item, index) => (
                <RecentConversation
                  key={item.conversation.id}
                  agent={item.agent!}
                  lastMessage={item.lastMessage}
                  timestamp={item.timestamp}
                  onPress={() => item.agent && handleAgentPress(item.agent)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Daily Insights */}
        {dailyInsights.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Insights</Text>
              <TouchableOpacity onPress={handleInsightsPress}>
                <Text style={styles.seeAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.insightsContainer}>
              {dailyInsights.slice(0, 3).map((insight, index) => (
                <InsightCard
                  key={insight.id}
                  type={insight.type}
                  title={insight.title}
                  description={insight.description}
                  score={insight.score}
                  onPress={handleInsightsPress}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Tips */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.tipsContainer}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
            <Text style={styles.tipTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>
            You can access your AI assistants from any screen by tapping the chat icon in the header.
            Each assistant remembers your conversation context!
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  insightsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  agentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chatButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  recentContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentIconText: {
    fontSize: 18,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  recentMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  recentTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scoreContainer: {
    paddingHorizontal: 10,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipsContainer: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
