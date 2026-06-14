// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Constants from 'expo-constants';
import { logger } from '@/utils/logger';

// API Configuration - Use SecureStore for auth token, not AsyncStorage
const API_URL = process.env.EXPO_PUBLIC_SAFE_QR_API || 'https://rez-safe-qr-service.onrender.com/api';
const AUTH_TOKEN_KEY = 'authToken';

// Types
interface SafeQR {
  shortcode: string;
  qrId: string;
  mode: string;
  status: string;
  stats?: {
    totalScans: number;
    uniqueScanners: number;
    totalMessages: number;
  };
  profile?;
  createdAt?: string;
}

interface Session {
  sessionId: string;
  shortcode: string;
  mode: string;
  status: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderRole: string;
    createdAt: string;
  };
}

interface KarmaState {
  totalPoints: number;
  helpCount: number;
  level: string;
  badge: string;
}

const MODE_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  pet: { icon: '🐕', color: '#f59e0b', name: 'Pet' },
  personal: { icon: '👤', color: '#6366f1', name: 'Personal' },
  device: { icon: '💻', color: '#10b981', name: 'Device' },
  medical: { icon: '🏥', color: '#ef4444', name: 'Medical' },
  helmet: { icon: '⛑️', color: '#8b5cf6', name: 'Helmet' },
  child: { icon: '👶', color: '#ec4899', name: 'Child' },
  vehicle: { icon: '🚗', color: '#3b82f6', name: 'Vehicle' },
  bicycle: { icon: '🚲', color: '#f97316', name: 'Bicycle' },
  key: { icon: '🔑', color: '#84cc16', name: 'Key' },
  luggage: { icon: '🧳', color: '#06b6d4', name: 'Luggage' },
  home: { icon: '🏠', color: '#14b8a6', name: 'Home' },
  office: { icon: '🏢', color: '#64748b', name: 'Office' },
  event: { icon: '🎉', color: '#d946ef', name: 'Event' },
  student: { icon: '🎒', color: '#0ea5e9', name: 'Student' },
  package: { icon: '📦', color: '#a855f7', name: 'Package' },
};

export default function SafeQRScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'myqrs' | 'messages' | 'karma'>('home');
  const [myQrs, setMyQrs] = useState<SafeQR[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [karma, setKarma] = useState<KarmaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [createProfile, setCreateProfile] = useState<unknown>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // SECURITY FIX: Use SecureStore instead of AsyncStorage for auth tokens
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        Alert.alert('Login Required', 'Please login to access Safe QR');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [qrRes, sessionRes, karmaRes] = await Promise.all([
        fetch(`${API_URL}/qr/my`, { headers }).catch(() => ({ ok: false, json: async () => ({ success: false, data: [] }) })),
        fetch(`${API_URL}/sessions`, { headers }).catch(() => ({ ok: false, json: async () => ({ success: false, data: [] }) })),
        fetch(`${API_URL}/karma/state`, { headers }).catch(() => ({ ok: false, json: async () => ({ success: false, data: null }) })),
      ]);

      const qrData = await qrRes.json();
      const sessionData = await sessionRes.json();
      const karmaData = await karmaRes.json();

      if (qrData.success) setMyQrs(qrData.data || []);
      if (sessionData.success) setSessions(sessionData.data || []);
      if (karmaData.success) setKarma(karmaData.data);
    } catch (error) {
      logger.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleLostMode(qr: SafeQR) {
    const newStatus = qr.status === 'lost' ? 'active' : 'lost';
    const confirmMessage = newStatus === 'lost'
      ? 'Mark this QR as lost? Finder will see your contact info.'
      : 'Mark this QR as found? This will restore normal mode.';

    Alert.alert(
      newStatus === 'lost' ? 'Mark as Lost' : 'Mark as Found',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'lost' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
              if (!token) {
                Alert.alert('Error', 'Please login first');
                return;
              }

              const response = await fetch(`${API_URL}/qr/${qr.qrId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
              });

              const data = await response.json();
              if (data.success) {
                // Update local state
                setMyQrs(prev => prev.map(q =>
                  q.qrId === qr.qrId ? { ...q, status: newStatus } : q
                ));
                Alert.alert(
                  'Success',
                  newStatus === 'lost' ? 'QR marked as lost!' : 'QR marked as found!'
                );
              } else {
                Alert.alert('Error', data.error?.message || 'Failed to update status');
              }
            } catch (error) {
              logger.error('Toggle lost mode error:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  }

  async function createQR() {
    if (!selectedMode) {
      Alert.alert('Error', 'Please select a mode');
      return;
    }

    // SECURITY FIX: Use SecureStore instead of AsyncStorage for auth tokens
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!token) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: selectedMode,
          profile: { mode: selectedMode, ...createProfile },
          settings: {},
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success!', `Your Safe QR (${data.data.shortcode}) has been created!`);
        setShowCreate(false);
        setSelectedMode(null);
        setCreateProfile({});
        loadData();
      } else {
        Alert.alert('Error', data.error?.message || 'Failed to create QR');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create QR');
    }
  }

  async function shareQR(shortcode: string) {
    try {
      await Share.share({
        message: `Scan my Safe QR: https://rez.app/s/${shortcode}`,
      });
    } catch (error) {
      logger.error('Share error:', error);
    }
  }

  const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Safe QR</Text>
            <Text style={styles.headerSubtitle}>Protect what matters</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/account/profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Karma Mini Card */}
        {karma && (
          <TouchableOpacity style={styles.karmaMini} onPress={() => setActiveTab('karma')}>
            <Text style={styles.karmaBadge}>{karma.badge}</Text>
            <View>
              <Text style={styles.karmaLevel}>{karma.level}</Text>
              <Text style={styles.karmaPoints}>{karma.totalPoints} pts</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['home', 'myqrs', 'messages', 'karma'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'home' ? 'Home' : tab === 'myqrs' ? 'My QRs' : tab === 'messages' ? `Messages${totalUnread > 0 ? ` (${totalUnread})` : ''}` : 'Karma'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowCreate(true)}>
                  <Text style={styles.actionIcon}>+</Text>
                  <Text style={styles.actionText}>Create QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/safe-qr/scan')}>
                  <Text style={styles.actionIcon}>📷</Text>
                  <Text style={styles.actionText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent QRs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent QRs</Text>
                <TouchableOpacity onPress={() => setActiveTab('myqrs')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {myQrs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🏷️</Text>
                  <Text style={styles.emptyText}>No Safe QRs yet</Text>
                  <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
                    <Text style={styles.createButtonText}>Create Your First QR</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myQrs.slice(0, 3).map((qr) => {
                  const config = MODE_CONFIG[qr.mode] || MODE_CONFIG.pet;
                  return (
                    <TouchableOpacity key={qr.shortcode} style={styles.qrCard}>
                      <View style={[styles.modeIcon, { backgroundColor: config.color + '20' }]}>
                        <Text style={styles.modeIconText}>{config.icon}</Text>
                      </View>
                      <View style={styles.qrInfo}>
                        <Text style={styles.qrShortcode}>{qr.shortcode}</Text>
                        <Text style={styles.qrMode}>{config.name}</Text>
                        <Text style={styles.qrStats}>{qr.stats?.totalScans || 0} scans</Text>
                      </View>
                      <View style={styles.qrStatus}>
                        <View style={[styles.statusBadge, qr.status === 'lost' && styles.lostBadge]}>
                          <Text style={[styles.statusText, qr.status === 'lost' && styles.lostText]}>
                            {qr.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Modes Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New</Text>
              <View style={styles.modesGrid}>
                {Object.entries(MODE_CONFIG).slice(0, 6).map(([mode, config]) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeCard, { borderColor: config.color }]}
                    onPress={() => {
                      setSelectedMode(mode);
                      setShowCreate(true);
                    }}
                  >
                    <Text style={styles.modeCardIcon}>{config.icon}</Text>
                    <Text style={styles.modeCardName}>{config.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* MY QRs TAB */}
        {activeTab === 'myqrs' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Safe QRs ({myQrs.length})</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
                <Text style={styles.addButtonText}>+ Create</Text>
              </TouchableOpacity>
            </View>

            {myQrs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏷️</Text>
                <Text style={styles.emptyText}>No Safe QRs yet</Text>
              </View>
            ) : (
              myQrs.map((qr) => {
                const config = MODE_CONFIG[qr.mode] || MODE_CONFIG.pet;
                return (
                  <TouchableOpacity key={qr.shortcode} style={styles.qrCardFull}>
                    <View style={[styles.modeIndicator, { backgroundColor: config.color }]} />
                    <View style={styles.qrCardContent}>
                      <View style={[styles.modeIcon, { backgroundColor: config.color + '20' }]}>
                        <Text style={styles.modeIconText}>{config.icon}</Text>
                      </View>
                      <View style={styles.qrInfoFull}>
                        <Text style={styles.qrShortcode}>{qr.shortcode}</Text>
                        <Text style={styles.qrMode}>{config.name}</Text>
                        <View style={styles.qrStatsRow}>
                          <Text style={styles.qrStat}>{qr.stats?.totalScans || 0} scans</Text>
                          <Text style={styles.qrStatDot}>•</Text>
                          <Text style={styles.qrStat}>{qr.stats?.totalMessages || 0} messages</Text>
                        </View>
                      </View>
                      <View style={styles.qrActions}>
                        <TouchableOpacity style={styles.qrAction} onPress={() => shareQR(qr.shortcode)}>
                          <Text style={styles.qrActionText}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.qrAction, qr.status === 'active' ? styles.lostAction : styles.foundAction]}
                          onPress={() => toggleLostMode(qr)}
                        >
                          <Text style={styles.qrActionText}>{qr.status === 'lost' ? 'Found' : 'Lost'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Conversations ({sessions.length})</Text>

            {sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>When someone scans your QR, messages will appear here</Text>
              </View>
            ) : (
              sessions.map((session) => {
                const config = MODE_CONFIG[session.mode] || MODE_CONFIG.pet;
                return (
                  <TouchableOpacity key={session.sessionId} style={styles.sessionCard}>
                    <View style={[styles.modeIcon, { backgroundColor: config.color + '20' }]}>
                      <Text style={styles.modeIconText}>{config.icon}</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionShortcode}>{session.shortcode}</Text>
                        {session.unreadCount > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{session.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sessionMode}>{config.name}</Text>
                      {session.lastMessage && (
                        <Text style={styles.sessionPreview} numberOfLines={1}>
                          {session.lastMessage.senderRole === 'owner' ? 'You: ' : ''}
                          {session.lastMessage.content}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* KARMA TAB */}
        {activeTab === 'karma' && (
          <View style={styles.tabContent}>
            {/* Karma Card */}
            <View style={styles.karmaCard}>
              <Text style={styles.karmaBadgeLarge}>{karma?.badge || ''}</Text>
              <Text style={styles.karmaLevelLarge}>{karma?.level || 'Newbie'}</Text>
              <Text style={styles.karmaPointsLarge}>{karma?.totalPoints || 0} points</Text>
              <View style={styles.karmaStats}>
                <View style={styles.karmaStat}>
                  <Text style={styles.karmaStatValue}>{karma?.helpCount || 0}</Text>
                  <Text style={styles.karmaStatLabel}>Helps</Text>
                </View>
              </View>
            </View>

            {/* Levels */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Karma Levels</Text>
              {[
                { name: 'Newbie', points: 0 },
                { name: 'Active', points: 10 },
                { name: 'Contributor', points: 50 },
                { name: 'Helper', points: 200 },
                { name: 'Guardian', points: 500 },
                { name: 'Hero', points: 1000 },
              ].map((level) => (
                <View key={level.name} style={styles.levelRow}>
                  <Text style={styles.levelName}>{level.name}</Text>
                  <Text style={styles.levelPoints}>{level.points}+ pts</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      {showCreate && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Safe QR</Text>
              <TouchableOpacity onPress={() => { setShowCreate(false); setSelectedMode(null); setCreateProfile({}); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {!selectedMode ? (
              <>
                <Text style={styles.modalSubtitle}>Select QR Type</Text>
                <View style={styles.modesGridFull}>
                  {Object.entries(MODE_CONFIG).map(([mode, config]) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeCardFull, { borderColor: config.color }]}
                      onPress={() => setSelectedMode(mode)}
                    >
                      <Text style={styles.modeCardIcon}>{config.icon}</Text>
                      <Text style={styles.modeCardName}>{config.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.selectedMode}>
                  <Text style={styles.selectedModeIcon}>{MODE_CONFIG[selectedMode]?.icon}</Text>
                  <Text style={styles.selectedModeName}>{MODE_CONFIG[selectedMode]?.name}</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Name/Description *"
                  placeholderTextColor="#9ca3af"
                  onChangeText={(v) => setCreateProfile({ ...createProfile, name: v })}
                />

                {(selectedMode === 'pet' || selectedMode === 'device') && (
                  <TextInput
                    style={styles.input}
                    placeholder={selectedMode === 'pet' ? 'Breed (optional)' : 'Model (optional)'}
                    placeholderTextColor="#9ca3af"
                    onChangeText={(v) => setCreateProfile({ ...createProfile, breed: v, model: v })}
                  />
                )}

                <TouchableOpacity style={styles.createSubmit} onPress={createQR}>
                  <Text style={styles.createSubmitText}>Create Safe QR</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSelectedMode(null)}>
                  <Text style={styles.backLink}>‹ Back to types</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  karmaMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  karmaBadge: {
    fontSize: 24,
    marginRight: 12,
  },
  karmaLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  karmaPoints: {
    fontSize: 12,
    color: '#e0e7ff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#eef2ff',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIconText: {
    fontSize: 24,
  },
  qrInfo: {
    flex: 1,
    marginLeft: 12,
  },
  qrShortcode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  qrMode: {
    fontSize: 12,
    color: '#6b7280',
  },
  qrStats: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  qrStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lostBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  lostText: {
    color: '#dc2626',
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeCard: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  modeCardIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  modeCardName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  qrCardFull: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  modeIndicator: {
    width: 4,
  },
  qrCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  qrInfoFull: {
    flex: 1,
    marginLeft: 12,
  },
  qrStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  qrStat: {
    fontSize: 12,
    color: '#9ca3af',
  },
  qrStatDot: {
    marginHorizontal: 6,
    color: '#9ca3af',
  },
  qrActions: {
    flexDirection: 'row',
    gap: 8,
  },
  qrAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  qrActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  lostAction: {
    backgroundColor: '#fee2e2',
  },
  foundAction: {
    backgroundColor: '#d1fae5',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionShortcode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sessionMode: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sessionPreview: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  karmaCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  karmaBadgeLarge: {
    fontSize: 48,
  },
  karmaLevelLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  karmaPointsLarge: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 4,
  },
  karmaStats: {
    flexDirection: 'row',
    marginTop: 20,
  },
  karmaStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  karmaStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  karmaStatLabel: {
    fontSize: 12,
    color: '#e0e7ff',
    marginTop: 4,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  levelName: {
    fontSize: 14,
    color: '#1f2937',
  },
  levelPoints: {
    fontSize: 14,
    color: '#6b7280',
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#9ca3af',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  modesGridFull: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modeCardFull: {
    width: '30%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  selectedMode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedModeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedModeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#1f2937',
  },
  createSubmit: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createSubmitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    textAlign: 'center',
    color: '#6366f1',
    marginTop: 16,
    fontSize: 14,
  },
});
