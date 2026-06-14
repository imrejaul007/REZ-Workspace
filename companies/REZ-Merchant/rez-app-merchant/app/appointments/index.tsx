import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { showAlert, showConfirm } from '@/utils/alert';
import { platformAlert } from '@/utils/platformAlert';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, ServiceAppointment } from '@/services/api/appointments';
import { apiClient } from '@/services/api/client';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_show: '#DC2626',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-Show',
};

// PERF: Move StyleSheet outside component to prevent recreations
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
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
  backButton: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12, paddingBottom: 120 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appointmentNumber: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  serviceType: { fontSize: 13, fontWeight: '600', color: Colors.light.primary },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: Colors.light.text, flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    minHeight: 100,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNotesBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patchTestWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 32,
  },
  confirmBtn: {
    backgroundColor: '#3B82F6',
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
  },
  startBtn: {
    backgroundColor: '#8B5CF6',
  },
  completeBtn: {
    backgroundColor: '#10B981',
  },
  noShowBtn: {
    borderColor: '#DC2626',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  noShowBtnText: {
    color: '#DC2626',
  },
});

// PERF: Extract memoized AppointmentCard component
const AppointmentCard = React.memo(
  ({
    item,
    updatingId,
    onUpdateStatus,
    onShowTreatmentNotes,
    onNoShow,
  }: {
    item: ServiceAppointment;
    updatingId: string | null;
    onUpdateStatus: (
      appointment: ServiceAppointment,
      status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
    ) => void;
    onShowTreatmentNotes: (appointmentId: string) => void;
    onNoShow: (bookingId: string) => void;
  }) => {
    const isUpdating = updatingId === item._id;

    const needsPatchTestWarning = useCallback((serviceType: string) => {
      const colourKeywords = ['colour', 'color', 'tint', 'bleach', 'highlight', 'balayage'];
      return colourKeywords.some((k) => serviceType?.toLowerCase().includes(k));
    }, []);

    const isAppointmentPassed = useCallback((appointment: ServiceAppointment) => {
      if (!appointment.appointmentDate) return false;
      const apptTime = new Date(appointment.appointmentDate);
      return apptTime < new Date();
    }, []);

    // PERF: Memoize action buttons rendering
    const actionButtons = useMemo(() => {
      const getActionButtons = (appointment: ServiceAppointment) => {
        switch (appointment.status) {
          case 'pending':
            return (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.confirmBtn]}
                  onPress={() => onUpdateStatus(appointment, 'confirmed')}
                  disabled={updatingId === appointment._id}
                >
                  <ThemedText style={styles.actionBtnText}>Confirm</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => onUpdateStatus(appointment, 'cancelled')}
                  disabled={updatingId === appointment._id}
                >
                  <ThemedText style={styles.actionBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            );
          case 'confirmed':
            return (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.startBtn]}
                  onPress={() => onUpdateStatus(appointment, 'in_progress')}
                  disabled={updatingId === appointment._id}
                >
                  <ThemedText style={styles.actionBtnText}>Start</ThemedText>
                </TouchableOpacity>
                {isAppointmentPassed(appointment) && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.noShowBtn]}
                    onPress={() => onNoShow(appointment._id)}
                    disabled={updatingId === appointment._id}
                  >
                    <Ionicons name="person-remove-outline" size={14} color="#DC2626" />
                    <ThemedText style={[styles.actionBtnText, styles.noShowBtnText]}>
                      No-Show
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => onUpdateStatus(appointment, 'cancelled')}
                  disabled={updatingId === appointment._id}
                >
                  <ThemedText style={styles.actionBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            );
          case 'in_progress':
            return (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.completeBtn]}
                  onPress={() => onUpdateStatus(appointment, 'completed')}
                  disabled={updatingId === appointment._id}
                >
                  <ThemedText style={styles.actionBtnText}>Complete</ThemedText>
                </TouchableOpacity>
                {isAppointmentPassed(appointment) && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.noShowBtn]}
                    onPress={() => onNoShow(appointment._id)}
                    disabled={updatingId === appointment._id}
                  >
                    <Ionicons name="person-remove-outline" size={14} color="#DC2626" />
                    <ThemedText style={[styles.actionBtnText, styles.noShowBtnText]}>
                      No-Show
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            );
          default:
            return null;
        }
      };
      return getActionButtons(item);
    }, [item, updatingId, onUpdateStatus, onNoShow, isAppointmentPassed]);

    const statusColor = STATUS_COLORS[item.status] || '#6B7280';

    if (!item) return null;

    return (
      <View style={styles.card}>
        {isUpdating && (
          <View style={styles.cardOverlay}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <ThemedText style={styles.appointmentNumber}>#{item.appointmentNumber}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <ThemedText style={styles.statusText}>
                {STATUS_LABELS[item.status] || item.status}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.serviceType}>{item.serviceType}</ThemedText>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={styles.infoText}>{item.customerName}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={styles.infoText}>{item.customerPhone}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={styles.infoText}>
              {new Date(item.appointmentDate).toLocaleDateString()} at {item.appointmentTime}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={styles.infoText}>{item.duration} min</ThemedText>
          </View>
          {item.staffMember && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={16} color={Colors.light.textSecondary} />
              <ThemedText style={styles.infoText}>Staff: {item.staffMember}</ThemedText>
            </View>
          )}
          {item.specialInstructions && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={16} color={Colors.light.textSecondary} />
              <ThemedText style={styles.infoText} numberOfLines={2}>
                {item.specialInstructions}
              </ThemedText>
            </View>
          )}
        </View>

        {needsPatchTestWarning(item.serviceType || '') && (
          <View style={styles.patchTestWarning}>
            <ThemedText style={styles.warningIcon}>⚠️</ThemedText>
            <ThemedText style={styles.warningText}>
              Patch test required — verify with client before service
            </ThemedText>
          </View>
        )}

        {actionButtons}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to minimize re-renders
    return (
      prevProps.item._id === nextProps.item._id &&
      prevProps.item.status === nextProps.item.status &&
      prevProps.updatingId === nextProps.updatingId
    );
  }
);

AppointmentCard.displayName = 'AppointmentCard';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showTreatmentNotes, setShowTreatmentNotes] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [colourFormula, setColourFormula] = useState('');
  const [productsUsed, setProductsUsed] = useState('');
  const [stylistNotes, setStylistNotes] = useState('');

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId || (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  // PERF: Wrap callbacks in useCallback
  const fetchAppointments = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!storeId) return;
      try {
        if (pageNum === 1 && !append) setLoading(true);
        const result = await appointmentService.getStoreAppointments(storeId, {
          page: pageNum,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter,
          date: selectedDate || undefined,
        });

        const items = result.appointments ?? [];
        setAppointments((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === 20);
        setPage(pageNum);
      } catch {
        if (!append) setAppointments([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [storeId, statusFilter, selectedDate]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments(1);
  }, [fetchAppointments]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchAppointments(page + 1, true);
  }, [hasMore, loadingMore, page, fetchAppointments]);

  const handleSaveTreatmentNotes = useCallback(async () => {
    if (!currentBookingId) return;
    try {
      await appointmentService.addTreatmentNotes(currentBookingId, {
        stylistNotes: stylistNotes || undefined,
        clientVisibleNotes: clientNotes || undefined,
        colourFormula: colourFormula || undefined,
        productsUsed: productsUsed
          ? productsUsed
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : undefined,
      });
    } catch (e) {
      logger.error('Error saving treatment notes:', e);
    } finally {
      setShowTreatmentNotes(false);
      setStylistNotes('');
      setClientNotes('');
      setColourFormula('');
      setProductsUsed('');
      setCurrentBookingId(null);
    }
  }, [currentBookingId, stylistNotes, clientNotes, colourFormula, productsUsed]);

  const handleUpdateStatus = useCallback(
    (
      appointment: ServiceAppointment,
      newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
    ) => {
      const label = STATUS_LABELS[newStatus];
      const isDestructive = newStatus === 'cancelled' || newStatus === 'no_show';

      showConfirm(
        `${label} Appointment`,
        `Mark appointment #${appointment.appointmentNumber} as ${label.toLowerCase()}?`,
        async () => {
          setUpdatingId(appointment._id);
          try {
            await appointmentService.updateStatus(appointment._id, newStatus);
            setAppointments((prev) =>
              prev.map((a) => (a._id === appointment._id ? { ...a, status: newStatus } : a))
            );

            if (newStatus === 'completed') {
              setCurrentBookingId(appointment._id);
              setStylistNotes('');
              setClientNotes('');
              setColourFormula('');
              setProductsUsed('');
              setShowTreatmentNotes(true);
            } else {
              showAlert('Success', `Appointment marked as ${label.toLowerCase()}`);
            }
          } catch (error) {
            showAlert('Error', error.message || `Failed to update appointment`);
          } finally {
            setUpdatingId(null);
          }
        }
      );
    },
    [showConfirm, showAlert]
  );

  const handleShowTreatmentNotes = useCallback((appointmentId: string) => {
    setCurrentBookingId(appointmentId);
    setShowTreatmentNotes(true);
  }, []);

  const handleNoShowWithFee = useCallback(
    (bookingId: string) => {
      const booking = appointments.find((a) => a._id === bookingId);
      // C-05: Context-aware message about deposit/cancellation fee
      const depositInfo = booking?.depositAmount
        ? `Deposit: ₹${booking.depositAmount}`
        : 'No deposit';
      const cancellationFee = booking?.cancellationFee
        ? `Cancellation Fee: ₹${booking.cancellationFee}`
        : 'No fee policy';

      platformAlert(
        'Mark as No-Show',
        `${depositInfo} · ${cancellationFee}\n\nCustomer will not be charged automatically. Do you want to manually charge the no-show fee?`,
        [
          {
            text: 'Mark Only',
            style: 'default',
            onPress: () => {
              const appointment = appointments.find((a) => a._id === bookingId);
              if (appointment) handleUpdateStatus(appointment, 'no_show');
            },
          },
          {
            text: 'Mark + Charge Fee',
            style: 'destructive',
            onPress: async () => {
              const appointment = appointments.find((a) => a._id === bookingId);
              if (appointment) handleUpdateStatus(appointment, 'no_show');
              try {
                await apiClient.post(`/merchant/service-appointments/${bookingId}/no-show`);
                Toast.show({ type: 'success', text1: 'No-show fee charged' });
              } catch (err) {
                Toast.show({
                  type: 'info',
                  text1: 'No-show marked',
                  text2: 'Fee charge failed — no card on file',
                });
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    },
    [appointments, handleUpdateStatus]
  );

  useEffect(() => {
    fetchAppointments(1);
  }, [fetchAppointments]);

  const FILTERS: StatusFilter[] = [
    'all',
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
  ];

  // Rules of Hooks: renderItem callbacks must be at component level, not inside JSX
  const renderFilterChip = useCallback(
    ({ item: f }: { item: unknown }) => (
      <TouchableOpacity
        style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
        onPress={() => setStatusFilter(f)}
      >
        <ThemedText style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
          {STATUS_LABELS[f] || 'All'}
        </ThemedText>
      </TouchableOpacity>
    ),
    [statusFilter]
  );

  const renderAppointmentCard = useCallback(
    ({ item }: { item: unknown }) => (
      <AppointmentCard
        item={item}
        updatingId={updatingId}
        onUpdateStatus={handleUpdateStatus}
        onShowTreatmentNotes={handleShowTreatmentNotes}
        onNoShow={handleNoShowWithFee}
      />
    ),
    [updatingId, handleUpdateStatus, handleShowTreatmentNotes, handleNoShowWithFee]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Appointments</ThemedText>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <TouchableOpacity
            onPress={() => router.push('/appointments/waitlist')}
            style={styles.backButton}
            accessibilityLabel="Waitlist"
          >
            <Ionicons name="time-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/appointments/blocked-time')}
            style={styles.backButton}
            accessibilityLabel="Manage Blocked Time"
          >
            <Ionicons name="ban-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/appointments/no-show-protection')}
            style={styles.backButton}
            accessibilityLabel="No-show Protection"
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/appointments/booking-link')}
            style={styles.backButton}
            accessibilityLabel="Booking Link"
          >
            <Ionicons name="link-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={renderFilterChip}
      />

      {/* Appointments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            appointments.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No Appointments</ThemedText>
              <ThemedText style={styles.emptyText}>
                Service appointments will appear here when customers book.
              </ThemedText>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.light.primary}
                style={{ padding: 16 }}
              />
            ) : null
          }
        />
      )}

      {/* Treatment Notes Modal */}
      <Modal
        visible={showTreatmentNotes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTreatmentNotes(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}
          >
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: '#1a3a52' }}>
              Treatment Notes
            </ThemedText>
            <TouchableOpacity onPress={() => setShowTreatmentNotes(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              These notes are saved to the client's record. Client-visible notes will be shared with
              them.
            </ThemedText>

            <ThemedText style={{ fontWeight: '600', color: '#1a3a52', marginBottom: 6 }}>
              Colour Formula
            </ThemedText>
            <TextInput
              multiline
              numberOfLines={3}
              placeholder="e.g. 7N + 20vol, 60g"
              value={colourFormula}
              onChangeText={setColourFormula}
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                padding: 12,
                minHeight: 80,
                marginBottom: 16,
                fontSize: 14,
                textAlignVertical: 'top',
                color: Colors.light.text,
              }}
              placeholderTextColor={Colors.light.textSecondary}
            />

            <ThemedText style={{ fontWeight: '600', color: '#1a3a52', marginBottom: 6 }}>
              Products Used
            </ThemedText>
            <TextInput
              multiline
              numberOfLines={2}
              placeholder="e.g. Wella Koleston, Olaplex No.1"
              value={productsUsed}
              onChangeText={setProductsUsed}
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                padding: 12,
                minHeight: 60,
                marginBottom: 16,
                fontSize: 14,
                textAlignVertical: 'top',
                color: Colors.light.text,
              }}
              placeholderTextColor={Colors.light.textSecondary}
            />

            <ThemedText style={{ fontWeight: '600', color: '#1a3a52', marginBottom: 6 }}>
              Stylist Notes
            </ThemedText>
            <TextInput
              multiline
              numberOfLines={3}
              placeholder="Internal notes for next visit..."
              value={stylistNotes}
              onChangeText={setStylistNotes}
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                padding: 12,
                minHeight: 80,
                marginBottom: 16,
                fontSize: 14,
                textAlignVertical: 'top',
                color: Colors.light.text,
              }}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </ScrollView>

          <View style={{ padding: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={handleSaveTreatmentNotes}
              style={{
                backgroundColor: '#1a3a52',
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ color: '#ffcd57', fontWeight: '700', fontSize: 16 }}>
                Save Notes
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowTreatmentNotes(false);
                setColourFormula('');
                setProductsUsed('');
                setStylistNotes('');
                setClientNotes('');
                setCurrentBookingId(null);
              }}
              style={{ borderRadius: 14, padding: 14, alignItems: 'center' }}
            >
              <ThemedText style={{ color: '#888', fontWeight: '500' }}>Skip for now</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
