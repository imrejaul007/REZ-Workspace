/**
 * Karma Campaign Details Screen
 * Displays campaign details, participants, and allows approval of completions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  karmaCampaignService,
  KarmaCampaign,
  KarmaParticipant,
  KarmaCampaignStatus,
} from '@/services/api/karma';
import { BRAND } from '@/constants/brand';
import { logger } from '@/utils/logger';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';
import ConfirmModal from '@/components/common/ConfirmModal';

// Helper functions
const getCampaignTypeEmoji = (type?: string): string => {
  const emojiMap: Record<string, string> = {
    'blood-donation': '🩸',
    'food-distribution': '🍱',
    'ngo-support': '🤝',
    other: '✨',
  };
  return emojiMap[type || ''] || '✨';
};

const getStatusColor = (status?: KarmaCampaignStatus): { bg: string; text: string } => {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
    draft: { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF' },
    paused: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
    completed: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  };
  return colors[status || ''] || colors.draft;
};

const getParticipantStatusColor = (status?: string): string => {
  const colors: Record<string, string> = {
    registered: '#3B82F6',
    checked_in: '#F59E0B',
    completed: '#10B981',
    cancelled: '#EF4444',
    no_show: '#6B7280',
  };
  return colors[status || ''] || '#6B7280';
};

const getParticipantStatusLabel = (status?: string): string => {
  if (!status) return 'Unknown';
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function CampaignDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Data state
  const [campaign, setCampaign] = useState<KarmaCampaign | null>(null);
  const [participants, setParticipants] = useState<KarmaParticipant[]>([]);
  const [selectedTab, setSelectedTab] = useState<'details' | 'participants'>('details');

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<KarmaParticipant | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Modals
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  // Load campaign data
  const loadCampaignData = useCallback(
    async (isRefresh = false) => {
      if (!id) return;

      try {
        if (!isRefresh) setLoading(true);
        const campaignData = await karmaCampaignService.getCampaignById(id);
        setCampaign(campaignData);
      } catch (error) {
        setErrorModal({
          visible: true,
          title: 'Error',
          message: error.message || 'Failed to load campaign details',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  // Load participants
  const loadParticipants = useCallback(
    async (isRefresh = false) => {
      if (!id) return;

      try {
        const params: unknown = {};
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        const response = await karmaCampaignService.getParticipants(id, params);
        setParticipants(response.participants);
      } catch (error) {
        logger.error('Error loading participants:', error);
      }
    },
    [id, statusFilter]
  );

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  useEffect(() => {
    if (!loading && campaign) {
      loadParticipants();
    }
  }, [loading, campaign, loadParticipants, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCampaignData(true);
    loadParticipants(true);
  }, [loadCampaignData, loadParticipants]);

  // Actions
  const handleStatusChange = async (newStatus: KarmaCampaignStatus) => {
    if (!id) return;

    setActionLoading(true);
    try {
      await karmaCampaignService.updateCampaign(id, { status: newStatus });
      setSuccessModal({
        visible: true,
        title: 'Success',
        message: `Campaign status changed to ${newStatus}`,
      });
      loadCampaignData(true);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to update status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveParticipant = async (awardBonus: boolean = false) => {
    if (!id || !selectedParticipant) return;

    setActionLoading(true);
    try {
      await karmaCampaignService.approveParticipant(id, selectedParticipant.user._id, { awardBonus });
      setShowApproveModal(false);
      setSuccessModal({
        visible: true,
        title: 'Approved',
        message: `Participation approved${awardBonus ? ' with bonus coins' : ''}`,
      });
      loadParticipants(true);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to approve participant',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelParticipant = async () => {
    if (!id || !selectedParticipant) return;

    setActionLoading(true);
    try {
      await karmaCampaignService.cancelParticipant(id, selectedParticipant.user._id);
      setShowCancelModal(false);
      setSuccessModal({
        visible: true,
        title: 'Cancelled',
        message: 'Participant has been cancelled',
      });
      loadParticipants(true);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to cancel participant',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openMaps = () => {
    if (!campaign?.location?.address) return;
    const address = `${campaign.location.address}${
      campaign.location.city ? ', ' + campaign.location.city : ''
    }`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading campaign details...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (!campaign) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
            <Text style={styles.errorTitle}>Campaign Not Found</Text>
            <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
              <Text style={styles.backButtonTextLarge}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const statusStyle = getStatusColor(campaign.status);
  const fillPercentage = campaign.capacity
    ? Math.min((campaign.capacity.enrolled / campaign.capacity.goal) * 100, 100)
    : 0;

  const renderParticipantItem = ({ item, index }: { item: KarmaParticipant; index: number }) => {
    const statusColor = getParticipantStatusColor(item.status);
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View style={styles.participantCard}>
          <View style={styles.participantAvatar}>
            {item.user.profile?.avatar ? (
              <Image source={{ uri: item.user.profile.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>
                {item.user.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.user.name}</Text>
            {item.user.phone && (
              <Text style={styles.participantPhone}>{item.user.phone}</Text>
            )}
            <Text style={styles.participantDate}>
              Joined: {formatDate(item.registeredAt)}
            </Text>
          </View>
          <View style={styles.participantStatus}>
            <View style={[styles.statusBadgeSmall, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getParticipantStatusLabel(item.status)}
              </Text>
            </View>
            {item.coinsAwarded !== undefined && item.coinsAwarded > 0 && (
              <Text style={styles.coinsEarned}>
                +{item.coinsAwarded} {BRAND.COIN_SHORT}
              </Text>
            )}
          </View>
          {item.status === 'checked_in' && campaign.status === 'active' && (
            <View style={styles.participantActions}>
              <TouchableOpacity
                style={[styles.actionButtonSmall, styles.approveButton]}
                onPress={() => {
                  setSelectedParticipant(item);
                  setShowApproveModal(true);
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButtonSmall, styles.cancelButtonSmall]}
                onPress={() => {
                  setSelectedParticipant(item);
                  setShowCancelModal(true);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED', '#F3F4F6']}
          locations={[0, 0.3, 1]}
          style={styles.backgroundGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Campaign Details</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Hero Section */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={styles.heroSection}
            >
              {campaign.image ? (
                <Image source={{ uri: campaign.image }} style={styles.heroImage} />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Text style={styles.heroEmoji}>
                    {getCampaignTypeEmoji(campaign.type)}
                  </Text>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {(campaign.status?.charAt(0).toUpperCase() ?? '') +
                    (campaign.status?.slice(1) ?? '')}
                </Text>
              </View>
            </Animated.View>

            {/* Title & Type */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              style={styles.titleSection}
            >
              <Text style={styles.campaignTitle}>{campaign.name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeEmoji}>
                  {getCampaignTypeEmoji(campaign.type)}
                </Text>
                <Text style={styles.typeText}>
                  {campaign.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
              </View>
            </Animated.View>

            {/* Tab Selector */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.tabContainer}
            >
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'details' && styles.tabActive]}
                onPress={() => setSelectedTab('details')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'details' && styles.tabTextActive,
                  ]}
                >
                  Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'participants' && styles.tabActive]}
                onPress={() => setSelectedTab('participants')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'participants' && styles.tabTextActive,
                  ]}
                >
                  Participants ({campaign.capacity?.enrolled || 0})
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Content based on tab */}
            {selectedTab === 'details' ? (
              <>
                {/* Quick Stats */}
                <Animated.View
                  entering={FadeInDown.delay(250).springify()}
                  style={styles.statsGrid}
                >
                  <View style={styles.statCard}>
                    <Ionicons name="people" size={20} color="#8B5CF6" />
                    <Text style={styles.statValue}>{campaign.capacity?.enrolled || 0}</Text>
                    <Text style={styles.statLabel}>Enrolled</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.statValue}>{campaign.capacity?.completed || 0}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="wallet" size={20} color="#F59E0B" />
                    <Text style={styles.statValue}>
                      {(campaign.capacity?.completed || 0) * (campaign.rewards?.coins || 0)}
                    </Text>
                    <Text style={styles.statLabel}>{BRAND.COIN_SHORT}</Text>
                  </View>
                </Animated.View>

                {/* Description */}
                {campaign.description && (
                  <Animated.View
                    entering={FadeInDown.delay(300).springify()}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                      <Text style={styles.cardTitle}>About</Text>
                    </View>
                    <Text style={styles.descriptionText}>{campaign.description}</Text>
                  </Animated.View>
                )}

                {/* Location */}
                {campaign.location && (
                  <Animated.View
                    entering={FadeInDown.delay(350).springify()}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="location" size={20} color="#EF4444" />
                      <Text style={styles.cardTitle}>Location</Text>
                    </View>
                    <Text style={styles.locationText}>{campaign.location.address}</Text>
                    {campaign.location.city && (
                      <Text style={styles.cityText}>{campaign.location.city}</Text>
                    )}
                    <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
                      <Ionicons name="map-outline" size={16} color="#3B82F6" />
                      <Text style={styles.mapsButtonText}>Open in Maps</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* Schedule */}
                <Animated.View
                  entering={FadeInDown.delay(400).springify()}
                  style={styles.quickInfoGrid}
                >
                  <View style={styles.quickInfoCard}>
                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                    <Text style={styles.quickInfoLabel}>Start Date</Text>
                    <Text style={styles.quickInfoValue}>
                      {campaign.startDate ? formatDate(campaign.startDate) : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.quickInfoCard}>
                    <Ionicons name="calendar" size={20} color="#F59E0B" />
                    <Text style={styles.quickInfoLabel}>End Date</Text>
                    <Text style={styles.quickInfoValue}>
                      {campaign.endDate ? formatDate(campaign.endDate) : 'Not set'}
                    </Text>
                  </View>
                </Animated.View>

                {/* Capacity Progress */}
                {campaign.capacity && (
                  <Animated.View
                    entering={FadeInDown.delay(450).springify()}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="trending-up" size={20} color="#10B981" />
                      <Text style={styles.cardTitle}>Capacity</Text>
                    </View>
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Participants</Text>
                        <Text style={styles.progressValue}>
                          {campaign.capacity.enrolled}/{campaign.capacity.goal}
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View
                          style={[styles.progressFill, { width: `${fillPercentage}%` }]}
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Rewards */}
                <Animated.View
                  entering={FadeInDown.delay(500).springify()}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="gift" size={20} color="#F59E0B" />
                    <Text style={styles.cardTitle}>Rewards</Text>
                  </View>
                  <View style={styles.rewardsGrid}>
                    <View style={styles.rewardItem}>
                      <Ionicons name="wallet" size={24} color="#10B981" />
                      <Text style={styles.rewardValue}>+{campaign.rewards?.coins || 0}</Text>
                      <Text style={styles.rewardLabel}>{BRAND.COIN_NAME}</Text>
                    </View>
                    {campaign.rewards?.bonusCoins && campaign.rewards.bonusCoins > 0 && (
                      <View style={[styles.rewardItem, styles.rewardItemPurple]}>
                        <Ionicons name="star" size={24} color="#8B5CF6" />
                        <Text style={[styles.rewardValue, { color: '#8B5CF6' }]}>
                          +{campaign.rewards.bonusCoins}
                        </Text>
                        <Text style={styles.rewardLabel}>Bonus</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>

                {/* Verification Methods */}
                {campaign.verificationMethods && campaign.verificationMethods.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(550).springify()}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
                      <Text style={styles.cardTitle}>Verification</Text>
                    </View>
                    <View style={styles.verificationRow}>
                      {campaign.verificationMethods.map((method, idx) => {
                        const config: Record<string, { icon: string; label: string; color: string }> = {
                          manual: { icon: 'person', label: 'Manual', color: '#6B7280' },
                          qr: { icon: 'qr-code', label: 'QR Code', color: '#10B981' },
                          geo: { icon: 'location', label: 'Location', color: '#3B82F6' },
                        };
                        const c = config[method] || config.manual;
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.verificationChip,
                              { backgroundColor: `${c.color}15` },
                            ]}
                          >
                            <Ionicons
                              name={c.icon as keyof typeof Ionicons.glyphMap}
                              size={14}
                              color={c.color}
                            />
                            <Text style={[styles.verificationChipText, { color: c.color }]}>
                              {c.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    {campaign.geoFenceRadius && (
                      <Text style={styles.verificationNote}>
                        Geo-fence radius: {campaign.geoFenceRadius}m
                      </Text>
                    )}
                  </Animated.View>
                )}

                {/* Benefits */}
                {campaign.benefits && campaign.benefits.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(600).springify()}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="heart" size={20} color="#EF4444" />
                      <Text style={styles.cardTitle}>Benefits</Text>
                    </View>
                    {campaign.benefits.map((benefit, idx) => (
                      <View key={idx} style={styles.listItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.listText}>{benefit}</Text>
                      </View>
                    ))}
                  </Animated.View>
                )}

                {/* Requirements */}
                {campaign.requirements && campaign.requirements.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(650).springify()}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="list" size={20} color="#8B5CF6" />
                      <Text style={styles.cardTitle}>Requirements</Text>
                    </View>
                    {campaign.requirements.map((req, idx) => (
                      <View key={idx} style={styles.listItem}>
                        <Ionicons
                          name={req.isMandatory ? 'alert-circle' : 'checkmark-circle'}
                          size={16}
                          color={req.isMandatory ? '#EF4444' : '#10B981'}
                        />
                        <Text style={styles.listText}>
                          {req.text}
                          {req.isMandatory && (
                            <Text style={styles.mandatoryText}> *</Text>
                          )}
                        </Text>
                      </View>
                    ))}
                  </Animated.View>
                )}

                {/* Status Actions */}
                <Animated.View
                  entering={FadeInDown.delay(700).springify()}
                  style={styles.actionsSection}
                >
                  <Text style={styles.sectionTitle}>Manage Campaign</Text>
                  <View style={styles.actionRow}>
                    {campaign.status === 'draft' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.activateButton]}
                        onPress={() => handleStatusChange('active')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="play" size={16} color="#10B981" />
                        <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                          Activate
                        </Text>
                      </TouchableOpacity>
                    )}
                    {campaign.status === 'active' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.pauseButton]}
                        onPress={() => handleStatusChange('paused')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="pause" size={16} color="#F59E0B" />
                        <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
                          Pause
                        </Text>
                      </TouchableOpacity>
                    )}
                    {campaign.status === 'paused' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.activateButton]}
                        onPress={() => handleStatusChange('active')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="play" size={16} color="#10B981" />
                        <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                          Resume
                        </Text>
                      </TouchableOpacity>
                    )}
                    {campaign.status !== 'completed' && campaign.status !== 'cancelled' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.completeButton]}
                          onPress={() => handleStatusChange('completed')}
                          disabled={actionLoading}
                        >
                          <Ionicons name="checkmark-done" size={16} color="#6B7280" />
                          <Text style={[styles.actionButtonText, { color: '#6B7280' }]}>
                            Complete
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelCampaignButton]}
                          onPress={() => {
                            setSuccessModal({
                              visible: true,
                              title: 'Cancel Campaign',
                              message: 'Are you sure you want to cancel this campaign?',
                            });
                          }}
                          disabled={actionLoading}
                        >
                          <Ionicons name="close-circle" size={16} color="#EF4444" />
                          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </Animated.View>
              </>
            ) : (
              /* Participants Tab */
              <Animated.View entering={FadeInDown.delay(250).springify()}>
                {/* Status Filter */}
                <View style={styles.participantFilterContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                  >
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Registered', value: 'registered' },
                      { label: 'Checked In', value: 'checked_in' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Cancelled', value: 'cancelled' },
                    ].map((filter) => (
                      <TouchableOpacity
                        key={filter.value}
                        style={[
                          styles.filterChip,
                          statusFilter === filter.value && styles.filterChipActive,
                        ]}
                        onPress={() => setStatusFilter(filter.value)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            statusFilter === filter.value && styles.filterChipTextActive,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {participants.length === 0 ? (
                  <View style={styles.emptyParticipants}>
                    <Ionicons name="people-outline" size={60} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No participants yet</Text>
                    <Text style={styles.emptyDescription}>
                      Participants will appear here once they register for this campaign.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.participantsList}>
                    {participants.map((item, index) => (
                      <View key={item._id}>
                        {renderParticipantItem({ item, index })}
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>

        {/* Modals */}
        <ConfirmModal
          visible={showApproveModal}
          title="Approve Participation"
          message={`Approve ${selectedParticipant?.user.name}'s participation?`}
          confirmText="Approve"
          confirmTextSecondary="Approve with Bonus"
          cancelText="Cancel"
          type="default"
          loading={actionLoading}
          onConfirm={() => handleApproveParticipant(false)}
          onConfirmSecondary={() => handleApproveParticipant(true)}
          onCancel={() => {
            setShowApproveModal(false);
            setSelectedParticipant(null);
          }}
        />

        <ConfirmModal
          visible={showCancelModal}
          title="Cancel Participation"
          message={`Are you sure you want to cancel ${selectedParticipant?.user.name}'s participation?`}
          confirmText="Yes, Cancel"
          cancelText="No, Keep"
          type="danger"
          loading={actionLoading}
          onConfirm={handleCancelParticipant}
          onCancel={() => {
            setShowCancelModal(false);
            setSelectedParticipant(null);
          }}
        />

        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
        />

        <SuccessModal
          visible={successModal.visible}
          title={successModal.title}
          message={successModal.message}
          onClose={() => setSuccessModal({ visible: false, title: '', message: '' })}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 280,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  backButtonLarge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonTextLarge: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroSection: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  heroEmoji: {
    fontSize: 56,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 16,
  },
  campaignTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  mapsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  rewardItemPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  rewardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 8,
  },
  rewardLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  verificationChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  verificationNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  mandatoryText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  activateButton: {
    flex: 1,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  pauseButton: {
    flex: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  completeButton: {
    flex: 1,
    borderColor: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  cancelCampaignButton: {
    flex: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  participantFilterContainer: {
    marginBottom: 16,
  },
  filterList: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyParticipants: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  participantStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coinsEarned: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  participantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  approveButton: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  cancelButtonSmall: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
});
