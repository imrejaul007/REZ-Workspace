/**
 * Restaurant Reservations Management
 * View and manage table bookings
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { storageService } from '@/services/storage';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
import { logger } from '@/utils/logger';

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  tableId?: string;
  tableNumber?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
  source: 'app' | 'phone' | 'walkin' | 'website';
}

type DateFilter = 'today' | 'tomorrow' | 'week' | 'all';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  dateFilters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    marginRight: Spacing.sm,
  },
  dateChipActive: {
    backgroundColor: Colors.primary[500],
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  dateChipTextActive: {
    color: '#fff',
  },
  statusFilters: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  reservationsList: {
    paddingHorizontal: Spacing.lg,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reservationCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  timeContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  timeAmPm: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  guestsBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  guestsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[700],
    textAlign: 'center',
  },
  reservationContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  tableInfo: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notes: {
    fontSize: 13,
    color: Colors.warning[600],
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    gap: 4,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
  },
  actionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    backgroundColor: Colors.gray[100],
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.success[100],
  },
  confirmButtonText: {
    color: Colors.success[700],
  },
  seatButton: {
    backgroundColor: Colors.primary[100],
  },
  seatButtonText: {
    color: Colors.primary[700],
  },
  cancelButton: {
    backgroundColor: Colors.error[100],
  },
  cancelButtonText: {
    color: Colors.error[700],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalClose: {
    padding: Spacing.sm,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formCol: {
    flex: 1,
  },
  formTextArea: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: Colors.warning[700], bgColor: Colors.warning[100], label: 'Pending' },
  confirmed: { color: Colors.success[700], bgColor: Colors.success[100], label: 'Confirmed' },
  seated: { color: Colors.primary[700], bgColor: Colors.primary[100], label: 'Seated' },
  completed: { color: Colors.text.secondary, bgColor: Colors.gray[100], label: 'Completed' },
  cancelled: { color: Colors.error[700], bgColor: Colors.error[100], label: 'Cancelled' },
  no_show: { color: Colors.error[700], bgColor: Colors.error[100], label: 'No Show' },
};

const SOURCE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap }> = {
  app: 'phone-portrait-outline',
  phone: 'call-outline',
  walkin: 'walk-outline',
  website: 'globe-outline',
};

const DATE_FILTER_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

const STATUS_FILTER_OPTIONS: StatusFilter[] = ['all', 'pending', 'confirmed', 'seated', 'completed'];

export default function RestaurantReservations() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const socketRef = React.useRef<Socket | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    guests: '2',
    notes: '',
  });

  const loadReservations = useCallback(async () => {
    try {
      // Mock data - in production would be API call
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const nextWeek = addDays(today, 7);

      const mockReservations: Reservation[] = [
        {
          id: '1',
          customerName: 'John Smith',
          phone: '+91 98765 43210',
          email: 'john@email.com',
          date: format(today, 'yyyy-MM-dd'),
          time: '12:30',
          guests: 4,
          tableId: '1',
          tableNumber: 'T4',
          status: 'confirmed',
          notes: 'Birthday celebration',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'app',
        },
        {
          id: '2',
          customerName: 'Sarah Johnson',
          phone: '+91 98765 43211',
          date: format(today, 'yyyy-MM-dd'),
          time: '13:00',
          guests: 2,
          status: 'pending',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'phone',
        },
        {
          id: '3',
          customerName: 'Mike Davis',
          phone: '+91 98765 43212',
          date: format(today, 'yyyy-MM-dd'),
          time: '19:00',
          guests: 6,
          tableId: '3',
          tableNumber: 'T3',
          status: 'confirmed',
          notes: 'Business dinner',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'website',
        },
        {
          id: '4',
          customerName: 'Emily Chen',
          phone: '+91 98765 43213',
          date: format(tomorrow, 'yyyy-MM-dd'),
          time: '14:00',
          guests: 4,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          source: 'app',
        },
        {
          id: '5',
          customerName: 'Robert Brown',
          phone: '+91 98765 43214',
          date: format(nextWeek, 'yyyy-MM-dd'),
          time: '20:00',
          guests: 8,
          tableId: '5',
          tableNumber: 'T5',
          status: 'confirmed',
          notes: 'Anniversary dinner',
          createdAt: new Date().toISOString(),
          source: 'phone',
        },
      ];

      setReservations(mockReservations);
    } catch (error) {
      logger.error('[Reservations] Failed to load reservations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Socket for real-time updates
  useEffect(() => {
    const initializeSocket = async () => {
      const authToken = await storageService.getAuthToken();

      if (!authToken || !API_CONFIG.SOCKET_URL) return;

      socketRef.current = io(`${API_CONFIG.SOCKET_URL}/bookings`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      socketRef.current.on('new-reservation', (data) => {
        const newReservation: Reservation = {
          id: data.id,
          customerName: data.customerName,
          phone: data.phone,
          date: data.date,
          time: data.time,
          guests: data.guests,
          status: 'pending',
          createdAt: new Date().toISOString(),
          source: 'app',
        };
        setReservations(prev => [newReservation, ...prev]);
      });

      socketRef.current.on('reservation-updated', (data) => {
        setReservations(prev =>
          prev.map(r =>
            r.id === data.reservationId ? { ...r, status: data.status } : r
          )
        );
      });

      return () => {
        socketRef.current?.disconnect();
      };
    };

    initializeSocket();
    loadReservations();
  }, [loadReservations]);

  // Apply filters
  useEffect(() => {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const weekEnd = endOfDay(addDays(today, 7));

    let filtered = [...reservations];

    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(r => {
        const resDate = startOfDay(parseISO(r.date));
        return isAfter(resDate, addDays(today, -1)) && isBefore(resDate, today) || isToday(resDate);
      });
    } else if (dateFilter === 'tomorrow') {
      filtered = filtered.filter(r => isTomorrow(parseISO(r.date)));
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(r => {
        const resDate = parseISO(r.date);
        return (isAfter(resDate, addDays(today, -1)) || isToday(resDate)) && isBefore(resDate, weekEnd);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    setFilteredReservations(filtered);
  }, [reservations, dateFilter, statusFilter]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadReservations();
  }, [loadReservations]);

  const handleConfirm = useCallback((reservation: Reservation) => {
    setReservations(prev =>
      prev.map(r =>
        r.id === reservation.id ? { ...r, status: 'confirmed' } : r
      )
    );
  }, []);

  const handleSeat = useCallback((reservation: Reservation) => {
    setReservations(prev =>
      prev.map(r =>
        r.id === reservation.id ? { ...r, status: 'seated' } : r
      )
    );
  }, []);

  const handleCancel = useCallback((reservation: Reservation) => {
    Alert.alert(
      'Cancel Reservation',
      `Are you sure you want to cancel the reservation for ${reservation.customerName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setReservations(prev =>
              prev.map(r =>
                r.id === reservation.id ? { ...r, status: 'cancelled' } : r
              )
            );
          },
        },
      ]
    );
  }, []);

  const handleAddReservation = useCallback(() => {
    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.time.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const newReservation: Reservation = {
      id: `new-${Date.now()}`,
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      date: formData.date,
      time: formData.time,
      guests: parseInt(formData.guests, 10) || 2,
      status: 'pending',
      notes: formData.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      source: 'walkin',
    };

    setReservations(prev => [newReservation, ...prev]);
    setShowAddModal(false);
    setFormData({
      customerName: '',
      phone: '',
      email: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      guests: '2',
      notes: '',
    });
    Alert.alert('Success', 'Reservation added successfully');
  }, [formData]);

  // Group by date
  const groupedReservations = useMemo(() => {
    const groups: Record<string, Reservation[]> = {};
    filteredReservations.forEach(res => {
      if (!groups[res.date]) {
        groups[res.date] = [];
      }
      groups[res.date].push(res);
    });
    return groups;
  }, [filteredReservations]);

  const stats = useMemo(() => ({
    todayTotal: reservations.filter(r => isToday(parseISO(r.date))).length,
    todayPending: reservations.filter(r => isToday(parseISO(r.date)) && r.status === 'pending').length,
    todayGuests: reservations
      .filter(r => isToday(parseISO(r.date)) && ['confirmed', 'seated'].includes(r.status))
      .reduce((sum, r) => sum + r.guests, 0),
  }), [reservations]);

  const formatDateHeader = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reservations</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.headerButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.primary[500] }]}>{stats.todayTotal}</Text>
          <Text style={styles.statLabel}>Today's Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.warning[500] }]}>{stats.todayPending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayGuests}</Text>
          <Text style={styles.statLabel}>Expected Guests</Text>
        </View>
      </View>

      {/* Date Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilters}>
        {DATE_FILTER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[styles.dateChip, dateFilter === option.key && styles.dateChipActive]}
            onPress={() => setDateFilter(option.key)}
          >
            <Text style={[styles.dateChipText, dateFilter === option.key && styles.dateChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
        {STATUS_FILTER_OPTIONS.map(status => {
          const config = status === 'all' ? { label: 'All', color: Colors.text.secondary } : STATUS_CONFIG[status];
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.dateChip,
                statusFilter === status && { backgroundColor: Colors.primary[500] },
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  statusFilter === status && styles.dateChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Reservations List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {Object.keys(groupedReservations).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.gray[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No reservations</Text>
            <Text style={styles.emptySubtitle}>
              {dateFilter === 'today'
                ? 'No reservations for today'
                : 'No reservations match your filters'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedReservations).map(([date, reservations]) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
              <View style={styles.reservationsList}>
                {reservations.map(reservation => {
                  const statusConfig = STATUS_CONFIG[reservation.status];
                  const [time, minutes] = reservation.time.split(':');
                  const hour = parseInt(time, 10);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour > 12 ? hour - 12 : hour;

                  return (
                    <View key={reservation.id} style={styles.reservationCard}>
                      <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{displayHour}:{minutes}</Text>
                        <Text style={styles.timeAmPm}>{ampm}</Text>
                        <View style={styles.guestsBadge}>
                          <Text style={styles.guestsText}>{reservation.guests} pax</Text>
                        </View>
                      </View>

                      <View style={styles.reservationContent}>
                        <Text style={styles.customerName}>{reservation.customerName}</Text>
                        <Text style={styles.customerPhone}>{reservation.phone}</Text>

                        {reservation.tableNumber && (
                          <View style={styles.tableInfo}>
                            <Ionicons name="grid-outline" size={14} color={Colors.text.secondary} />
                            <Text style={styles.tableInfo}>Table {reservation.tableNumber}</Text>
                          </View>
                        )}

                        {reservation.notes && (
                          <Text style={styles.notes}>{reservation.notes}</Text>
                        )}

                        <View style={styles.sourceBadge}>
                          <Ionicons name={SOURCE_CONFIG[reservation.source]} size={12} color={Colors.text.secondary} />
                          <Text style={styles.sourceText}>{reservation.source}</Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                          <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                          </Text>
                        </View>

                        {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                          <View style={styles.actionsContainer}>
                            {reservation.status === 'pending' && (
                              <>
                                <TouchableOpacity
                                  style={[styles.actionButton, styles.confirmButton]}
                                  onPress={() => handleConfirm(reservation)}
                                >
                                  <Text style={[styles.actionButtonText, styles.confirmButtonText]}>
                                    Confirm
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionButton, styles.cancelButton]}
                                  onPress={() => handleCancel(reservation)}
                                >
                                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                              </>
                            )}
                            {reservation.status === 'confirmed' && (
                              <>
                                <TouchableOpacity
                                  style={[styles.actionButton, styles.seatButton]}
                                  onPress={() => handleSeat(reservation)}
                                >
                                  <Text style={[styles.actionButtonText, styles.seatButtonText]}>
                                    Seat Guest
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionButton, styles.cancelButton]}
                                  onPress={() => handleCancel(reservation)}
                                >
                                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Reservation Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reservation</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Customer Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Full name"
                    placeholderTextColor={Colors.text.tertiary}
                    value={formData.customerName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, customerName: text }))}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Phone *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+91 XXXXX XXXXX"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.text.tertiary}
                    value={formData.date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Time *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.text.tertiary}
                    value={formData.time}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Guests</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="2"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="number-pad"
                    value={formData.guests}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, guests: text }))}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={styles.formTextArea}
                  placeholder="Special requests, allergies, etc."
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddReservation}>
                <Text style={styles.submitButtonText}>Add Reservation</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
