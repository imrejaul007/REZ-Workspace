import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { useStore } from '@/contexts/StoreContext';
import { integrationApiService, IntegrationStatus } from '@/services/api/integrations';
import { apiClient } from '@/services/api/client';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  active: { color: '#10B981', bg: '#D1FAE5', label: 'Connected', icon: 'checkmark-circle' },
  paused: { color: '#F59E0B', bg: '#FEF3C7', label: 'Paused', icon: 'pause-circle' },
  error: { color: '#EF4444', bg: '#FEE2E2', label: 'Error', icon: 'alert-circle' },
  pending_setup: { color: '#6B7280', bg: '#F3F4F6', label: 'Not Connected', icon: 'time' },
};

interface AggregatorCardProps {
  platform: 'swiggy' | 'zomato' | 'dunzo';
  title: string;
  description: string;
  icon: string;
  isConnected: boolean;
  onConnect: () => void;
}

const AggregatorCard = ({
  platform,
  title,
  description,
  icon,
  isConnected,
  onConnect,
}: AggregatorCardProps) => {
  const statusConf = isConnected ? STATUS_CONFIG.active : STATUS_CONFIG.pending_setup;

  return (
    <View style={styles.aggregatorCard}>
      <View style={styles.aggregatorHeader}>
        <View style={styles.aggregatorInfo}>
          <View style={[styles.iconBox, { backgroundColor: Colors.primary[50] }]}>
            <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={28} color={Colors.primary[500]} />
          </View>
          <View style={styles.aggregatorText}>
            <Text style={styles.aggregatorTitle}>{title}</Text>
            <Text style={styles.aggregatorDesc}>{description}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
        <Ionicons name={statusConf.icon as unknown as keyof typeof Ionicons.glyphMap} size={14} color={statusConf.color} />
        <Text style={[styles.statusLabel, { color: statusConf.color }]}>{statusConf.label}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.connectButton,
          {
            backgroundColor: isConnected ? Colors.success[50] : Colors.primary[500],
            borderColor: isConnected ? Colors.success[200] : 'transparent',
            borderWidth: isConnected ? 1 : 0,
          },
        ]}
        onPress={onConnect}
      >
        <Ionicons
          name={isConnected ? 'checkmark' : 'link'}
          size={18}
          color={isConnected ? Colors.success[600] : Colors.text.inverse}
        />
        <Text
          style={[
            styles.connectButtonText,
            { color: isConnected ? Colors.success[600] : Colors.text.inverse },
          ]}
        >
          {isConnected ? 'Connected' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function IntegrationsScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const [data, setData] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Aggregator connection modal
  const [showAggregatorModal, setShowAggregatorModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'swiggy' | 'zomato' | 'dunzo' | null>(
    null
  );
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [pauseAllLoading, setPauseAllLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeStore?._id) return;
    try {
      const result = await integrationApiService.getStatus(activeStore._id);
      setData(result);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnectAggregator = async (platform: string) => {
    platformAlertSimple(
      `${platform} Integration`,
      `${platform} integration is coming soon. We're in the process of getting API access approved. We'll notify you when it's ready for your store.`
    );
  };

  const handleOpenAggregatorModal = (platform: 'swiggy' | 'zomato' | 'dunzo') => {
    setSelectedPlatform(platform);
    setShowAggregatorModal(true);
  };

  const handleOpenPartnerPortal = (platform: 'swiggy' | 'zomato' | 'dunzo') => {
    platformAlertConfirm(
      'Apply for API Access',
      `You will be redirected to ${platform}'s partner portal. API access typically takes 4-8 weeks to approve.`,
      () => integrationApiService.openPartnerPortal(platform),
      'Open Portal'
    );
  };

  const handleSyncPlatform = async (platform: string) => {
    if (!activeStore?._id) return;
    setSyncing(platform);
    try {
      await apiClient.post(`merchant/integrations/${platform}/sync`);
      platformAlertSimple('Success', `${platform} menu synced successfully`);
      await loadData();
    } catch (error) {
      platformAlertSimple('Error', `Failed to sync ${platform}`);
    } finally {
      setSyncing(null);
    }
  };

  const handlePauseAll = async () => {
    if (!activeStore?._id) return;
    setPauseAllLoading(true);
    try {
      await apiClient.post(`merchant/integrations/pause-all`);
      platformAlertSimple('Success', 'All platforms paused');
      await loadData();
    } catch (error) {
      platformAlertSimple('Error', 'Failed to pause platforms');
    } finally {
      setPauseAllLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const integrations = data?.integrations || [];
  const hasIntegrations = integrations.length > 0;
  const connectedAggregators = integrations
    .filter((i) => ['swiggy', 'zomato', 'dunzo'].includes(i.provider))
    .map((i) => i.provider);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          tintColor="#7C3AED"
        />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="git-branch" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Integrations</Text>
            <Text style={styles.headerSubtitle}>Connect food aggregators & payment systems</Text>
          </View>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePauseAll}
            disabled={pauseAllLoading}
          >
            <Ionicons name="pause" size={18} color="#fff" />
            <Text style={styles.pauseButtonText}>
              {pauseAllLoading ? 'Pausing...' : 'Pause All'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>
            {data?.recentTransactions || 0}
          </Text>
          <Text style={styles.statLabel}>Synced Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statValue, { color: '#D97706' }]}>
            {data?.pendingTransactions || 0}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statValue, { color: '#059669' }]}>
            {integrations.filter((i) => i.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Order Inbox CTA */}
      <TouchableOpacity
        style={styles.orderInboxBtn}
        onPress={() => router.push('/(dashboard)/aggregator-orders')}
        activeOpacity={0.85}
      >
        <View style={styles.orderInboxLeft}>
          <View style={styles.orderInboxIconBox}>
            <Ionicons name="receipt" size={20} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.orderInboxTitle}>Order Inbox</Text>
            <Text style={styles.orderInboxSub}>
              {data?.pendingTransactions
                ? `${data.pendingTransactions} pending order${data.pendingTransactions !== 1 ? 's' : ''}`
                : 'View all aggregator orders'}
            </Text>
          </View>
        </View>
        {(data?.pendingTransactions ?? 0) > 0 && (
          <View style={styles.orderInboxBadge}>
            <Text style={styles.orderInboxBadgeText}>{data!.pendingTransactions}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color="#7C3AED" style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      {/* Food Aggregators Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food Aggregators</Text>
        <AggregatorCard
          platform="swiggy"
          title="Swiggy"
          description="Receive orders directly in REZ"
          icon="storefront"
          isConnected={connectedAggregators.includes('swiggy')}
          onConnect={() => handleConnectAggregator('Swiggy')}
        />
        <AggregatorCard
          platform="zomato"
          title="Zomato"
          description="Auto-sync Zomato orders"
          icon="restaurant"
          isConnected={connectedAggregators.includes('zomato')}
          onConnect={() => handleConnectAggregator('Zomato')}
        />
        <AggregatorCard
          platform="dunzo"
          title="Dunzo"
          description="Last-mile delivery partner"
          icon="bicycle"
          isConnected={connectedAggregators.includes('dunzo')}
          onConnect={() => handleConnectAggregator('Dunzo')}
        />
      </View>

      {/* Payments Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments</Text>
        {hasIntegrations ? (
          integrations.map((integration) => {
            const statusConf = STATUS_CONFIG[integration.status] || STATUS_CONFIG.pending_setup;
            return (
              <View key={integration._id} style={styles.integrationCard}>
                <View style={styles.integrationHeader}>
                  <View style={styles.integrationInfo}>
                    <Text style={styles.providerName}>
                      {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                    </Text>
                    <Text style={styles.integrationTypeBadge}>Payment gateway</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
                    <Ionicons name={statusConf.icon as unknown as keyof typeof Ionicons.glyphMap} size={14} color={statusConf.color} />
                    <Text style={[styles.statusText, { color: statusConf.color }]}>
                      {statusConf.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.integrationMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="sync-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {integration.lastSyncAt
                        ? `Last sync: ${new Date(integration.lastSyncAt).toLocaleString()}`
                        : 'Never synced'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.syncButton}
                  onPress={() => handleSyncPlatform(integration.provider)}
                  disabled={syncing === integration.provider}
                >
                  <Ionicons name="sync" size={16} color="#0EA5E9" />
                  <Text style={styles.syncButtonText}>
                    {syncing === integration.provider ? 'Syncing...' : 'Sync Menu Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Payment Integrations</Text>
            <Text style={styles.emptySubtitle}>Contact support to set up payment gateways</Text>
          </View>
        )}
      </View>

      {/* Hotel OTA Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hotel OTA (Property Management)</Text>
        <View style={[styles.integrationCard, { borderLeftWidth: 4, borderLeftColor: '#0891B2' }]}>
          <View style={styles.integrationHeader}>
            <View style={styles.integrationInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="bed" size={18} color="#0891B2" />
                </View>
                <Text style={styles.providerName}>Hotel OTA</Text>
              </View>
              <Text style={[styles.integrationTypeBadge, { color: '#0891B2' }]}>
                Hospitality platform
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="bed-outline" size={14} color="#0891B2" />
              <Text style={[styles.statusText, { color: '#0891B2' }]}>Hotel Type</Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: '#6B7280', marginVertical: 8, lineHeight: 18 }}>
            If this is a hotel property, connect to REZ Hotel OTA to enable room bookings, guest
            check-ins, PMS sync, and earn/burn loyalty coins for hotel stays.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            {[
              { icon: 'calendar', label: 'Room Bookings' },
              { icon: 'sync', label: 'PMS Sync' },
              { icon: 'wallet', label: 'Brand Coins' },
            ].map((f) => (
              <View
                key={f.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#F0F9FF',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name={f.icon as unknown as keyof typeof Ionicons.glyphMap} size={12} color="#0891B2" />
                <Text style={{ fontSize: 11, color: '#0369A1', fontWeight: '600' }}>{f.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: '#0891B2', marginTop: 14 }]}
            onPress={() => router.push('/hotel-ota')}
          >
            <Ionicons name="bed" size={16} color="#fff" />
            <Text style={[styles.syncButtonText, { color: '#fff' }]}>Open Hotel OTA Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming Soon</Text>
        <View style={styles.comingSoonGrid}>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>Magicpin</Text>
            <Text style={styles.comingSoonTimeframe}>Available Q2 2026</Text>
          </View>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>EazyDiner</Text>
            <Text style={styles.comingSoonTimeframe}>Available Q2 2026</Text>
          </View>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>DotPe</Text>
            <Text style={styles.comingSoonTimeframe}>Available Q2 2026</Text>
          </View>
        </View>
      </View>

      {/* Aggregator Connection Modal */}
      <Modal visible={showAggregatorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Connect {selectedPlatform}</Text>

            <View style={styles.modalBody}>
              <View>
                <Text style={styles.label}>API access requires partner approval</Text>
                <Text style={[styles.label, { marginTop: 8, color: '#6B7280', fontWeight: '400' }]}>
                  API access typically takes 4-8 weeks to approve. Once approved, enter your
                  credentials here.
                </Text>
              </View>

              <View>
                <Text style={styles.label}>API Key</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter API Key"
                  value={apiKey}
                  onChangeText={setApiKey}
                  editable={!connecting}
                />
              </View>

              <View>
                <Text style={styles.label}>API Secret</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter API Secret"
                  value={apiSecret}
                  onChangeText={setApiSecret}
                  secureTextEntry
                  editable={!connecting}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    setShowAggregatorModal(false);
                    setApiKey('');
                    setApiSecret('');
                  }}
                  disabled={connecting}
                >
                  <Text style={styles.buttonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, connecting && { opacity: 0.6 }]}
                  onPress={() => selectedPlatform && handleConnectAggregator(selectedPlatform)}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save Credentials</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => selectedPlatform && handleOpenPartnerPortal(selectedPlatform)}
                disabled={connecting}
              >
                <Text
                  style={[
                    styles.label,
                    { color: Colors.primary[500], textAlign: 'center', fontWeight: '600' },
                  ]}
                >
                  Apply for API Access →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Order inbox CTA
  orderInboxBtn: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  orderInboxLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderInboxIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInboxTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  orderInboxSub: { fontSize: 12, color: '#7C3AED', marginTop: 2 },
  orderInboxBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  orderInboxBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  section: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  aggregatorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  aggregatorHeader: { flexDirection: 'row', gap: 12 },
  aggregatorInfo: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aggregatorText: { flex: 1 },
  aggregatorTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  aggregatorDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  statusText: { fontSize: 11, fontWeight: '600' },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectButtonText: { fontSize: 14, fontWeight: '600' },
  integrationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  integrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  integrationInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  integrationTypeBadge: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  integrationMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
  },
  syncButtonText: { fontSize: 12, fontWeight: '600', color: '#0EA5E9' },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  pauseButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 12 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  comingSoonGrid: { flexDirection: 'row', gap: 10 },
  comingSoonCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  comingSoonText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  comingSoonTimeframe: { fontSize: 11, fontWeight: '500', color: '#6B7280', marginTop: 6 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBody: { gap: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: '#3182CE' },
  buttonSecondary: { backgroundColor: '#F3F4F6' },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  buttonTextSecondary: { color: '#374151' },
});
