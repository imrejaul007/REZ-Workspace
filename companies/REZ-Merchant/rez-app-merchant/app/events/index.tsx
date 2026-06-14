import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { eventService, Event, EventStatus } from '@/services/api/events';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { showAlert, showConfirm } from '@/utils/alert';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Status filter options
const STATUS_FILTERS: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Completed', value: 'completed' },
];

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const params: unknown = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await eventService.getEvents(params);
      setEvents(response.events);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      logger.error('Error fetching events:', error);
      showAlert('Error', error.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handlePublish = async (event: Event) => {
    showConfirm(
      'Publish Event',
      `Are you sure you want to publish "${event.title}"? It will be visible to users.`,
      async () => {
        try {
          setPublishingEventId(event._id);
          await eventService.publishEvent(event._id);
          showAlert('Success', 'Event published successfully');
          fetchEvents();
        } catch (error) {
          showAlert('Error', error.message || 'Failed to publish event');
        } finally {
          setPublishingEventId(null);
        }
      }
    );
  };

  const handleCancel = async (event: Event) => {
    showConfirm(
      'Cancel Event',
      `Are you sure you want to cancel "${event.title}"? All bookings will be cancelled.`,
      async () => {
        try {
          const result = await eventService.cancelEvent(event._id, 'Cancelled by organizer');
          showAlert('Success', `Event cancelled. ${result.cancelledBookings} booking(s) affected.`);
          fetchEvents();
        } catch (error) {
          showAlert('Error', error.message || 'Failed to cancel event');
        }
      }
    );
  };

  const handleDelete = async (event: Event) => {
    showConfirm(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      async () => {
        try {
          await eventService.deleteEvent(event._id);
          showAlert('Success', 'Event deleted successfully');
          fetchEvents();
        } catch (error) {
          showAlert('Error', error.message || 'Failed to delete event');
        }
      }
    );
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'draft':
        return Colors.light.textSecondary;
      case 'published':
        return Colors.light.success;
      case 'cancelled':
        return Colors.light.error;
      case 'completed':
        return Colors.light.info;
      case 'sold_out':
        return Colors.light.warning;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status: EventStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderEventCard = useCallback(
    ({ item, index }: { item: Event; index: number }) => {
      const statusColor = getStatusColor(item.status);

      return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => router.push(`/events/${item._id}`)}
            activeOpacity={0.8}
          >
            {/* Event Image */}
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.eventImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="calendar" size={48} color={Colors.light.textMuted} />
                </View>
              )}
              {/* Online Badge */}
              {item.isOnline && (
                <View style={styles.onlineBadge}>
                  <Ionicons name="globe-outline" size={12} color={Colors.light.card} />
                  <Text style={styles.onlineBadgeText}>Online</Text>
                </View>
              )}
              {/* Price Badge */}
              <View style={[styles.priceBadge, item.price.isFree && styles.freeBadge]}>
                <Text style={styles.priceBadgeText}>
                  {item.price.isFree ? 'Free' : `${item.price.currency}${item.price.amount}`}
                </Text>
              </View>
            </View>

            {/* Event Info */}
            <View style={styles.eventInfo}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>

              {/* Category */}
              <View style={styles.categoryRow}>
                <Ionicons name="pricetag-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>

              {/* Date & Time */}
              <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>

              {/* Location */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.isOnline ? 'Online Event' : `${item.location.name}, ${item.location.city}`}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{item.analytics?.views || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="ticket-outline" size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{item.analytics?.bookings || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.statText}>{item.analytics?.favorites || 0}</Text>
                </View>
                {item.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color={Colors.light.warning} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                {item.status === 'draft' && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.publishButton,
                      publishingEventId === item._id && styles.actionButtonDisabled,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (publishingEventId === null) handlePublish(item);
                    }}
                    disabled={publishingEventId === item._id}
                  >
                    {publishingEventId === item._id ? (
                      <ActivityIndicator size="small" color={Colors.light.success} />
                    ) : (
                      <Ionicons name="send" size={14} color={Colors.light.success} />
                    )}
                    <Text style={[styles.actionButtonText, { color: Colors.light.success }]}>
                      {publishingEventId === item._id ? 'Publishing...' : 'Publish'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/events/${item._id}/edit`);
                  }}
                >
                  <Ionicons name="pencil" size={14} color={Colors.light.info} />
                  <Text style={[styles.actionButtonText, { color: Colors.light.info }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.bookingsButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/events/${item._id}/bookings`);
                  }}
                >
                  <Ionicons name="people" size={14} color={Colors.light.primary} />
                  <Text style={[styles.actionButtonText, { color: Colors.light.primary }]}>
                    Bookings
                  </Text>
                </TouchableOpacity>
                {item.status === 'published' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancel(item);
                    }}
                  >
                    <Ionicons name="close-circle" size={14} color={Colors.light.warning} />
                    <Text style={[styles.actionButtonText, { color: Colors.light.warning }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
                {item.status === 'draft' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                  >
                    <Ionicons name="trash" size={14} color={Colors.light.error} />
                    <Text style={[styles.actionButtonText, { color: Colors.light.error }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [
      getStatusColor,
      getStatusLabel,
      formatDate,
      publishingEventId,
      handlePublish,
      handleCancel,
      handleDelete,
      router,
    ]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.indigo, Colors.light.backgroundTertiary]}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>My Events</Text>
              {totalCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {totalCount} {totalCount === 1 ? 'event' : 'events'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push('/events/add')} activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.indigo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>New Event</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <FlatList
            data={STATUS_FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
                onPress={() => {
                  setStatusFilter(item.value as EventStatus | 'all');
                  setIsLoading(true);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === item.value && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first event to start attracting attendees and managing bookings.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/events/add')}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Your First Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16 },
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      <BottomNav />
    </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.card,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.card,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: Colors.light.card,
    fontWeight: '700',
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.light.card,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  eventCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.info,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onlineBadgeText: {
    color: Colors.light.card,
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  freeBadge: {
    backgroundColor: Colors.light.warning,
  },
  priceBadgeText: {
    color: Colors.light.card,
    fontSize: 14,
    fontWeight: '700',
  },
  eventInfo: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textDark,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  publishButton: {
    borderColor: Colors.light.success,
    backgroundColor: Colors.light.successLight,
  },
  editButton: {
    borderColor: Colors.light.info,
    backgroundColor: Colors.light.infoLight,
  },
  bookingsButton: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  cancelButton: {
    borderColor: Colors.light.warning,
    backgroundColor: Colors.light.warningLight,
  },
  deleteButton: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorLight,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: '600',
  },
});
