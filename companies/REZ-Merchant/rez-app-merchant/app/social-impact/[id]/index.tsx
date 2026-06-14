import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { socialImpactAdminService, SocialImpactEvent } from '@/services/api/socialImpact';
import { BRAND } from '@/constants/brand';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';
import ConfirmModal from '@/components/common/ConfirmModal';

// Helper functions
const getEventTypeEmoji = (eventType?: string): string => {
  const emojiMap: Record<string, string> = {
    'blood-donation': '🩸',
    'tree-plantation': '🌳',
    'beach-cleanup': '🏖️',
    'digital-literacy': '💻',
    'food-drive': '🍛',
    'health-camp': '🏥',
    'skill-training': '👩‍💼',
    'women-empowerment': '👩‍💼',
    education: '📚',
    environment: '🌍',
  };
  return emojiMap[eventType || ''] || '✨';
};

const getStatusColor = (status?: string): { bg: string; text: string } => {
  const colors: Record<string, { bg: string; text: string }> = {
    upcoming: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
    ongoing: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
    completed: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
    draft: { bg: 'rgba(249, 115, 22, 0.1)', text: '#F97316' },
  };
  return colors[status || ''] || colors.draft;
};

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Data state
  const [event, setEvent] = useState<SocialImpactEvent | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  // Load event data
  const loadEventData = useCallback(
    async (isRefresh = false) => {
      if (!id) return;

      try {
        if (!isRefresh) setLoading(true);
        const eventData = await socialImpactAdminService.getEventById(id);
        setEvent(eventData);
      } catch (error) {
        setErrorModal({
          visible: true,
          title: 'Error',
          message: error.message || 'Failed to load event details',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEventData(true);
  }, [loadEventData]);

  // Actions
  const handleStatusChange = async () => {
    if (!id || !selectedStatus) return;

    setActionLoading(true);
    try {
      await socialImpactAdminService.updateEvent(id, { eventStatus: selectedStatus as 'cancelled' | 'completed' | 'upcoming' | 'ongoing' });
      setStatusModalVisible(false);
      setSuccessModal({
        visible: true,
        title: 'Success',
        message: `Event status changed to ${selectedStatus}`,
      });
      loadEventData(true);
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

  const handleCancel = async () => {
    if (!id) return;

    setActionLoading(true);
    try {
      await socialImpactAdminService.updateEvent(id, { eventStatus: 'cancelled' });
      setCancelModalVisible(false);
      setSuccessModal({
        visible: true,
        title: 'Cancelled',
        message: 'Event has been cancelled',
      });
      loadEventData(true);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to cancel event',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openMaps = () => {
    if (!event?.location?.address) return;
    const address = `${event.location.address}${event.location.city ? ', ' + event.location.city : ''}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const callPhone = () => {
    if (event?.contact?.phone) {
      Linking.openURL(`tel:${event.contact.phone}`);
    }
  };

  const sendEmail = () => {
    if (event?.contact?.email) {
      Linking.openURL(`mailto:${event.contact.email}`);
    }
  };

  // Format helpers
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

  const formatTime = (eventTime?: { start: string; end: string }): string => {
    if (!eventTime) return 'TBD';
    return `${eventTime.start} - ${eventTime.end}`;
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading event details...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
            <Text style={styles.errorTitle}>Event Not Found</Text>
            <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const statusStyle = getStatusColor(event.eventStatus);
  const fillPercentage = event.capacity
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669', '#F3F4F6']}
          locations={[0, 0.3, 1]}
          style={styles.backgroundGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Details</Text>
            <TouchableOpacity
              style={styles.headerEditButton}
              onPress={() => router.push(`/social-impact/${id}/edit`)}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Hero Section */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
              {event.image ? (
                <Image source={{ uri: event.image }} style={styles.heroImage} />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Text style={styles.heroEmoji}>{getEventTypeEmoji(event.eventType)}</Text>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {(event.eventStatus?.charAt(0).toUpperCase() ?? '') +
                    (event.eventStatus?.slice(1) ?? '')}
                </Text>
              </View>
              {event.featured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={12} color="#FFFFFF" />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </Animated.View>

            {/* Title & Organizer */}
            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.titleSection}>
              <Text style={styles.eventTitle}>{event.name}</Text>
              <View style={styles.organizerRow}>
                <Ionicons name="business" size={16} color="#6B7280" />
                <Text style={styles.organizerText}>
                  {event.organizer?.name || 'Unknown Organizer'}
                </Text>
              </View>
              {event.sponsor && (
                <View style={styles.sponsorBadge}>
                  <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                  <Text style={styles.sponsorBadgeText}>Sponsored by {event.sponsor.name}</Text>
                </View>
              )}
            </Animated.View>

            {/* Quick Info */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.quickInfoGrid}
            >
              <View style={styles.quickInfoCard}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                <Text style={styles.quickInfoLabel}>Date</Text>
                <Text style={styles.quickInfoValue}>{formatDate(event.eventDate)}</Text>
              </View>
              <View style={styles.quickInfoCard}>
                <Ionicons name="time-outline" size={20} color="#F97316" />
                <Text style={styles.quickInfoLabel}>Time</Text>
                <Text style={styles.quickInfoValue}>{formatTime(event.eventTime)}</Text>
              </View>
            </Animated.View>

            {/* Location */}
            {event.location && (
              <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="location" size={20} color="#EF4444" />
                  <Text style={styles.cardTitle}>Location</Text>
                </View>
                <Text style={styles.locationText}>{event.location.address}</Text>
                {event.location.city && <Text style={styles.cityText}>{event.location.city}</Text>}
                <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
                  <Ionicons name="map-outline" size={16} color="#3B82F6" />
                  <Text style={styles.mapsButtonText}>Open in Maps</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Description */}
            {event.description && (
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text style={styles.cardTitle}>About</Text>
                </View>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </Animated.View>
            )}

            {/* Impact & Progress */}
            <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.impactCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text style={styles.cardTitle}>Impact & Progress</Text>
              </View>
              {event.impact?.description && (
                <Text style={styles.impactText}>{event.impact.description}</Text>
              )}
              {event.capacity && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Participants</Text>
                    <Text style={styles.progressValue}>
                      {event.capacity.enrolled}/{event.capacity.goal}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${fillPercentage}%` }]} />
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Rewards */}
            {event.rewards && (
              <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="gift" size={20} color="#F59E0B" />
                  <Text style={styles.cardTitle}>Rewards</Text>
                </View>
                <View style={styles.rewardsGrid}>
                  <View style={styles.rewardItem}>
                    <Ionicons name="wallet" size={24} color="#10B981" />
                    <Text style={styles.rewardValue}>+{event.rewards.rezCoins}</Text>
                    <Text style={styles.rewardLabel}>{BRAND.COIN_NAME}</Text>
                  </View>
                  {event.rewards.brandCoins > 0 && event.sponsor && (
                    <View style={[styles.rewardItem, styles.rewardItemPurple]}>
                      <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                      <Text style={[styles.rewardValue, { color: '#8B5CF6' }]}>
                        +{event.rewards.brandCoins}
                      </Text>
                      <Text style={styles.rewardLabel}>{event.sponsor.brandCoinName}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Sponsor Budget */}
            {event.rewards && event.sponsor && event.capacity && (
              <Animated.View entering={FadeInDown.delay(420).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="pie-chart" size={20} color="#8B5CF6" />
                  <Text style={styles.cardTitle}>Sponsor Budget</Text>
                </View>
                {(() => {
                  const totalBrandAllocated =
                    (event.capacity.goal || 0) * (event.rewards.brandCoins || 0);
                  const brandConsumed =
                    (event.capacity.enrolled || 0) * (event.rewards.brandCoins || 0);
                  const brandRemaining = Math.max(0, totalBrandAllocated - brandConsumed);
                  const consumedPct =
                    totalBrandAllocated > 0
                      ? Math.min((brandConsumed / totalBrandAllocated) * 100, 100)
                      : 0;

                  return (
                    <View>
                      <View style={styles.budgetRow}>
                        <Text style={styles.budgetLabel}>Allocated</Text>
                        <Text style={styles.budgetValue}>
                          {totalBrandAllocated.toLocaleString()} {event.sponsor.brandCoinName}
                        </Text>
                      </View>
                      <View style={styles.budgetRow}>
                        <Text style={styles.budgetLabel}>Consumed</Text>
                        <Text style={[styles.budgetValue, { color: '#F59E0B' }]}>
                          {brandConsumed.toLocaleString()} {event.sponsor.brandCoinName}
                        </Text>
                      </View>
                      <View style={styles.budgetRow}>
                        <Text style={styles.budgetLabel}>Remaining</Text>
                        <Text style={[styles.budgetValue, { color: '#10B981' }]}>
                          {brandRemaining.toLocaleString()} {event.sponsor.brandCoinName}
                        </Text>
                      </View>
                      <View style={styles.budgetProgressBar}>
                        <View style={[styles.budgetProgressFill, { width: `${consumedPct}%` }]} />
                      </View>
                      <Text style={styles.budgetProgressLabel}>
                        {consumedPct.toFixed(0)}% of budget consumed
                      </Text>
                    </View>
                  );
                })()}
              </Animated.View>
            )}

            {/* Requirements */}
            {event.eventRequirements && event.eventRequirements.length > 0 && (
              <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="list" size={20} color="#8B5CF6" />
                  <Text style={styles.cardTitle}>Requirements</Text>
                </View>
                {event.eventRequirements.map((req, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Ionicons
                      name={req.isMandatory ? 'alert-circle' : 'checkmark-circle'}
                      size={16}
                      color={req.isMandatory ? '#EF4444' : '#10B981'}
                    />
                    <Text style={styles.listText}>
                      {req.text}
                      {req.isMandatory && <Text style={styles.mandatoryText}> *</Text>}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Benefits */}
            {event.benefits && event.benefits.length > 0 && (
              <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="heart" size={20} color="#EF4444" />
                  <Text style={styles.cardTitle}>Benefits</Text>
                </View>
                {event.benefits.map((benefit, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.listText}>{benefit}</Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Schedule */}
            {event.schedule && event.schedule.length > 0 && (
              <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="time" size={20} color="#3B82F6" />
                  <Text style={styles.cardTitle}>Schedule</Text>
                </View>
                {event.schedule.map((item, idx) => (
                  <View key={idx} style={styles.scheduleItem}>
                    <Text style={styles.scheduleTime}>{item.time}</Text>
                    <Text style={styles.scheduleActivity}>{item.activity}</Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Contact */}
            {event.contact && (event.contact.phone || event.contact.email) && (
              <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="call" size={20} color="#10B981" />
                  <Text style={styles.cardTitle}>Contact</Text>
                </View>
                {event.contact.phone && (
                  <TouchableOpacity style={styles.contactRow} onPress={callPhone}>
                    <Ionicons name="call-outline" size={18} color="#6B7280" />
                    <Text style={styles.contactText}>{event.contact.phone}</Text>
                  </TouchableOpacity>
                )}
                {event.contact.email && (
                  <TouchableOpacity style={styles.contactRow} onPress={sendEmail}>
                    <Ionicons name="mail-outline" size={18} color="#6B7280" />
                    <Text style={styles.contactText}>{event.contact.email}</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            {/* Verification Methods */}
            {event.verificationConfig && event.verificationConfig.methods?.length > 0 && (
              <Animated.View entering={FadeInDown.delay(625).springify()} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
                  <Text style={styles.cardTitle}>Verification Methods</Text>
                </View>
                <View style={styles.verificationMethodsRow}>
                  {event.verificationConfig.methods.map((method: string) => {
                    const config: Record<string, { icon: string; label: string; color: string }> = {
                      manual: { icon: 'person', label: 'Manual', color: '#6B7280' },
                      qr: { icon: 'qr-code', label: 'QR Code', color: '#10B981' },
                      otp: { icon: 'key', label: 'OTP', color: '#8B5CF6' },
                      geo: { icon: 'location', label: 'Location', color: '#3B82F6' },
                    };
                    const c = config[method] || config.manual;
                    return (
                      <View
                        key={method}
                        style={[styles.verificationChip, { backgroundColor: `${c.color}15` }]}
                      >
                        <Ionicons name={c.icon as unknown as keyof typeof Ionicons.glyphMap} size={14} color={c.color} />
                        <Text style={[styles.verificationChipText, { color: c.color }]}>
                          {c.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {event.verificationConfig.methods.includes('geo') && (
                  <Text style={styles.verificationNote}>
                    Geo-fence radius: {event.verificationConfig.geoFenceRadiusMeters || 500}m
                  </Text>
                )}
                <Text style={styles.verificationNote}>
                  Scan QR and generate OTP from the Participants page
                </Text>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <Animated.View
              entering={FadeInDown.delay(650).springify()}
              style={styles.actionsSection}
            >
              <TouchableOpacity
                style={styles.participantsButton}
                onPress={() => router.push(`/social-impact/${id}/participants`)}
              >
                <Ionicons name="people" size={18} color="#7C3AED" />
                <Text style={styles.participantsButtonText}>View Participants</Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push(`/social-impact/${id}/edit`)}
                >
                  <Ionicons name="pencil" size={16} color="#3B82F6" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                {event.eventStatus !== 'cancelled' && event.eventStatus !== 'completed' && (
                  <>
                    <TouchableOpacity
                      style={styles.statusButton}
                      onPress={() => {
                        const nextStatus =
                          event.eventStatus === 'upcoming' ? 'ongoing' : 'completed';
                        setSelectedStatus(nextStatus);
                        setStatusModalVisible(true);
                      }}
                    >
                      <Ionicons name="sync" size={16} color="#10B981" />
                      <Text style={styles.statusButtonText}>
                        {event.eventStatus === 'upcoming' ? 'Start' : 'Complete'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setCancelModalVisible(true)}
                    >
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>

        {/* Modals */}
        <ConfirmModal
          visible={statusModalVisible}
          title="Change Status"
          message={`Are you sure you want to change this event's status to "${selectedStatus}"?`}
          confirmText="Confirm"
          cancelText="Cancel"
          type="default"
          loading={actionLoading}
          onConfirm={handleStatusChange}
          onCancel={() => setStatusModalVisible(false)}
        />

        <ConfirmModal
          visible={cancelModalVisible}
          title="Cancel Event"
          message="Are you sure you want to cancel this event? Participants will be notified."
          confirmText="Yes, Cancel Event"
          cancelText="No, Keep It"
          type="danger"
          loading={actionLoading}
          onConfirm={handleCancel}
          onCancel={() => setCancelModalVisible(false)}
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
    height: 300,
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
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
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
  headerEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroSection: {
    height: 180,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  heroEmoji: {
    fontSize: 64,
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
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  titleSection: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  organizerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sponsorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
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
    shadowColor: '#10B981',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#10B981',
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
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  impactCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  impactText: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 12,
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
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  budgetProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  budgetProgressLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
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
  scheduleItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scheduleTime: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scheduleActivity: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  actionsSection: {
    gap: 12,
    marginTop: 8,
  },
  participantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  participantsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  verificationMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    lineHeight: 18,
  },
});
