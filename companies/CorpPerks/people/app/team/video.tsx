// ==========================================
// MyTalent - Video Meetings Screen
// Video Conferencing & Meeting Management
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Colors } from '../../src/components/Badge';

interface VideoMeeting {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  startTime: string;
  endTime: string;
  duration: number;
  meetingLink: string;
  platform: 'zoom' | 'google-meet' | 'teams' | 'webex' | 'internal';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  attendees: {
    id: string;
    name: string;
    avatar?: string;
    status: 'pending' | 'accepted' | 'declined' | 'maybe';
  }[];
  isRecurring: boolean;
  recurrencePattern?: string;
  description?: string;
  agenda?: string[];
  recordingAvailable?: boolean;
  recordingLink?: string;
}

interface MeetingStats {
  todayMeetings: number;
  weeklyHours: number;
  upcomingMeetings: number;
  totalRecordings: number;
}

export default function VideoMeetingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recordings' | 'schedule'>('upcoming');
  const [selectedMeeting, setSelectedMeeting] = useState<VideoMeeting | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const mockStats: MeetingStats = {
    todayMeetings: 3,
    weeklyHours: 12,
    upcomingMeetings: 8,
    totalRecordings: 24,
  };

  const mockMeetings: VideoMeeting[] = [
    {
      id: '1',
      title: 'Sprint Planning - Q2 Week 22',
      hostName: 'Priya Sharma',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      duration: 60,
      meetingLink: 'https://zoom.us/j/123456789',
      platform: 'zoom',
      status: 'in-progress',
      attendees: [
        { id: '1', name: 'Rahul K.', status: 'accepted' },
        { id: '2', name: 'Anita R.', status: 'accepted' },
        { id: '3', name: 'Vikram S.', status: 'accepted' },
        { id: '4', name: 'Meera P.', status: 'maybe' },
      ],
      isRecurring: true,
      recurrencePattern: 'Every Monday',
      agenda: ['Review sprint goals', 'Assign tasks', 'Discuss blockers'],
    },
    {
      id: '2',
      title: '1:1 with Manager - Performance Review',
      hostName: 'Raj Mehta',
      startTime: new Date(Date.now() + 7200000).toISOString(),
      endTime: new Date(Date.now() + 7800000).toISOString(),
      duration: 30,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      platform: 'google-meet',
      status: 'scheduled',
      attendees: [
        { id: '1', name: 'You', status: 'accepted' },
        { id: '2', name: 'Raj Mehta', status: 'accepted' },
      ],
      isRecurring: false,
      description: 'Monthly performance review discussion',
    },
    {
      id: '3',
      title: 'Product Demo - New Dashboard Features',
      hostName: 'Sneha K.',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 9000000).toISOString(),
      duration: 45,
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/123',
      platform: 'teams',
      status: 'scheduled',
      attendees: [
        { id: '1', name: 'You', status: 'pending' },
        { id: '2', name: 'Sneha K.', status: 'accepted' },
        { id: '3', name: 'Design Team', status: 'accepted' },
        { id: '4', name: 'QA Team', status: 'accepted' },
        { id: '5', name: 'Dev Team', status: 'pending' },
      ],
      isRecurring: false,
      description: 'Live demo of the new analytics dashboard',
    },
    {
      id: '4',
      title: 'Weekly Team Standup',
      hostName: 'Amit V.',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      endTime: new Date(Date.now() + 174600000).toISOString(),
      duration: 15,
      meetingLink: 'https://meet.google.com/xyz-abc-def',
      platform: 'google-meet',
      status: 'scheduled',
      attendees: [
        { id: '1', name: 'You', status: 'accepted' },
        { id: '2', name: 'Amit V.', status: 'accepted' },
        { id: '3', name: 'Team Members (8)', status: 'accepted' },
      ],
      isRecurring: true,
      recurrencePattern: 'Every Tuesday, Thursday',
      agenda: ['Updates', 'Blockers', 'Any questions'],
    },
    {
      id: '5',
      title: 'Client Presentation - Q2 Results',
      hostName: 'Neha G.',
      startTime: new Date(Date.now() + 259200000).toISOString(),
      endTime: new Date(Date.now() + 2700000).toISOString(),
      duration: 60,
      meetingLink: 'https://webex.com/meet/neha.g',
      platform: 'webex',
      status: 'scheduled',
      attendees: [
        { id: '1', name: 'You', status: 'accepted' },
        { id: '2', name: 'Neha G.', status: 'accepted' },
        { id: '3', name: 'Client Team (5)', status: 'accepted' },
      ],
      isRecurring: false,
      description: 'Quarterly business review with client',
    },
  ];

  const mockRecordings: Array<{
    id: string;
    title: string;
    meetingTitle: string;
    date: string;
    duration: number;
    hostName: string;
    attendees: number;
    views: number;
    size: string;
  }> = [
    {
      id: '1',
      title: 'Sprint Planning - Q2 Week 21',
      meetingTitle: 'Sprint Planning',
      date: new Date(Date.now() - 604800000).toISOString(),
      duration: 55,
      hostName: 'Priya Sharma',
      attendees: 8,
      views: 12,
      size: '450 MB',
    },
    {
      id: '2',
      title: 'Product Roadmap Review',
      meetingTitle: 'Product Sync',
      date: new Date(Date.now() - 1209600000).toISOString(),
      duration: 90,
      hostName: 'Sneha K.',
      attendees: 12,
      views: 25,
      size: '820 MB',
    },
    {
      id: '3',
      title: 'Technical Deep Dive - Auth System',
      meetingTitle: 'Architecture Review',
      date: new Date(Date.now() - 1814400000).toISOString(),
      duration: 75,
      hostName: 'Vikram S.',
      attendees: 5,
      views: 8,
      size: '680 MB',
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // API call would go here
      // const response = await videoService.getMeetings(employeeId);
    } catch (error) {
      logger.error('Failed to load meetings:', error);
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
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return '🔵';
      case 'google-meet':
        return '🟢';
      case 'teams':
        return '🔷';
      case 'webex':
        return '🔴';
      case 'internal':
        return '💻';
      default:
        return '📹';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return '#2D8CFF';
      case 'google-meet':
        return '#00897B';
      case 'teams':
        return '#6264A7';
      case 'webex':
        return '#EB3B3B';
      case 'internal':
        return '#8b5cf6';
      default:
        return Colors.textMuted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'scheduled':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'completed':
        return { bg: '#f3f4f6', text: '#6b7280' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const handleJoinMeeting = async (meeting: VideoMeeting) => {
    if (!meeting.meetingLink) {
      Alert.alert('No Link', 'This meeting does not have a video link.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(meeting.meetingLink);
      if (supported) {
        await Linking.openURL(meeting.meetingLink);
      } else {
        Alert.alert('Error', 'Cannot open meeting link. Please try copying the link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open meeting link.');
    }
  };

  const handleScheduleMeeting = () => {
    Alert.alert('Schedule Meeting', 'This will open the meeting scheduler.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => {} },
    ]);
  };

  const todayMeetings = mockMeetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start.toDateString() === today.toDateString();
  });

  const upcomingMeetings = mockMeetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start > today;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Meetings</Text>
        <Text style={styles.headerSubtitle}>Your scheduled meetings</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockStats.todayMeetings}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {mockStats.weeklyHours}h
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>
            {mockStats.upcomingMeetings}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {mockStats.totalRecordings}
          </Text>
          <Text style={styles.statLabel}>Recordings</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recordings' && styles.tabActive]}
          onPress={() => setActiveTab('recordings')}
        >
          <Text style={[styles.tabText, activeTab === 'recordings' && styles.tabTextActive]}>
            Recordings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
            Schedule
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'upcoming' && (
          <>
            {/* Today */}
            {todayMeetings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today</Text>
                {todayMeetings.map((meeting) => {
                  const statusStyle = getStatusColor(meeting.status);
                  const platformColor = getPlatformColor(meeting.platform);

                  return (
                    <TouchableOpacity
                      key={meeting.id}
                      style={styles.meetingCard}
                      onPress={() => setSelectedMeeting(meeting)}
                    >
                      <View style={styles.meetingHeader}>
                        <View
                          style={[
                            styles.platformBadge,
                            { backgroundColor: platformColor + '20' },
                          ]}
                        >
                          <Text style={styles.platformIcon}>
                            {getPlatformIcon(meeting.platform)}
                          </Text>
                        </View>
                        <View style={styles.meetingInfo}>
                          <Text style={styles.meetingTitle} numberOfLines={1}>
                            {meeting.title}
                          </Text>
                          <Text style={styles.meetingHost}>by {meeting.hostName}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {meeting.status === 'in-progress' ? 'LIVE' : formatTime(meeting.startTime)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.meetingMeta}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaIcon}>🕐</Text>
                          <Text style={styles.metaText}>
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaIcon}>⏱️</Text>
                          <Text style={styles.metaText}>{meeting.duration} min</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaIcon}>👥</Text>
                          <Text style={styles.metaText}>{meeting.attendees.length}</Text>
                        </View>
                      </View>

                      {meeting.isRecurring && (
                        <View style={styles.recurringBadge}>
                          <Text style={styles.recurringIcon}>🔁</Text>
                          <Text style={styles.recurringText}>{meeting.recurrencePattern}</Text>
                        </View>
                      )}

                      {(meeting.status === 'in-progress' || meeting.status === 'scheduled') && (
                        <TouchableOpacity
                          style={styles.joinButton}
                          onPress={() => handleJoinMeeting(meeting)}
                        >
                          <Text style={styles.joinButtonText}>Join Meeting</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Upcoming */}
            {upcomingMeetings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {upcomingMeetings.map((meeting) => {
                  const statusStyle = getStatusColor(meeting.status);
                  const platformColor = getPlatformColor(meeting.platform);

                  return (
                    <TouchableOpacity
                      key={meeting.id}
                      style={styles.meetingCard}
                      onPress={() => setSelectedMeeting(meeting)}
                    >
                      <View style={styles.meetingHeader}>
                        <View
                          style={[
                            styles.platformBadge,
                            { backgroundColor: platformColor + '20' },
                          ]}
                        >
                          <Text style={styles.platformIcon}>
                            {getPlatformIcon(meeting.platform)}
                          </Text>
                        </View>
                        <View style={styles.meetingInfo}>
                          <Text style={styles.meetingTitle} numberOfLines={1}>
                            {meeting.title}
                          </Text>
                          <Text style={styles.meetingHost}>
                            {formatDate(meeting.startTime)} • {formatTime(meeting.startTime)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.meetingMeta}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaIcon}>👥</Text>
                          <Text style={styles.metaText}>{meeting.attendees.length} attendees</Text>
                        </View>
                        {meeting.description && (
                          <Text style={styles.meetingDesc} numberOfLines={1}>
                            {meeting.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {todayMeetings.length === 0 && upcomingMeetings.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No upcoming meetings</Text>
                <Text style={styles.emptyDesc}>You're all caught up!</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'recordings' && (
          <>
            <Text style={styles.sectionTitle}>Meeting Recordings</Text>
            {mockRecordings.map((recording) => (
              <TouchableOpacity
                key={recording.id}
                style={styles.recordingCard}
                onPress={() => Alert.alert('Play Recording', 'Opening video player...')}
              >
                <View style={styles.recordingThumbnail}>
                  <Text style={styles.recordingPlayIcon}>▶️</Text>
                </View>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingTitle} numberOfLines={1}>
                    {recording.title}
                  </Text>
                  <View style={styles.recordingMeta}>
                    <Text style={styles.recordingDate}>
                      {new Date(recording.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <Text style={styles.recordingDot}>•</Text>
                    <Text style={styles.recordingDuration}>{recording.duration} min</Text>
                    <Text style={styles.recordingDot}>•</Text>
                    <Text style={styles.recordingSize}>{recording.size}</Text>
                  </View>
                  <View style={styles.recordingStats}>
                    <Text style={styles.recordingStat}>👁 {recording.views} views</Text>
                    <Text style={styles.recordingStat}>👥 {recording.attendees}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => Alert.alert('All Recordings', 'Opening recordings library...')}
            >
              <Text style={styles.viewAllText}>View All Recordings</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            {/* Quick Schedule */}
            <Text style={styles.sectionTitle}>Quick Schedule</Text>
            <View style={styles.scheduleCard}>
              <TouchableOpacity
                style={styles.scheduleOption}
                onPress={handleScheduleMeeting}
              >
                <Text style={styles.scheduleIcon}>📹</Text>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>Video Meeting</Text>
                  <Text style={styles.scheduleDesc}>Start an instant or scheduled meeting</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scheduleOption}
                onPress={handleScheduleMeeting}
              >
                <Text style={styles.scheduleIcon}>🎥</Text>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>Record Session</Text>
                  <Text style={styles.scheduleDesc}>Start a recording session</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scheduleOption}
                onPress={handleScheduleMeeting}
              >
                <Text style={styles.scheduleIcon}>👥</Text>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>Team Standup</Text>
                  <Text style={styles.scheduleDesc}>Quick daily or weekly sync</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Platform Selection */}
            <Text style={styles.sectionTitle}>Default Platform</Text>
            <View style={styles.platformsCard}>
              <TouchableOpacity style={styles.platformOption}>
                <View style={[styles.platformIconBox, { backgroundColor: '#2D8CFF20' }]}>
                  <Text style={styles.platformOptionIcon}>🔵</Text>
                </View>
                <Text style={[styles.platformOptionName, { color: '#2D8CFF' }]}>Zoom</Text>
                <View style={styles.platformCheck}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.platformOption}>
                <View style={[styles.platformIconBox, { backgroundColor: '#00897B20' }]}>
                  <Text style={styles.platformOptionIcon}>🟢</Text>
                </View>
                <Text style={styles.platformOptionName}>Google Meet</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.platformOption}>
                <View style={[styles.platformIconBox, { backgroundColor: '#6264A720' }]}>
                  <Text style={styles.platformOptionIcon}>🔷</Text>
                </View>
                <Text style={styles.platformOptionName}>Microsoft Teams</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.platformOption}>
                <View style={[styles.platformIconBox, { backgroundColor: '#EB3B3B20' }]}>
                  <Text style={styles.platformOptionIcon}>🔴</Text>
                </View>
                <Text style={styles.platformOptionName}>Webex</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Meeting Detail Modal */}
      <Modal
        visible={!!selectedMeeting}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedMeeting(null)}
      >
        {selectedMeeting && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meeting Details</Text>
              <TouchableOpacity onPress={() => setSelectedMeeting(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Meeting Title */}
              <View style={styles.modalMeetingHeader}>
                <View
                  style={[
                    styles.modalPlatformBadge,
                    { backgroundColor: getPlatformColor(selectedMeeting.platform) },
                  ]}
                >
                  <Text style={styles.modalPlatformIcon}>
                    {getPlatformIcon(selectedMeeting.platform)}
                  </Text>
                  <Text style={styles.modalPlatformName}>
                    {selectedMeeting.platform === 'google-meet'
                      ? 'Google Meet'
                      : selectedMeeting.platform.charAt(0).toUpperCase() +
                        selectedMeeting.platform.slice(1)}
                  </Text>
                </View>
                <Text style={styles.modalMeetingTitle}>{selectedMeeting.title}</Text>
                <Text style={styles.modalMeetingHost}>Hosted by {selectedMeeting.hostName}</Text>
              </View>

              {/* Time & Duration */}
              <View style={styles.modalSection}>
                <View style={styles.modalRow}>
                  <View style={styles.modalIconBox}>
                    <Text style={styles.modalIcon}>📅</Text>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Date & Time</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedMeeting.startTime).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.modalSubvalue}>
                      {formatTime(selectedMeeting.startTime)} - {formatTime(selectedMeeting.endTime)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRow}>
                  <View style={styles.modalIconBox}>
                    <Text style={styles.modalIcon}>⏱️</Text>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Duration</Text>
                    <Text style={styles.modalValue}>{selectedMeeting.duration} minutes</Text>
                  </View>
                </View>

                {selectedMeeting.isRecurring && (
                  <View style={styles.modalRow}>
                    <View style={styles.modalIconBox}>
                      <Text style={styles.modalIcon}>🔁</Text>
                    </View>
                    <View>
                      <Text style={styles.modalLabel}>Recurrence</Text>
                      <Text style={styles.modalValue}>
                        {selectedMeeting.recurrencePattern}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Description */}
              {selectedMeeting.description && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalDescription}>
                    {selectedMeeting.description}
                  </Text>
                </View>
              )}

              {/* Agenda */}
              {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Agenda</Text>
                  {selectedMeeting.agenda.map((item, index) => (
                    <View key={index} style={styles.agendaItem}>
                      <View style={styles.agendaNumber}>
                        <Text style={styles.agendaNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.agendaText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Attendees */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Attendees ({selectedMeeting.attendees.length})
                </Text>
                {selectedMeeting.attendees.map((attendee) => (
                  <View key={attendee.id} style={styles.attendeeRow}>
                    <View style={styles.attendeeAvatar}>
                      <Text style={styles.attendeeInitial}>
                        {attendee.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.attendeeName}>{attendee.name}</Text>
                    <View
                      style={[
                        styles.attendeeStatus,
                        {
                          backgroundColor:
                            attendee.status === 'accepted'
                              ? '#dcfce7'
                              : attendee.status === 'declined'
                              ? '#fee2e2'
                              : attendee.status === 'maybe'
                              ? '#fef3c7'
                              : '#f3f4f6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.attendeeStatusText,
                          {
                            color:
                              attendee.status === 'accepted'
                                ? '#15803d'
                                : attendee.status === 'declined'
                                ? '#dc2626'
                                : attendee.status === 'maybe'
                                ? '#b45309'
                                : '#6b7280',
                          },
                        ]}
                      >
                        {attendee.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Recording */}
              {selectedMeeting.recordingAvailable && (
                <TouchableOpacity style={styles.recordingButton}>
                  <Text style={styles.recordingButtonIcon}>🎬</Text>
                  <Text style={styles.recordingButtonText}>View Recording</Text>
                </TouchableOpacity>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => {
                    Alert.alert('Cancel', 'Opening cancellation form...');
                  }}
                >
                  <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    handleJoinMeeting(selectedMeeting);
                    setSelectedMeeting(null);
                  }}
                >
                  <Text style={styles.modalPrimaryButtonText}>Join Meeting</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    backgroundColor: '#ec4899',
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
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ec4899',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ec4899',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meetingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  platformIcon: {
    fontSize: 18,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  meetingHost: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meetingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  meetingDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recurringIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  recurringText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  joinButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  recordingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  recordingThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingPlayIcon: {
    fontSize: 24,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  recordingDot: {
    fontSize: 11,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  recordingDuration: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  recordingSize: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  recordingStats: {
    flexDirection: 'row',
    gap: 12,
  },
  recordingStat: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  viewAllButton: {
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  scheduleCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scheduleIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  scheduleDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  platformsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  platformIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformOptionIcon: {
    fontSize: 18,
  },
  platformOptionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  platformCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: '#ec4899',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalMeetingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalPlatformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalPlatformIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  modalPlatformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalMeetingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalMeetingHost: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  modalSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalIcon: {
    fontSize: 16,
  },
  modalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  modalSubvalue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  agendaNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  agendaNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  agendaText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  attendeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  attendeeInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendeeName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  attendeeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attendeeStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  recordingButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recordingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#ec4899',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
