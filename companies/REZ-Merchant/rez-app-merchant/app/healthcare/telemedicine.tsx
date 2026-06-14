/**
 * Telemedicine Screen
 * Virtual consultations and video call management
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card, Avatar } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';

// Types
export type TelemedicineStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface TelemedicineSession {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  doctorId: string;
  doctorName: string;
  scheduledTime: Date;
  status: TelemedicineStatus;
  type: 'video' | 'audio' | 'chat';
  reason: string;
  notes?: string;
  duration?: number; // in seconds
  waitingRoom?: number; // patients waiting
}

// Mock data
const mockSessions: TelemedicineSession[] = [
  {
    id: '1',
    patientId: '2',
    patientName: 'Sarah Johnson',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    scheduledTime: new Date(),
    status: 'in_progress',
    type: 'video',
    reason: 'Follow-up consultation',
    notes: 'Patient has been waiting for 5 minutes',
    waitingRoom: 2,
  },
  {
    id: '2',
    patientId: '4',
    patientName: 'Emily Davis',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    scheduledTime: new Date(Date.now() + 15 * 60 * 1000),
    status: 'scheduled',
    type: 'video',
    reason: 'Prescription renewal',
  },
  {
    id: '3',
    patientId: '5',
    patientName: 'Robert Wilson',
    doctorId: 'd2',
    doctorName: 'Dr. James Wilson',
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000),
    status: 'scheduled',
    type: 'audio',
    reason: 'Lab results review',
  },
  {
    id: '4',
    patientId: '1',
    patientName: 'John Smith',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    scheduledTime: new Date(Date.now() - 60 * 60 * 1000),
    status: 'completed',
    type: 'video',
    reason: 'Blood pressure check',
    duration: 900, // 15 minutes
  },
  {
    id: '5',
    patientId: '3',
    patientName: 'Michael Brown',
    doctorId: 'd2',
    doctorName: 'Dr. James Wilson',
    scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'completed',
    type: 'chat',
    reason: 'Prescription inquiry',
    duration: 1200, // 20 minutes
  },
];

// Helper functions
const getStatusColor = (status: TelemedicineStatus): string => {
  const colors: Record<TelemedicineStatus, string> = {
    scheduled: Colors.light.info,
    in_progress: Colors.light.success,
    completed: Colors.light.primary,
    cancelled: Colors.light.danger,
    no_show: Colors.light.textMuted,
  };
  return colors[status];
};

const getStatusLabel = (status: TelemedicineStatus): string => {
  const labels: Record<TelemedicineStatus, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return labels[status];
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface SessionCardProps {
  session: TelemedicineSession;
  onPress: () => void;
  onJoin?: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onPress, onJoin }) => {
  const isActive = session.status === 'in_progress';
  const canJoin = session.status === 'scheduled' || session.status === 'in_progress';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card
        variant="elevated"
        padding="md"
        style={[styles.sessionCard, isActive && styles.sessionCardActive]}
      >
        {isActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        <View style={styles.sessionHeader}>
          <View style={styles.participantInfo}>
            <Avatar
              size="medium"
              initials={`${session.patientName.split(' ')[0][0]}${session.patientName.split(' ')[1]?.[0] || ''}`}
              backgroundColor={Colors.light.primaryLight2}
              textColor={Colors.light.primary}
            />
            <View style={styles.participantDetails}>
              <Text style={styles.patientName}>{session.patientName}</Text>
              <View style={styles.doctorInfo}>
                <Ionicons name="person-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.doctorName}>{session.doctorName}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(session.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
              {getStatusLabel(session.status)}
            </Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={styles.reasonText}>{session.reason}</Text>
        </View>

        <View style={styles.sessionMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name={
                session.type === 'video'
                  ? 'videocam-outline'
                  : session.type === 'audio'
                    ? 'call-outline'
                    : 'chatbubble-outline'
              }
              size={16}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.metaText}>
              {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{formatTime(session.scheduledTime)}</Text>
          </View>
          {session.duration && (
            <View style={styles.metaItem}>
              <Ionicons name="timer-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.metaText}>{formatDuration(session.duration)}</Text>
            </View>
          )}
          {session.waitingRoom && session.waitingRoom > 0 && (
            <View style={styles.waitingBadge}>
              <Text style={styles.waitingText}>{session.waitingRoom} waiting</Text>
            </View>
          )}
        </View>

        {canJoin && (
          <TouchableOpacity
            style={[styles.joinButton, isActive && styles.joinButtonActive]}
            onPress={onJoin}
          >
            <Ionicons
              name={session.type === 'video' ? 'videocam' : session.type === 'audio' ? 'call' : 'chatbubbles'}
              size={20}
              color="#fff"
            />
            <Text style={styles.joinButtonText}>
              {isActive ? 'Rejoin Call' : 'Join Call'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
};

export default function TelemedicineScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [sessions, setSessions] = useState<TelemedicineSession[]>(mockSessions);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeSession = sessions.find((s) => s.status === 'in_progress');
  const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions().finally(() => setRefreshing(false));
  }, [fetchSessions]);

  const handleSessionPress = useCallback((session: TelemedicineSession) => {
    router.push(`/healthcare/telemedicine/${session.id}`);
  }, []);

  const handleJoinCall = useCallback((session: TelemedicineSession) => {
    Alert.alert(
      'Join Video Call',
      `Connecting to ${session.patientName}...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            // Would navigate to video call screen
            Alert.alert('Video Call', 'Video call feature would open here');
          },
        },
      ]
    );
  }, []);

  const handleStartNewSession = useCallback(() => {
    Alert.alert('Start Session', 'Session creation modal would open here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => {} },
    ]);
  }, []);

  const renderActiveSession = () => {
    if (!activeSession) return null;

    return (
      <Animated.View entering={FadeInUp} style={styles.activeSessionContainer}>
        <LinearGradient
          colors={[Colors.light.success, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeGradient}
        >
          <View style={styles.activeHeader}>
            <View style={styles.activeInfo}>
              <View style={styles.liveIndicator}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveLabel}>LIVE SESSION</Text>
              </View>
              <Text style={styles.activePatientName}>{activeSession.patientName}</Text>
              <Text style={styles.activeReason}>{activeSession.reason}</Text>
            </View>
          </View>
          <View style={styles.activeActions}>
            <TouchableOpacity
              style={styles.activeButton}
              onPress={() => handleJoinCall(activeSession)}
            >
              <Ionicons name="videocam" size={24} color={Colors.light.success} />
              <Text style={styles.activeButtonText}>View Session</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderSessionList = (title: string, data: TelemedicineSession[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map((session, index) => (
          <Animated.View key={session.id} entering={FadeInDown.delay(index * 50)}>
            <SessionCard
              session={session}
              onPress={() => handleSessionPress(session)}
              onJoin={() => handleJoinCall(session)}
            />
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Telemedicine</Text>
        <TouchableOpacity onPress={handleStartNewSession} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.light.primaryLight2 }]}>
            <Ionicons name="videocam" size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.statValue}>{scheduledSessions.length}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.light.successLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
          </View>
          <Text style={styles.statValue}>{completedSessions.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.light.infoLight }]}>
            <Ionicons name="people" size={20} color={Colors.light.info} />
          </View>
          <Text style={styles.statValue}>{sessions.filter((s) => s.status === 'in_progress').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          ListHeaderComponent={
            <View>
              {renderActiveSession()}
              {renderSessionList('Upcoming Sessions', scheduledSessions)}
              {renderSessionList('Recent Sessions', completedSessions)}
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={64} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No Sessions</Text>
              <Text style={styles.emptyText}>
                No telemedicine sessions scheduled
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  addButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  activeSessionContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activeGradient: {
    padding: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeInfo: {
    flex: 1,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  livePatientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  activeReason: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  activeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  sessionCard: {
    marginBottom: 12,
  },
  sessionCardActive: {
    borderWidth: 2,
    borderColor: Colors.light.success,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
    marginRight: 8,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.success,
    letterSpacing: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantDetails: {
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  doctorName: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  waitingBadge: {
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.warning,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  joinButtonActive: {
    backgroundColor: Colors.light.success,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
