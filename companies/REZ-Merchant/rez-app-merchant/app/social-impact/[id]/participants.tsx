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
  TextInput,
  Modal,
} from 'react-native';
import { showAlert, showConfirm } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  socialImpactAdminService,
  Participant,
  SocialImpactEvent,
} from '@/services/api/socialImpact';
import { BRAND } from '@/constants/brand';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Registered', value: 'registered' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Completed', value: 'completed' },
  { label: 'No Show', value: 'no_show' },
];

export default function ParticipantsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<SocialImpactEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpParticipantName, setOtpParticipantName] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const [eventData, participantsData] = await Promise.all([
        socialImpactAdminService.getEventById(id),
        socialImpactAdminService.getEventParticipants(id),
      ]);

      setEvent(eventData);
      setParticipants(participantsData.participants);
    } catch (error) {
      logger.error('Error fetching data:', error);
      showAlert('Error', error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = participants;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.user?.name || '').toLowerCase().includes(query) ||
          p.user?.email?.toLowerCase().includes(query) ||
          (p.user?.phone || '').includes(query)
      );
    }

    setFilteredParticipants(filtered);
  }, [participants, statusFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCheckIn = async (userId: string, userName: string) => {
    showConfirm('Check In', `Check in ${userName}?`, async () => {
      try {
        setActionLoading(true);
        await socialImpactAdminService.checkInParticipant(id!, userId);
        showAlert('Success', `${userName} checked in successfully`);
        fetchData();
      } catch (error) {
        showAlert('Error', error.message || 'Failed to check in');
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleComplete = async (userId: string, userName: string) => {
    showConfirm(
      'Complete Participation',
      `Mark ${userName} as completed and award coins?`,
      async () => {
        try {
          setActionLoading(true);
          await socialImpactAdminService.completeParticipant(id!, userId);
          showAlert('Success', `${userName} completed! Coins awarded.`);
          fetchData();
        } catch (error) {
          showAlert('Error', error.message || 'Failed to complete');
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handleBulkComplete = async () => {
    if (selectedParticipants.length === 0) {
      showAlert('Error', 'Please select participants first');
      return;
    }

    try {
      setActionLoading(true);
      const result = await socialImpactAdminService.bulkCompleteParticipants(
        id!,
        selectedParticipants
      );
      showAlert(
        'Bulk Complete',
        `Successfully completed: ${result.success}\nFailed: ${result.failed}`
      );
      setSelectedParticipants([]);
      setShowBulkModal(false);
      fetchData();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to bulk complete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateOTP = async (userId: string, userName: string) => {
    try {
      setActionLoading(true);
      const result = await socialImpactAdminService.generateEventOTP(id!, userId);
      setOtpCode(result.otpCode);
      setOtpParticipantName(userName);
      setShowOTPModal(true);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to generate OTP');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleParticipantSelection = (enrollmentId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const selectAllEligible = () => {
    const eligible = filteredParticipants
      .filter((p) => p.status === 'checked_in')
      .map((p) => getUserId(p));
    setSelectedParticipants(eligible);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      registered: '#3B82F6',
      checked_in: '#F59E0B',
      completed: '#10B981',
      cancelled: '#EF4444',
      no_show: '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      registered: 'Registered',
      checked_in: 'Checked In',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
    };
    return labels[status] || status;
  };

  const getUserId = (item: Participant) => item.user?._id || '';
  const getUserName = (item: Participant) => item.user?.name || 'Unknown';

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => {
    const statusColor = getStatusColor(item.status);
    const userId = getUserId(item);
    const userName = getUserName(item);
    const isSelected = selectedParticipants.includes(userId);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity
          style={[styles.participantCard, isSelected && styles.participantCardSelected]}
          onPress={() => toggleParticipantSelection(userId)}
          activeOpacity={0.8}
        >
          <View style={styles.participantHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{userName}</Text>
              {item.user?.email && <Text style={styles.participantEmail}>{item.user.email}</Text>}
              {item.user?.phone && <Text style={styles.participantPhone}>{item.user.phone}</Text>}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          {/* Timestamps */}
          <View style={styles.timestampRow}>
            <Text style={styles.timestampText}>
              Registered: {new Date(item.registeredAt).toLocaleDateString()}
            </Text>
            {item.checkedInAt && (
              <Text style={styles.timestampText}>
                Checked In: {new Date(item.checkedInAt).toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Coins Awarded */}
          {item.coinsAwarded && item.status === 'completed' && (
            <View style={styles.coinsRow}>
              <Ionicons name="wallet" size={14} color="#10B981" />
              <Text style={styles.coinsText}>
                +{item.coinsAwarded.rez} {BRAND.COIN_SHORT}, +{item.coinsAwarded.brand} Brand
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            {item.status === 'registered' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.checkInButton]}
                  onPress={() => handleCheckIn(userId, userName)}
                  disabled={actionLoading}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
                  <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Check In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.otpButton]}
                  onPress={() => handleGenerateOTP(userId, userName)}
                  disabled={actionLoading}
                >
                  <Ionicons name="key" size={16} color="#8B5CF6" />
                  <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>OTP</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === 'checked_in' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleComplete(userId, userName)}
                disabled={actionLoading}
              >
                <Ionicons name="trophy" size={16} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Complete</Text>
              </TouchableOpacity>
            )}
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading participants...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const stats = {
    total: participants.length,
    registered: participants.filter((p) => p.status === 'registered').length,
    checkedIn: participants.filter((p) => p.status === 'checked_in').length,
    completed: participants.filter((p) => p.status === 'completed').length,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669', '#F3F4F6']}
          locations={[0, 0.25, 1]}
          style={styles.backgroundGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title} numberOfLines={1}>
                {event?.name || 'Participants'}
              </Text>
              <Text style={styles.subtitle}>{stats.total} participants</Text>
            </View>
            <TouchableOpacity
              style={styles.scanQRButton}
              onPress={() => router.push(`/social-impact/${id}/scan`)}
            >
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.registered}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.checkedIn}</Text>
              <Text style={styles.statLabel}>Checked In</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or phone..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter */}
          <View style={styles.filterContainer}>
            <FlatList
              data={STATUS_FILTERS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === item.value && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(item.value)}
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

          {/* Bulk Actions */}
          {stats.checkedIn > 0 && (
            <View style={styles.bulkActions}>
              <TouchableOpacity style={styles.bulkButton} onPress={selectAllEligible}>
                <Ionicons name="checkbox-outline" size={16} color="#7C3AED" />
                <Text style={styles.bulkButtonText}>Select All Checked In</Text>
              </TouchableOpacity>
              {selectedParticipants.length > 0 && (
                <TouchableOpacity
                  style={[styles.bulkButton, styles.bulkCompleteButton]}
                  onPress={() => setShowBulkModal(true)}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.bulkCompleteText}>
                    Complete ({selectedParticipants.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* List */}
          <FlatList
            data={filteredParticipants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.enrollmentId}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No participants found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>

      {/* Bulk Complete Modal */}
      <Modal visible={showBulkModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
            <Text style={styles.modalTitle}>Bulk Complete</Text>
            <Text style={styles.modalText}>
              Complete {selectedParticipants.length} participants and award coins?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowBulkModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleBulkComplete}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Complete All</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Display Modal */}
      <Modal visible={showOTPModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.otpIconContainer}>
              <Ionicons name="key" size={40} color="#8B5CF6" />
            </View>
            <Text style={styles.modalTitle}>OTP for {otpParticipantName}</Text>
            <Text style={styles.otpCodeDisplay}>{otpCode}</Text>
            <Text style={styles.modalText}>
              Show this code to the participant. It expires in 30 minutes.
            </Text>
            <TouchableOpacity
              style={[styles.modalConfirmButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setShowOTPModal(false)}
            >
              <Text style={styles.modalConfirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    height: 250,
  },
  safeArea: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  scanQRButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  bulkActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  bulkButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  bulkCompleteButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  bulkCompleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  participantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  participantCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  participantPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timestampRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timestampText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  coinsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  checkInButton: {
    backgroundColor: '#FEF3C7',
  },
  completeButton: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 32,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  otpButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  otpIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  otpCodeDisplay: {
    fontSize: 40,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 8,
    marginVertical: 16,
  },
});
