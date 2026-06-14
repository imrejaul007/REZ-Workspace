import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Switch,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/DesignTokens';
import { broadcastsApi, webPushBroadcastApi, BroadcastLogEntry } from '@/services/api/broadcasts';
import { showAlert } from '@/utils/alert';
import { useStore } from '@/contexts/StoreContext';
import { SEGMENT_TOP_SPENDERS_MIN_SPEND } from '@/constants/merchantConstants';
import { logger } from '@/utils/logger';

type ChannelType = 'whatsapp' | 'push' | 'sms';
type SegmentType = 'all' | 'top_spenders' | 'lapsed' | 'new';
type CampaignStatus = 'queued' | 'sent' | 'failed';

interface Campaign {
  _id: string;
  name: string;
  segment: string;
  channel: ChannelType;
  createdAt: string;
  status: CampaignStatus;
  message: string;
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  openRate: number;
}

interface SegmentOption {
  id: SegmentType;
  label: string;
  description: string;
}

const SEGMENT_OPTIONS: SegmentOption[] = [
  { id: 'all', label: 'All Customers', description: 'Send to all' },
  {
    id: 'top_spenders',
    label: 'Top Spenders',
    description: `₹${SEGMENT_TOP_SPENDERS_MIN_SPEND.toLocaleString()}+`,
  },
  { id: 'lapsed', label: 'Lapsed', description: '30+ days inactive' },
  { id: 'new', label: 'New Customers', description: '≤ 2 visits' },
];

const CHANNEL_OPTIONS: Array<{
  id: ChannelType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { id: 'push', label: 'Push', icon: 'notifications-outline' },
  { id: 'sms', label: 'SMS', icon: 'chatbubble-outline' },
];

export default function BroadcastScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;
  const storeSlug = activeStore?.slug;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // ─── Web Push Broadcast state ──────────────────────────────────────────────
  const [wpTitle, setWpTitle] = useState('');
  const [wpBody, setWpBody] = useState('');
  const [wpUrl, setWpUrl] = useState('');
  const [wpSending, setWpSending] = useState(false);
  const [wpLogs, setWpLogs] = useState<BroadcastLogEntry[]>([]);
  const [wpDailyUsed, setWpDailyUsed] = useState(0);
  const [wpDailyLimit, setWpDailyLimit] = useState(3);
  const [wpLogsLoading, setWpLogsLoading] = useState(false);
  const [wpSuccessMsg, setWpSuccessMsg] = useState('');

  // Compose state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [messageCharCount, setMessageCharCount] = useState(0);

  // Segment & channels
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('all');
  const [selectedChannels, setSelectedChannels] = useState<ChannelType[]>(['push']);
  const [segmentCount, setSegmentCount] = useState(0);
  const [estimatingSegment, setEstimatingSegment] = useState(false);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Success animation
  const [successAnim] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchCampaigns = useCallback(
    async (showRefreshing = false) => {
      if (!storeId) return;
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const response = await broadcastsApi.getAll({ storeId, limit: 20 });
        if (response.success && response.data) {
          const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
          setCampaigns(items as Campaign[]);
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching campaigns:', error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [storeId]
  );

  // Debounced audience estimation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!storeId) return;
      const estimateAudience = async () => {
        try {
          setEstimatingSegment(true);
          const response = await broadcastsApi.estimateAudience({
            storeId,
            segment: selectedSegment,
          });
          if (response.success) {
            setSegmentCount(response.data?.count || 0);
          }
        } catch (error) {
          if (__DEV__) console.error('Error estimating audience:', error);
        } finally {
          setEstimatingSegment(false);
        }
      };
      estimateAudience();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedSegment, storeId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Cleanup success state on unmount
  useEffect(() => {
    return () => {
      setShowSuccess(false);
      successAnim.setValue(0);
    };
  }, [successAnim]);

  const handleMessageChange = (text: string) => {
    const truncated = text.slice(0, 300);
    setMessage(truncated);
    setMessageCharCount(truncated.length);
  };

  const toggleChannel = (channel: ChannelType) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleSendCampaign = async () => {
    if (!storeId) {
      showAlert('Error', 'Store not found');
      return;
    }
    if (!title.trim()) {
      showAlert('Validation', 'Please enter a campaign title');
      return;
    }
    if (!message.trim()) {
      showAlert('Validation', 'Please enter a message');
      return;
    }
    if (selectedChannels.length === 0) {
      showAlert('Validation', 'Please select at least one channel');
      return;
    }

    try {
      setIsLoading(true);
      const response = await broadcastsApi.send({
        storeId,
        title,
        message,
        segment: selectedSegment,
        channels: selectedChannels,
      });

      if (response.success) {
        // Show success animation
        setShowSuccess(true);
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          // Reset form
          setTitle('');
          setMessage('');
          setMessageCharCount(0);
          setSelectedSegment('all');
          setSelectedChannels(['push']);
          setShowSuccess(false);
          successAnim.setValue(0);
          // Refresh campaigns
          fetchCampaigns();
        }, 2000);
      } else {
        showAlert('Error', response.message || 'Failed to send campaign');
      }
    } catch (error) {
      if (__DEV__) console.error('Error sending campaign:', error);
      showAlert('Error', error?.message || 'Failed to send campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId: string) => {
    try {
      setStatsLoading(true);
      const response = await broadcastsApi.getStats(campaignId);
      if (response.success) {
        setCampaignStats(response.data ?? null);
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const openCampaignStats = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setShowStatsModal(true);
    fetchCampaignStats(campaignId);
  };

  // ─── Web Push Broadcast handlers ──────────────────────────────────────────
  const fetchWebPushLogs = useCallback(async () => {
    if (!storeSlug) return;
    try {
      setWpLogsLoading(true);
      const res = await webPushBroadcastApi.getLogs(storeSlug);
      if (res.success && res.data) {
        setWpLogs(res.data.logs ?? []);
        setWpDailyUsed(res.data.dailyUsed ?? 0);
        setWpDailyLimit(res.data.dailyLimit ?? 3);
      }
    } catch (err) {
      if (__DEV__) console.error('[WP Broadcast] getLogs error:', err);
    } finally {
      setWpLogsLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchWebPushLogs();
  }, [fetchWebPushLogs]);

  const handleSendWebPush = async () => {
    if (!storeSlug) {
      showAlert('Error', 'Store slug not available');
      return;
    }
    if (!wpTitle.trim()) {
      showAlert('Validation', 'Please enter a notification title');
      return;
    }
    if (wpTitle.length > 60) {
      showAlert('Validation', 'Title must be 60 characters or fewer');
      return;
    }
    if (!wpBody.trim()) {
      showAlert('Validation', 'Please enter a notification body');
      return;
    }
    if (wpBody.length > 160) {
      showAlert('Validation', 'Body must be 160 characters or fewer');
      return;
    }
    if (wpDailyUsed >= wpDailyLimit) {
      showAlert(
        'Limit Reached',
        `You have used all ${wpDailyLimit} daily broadcasts. Try again tomorrow.`
      );
      return;
    }
    try {
      setWpSending(true);
      const res = await webPushBroadcastApi.send(storeSlug, {
        title: wpTitle.trim(),
        body: wpBody.trim(),
        url: wpUrl.trim() || undefined,
      });
      if (res.success) {
        setWpSuccessMsg(`Sent to ${res.data?.recipientCount ?? 0} customers`);
        setWpTitle('');
        setWpBody('');
        setWpUrl('');
        await fetchWebPushLogs();
        setTimeout(() => setWpSuccessMsg(''), 4000);
      } else {
        showAlert('Error', res?.message || 'Failed to send notification');
      }
    } catch (err) {
      if (__DEV__) console.error('[WP Broadcast] send error:', err);
      showAlert('Error', err?.message || 'Failed to send notification');
    } finally {
      setWpSending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[500], Colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <ThemedText style={styles.headerTitle}>Broadcast Campaigns</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Send WhatsApp, push & SMS to your customers
        </ThemedText>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCampaigns(true)} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compose Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Campaign Title</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Weekend Sale"
              placeholderTextColor={Colors.disabled}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
            <ThemedText style={styles.charCounter}>{title.length}/60</ThemedText>
          </View>
        </View>

        {/* Audience Segment Picker */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Audience Segment</ThemedText>
          <View style={styles.segmentChips}>
            {SEGMENT_OPTIONS.map((segment) => (
              <TouchableOpacity
                key={segment.id}
                style={[
                  styles.segmentChip,
                  selectedSegment === segment.id && styles.segmentChipActive,
                ]}
                onPress={() => setSelectedSegment(segment.id)}
              >
                <ThemedText
                  style={[
                    styles.segmentChipText,
                    selectedSegment === segment.id && styles.segmentChipTextActive,
                  ]}
                >
                  {segment.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.audienceEstimate}>
            {estimatingSegment ? (
              <>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
                <ThemedText style={styles.audienceText}>Calculating audience size…</ThemedText>
              </>
            ) : (
              <>
                <Ionicons name="people" size={16} color={Colors.primary[500]} />
                <ThemedText style={styles.audienceText}>
                  {segmentCount.toLocaleString()} customers
                </ThemedText>
              </>
            )}
          </View>
        </View>

        {/* Channel Selector */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Send Via</ThemedText>
          <View style={styles.channelGrid}>
            {CHANNEL_OPTIONS.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelOption,
                  selectedChannels.includes(channel.id) && styles.channelOptionActive,
                ]}
                onPress={() => toggleChannel(channel.id)}
              >
                <Ionicons
                  name={channel.icon}
                  size={24}
                  color={
                    selectedChannels.includes(channel.id) ? Colors.primary[500] : Colors.disabled
                  }
                />
                <ThemedText
                  style={[
                    styles.channelLabel,
                    selectedChannels.includes(channel.id) && styles.channelLabelActive,
                  ]}
                >
                  {channel.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message Composer */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <ThemedText style={styles.sectionTitle}>Message</ThemedText>
            <ThemedText style={styles.charCounter}>{messageCharCount}/300</ThemedText>
          </View>
          <TextInput
            style={styles.messageInput}
            placeholder="Enter your message here..."
            placeholderTextColor={Colors.disabled}
            multiline
            numberOfLines={5}
            value={message}
            onChangeText={handleMessageChange}
            maxLength={300}
          />

          {/* Preview */}
          {message.trim() && (
            <View style={styles.previewCard}>
              <ThemedText style={styles.previewLabel}>Preview</ThemedText>
              <View style={styles.messageBubble}>
                <ThemedText style={styles.messagePreviewText}>{message}</ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* ── Web Push Broadcast Section ── */}
        <View style={[styles.section, styles.wpSection]}>
          <View style={styles.wpSectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary[500]} />
            <ThemedText style={styles.wpSectionTitle}>REZ Now Push Notifications</ThemedText>
          </View>

          {/* Daily usage indicator */}
          <View style={styles.wpUsageBar}>
            <ThemedText style={styles.wpUsageText}>
              {wpDailyUsed} of {wpDailyLimit} daily broadcasts used
            </ThemedText>
            <View style={styles.wpUsageDots}>
              {Array.from({ length: wpDailyLimit }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.wpUsageDot, i < wpDailyUsed && styles.wpUsageDotFilled]}
                />
              ))}
            </View>
          </View>

          {/* Title input */}
          <View style={styles.wpField}>
            <View style={styles.wpLabelRow}>
              <ThemedText style={styles.wpLabel}>Title</ThemedText>
              <ThemedText style={[styles.wpCounter, wpTitle.length > 54 && styles.wpCounterWarn]}>
                {wpTitle.length}/60
              </ThemedText>
            </View>
            <TextInput
              style={styles.wpInput}
              placeholder="e.g., Flash Sale — 20% off today"
              placeholderTextColor={Colors.disabled}
              value={wpTitle}
              onChangeText={(t) => setWpTitle(t.slice(0, 60))}
              maxLength={60}
            />
          </View>

          {/* Body input */}
          <View style={styles.wpField}>
            <View style={styles.wpLabelRow}>
              <ThemedText style={styles.wpLabel}>Message</ThemedText>
              <ThemedText style={[styles.wpCounter, wpBody.length > 145 && styles.wpCounterWarn]}>
                {wpBody.length}/160
              </ThemedText>
            </View>
            <TextInput
              style={[styles.wpInput, styles.wpInputMulti]}
              placeholder="Tap here to view your exclusive offer…"
              placeholderTextColor={Colors.disabled}
              value={wpBody}
              onChangeText={(t) => setWpBody(t.slice(0, 160))}
              maxLength={160}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Optional URL */}
          <View style={styles.wpField}>
            <ThemedText style={styles.wpLabel}>Link (optional)</ThemedText>
            <TextInput
              style={styles.wpInput}
              placeholder="https://menu.rez.money/your-store"
              placeholderTextColor={Colors.disabled}
              value={wpUrl}
              onChangeText={setWpUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Preview card */}
          {(wpTitle.trim() || wpBody.trim()) && (
            <View style={styles.wpPreview}>
              <ThemedText style={styles.wpPreviewLabel}>Preview</ThemedText>
              <View style={styles.wpPreviewCard}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={Colors.primary[500]}
                  style={{ marginTop: 2 }}
                />
                <View style={styles.wpPreviewContent}>
                  {wpTitle.trim() ? (
                    <ThemedText style={styles.wpPreviewTitle}>{wpTitle.trim()}</ThemedText>
                  ) : null}
                  {wpBody.trim() ? (
                    <ThemedText style={styles.wpPreviewBody}>{wpBody.trim()}</ThemedText>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {/* Success message */}
          {wpSuccessMsg ? (
            <View style={styles.wpSuccess}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success[500]} />
              <ThemedText style={styles.wpSuccessText}>{wpSuccessMsg}</ThemedText>
            </View>
          ) : null}

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.wpSendButton,
              (wpSending || wpDailyUsed >= wpDailyLimit) && styles.wpSendButtonDisabled,
            ]}
            onPress={handleSendWebPush}
            disabled={wpSending || wpDailyUsed >= wpDailyLimit}
            accessibilityRole="button"
            accessibilityLabel="Send push notification to all subscribers"
          >
            {wpSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="white" />
                <ThemedText style={styles.wpSendButtonText}>Send to All Subscribers</ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Recent push broadcasts */}
          <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>
            Recent Push Broadcasts
          </ThemedText>
          {wpLogsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginTop: 8 }} />
          ) : wpLogs.length === 0 ? (
            <ThemedText style={styles.wpEmptyText}>No push broadcasts yet</ThemedText>
          ) : (
            wpLogs.map((log) => (
              <View key={log._id} style={styles.wpLogCard}>
                <View style={styles.wpLogRow}>
                  <ThemedText style={styles.wpLogTitle} numberOfLines={1}>
                    {log.title}
                  </ThemedText>
                  <ThemedText style={styles.wpLogCount}>{log.recipientCount} sent</ThemedText>
                </View>
                <ThemedText style={styles.wpLogBody} numberOfLines={2}>
                  {log.body}
                </ThemedText>
                <ThemedText style={styles.wpLogDate}>
                  {new Date(log.sentAt).toLocaleDateString()}{' '}
                  {new Date(log.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
              </View>
            ))
          )}
        </View>

        {/* Campaign History */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Campaign History</ThemedText>
          {campaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="send" size={48} color={Colors.disabled} />
              <ThemedText style={styles.emptyStateText}>No campaigns yet</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Send your first broadcast to get started
              </ThemedText>
            </View>
          ) : (
            <View>
              {campaigns.map((campaign) => (
                <TouchableOpacity
                  key={campaign._id}
                  style={styles.campaignCard}
                  onPress={() => openCampaignStats(campaign._id)}
                >
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignInfo}>
                      <ThemedText style={styles.campaignTitle}>{campaign.name}</ThemedText>
                      <ThemedText style={styles.campaignDate}>
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            campaign.status === 'sent'
                              ? Colors.success[500] + '20'
                              : campaign.status === 'queued'
                                ? Colors.warning[500] + '20'
                                : Colors.danger + '20',
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusText,
                          {
                            color:
                              campaign.status === 'sent'
                                ? Colors.success[500]
                                : campaign.status === 'queued'
                                  ? Colors.warning[500]
                                  : Colors.danger,
                          },
                        ]}
                      >
                        {campaign.status.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.campaignMeta} numberOfLines={2}>
                    {campaign.message}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Send Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendCampaign}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Send campaign"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : showSuccess ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <ThemedText style={styles.sendButtonText}>Sent!</ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <ThemedText style={styles.sendButtonText}>Send Campaign</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Campaign Stats</ThemedText>
              <TouchableOpacity onPress={() => setShowStatsModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {statsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
              </View>
            ) : campaignStats ? (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>Sent</ThemedText>
                  <ThemedText style={styles.statValue}>{campaignStats.sent}</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>Delivered</ThemedText>
                  <ThemedText style={styles.statValue}>{campaignStats.delivered}</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>Opened</ThemedText>
                  <ThemedText style={styles.statValue}>{campaignStats.opened}</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>Failed</ThemedText>
                  <ThemedText style={styles.statValue}>{campaignStats.failed}</ThemedText>
                </View>
                <View style={[styles.statCard, { backgroundColor: Colors.primary[500] + '20' }]}>
                  <ThemedText style={styles.statLabel}>Open Rate</ThemedText>
                  <ThemedText style={[styles.statValue, { color: Colors.primary[500] }]}>
                    {campaignStats.openRate}%
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatsModal(false)}
            >
              <ThemedText style={styles.modalCloseButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputGroup: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.card,
  },
  charCounter: {
    fontSize: 12,
    color: Colors.disabled,
    marginTop: 8,
  },
  segmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  segmentChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  segmentChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  segmentChipTextActive: {
    color: 'white',
  },
  audienceEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.primary[500] + '10',
    borderRadius: 8,
  },
  audienceText: {
    fontSize: 13,
    color: Colors.primary[500],
    fontWeight: '500',
  },
  channelGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  channelOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    gap: 6,
  },
  channelOptionActive: {
    backgroundColor: Colors.primary[500] + '15',
    borderColor: Colors.primary[500],
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  channelLabelActive: {
    color: Colors.primary[500],
  },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.card,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  previewCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.disabled,
    marginBottom: 8,
  },
  messageBubble: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messagePreviewText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: Colors.disabled,
    marginTop: 4,
  },
  campaignCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  campaignDate: {
    fontSize: 12,
    color: Colors.disabled,
  },
  campaignMeta: {
    fontSize: 12,
    color: Colors.disabled,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12, // min readable
    fontWeight: '700',
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.disabled,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  // ─── Web Push Broadcast styles ───────────────────────────────────────────
  wpSection: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  wpSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  wpSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  wpUsageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary[500] + '10',
    borderRadius: 8,
    marginBottom: 16,
  },
  wpUsageText: {
    fontSize: 12,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  wpUsageDots: {
    flexDirection: 'row',
    gap: 6,
  },
  wpUsageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border.default,
  },
  wpUsageDotFilled: {
    backgroundColor: Colors.primary[500],
  },
  wpField: {
    marginBottom: 12,
  },
  wpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  wpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  wpCounter: {
    fontSize: 11,
    color: Colors.disabled,
  },
  wpCounterWarn: {
    color: Colors.warning[500],
    fontWeight: '700',
  },
  wpInput: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  wpInputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  wpPreview: {
    marginTop: 4,
    marginBottom: 12,
  },
  wpPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.disabled,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  wpPreviewCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  wpPreviewContent: {
    flex: 1,
  },
  wpPreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  wpPreviewBody: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  wpSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.success[500] + '15',
    borderRadius: 8,
    marginBottom: 12,
  },
  wpSuccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success[500],
  },
  wpSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
  },
  wpSendButtonDisabled: {
    opacity: 0.5,
  },
  wpSendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  wpEmptyText: {
    fontSize: 13,
    color: Colors.disabled,
    marginTop: 8,
    textAlign: 'center',
    paddingVertical: 12,
  },
  wpLogCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  wpLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wpLogTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  wpLogCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  wpLogBody: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  wpLogDate: {
    fontSize: 11,
    color: Colors.disabled,
  },
});
