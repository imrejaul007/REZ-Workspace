// ==========================================
// MyTalent - Team Tab
// Team Collaboration Hub
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../components/Badge';
import { teamCollabService, Channel, Announcement, Meeting } from '../../services/teamCollabService';

interface TeamTabProps {
  navigation: any;
}

export default function TeamTab({ navigation }: TeamTabProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'announcements' | 'meetings'>('channels');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [channelsData, announcementsData, meetingsData] = await Promise.all([
        teamCollabService.getMyChannels(),
        teamCollabService.getRecentAnnouncements(5),
        teamCollabService.getUpcomingMeetings(5),
      ]);
      setChannels(channelsData);
      setAnnouncements(announcementsData);
      setMeetings(meetingsData);
    } catch (error) {
      logger.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return '📢';
      case 'private': return '🔒';
      case 'project': return '📋';
      case 'direct': return '💬';
      default: return '💬';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return Colors.primary;
      default: return Colors.textMuted;
    }
  };

  const tabs = [
    { id: 'channels' as const, label: 'Channels', icon: '💬' },
    { id: 'announcements' as const, label: 'Updates', icon: '📢' },
    { id: 'meetings' as const, label: 'Meetings', icon: '📅' },
  ];

  const renderChannelItem = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => navigation.navigate('Chat', { channel: item })}
    >
      <View style={styles.channelIcon}>
        <Text style={styles.channelIconText}>{getChannelIcon(item.type)}</Text>
      </View>
      <View style={styles.channelInfo}>
        <View style={styles.channelHeader}>
          <Text style={styles.channelName}>{item.name}</Text>
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={styles.channelDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <Text style={styles.channelArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <TouchableOpacity style={styles.announcementItem}>
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.announcementContent}>
        <View style={styles.announcementHeader}>
          <Text style={styles.announcementTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.announcementTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.announcementSummary} numberOfLines={2}>
          {item.summary || item.content}
        </Text>
        <View style={styles.announcementMeta}>
          <Text style={styles.announcementAuthor}>By {item.authorName}</Text>
          <Text style={styles.announcementViews}>👁 {item.views}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMeetingItem = ({ item }: { item: Meeting }) => (
    <TouchableOpacity style={styles.meetingItem}>
      <View style={styles.meetingIcon}>
        <Text style={styles.meetingIconText}>
          {item.meetingType === 'video' ? '📹' :
           item.meetingType === 'audio' ? '🎧' :
           item.meetingType === 'in_person' ? '🏢' : '📞'}
        </Text>
      </View>
      <View style={styles.meetingContent}>
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, {
            backgroundColor: item.status === 'scheduled' ? Colors.primaryLight :
                            item.status === 'in_progress' ? '#DCFCE7' : Colors.card
          }]}>
            <Text style={[styles.statusText, {
              color: item.status === 'in_progress' ? Colors.success : Colors.textMuted
            }]}>
              {item.status === 'in_progress' ? 'Live' : formatTime(item.startTime)}
            </Text>
          </View>
        </View>
        <View style={styles.meetingMeta}>
          <Text style={styles.meetingTime}>👥 {item.attendees.length} attendees</Text>
          {item.actionItems.length > 0 && (
            <Text style={styles.meetingActions}>✅ {item.actionItems.filter((a) => a.completed).length}/{item.actionItems.length}</Text>
          )}
        </View>
        {item.meetingLink && item.status === 'scheduled' && (
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'channels':
        return channels.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No channels yet</Text>
            <Text style={styles.emptySubtitle}>Join a channel to start collaborating</Text>
          </View>
        ) : (
          <FlatList
            data={channels}
            keyExtractor={(item) => item.channelId}
            renderItem={renderChannelItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );

      case 'announcements':
        return announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>No announcements</Text>
            <Text style={styles.emptySubtitle}>New updates will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.announcementId}
            renderItem={renderAnnouncementItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );

      case 'meetings':
        return meetings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No upcoming meetings</Text>
            <Text style={styles.emptySubtitle}>Schedule a meeting to collaborate</Text>
          </View>
        ) : (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.meetingId}
            renderItem={renderMeetingItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Hub</Text>
        <Text style={styles.headerSubtitle}>Collaborate with your team</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{channels.length}</Text>
          <Text style={styles.statLabel}>Channels</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{announcements.length}</Text>
          <Text style={styles.statLabel}>Updates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{meetings.length}</Text>
          <Text style={styles.statLabel}>Meetings</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelIconText: {
    fontSize: 20,
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  channelDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  channelArrow: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  announcementItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  priorityIndicator: {
    width: 4,
  },
  announcementContent: {
    flex: 1,
    padding: 14,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  announcementTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  announcementSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  announcementAuthor: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  announcementViews: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  meetingItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  meetingIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetingIconText: {
    fontSize: 20,
  },
  meetingContent: {
    flex: 1,
    marginLeft: 12,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meetingMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  meetingTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  meetingActions: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
