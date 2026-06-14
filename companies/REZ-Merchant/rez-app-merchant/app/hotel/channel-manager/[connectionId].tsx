/**
 * Channel Detail Screen
 * Shows detailed view of a channel connection
 * API: GET /channel-manager/connections/:connectionId
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import type { ChannelConnection, ConnectionStatus } from './index';

// Mock connection data
const mockConnection: ChannelConnection = {
  id: '1',
  channelId: 'booking',
  channelName: 'Booking.com',
  status: 'connected',
  lastSync: new Date(Date.now() - 15 * 60000),
  totalBookings: 245,
  pendingBookings: 3,
  enabled: true,
};

const mockRecentBookings = [
  { id: '1', guestName: 'John Smith', room: '101', checkIn: '2024-03-15', checkOut: '2024-03-18', status: 'confirmed' },
  { id: '2', guestName: 'Sarah Johnson', room: '102', checkIn: '2024-03-16', checkOut: '2024-03-20', status: 'pending' },
  { id: '3', guestName: 'Michael Brown', room: '103', checkIn: '2024-03-15', checkOut: '2024-03-17', status: 'confirmed' },
];

const channelDetails = {
  booking: {
    website: 'https://www.booking.com',
    supportEmail: 'partners@booking.com',
    apiVersion: 'v2.1',
    description: 'Connect your property to reach millions of travelers worldwide.',
  },
  airbnb: {
    website: 'https://www.airbnb.com',
    supportEmail: 'hosts@airbnb.com',
    apiVersion: 'v2.0',
    description: 'Share your space and earn money on the world\'s largest hospitality platform.',
  },
  expedia: {
    website: 'https://www.expedia.com',
    supportEmail: 'partner-support@expedia.com',
    apiVersion: 'v3.0',
    description: 'Reach travelers from Expedia, Hotels.com, and more.',
  },
};

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

const formatDate = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function ChannelDetailScreen() {
  const insets = useSafeAreaInsets();
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>();

  const [connection, setConnection] = useState<ChannelConnection>(mockConnection);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const channelInfo = channelDetails[connection.channelId as keyof typeof channelDetails] || channelDetails.booking;

  const handleSyncInventory = useCallback(async () => {
    setSyncing(true);
    setConnection((prev) => ({ ...prev, status: 'syncing' }));

    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setConnection((prev) => ({
      ...prev,
      status: 'connected',
      lastSync: new Date(),
    }));
    setSyncing(false);
    Alert.alert('Success', 'Inventory synced successfully');
  }, []);

  const handleFetchBookings = useCallback(async () => {
    setSyncing(true);
    setConnection((prev) => ({ ...prev, status: 'syncing' }));

    // Simulate fetch
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setConnection((prev) => ({
      ...prev,
      status: 'connected',
      lastSync: new Date(),
    }));
    setSyncing(false);
    Alert.alert('Success', 'New bookings fetched');
  }, []);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect Channel',
      `Are you sure you want to disconnect ${connection.channelName}? You will need to reconnect to sync bookings again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setConnection((prev) => ({ ...prev, status: 'disconnected', enabled: false }));
            Alert.alert('Disconnected', `${connection.channelName} has been disconnected.`);
            router.back();
          },
        },
      ]
    );
  }, [connection.channelName]);

  const handleReconnect = useCallback(() => {
    Alert.alert('Reconnect', 'Channel reconnection flow would open here.', [
      { text: 'OK' },
    ]);
  }, []);

  const handleToggleEnabled = useCallback((value: boolean) => {
    setConnection((prev) => ({ ...prev, enabled: value }));
    Alert.alert(
      value ? 'Enabled' : 'Disabled',
      `${connection.channelName} has been ${value ? 'enabled' : 'disabled'}.`
    );
  }, [connection.channelName]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{connection.channelName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated" padding="lg" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(connection.status)}20` },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: getStatusColor(connection.status) }]}
                />
                <Text style={[styles.statusText, { color: getStatusColor(connection.status) }]}>
                  {getStatusLabel(connection.status)}
                </Text>
              </View>
            </View>

            <View style={styles.lastSyncRow}>
              <Text style={styles.lastSyncLabel}>Last synced</Text>
              <Text style={styles.lastSyncValue}>
                {connection.lastSync ? formatDate(connection.lastSync) : 'Never'}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Enable Channel</Text>
                <Text style={styles.toggleDescription}>
                  Allow booking sync and inventory updates
                </Text>
              </View>
              <Switch
                value={connection.enabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: Colors.light.border, true: Colors.light.success }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>Sync Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSyncInventory}
              disabled={syncing || !connection.enabled}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.light.primaryLight2 }]}>
                {syncing ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <Ionicons name="cube-outline" size={24} color={Colors.light.primary} />
                )}
              </View>
              <Text style={styles.actionTitle}>Sync Inventory</Text>
              <Text style={styles.actionDescription}>Update room availability and rates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleFetchBookings}
              disabled={syncing || !connection.enabled}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.light.successLight }]}>
                {syncing ? (
                  <ActivityIndicator size="small" color={Colors.light.success} />
                ) : (
                  <Ionicons name="download-outline" size={24} color={Colors.light.success} />
                )}
              </View>
              <Text style={styles.actionTitle}>Fetch Bookings</Text>
              <Text style={styles.actionDescription}>Import new reservations</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Statistics */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <Card variant="default" padding="md" style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{connection.totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, connection.pendingBookings > 0 && styles.pendingValue]}>
                  {connection.pendingBookings}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Recent Bookings */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {mockRecentBookings.map((booking) => (
            <Card key={booking.id} variant="default" padding="md" style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.guestName}>{booking.guestName}</Text>
                <View
                  style={[
                    styles.bookingStatus,
                    {
                      backgroundColor:
                        booking.status === 'confirmed'
                          ? Colors.light.successLight
                          : Colors.light.warningLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bookingStatusText,
                      {
                        color:
                          booking.status === 'confirmed'
                            ? Colors.light.success
                            : Colors.light.warning,
                      },
                    ]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetail}>
                  <Ionicons name="bed-outline" size={14} color={Colors.light.textMuted} />
                  <Text style={styles.bookingDetailText}>Room {booking.room}</Text>
                </View>
                <View style={styles.bookingDetail}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.light.textMuted} />
                  <Text style={styles.bookingDetailText}>
                    {booking.checkIn} - {booking.checkOut}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </Animated.View>

        {/* Channel Info */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Channel Information</Text>
          <Card variant="default" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>API Version</Text>
              <Text style={styles.infoValue}>{channelInfo.apiVersion}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={styles.infoValueLink}>{channelInfo.website}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Support</Text>
              <Text style={styles.infoValueLink}>{channelInfo.supportEmail}</Text>
            </View>
            <Text style={styles.infoDescription}>{channelInfo.description}</Text>
          </Card>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={[styles.sectionTitle, { color: Colors.light.danger }]}>Danger Zone</Text>
          <Card variant="outlined" padding="md" style={styles.dangerCard}>
            {connection.status === 'disconnected' ? (
              <TouchableOpacity style={styles.dangerButton} onPress={handleReconnect}>
                <Ionicons name="refresh" size={20} color={Colors.light.info} />
                <Text style={styles.dangerButtonText}>Reconnect Channel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.dangerButton} onPress={handleDisconnect}>
                <Ionicons name="link-outline" size={20} color={Colors.light.danger} />
                <Text style={styles.dangerButtonTextRed}>Disconnect Channel</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.dangerWarning}>
              This will stop all synchronization with {connection.channelName}.
            </Text>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  lastSyncLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  lastSyncValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
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
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  pendingValue: {
    color: Colors.light.warning,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  bookingCard: {
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bookingStatusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  infoValueLink: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.info,
  },
  infoDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  dangerCard: {
    borderColor: Colors.light.danger,
    marginBottom: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.info,
  },
  dangerButtonTextRed: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.danger,
  },
  dangerWarning: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 8,
  },
});
