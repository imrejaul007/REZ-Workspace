import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventService, Event, EventAnalyticsExtended } from '@/services/api/events';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorModal from '@/components/common/ErrorModal';
import { logger } from '@/utils/logger';
import SuccessModal from '@/components/common/SuccessModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_COLORS = {
  draft: { bg: Colors.light.warningLight, text: Colors.light.warning },
  published: { bg: Colors.light.successLight, text: Colors.light.success },
  cancelled: { bg: Colors.light.errorLight, text: Colors.light.error },
  completed: { bg: '#E0E7FF', text: Colors.light.indigo },
  sold_out: { bg: '#FED7AA', text: '#EA580C' },
};

const CATEGORY_ICONS: Record<string, string> = {
  Music: 'musical-notes',
  Technology: 'hardware-chip',
  Wellness: 'fitness',
  Sports: 'football',
  Education: 'school',
  Business: 'briefcase',
  Arts: 'color-palette',
  Food: 'restaurant',
  Entertainment: 'game-controller',
  Other: 'ellipsis-horizontal',
};

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalyticsExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    if (id) {
      loadEventDetails();
      loadEventAnalytics();
    }
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getEventById(id as string);
      setEvent(eventData);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to load event details',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEventAnalytics = async () => {
    try {
      const analyticsData = await eventService.getEventAnalytics(id as string);
      setAnalytics(analyticsData);
    } catch (error) {
      // Analytics not critical, just log
      logger.debug('Failed to load analytics:', error);
    }
  };

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      await eventService.publishEvent(id as string);
      setPublishModalVisible(false);
      setSuccessModal({
        visible: true,
        title: 'Published!',
        message: 'Your event is now live and visible to users.',
      });
      loadEventDetails();
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to publish event',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await eventService.cancelEvent(id as string, 'Cancelled by merchant');
      setCancelModalVisible(false);
      setSuccessModal({
        visible: true,
        title: 'Cancelled',
        message: 'The event has been cancelled. All bookings will be notified.',
      });
      loadEventDetails();
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

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await eventService.deleteEvent(id as string);
      setDeleteModalVisible(false);
      setSuccessModal({
        visible: true,
        title: 'Deleted',
        message: 'The event has been permanently deleted.',
      });
      setTimeout(() => {
        router.replace('/events');
      }, 1500);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to delete event',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_COLORS[event.status] || STATUS_COLORS.draft;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <TouchableOpacity
            onPress={() => router.push(`/events/${event._id}/edit`)}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Image */}
          <View style={styles.imageSection}>
            {event.image ? (
              <Image source={{ uri: event.image }} style={styles.eventImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name={(CATEGORY_ICONS[event.category] as unknown as keyof typeof Ionicons.glyphMap) || 'calendar'}
                  size={64}
                  color="#9CA3AF"
                />
              </View>
            )}
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
              </Text>
            </View>
            {/* Featured Badge */}
            {event.featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={14} color="#FFFFFF" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>

          {/* Event Info Card */}
          <View style={styles.infoCard}>
            {/* Title and Category */}
            <View style={styles.titleSection}>
              <View style={styles.categoryBadge}>
                <Ionicons
                  name={(CATEGORY_ICONS[event.category] as unknown as keyof typeof Ionicons.glyphMap) || 'calendar'}
                  size={16}
                  color={Colors.light.primary}
                />
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.subtitle && <Text style={styles.eventSubtitle}>{event.subtitle}</Text>}
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Date & Time</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(event.date)}</Text>
              <Text style={styles.timeText}>
                {formatTime(event.time)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </Text>
            </View>

            {/* Price */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetag" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Price</Text>
              </View>
              {event.price.isFree ? (
                <View style={styles.freeBadge}>
                  <Ionicons name="gift" size={16} color="#10B981" />
                  <Text style={styles.freeText}>Free Event</Text>
                </View>
              ) : (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>
                    {event.price.currency || '₹'}
                    {event.price.amount}
                  </Text>
                  {event.price.originalPrice && event.price.originalPrice > event.price.amount && (
                    <Text style={styles.originalPrice}>
                      {event.price.currency || '₹'}
                      {event.price.originalPrice}
                    </Text>
                  )}
                  {event.price.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{event.price.discount}% OFF</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={event.isOnline ? 'videocam' : 'location'}
                  size={20}
                  color={Colors.light.primary}
                />
                <Text style={styles.sectionTitle}>
                  {event.isOnline ? 'Online Event' : 'Location'}
                </Text>
              </View>
              {event.isOnline ? (
                <View>
                  <Text style={styles.locationText}>This is an online event</Text>
                  {event.location.meetingUrl && (
                    <Text style={styles.meetingUrl}>{event.location.meetingUrl}</Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={styles.locationName}>{event.location.name}</Text>
                  <Text style={styles.locationText}>{event.location.address}</Text>
                  <Text style={styles.locationText}>
                    {event.location.city}
                    {event.location.state && `, ${event.location.state}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {event.description && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>About</Text>
                </View>
                <Text style={styles.description}>{event.description}</Text>
              </View>
            )}

            {/* Organizer */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Organizer</Text>
              </View>
              <View style={styles.organizerCard}>
                {event.organizer.logo ? (
                  <Image source={{ uri: event.organizer.logo }} style={styles.organizerLogo} />
                ) : (
                  <View style={styles.organizerLogoPlaceholder}>
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>{event.organizer.name}</Text>
                  <Text style={styles.organizerEmail}>{event.organizer.email}</Text>
                  {event.organizer.phone && (
                    <Text style={styles.organizerPhone}>{event.organizer.phone}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Capacity */}
            {event.maxCapacity && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Capacity</Text>
                </View>
                <Text style={styles.capacityText}>Maximum {event.maxCapacity} attendees</Text>
                {event.minAge && (
                  <Text style={styles.ageRestriction}>Minimum age: {event.minAge}+</Text>
                )}
              </View>
            )}

            {/* Requirements */}
            {event.requirements && event.requirements.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkbox" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Requirements</Text>
                </View>
                {event.requirements.map((req, index) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                    <Text style={styles.listText}>{req}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* What's Included */}
            {event.includes && event.includes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="gift" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>What's Included</Text>
                </View>
                {event.includes.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetags" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Tags</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {event.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Analytics */}
            {analytics && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="stats-chart" size={20} color={Colors.light.primary} />
                  <Text style={styles.sectionTitle}>Analytics</Text>
                </View>
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="eye-outline" size={24} color={Colors.light.primary} />
                    <Text style={styles.analyticsValue}>{analytics.views}</Text>
                    <Text style={styles.analyticsLabel}>Views</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="ticket-outline" size={24} color={Colors.light.success} />
                    <Text style={styles.analyticsValue}>{analytics.totalBookings}</Text>
                    <Text style={styles.analyticsLabel}>Bookings</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="share-social-outline" size={24} color={Colors.light.warning} />
                    <Text style={styles.analyticsValue}>{analytics.shares}</Text>
                    <Text style={styles.analyticsLabel}>Shares</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Ionicons name="cash-outline" size={24} color="#10B981" />
                    <Text style={styles.analyticsValue}>
                      {analytics.currency}
                      {analytics.totalRevenue}
                    </Text>
                    <Text style={styles.analyticsLabel}>Revenue</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Bookings Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/events/${event._id}/bookings`)}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardLeft}>
                    <Ionicons name="ticket" size={24} color={Colors.light.primary} />
                    <View style={styles.actionCardText}>
                      <Text style={styles.actionCardTitle}>View Bookings</Text>
                      <Text style={styles.actionCardSubtitle}>
                        {analytics?.totalBookings || 0} total bookings
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              {/* Publish Button (only for drafts) */}
              {event.status === 'draft' && (
                <TouchableOpacity
                  style={styles.publishButton}
                  onPress={() => setPublishModalVisible(true)}
                >
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Publish Event</Text>
                </TouchableOpacity>
              )}

              {/* Cancel Button (for published events) */}
              {event.status === 'published' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCancelModalVisible(true)}
                >
                  <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Cancel Event</Text>
                </TouchableOpacity>
              )}

              {/* Edit Button */}
              <TouchableOpacity
                style={styles.editButtonFull}
                onPress={() => router.push(`/events/${event._id}/edit`)}
              >
                <Ionicons name="pencil" size={20} color={Colors.light.primary} />
                <Text style={styles.editButtonFullText}>Edit Event</Text>
              </TouchableOpacity>

              {/* Delete Button (only for drafts or cancelled) */}
              {(event.status === 'draft' || event.status === 'cancelled') && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setDeleteModalVisible(true)}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />

      {/* Publish Confirmation Modal */}
      <ConfirmModal
        visible={publishModalVisible}
        title="Publish Event"
        message="Are you sure you want to publish this event? It will become visible to all users."
        confirmText="Publish"
        cancelText="Cancel"
        type="default"
        loading={actionLoading}
        onConfirm={handlePublish}
        onCancel={() => setPublishModalVisible(false)}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        visible={cancelModalVisible}
        title="Cancel Event"
        message="Are you sure you want to cancel this event? All bookings will be notified and refunded."
        confirmText="Cancel Event"
        cancelText="Go Back"
        type="warning"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelModalVisible(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ visible: false, title: '', message: '' })}
        autoCloseDelay={2000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  backButtonLarge: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16,
  },
  imageSection: {
    height: 220,
    position: 'relative',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  eventImage: {
    width: SCREEN_WIDTH,
    height: 220,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  featuredText: {
    color: Colors.light.card,
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.light.background,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  freeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  meetingUrl: {
    fontSize: 14,
    color: Colors.light.primary,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  organizerLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  organizerLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  organizerEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  organizerPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  capacityText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  ageRestriction: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  listText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  actionCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionCardText: {
    marginLeft: 12,
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  actionsSection: {
    marginTop: 8,
    gap: 12,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.success,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    gap: 8,
  },
  editButtonFullText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
