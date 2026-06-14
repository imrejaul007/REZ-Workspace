import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { socialImpactAdminService, SocialImpactEvent } from '@/services/api/socialImpact';
import { BRAND } from '@/constants/brand';
import { showAlert } from '@/utils/alert';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';

// Status filter options
const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function SocialImpactEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<SocialImpactEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const filters: unknown = {};
      if (statusFilter !== 'all') {
        filters.eventStatus = statusFilter;
      }
      const response = await socialImpactAdminService.getEvents(filters);
      setEvents(response.events);
      setTotalCount(response.events.length);
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

  const getStatusColor = (status?: string) => {
    const statusColors: Record<string, string> = {
      upcoming: '#3B82F6',
      ongoing: '#10B981',
      completed: '#6B7280',
      cancelled: '#EF4444',
    };
    return statusColors[status || ''] || '#6B7280';
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderEventCard = useCallback(
    ({ item, index }: { item: SocialImpactEvent; index: number }) => {
      const statusColor = getStatusColor(item.eventStatus);
      const fillPercentage = item.capacity
        ? Math.min((item.capacity.enrolled / item.capacity.goal) * 100, 100)
        : 0;

      const isPending = item.status === 'pending_approval';
      const isRejected = item.status === 'rejected';

      return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
          <TouchableOpacity
            style={[
              styles.eventCard,
              isPending && styles.pendingCard,
              isRejected && styles.rejectedCard,
            ]}
            onPress={() => router.push(`/social-impact/${item._id}`)}
            activeOpacity={0.8}
          >
            {/* Approval Status Banner */}
            {isPending && (
              <View style={styles.approvalBanner}>
                <Ionicons name="time-outline" size={14} color="#D97706" />
                <Text style={styles.approvalBannerText}>Pending Admin Approval</Text>
              </View>
            )}
            {isRejected && (
              <View style={[styles.approvalBanner, styles.rejectedBanner]}>
                <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                <Text style={[styles.approvalBannerText, { color: '#EF4444' }]}>
                  Rejected by Admin
                </Text>
              </View>
            )}

            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.eventTypeContainer}>
                <Text style={styles.eventTypeEmoji}>
                  {socialImpactAdminService.getEventTypeEmoji(item.eventType)}
                </Text>
                <View>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.eventOrganizer}>
                    {item.organizer?.name || 'Unknown Organizer'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusLabel(item.eventStatus)}
                </Text>
              </View>
            </View>

            {/* Sponsor Badge */}
            {item.sponsor && (
              <View style={styles.sponsorBadge}>
                <Ionicons name="business" size={12} color="#8B5CF6" />
                <Text style={styles.sponsorText}>Sponsored by {item.sponsor.name}</Text>
              </View>
            )}

            {/* Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{formatDate(item.eventDate)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.location?.city || 'TBD'}
                </Text>
              </View>
            </View>

            {/* Capacity Progress */}
            {item.capacity && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Participants</Text>
                  <Text style={styles.progressValue}>
                    {item.capacity.enrolled}/{item.capacity.goal}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${fillPercentage}%` }]} />
                </View>
              </View>
            )}

            {/* Rewards */}
            {item.rewards && (
              <View style={styles.rewardsRow}>
                <View style={styles.rewardItem}>
                  <Ionicons name="wallet" size={14} color="#10B981" />
                  <Text style={styles.rewardText}>
                    +{item.rewards.rezCoins} {BRAND.COIN_SHORT}
                  </Text>
                </View>
                {item.rewards.brandCoins > 0 && item.sponsor && (
                  <View style={styles.rewardItem}>
                    <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                    <Text style={styles.rewardText}>+{item.rewards.brandCoins} Brand</Text>
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/social-impact/${item._id}/participants`);
                }}
              >
                <Ionicons name="people" size={14} color="#7C3AED" />
                <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>Participants</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/social-impact/${item._id}/edit`);
                }}
              >
                <Ionicons name="pencil" size={14} color="#3B82F6" />
                <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669', '#F3F4F6']}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.title}>Social Impact</Text>
                {totalCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {totalCount} {totalCount === 1 ? 'event' : 'events'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/social-impact/add')} activeOpacity={0.8}>
              <LinearGradient
                colors={['#10B981', '#059669']}
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
            renderItem={useCallback(
              ({ item }: { item: unknown }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === item.value && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setStatusFilter(item.value);
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
              ),
              [statusFilter]
            )}
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first social impact event to start making a difference.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/social-impact/add')}
            >
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
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  eventCard: {
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
  pendingCard: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  rejectedCard: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    opacity: 0.8,
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  rejectedBanner: {
    backgroundColor: '#FEE2E2',
  },
  approvalBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  eventTypeEmoji: {
    fontSize: 32,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sponsorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
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
  viewButton: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  editButton: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
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
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
