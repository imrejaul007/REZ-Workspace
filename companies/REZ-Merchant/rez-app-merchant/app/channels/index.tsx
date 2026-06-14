/**
 * Channel Manager Screen
 * Manage OTA (Online Travel Agency) integrations
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import {
  channelManagerService,
  ChannelConfig,
  ChannelType,
  ChannelSyncStatus,
  ChannelBooking,
  ChannelRevenue,
} from '@/services/api/channels';

type TabType = 'channels' | 'bookings' | 'revenue';

const CHANNEL_INFO: Record<ChannelType, { name: string; color: string; icon: string }> = {
  booking_com: { name: 'Booking.com', color: '#003580', icon: 'bed-outline' },
  expedia: { name: 'Expedia', color: '#00355F', icon: 'airplane-outline' },
  airbnb: { name: 'Airbnb', color: '#FF5A5F', icon: 'home-outline' },
  makemytrip: { name: 'MakeMyTrip', color: '#2E67B0', icon: 'briefcase-outline' },
  goibibo: { name: 'Goibibo', color: '#FF8000', icon: 'car-outline' },
};

function formatCurrency(amount: number): string {
  return 'Rs. ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'synced':
    case 'confirmed':
      return Colors.light.success;
    case 'pending':
      return Colors.light.warning;
    case 'error':
    case 'cancelled':
      return Colors.light.error;
    default:
      return Colors.light.textSecondary;
  }
}

export default function ChannelsScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<ChannelSyncStatus[]>([]);
  const [bookings, setBookings] = useState<ChannelBooking[]>([]);
  const [revenue, setRevenue] = useState<ChannelRevenue[]>([]);

  // Modal states
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [connecting, setConnecting] = useState(false);

  const fetchChannels = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await channelManagerService.getChannels(storeId);
      setChannels(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load channels');
    }
  }, [storeId]);

  const fetchSyncStatus = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await channelManagerService.getSyncStatus(storeId);
      setSyncStatuses(data);
    } catch (err) {
      // Silent fail for sync status
    }
  }, [storeId]);

  const fetchBookings = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await channelManagerService.getBookings(storeId, { limit: 50 });
      setBookings(data.bookings);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load bookings');
    }
  }, [storeId]);

  const fetchRevenue = useCallback(async () => {
    if (!storeId) return;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    try {
      const data = await channelManagerService.getRevenue(
        storeId,
        thirtyDaysAgo.toISOString(),
        now.toISOString()
      );
      setRevenue(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load revenue');
    }
  }, [storeId]);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (!storeId) return;
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      await Promise.all([fetchChannels(), fetchSyncStatus()]);

      if (activeTab === 'bookings') {
        await fetchBookings();
      } else if (activeTab === 'revenue') {
        await fetchRevenue();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, activeTab, fetchChannels, fetchSyncStatus, fetchBookings, fetchRevenue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnect = async () => {
    if (!storeId || !selectedChannel) return;

    if (!apiKey && !propertyId) {
      Alert.alert('Error', 'Please enter API key or property ID');
      return;
    }

    try {
      setConnecting(true);
      await channelManagerService.connectChannel(storeId, selectedChannel, {
        apiKey,
        propertyId,
      });
      Alert.alert('Success', `${CHANNEL_INFO[selectedChannel].name} connected successfully`);
      setConnectModalVisible(false);
      setApiKey('');
      setPropertyId('');
      await fetchChannels();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to connect channel');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (channelType: ChannelType) => {
    if (!storeId) return;

    Alert.alert(
      'Disconnect Channel',
      `Are you sure you want to disconnect ${CHANNEL_INFO[channelType].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await channelManagerService.disconnectChannel(storeId, channelType);
              await fetchChannels();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const handleToggleSync = async (channelType: ChannelType, setting: 'autoSyncAvailability' | 'autoSyncRates', value: boolean) => {
    if (!storeId) return;
    try {
      const channel = channels.find(c => c.channelType === channelType);
      if (!channel) return;

      await channelManagerService.updateSyncSettings(storeId, channelType, {
        [setting]: value,
      });
      await fetchChannels();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update settings');
    }
  };

  const openConnectModal = (channelType: ChannelType) => {
    setSelectedChannel(channelType);
    setConnectModalVisible(true);
  };

  const getSyncStatus = (channelType: ChannelType): ChannelSyncStatus | undefined => {
    return syncStatuses.find(s => s.channelType === channelType);
  };

  const renderChannelsTab = () => (
    <View style={styles.channelsContainer}>
      {channels.map((channel) => {
        const info = CHANNEL_INFO[channel.channelType];
        const syncStatus = getSyncStatus(channel.channelType);

        return (
          <View key={channel.channelType} style={styles.channelCard}>
            <View style={styles.channelHeader}>
              <View style={[styles.channelIcon, { backgroundColor: info.color + '15' }]}>
                <Ionicons name={info.icon as unknown} size={24} color={info.color} />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{info.name}</Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: channel.isConnected ? Colors.light.success : Colors.light.textSecondary },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {channel.isConnected ? 'Connected' : 'Not Connected'}
                  </Text>
                </View>
              </View>
              {channel.isConnected ? (
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={() => handleDisconnect(channel.channelType)}
                >
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => openConnectModal(channel.channelType)}
                >
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>

            {channel.isConnected && (
              <View style={styles.channelSettings}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.light.textSecondary} />
                    <Text style={styles.settingLabel}>Auto-sync Availability</Text>
                  </View>
                  <Switch
                    value={channel.syncSettings.autoSyncAvailability}
                    onValueChange={(v) => handleToggleSync(channel.channelType, 'autoSyncAvailability', v)}
                    trackColor={{ false: Colors.light.border, true: Colors.light.primary + '50' }}
                    thumbColor={channel.syncSettings.autoSyncAvailability ? Colors.light.primary : '#f4f3f4'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="pricetag-outline" size={18} color={Colors.light.textSecondary} />
                    <Text style={styles.settingLabel}>Auto-sync Rates</Text>
                  </View>
                  <Switch
                    value={channel.syncSettings.autoSyncRates}
                    onValueChange={(v) => handleToggleSync(channel.channelType, 'autoSyncRates', v)}
                    trackColor={{ false: Colors.light.border, true: Colors.light.primary + '50' }}
                    thumbColor={channel.syncSettings.autoSyncRates ? Colors.light.primary : '#f4f3f4'}
                  />
                </View>
                {syncStatus && (
                  <View style={styles.syncStatusRow}>
                    <Text style={styles.syncStatusLabel}>
                      Last synced: {syncStatus.lastSyncAt ? formatDate(syncStatus.lastSyncAt) : 'Never'}
                    </Text>
                    <Text style={[styles.syncStatusValue, { color: getStatusColor(syncStatus.status) }]}>
                      {syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderBookingsTab = () => (
    <View style={styles.bookingsContainer}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : bookings.length > 0 ? (
        bookings.map((booking) => {
          const info = CHANNEL_INFO[booking.channelType];
          return (
            <View key={booking.bookingId} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={[styles.channelIcon, { backgroundColor: info.color + '15' }]}>
                  <Ionicons name={info.icon as unknown} size={20} color={info.color} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingGuest}>{booking.guestName}</Text>
                  <Text style={styles.bookingChannel}>{info.name}</Text>
                </View>
                <View style={styles.bookingAmount}>
                  <Text style={styles.amountValue}>{formatCurrency(booking.totalAmount)}</Text>
                  <Text
                    style={[styles.bookingStatus, { color: getStatusColor(booking.status) }]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetail}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.detailText}>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </Text>
                </View>
                <View style={styles.bookingDetail}>
                  <Ionicons name="bed-outline" size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.detailText}>{booking.roomType}</Text>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>No channel bookings found</Text>
          <Text style={styles.emptySubtext}>Bookings from connected OTAs will appear here</Text>
        </View>
      )}
    </View>
  );

  const renderRevenueTab = () => (
    <View style={styles.revenueContainer}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : revenue.length > 0 ? (
        <>
          {revenue.map((item) => {
            const info = CHANNEL_INFO[item.channelType];
            return (
              <View key={item.channelType} style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <View style={[styles.channelIcon, { backgroundColor: info.color + '15' }]}>
                    <Ionicons name={info.icon as unknown} size={20} color={info.color} />
                  </View>
                  <Text style={styles.revenueChannelName}>{info.name}</Text>
                </View>
                <View style={styles.revenueStats}>
                  <View style={styles.revenueStat}>
                    <Text style={styles.revenueStatValue}>{item.totalBookings}</Text>
                    <Text style={styles.revenueStatLabel}>Bookings</Text>
                  </View>
                  <View style={styles.revenueStat}>
                    <Text style={styles.revenueStatValue}>{formatCurrency(item.grossRevenue)}</Text>
                    <Text style={styles.revenueStatLabel}>Gross</Text>
                  </View>
                  <View style={styles.revenueStat}>
                    <Text style={styles.revenueStatValue}>{formatCurrency(item.commission)}</Text>
                    <Text style={styles.revenueStatLabel}>Commission</Text>
                  </View>
                  <View style={styles.revenueStat}>
                    <Text style={[styles.revenueStatValue, { color: Colors.light.success }]}>
                      {formatCurrency(item.netRevenue)}
                    </Text>
                    <Text style={styles.revenueStatLabel}>Net</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={styles.totalRevenue}>
            <Text style={styles.totalLabel}>Total Revenue (Last 30 Days)</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(revenue.reduce((sum, r) => sum + r.netRevenue, 0))}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cash-outline" size={48} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>No revenue data available</Text>
          <Text style={styles.emptySubtext}>Revenue from connected OTAs will appear here</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Channel Manager</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['channels', 'bookings', 'revenue'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {activeTab === 'channels' && renderChannelsTab()}
        {activeTab === 'bookings' && renderBookingsTab()}
        {activeTab === 'revenue' && renderRevenueTab()}
      </ScrollView>

      {/* Connect Modal */}
      <Modal
        visible={connectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConnectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Connect {selectedChannel ? CHANNEL_INFO[selectedChannel].name : ''}
              </Text>
              <TouchableOpacity onPress={() => setConnectModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>API Key</Text>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Enter API key"
                placeholderTextColor={Colors.light.textSecondary}
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Property ID</Text>
              <TextInput
                style={styles.input}
                value={propertyId}
                onChangeText={setPropertyId}
                placeholder="Enter property ID"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <TouchableOpacity
                style={styles.modalConnectBtn}
                onPress={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConnectText}>Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tabActive: { backgroundColor: Colors.light.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  channelsContainer: { padding: 16, gap: 16 },
  channelCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
  },
  channelHeader: { flexDirection: 'row', alignItems: 'center' },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: { flex: 1, marginLeft: 12 },
  channelName: { fontSize: 16, fontWeight: '700', color: Colors.light.textHeading },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: Colors.light.textSecondary },
  connectBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  disconnectBtn: {
    borderWidth: 1,
    borderColor: Colors.light.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectText: { color: Colors.light.error, fontWeight: '600', fontSize: 13 },
  channelSettings: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.light.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14, color: Colors.light.text },
  syncStatusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  syncStatusLabel: { fontSize: 12, color: Colors.light.textSecondary },
  syncStatusValue: { fontSize: 12, fontWeight: '600' },
  bookingsContainer: { padding: 16, gap: 12 },
  bookingCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
  },
  bookingHeader: { flexDirection: 'row', alignItems: 'center' },
  bookingInfo: { flex: 1, marginLeft: 10 },
  bookingGuest: { fontSize: 14, fontWeight: '600', color: Colors.light.textHeading },
  bookingChannel: { fontSize: 12, color: Colors.light.textSecondary },
  bookingAmount: { alignItems: 'flex-end' },
  amountValue: { fontSize: 14, fontWeight: '700', color: Colors.light.textHeading },
  bookingStatus: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bookingDetails: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.light.border },
  bookingDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: Colors.light.textSecondary },
  revenueContainer: { padding: 16, gap: 12 },
  revenueCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
  },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  revenueChannelName: { fontSize: 14, fontWeight: '600', color: Colors.light.textHeading, marginLeft: 10 },
  revenueStats: { flexDirection: 'row' },
  revenueStat: { flex: 1, alignItems: 'center' },
  revenueStatValue: { fontSize: 14, fontWeight: '700', color: Colors.light.textHeading },
  revenueStatLabel: { fontSize: 10, color: Colors.light.textSecondary, marginTop: 2 },
  totalRevenue: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: { fontSize: 12, color: '#fff', opacity: 0.8 },
  totalValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.light.textHeading },
  emptySubtext: { fontSize: 13, color: Colors.light.textSecondary },
  centered: { alignItems: 'center', paddingVertical: 48 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.light.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  modalBody: {},
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 16,
  },
  modalConnectBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalConnectText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
