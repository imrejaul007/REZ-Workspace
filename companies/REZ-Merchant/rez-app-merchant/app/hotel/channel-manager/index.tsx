/**
 * Channel Manager Dashboard
 * Manages OTA connections and booking synchronization
 * API: GET /channel-manager/connections
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

// Types
export type ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface ChannelConnection {
  id: string;
  channelId: string;
  channelName: string;
  channelLogo?: string;
  status: ConnectionStatus;
  lastSync?: Date;
  errorMessage?: string;
  totalBookings: number;
  pendingBookings: number;
  enabled: boolean;
}

// Channel logo mappings (using Ionicons as placeholders)
const channelIcons: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  booking: { name: 'bed-outline', color: '#003580' },
  airbnb: { name: 'home-outline', color: '#FF5A5F' },
  expedia: { name: 'airplane-outline', color: '#00355E' },
  agoda: { name: 'globe-outline', color: '#00AFB2' },
  hotels: { name: 'business-outline', color: '#00452E' },
  direct: { name: 'key-outline', color: '#7C3AED' },
};

const mockConnections: ChannelConnection[] = [
  {
    id: '1',
    channelId: 'booking',
    channelName: 'Booking.com',
    status: 'connected',
    lastSync: new Date(Date.now() - 15 * 60000),
    totalBookings: 245,
    pendingBookings: 3,
    enabled: true,
  },
  {
    id: '2',
    channelId: 'airbnb',
    channelName: 'Airbnb',
    status: 'connected',
    lastSync: new Date(Date.now() - 30 * 60000),
    totalBookings: 89,
    pendingBookings: 1,
    enabled: true,
  },
  {
    id: '3',
    channelId: 'expedia',
    channelName: 'Expedia',
    status: 'syncing',
    lastSync: new Date(Date.now() - 60 * 60000),
    totalBookings: 156,
    pendingBookings: 0,
    enabled: true,
  },
  {
    id: '4',
    channelId: 'agoda',
    channelName: 'Agoda',
    status: 'error',
    lastSync: new Date(Date.now() - 2 * 60 * 60000),
    errorMessage: 'Authentication expired. Please reconnect.',
    totalBookings: 78,
    pendingBookings: 5,
    enabled: true,
  },
  {
    id: '5',
    channelId: 'hotels',
    channelName: 'Hotels.com',
    status: 'disconnected',
    totalBookings: 45,
    pendingBookings: 0,
    enabled: false,
  },
];

const availableChannels = [
  { id: 'oyo', name: 'OYO', icon: 'business-outline', color: '#FF1744' },
  { id: 'makemytrip', name: 'MakeMyTrip', icon: 'airplane-outline', color: '#FFC107' },
  { id: 'goibibo', name: 'Goibibo', icon: 'bed-outline', color: '#00BFA5' },
];

const getStatusColor = (status: ConnectionStatus): string => {
  const colors: Record<ConnectionStatus, string> = {
    connected: Colors.light.success,
    disconnected: Colors.light.textMuted,
    syncing: Colors.light.info,
    error: Colors.light.danger,
  };
  return colors[status];
};

const getStatusLabel = (status: ConnectionStatus): string => {
  const labels: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    syncing: 'Syncing...',
    error: 'Error',
  };
  return labels[status];
};

const formatLastSync = (date?: Date): string => {
  if (!date) return 'Never';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

interface ConnectionCardProps {
  connection: ChannelConnection;
  onPress: () => void;
  onSync: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onPress, onSync }) => {
  const channelIcon = channelIcons[connection.channelId] || {
    name: 'globe-outline' as const,
    color: Colors.light.primary,
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="elevated" padding="md" style={styles.connectionCard}>
        <View style={styles.connectionHeader}>
          <View style={[styles.channelIcon, { backgroundColor: `${channelIcon.color}15` }]}>
            <Ionicons name={channelIcon.name} size={28} color={channelIcon.color} />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.channelName}>{connection.channelName}</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: getStatusColor(connection.status) }]}
              />
              <Text style={[styles.statusText, { color: getStatusColor(connection.status) }]}>
                {getStatusLabel(connection.status)}
              </Text>
            </View>
          </View>
          {connection.status === 'connected' && (
            <TouchableOpacity style={styles.syncButton} onPress={onSync}>
              <Ionicons name="sync" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
        </View>

        {connection.errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.light.danger} />
            <Text style={styles.errorText}>{connection.errorMessage}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{connection.totalBookings}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, connection.pendingBookings > 0 && styles.pendingValue]}>
              {connection.pendingBookings}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {connection.lastSync ? formatLastSync(connection.lastSync) : '-'}
            </Text>
            <Text style={styles.statLabel}>Last Sync</Text>
          </View>
        </View>

        <View style={styles.connectionFooter}>
          <TouchableOpacity
            style={[styles.toggleButton, connection.enabled && styles.toggleButtonActive]}
            onPress={() => {}}
          >
            <View
              style={[styles.toggleTrack, connection.enabled && styles.toggleTrackActive]}
            >
              <View
                style={[styles.toggleThumb, connection.enabled && styles.toggleThumbActive]}
              />
            </View>
            <Text style={[styles.toggleText, connection.enabled && styles.toggleTextActive]}>
              {connection.enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default function ChannelManagerScreen() {
  const insets = useSafeAreaInsets();

  const [connections, setConnections] = useState<ChannelConnection[]>(mockConnections);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleConnectionPress = useCallback((connection: ChannelConnection) => {
    router.push(`/hotel/channel-manager/${connection.id}`);
  }, []);

  const handleSync = useCallback(async (connection: ChannelConnection) => {
    if (connection.status === 'syncing') return;

    setSyncingId(connection.id);
    setConnections((prev) =>
      prev.map((c) => (c.id === connection.id ? { ...c, status: 'syncing' } : c))
    );

    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setConnections((prev) =>
      prev.map((c) =>
        c.id === connection.id
          ? { ...c, status: 'connected', lastSync: new Date(), errorMessage: undefined }
          : c
      )
    );
    setSyncingId(null);
  }, []);

  const handleSyncAll = useCallback(async () => {
    const connected = connections.filter((c) => c.status === 'connected');
    if (connected.length === 0) {
      Alert.alert('No Channels', 'No connected channels to sync.');
      return;
    }

    Alert.alert('Sync All', `Sync ${connected.length} connected channels?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sync All',
        onPress: async () => {
          setConnections((prev) =>
            prev.map((c) => (c.status === 'connected' ? { ...c, status: 'syncing' } : c))
          );
          // Simulate sync
          await new Promise((resolve) => setTimeout(resolve, 3000));
          setConnections((prev) =>
            prev.map((c) =>
              c.status === 'syncing' ? { ...c, status: 'connected', lastSync: new Date() } : c
            )
          );
          Alert.alert('Success', 'All channels synced successfully.');
        },
      },
    ]);
  }, [connections]);

  const handleConnectChannel = useCallback((channel: typeof availableChannels[0]) => {
    Alert.alert(
      'Connect Channel',
      `Would you like to connect ${channel.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            // Would open OAuth flow or credentials modal
            Alert.alert('Coming Soon', 'Channel connection flow would open here.');
          },
        },
      ]
    );
  }, []);

  const connectedCount = connections.filter((c) => c.status === 'connected').length;
  const totalPending = connections.reduce((sum, c) => sum + c.pendingBookings, 0);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{connectedCount}</Text>
          <Text style={styles.summaryLabel}>Connected</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryValue, totalPending > 0 && styles.pendingValue]}>
            {totalPending}
          </Text>
          <Text style={styles.summaryLabel}>Pending Bookings</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{connections.length}</Text>
          <Text style={styles.summaryLabel}>Channels</Text>
        </View>
      </View>

      {/* Sync All Button */}
      <TouchableOpacity style={styles.syncAllButton} onPress={handleSyncAll}>
        <Ionicons name="sync" size={20} color={Colors.light.primary} />
        <Text style={styles.syncAllText}>Sync All Channels</Text>
      </TouchableOpacity>

      {/* Connected Channels */}
      <Text style={styles.sectionTitle}>Connected Channels</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      {/* Available Channels */}
      <Text style={styles.sectionTitle}>Available Channels</Text>
      <Text style={styles.sectionSubtitle}>
        Connect more channels to increase your reach
      </Text>
      {availableChannels.map((channel) => (
        <TouchableOpacity
          key={channel.id}
          style={styles.availableChannelCard}
          onPress={() => handleConnectChannel(channel)}
        >
          <View style={[styles.channelIcon, { backgroundColor: `${channel.color}15` }]}>
            <Ionicons name={channel.icon as keyof typeof Ionicons.glyphMap} size={24} color={channel.color} />
          </View>
          <Text style={styles.availableChannelName}>{channel.name}</Text>
          <Ionicons name="add-circle-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channel Manager</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100)}>
              <ConnectionCard
                connection={item}
                onPress={() => handleConnectionPress(item)}
                onSync={() => handleSync(item)}
              />
            </Animated.View>
          )}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  pendingValue: {
    color: Colors.light.warning,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  syncAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: -8,
    marginBottom: 12,
  },
  separator: {
    height: 12,
  },
  connectionCard: {
    backgroundColor: Colors.light.card,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  syncButton: {
    padding: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.errorLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.danger,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  pendingValue: {
    color: Colors.light.warning,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  connectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButtonActive: {},
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.border,
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: Colors.light.success,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    transform: [{ translateX: 16 }],
  },
  toggleText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.light.success,
  },
  footer: {
    marginTop: 24,
    paddingBottom: 24,
  },
  availableChannelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  availableChannelName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textHeading,
    marginLeft: 12,
  },
});
