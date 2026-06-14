/**
 * Team - Staff Clock In / Out Screen
 * Shows all staff with their current clock status and allows clocking in/out.
 */

import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';

// ============================================================================
// TYPES
// ============================================================================

type ClockStatus = 'clocked_in' | 'clocked_out' | 'not_started';

interface StaffClockStatus {
  staffId: string;
  staffName: string;
  role: string;
  clockStatus: ClockStatus;
  clockInTime?: string;
  clockOutTime?: string;
  entryId?: string;
  breakMinutes: number;
}

interface StatusResponse {
  date: string;
  staff: StaffClockStatus[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatTime(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function statusLabel(status: ClockStatus): string {
  switch (status) {
    case 'clocked_in':
      return 'Clocked In';
    case 'clocked_out':
      return 'Clocked Out';
    default:
      return 'Not Started';
  }
}

function statusColor(status: ClockStatus): string {
  switch (status) {
    case 'clocked_in':
      return Colors.light.success;
    case 'clocked_out':
      return Colors.light.textSecondary;
    default:
      return Colors.light.textMuted;
  }
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function ClockScreen() {
  const { storeId } = useAuth() as unknown as { storeId?: string };
  const [staffList, setStaffList] = useState<StaffClockStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [date, setDate] = useState('');

  const fetchStatus = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await apiClient.get<{ data: StatusResponse }>(
        `/staff-time/status?storeId=${storeId}`
      );
      const data = res.data?.data ?? (res.data as unknown as StatusResponse);
      setStaffList(data.staff || []);
      setDate(data.date || '');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to load staff status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleClockIn = async (staff: StaffClockStatus) => {
    setActionLoading(staff.staffId);
    try {
      await apiClient.post('/staff-time/clock-in', {
        storeId,
        staffId: staff.staffId,
        staffName: staff.staffName,
      });
      await fetchStatus();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to clock in');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClockOut = (staff: StaffClockStatus) => {
    Alert.alert('Clock Out', `Clock out ${staff.staffName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(staff.staffId);
          try {
            await apiClient.post('/staff-time/clock-out', {
              storeId,
              staffId: staff.staffId,
            });
            await fetchStatus();
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to clock out');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const renderStaffCard = (staff: StaffClockStatus) => {
    const isActioning = actionLoading === staff.staffId;
    const color = statusColor(staff.clockStatus);

    return (
      <View key={staff.staffId} style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: Colors.light.primary + '20' }]}>
            <ThemedText style={[styles.avatarText, { color: Colors.light.primary }]}>
              {getInitials(staff.staffName)}
            </ThemedText>
          </View>

          <View style={styles.staffInfo}>
            <ThemedText style={styles.staffName}>{staff.staffName}</ThemedText>
            <ThemedText style={styles.staffRole}>{staff.role}</ThemedText>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: color }]} />
              <ThemedText style={[styles.statusText, { color }]}>
                {statusLabel(staff.clockStatus)}
              </ThemedText>
              {staff.clockStatus === 'clocked_in' && staff.clockInTime && (
                <ThemedText style={styles.timeText}>
                  since {formatTime(staff.clockInTime)}
                </ThemedText>
              )}
              {staff.clockStatus === 'clocked_out' && staff.clockOutTime && (
                <ThemedText style={styles.timeText}>
                  out {formatTime(staff.clockOutTime)}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          {isActioning ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : staff.clockStatus === 'clocked_in' ? (
            <TouchableOpacity
              style={styles.clockOutButton}
              onPress={() => handleClockOut(staff)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.clockOutButtonText}>Clock Out</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.clockInButton}
              onPress={() => handleClockIn(staff)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.clockInButtonText}>Clock In</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.loadingText}>Loading staff status...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const clockedInCount = staffList.filter((s) => s.clockStatus === 'clocked_in').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>{staffList.length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Total Staff</ThemedText>
          </View>
          <View style={[styles.summaryItem, styles.summaryDivider]}>
            <ThemedText style={[styles.summaryValue, { color: Colors.light.success }]}>
              {clockedInCount}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Clocked In</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryValue, { color: Colors.light.textSecondary }]}>
              {staffList.length - clockedInCount}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Not In</ThemedText>
          </View>
        </View>

        {date ? <ThemedText style={styles.dateLabel}>{date}</ThemedText> : null}

        {/* Staff List */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
        >
          {staffList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No staff found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Add staff members to your team to track attendance
              </ThemedText>
            </View>
          ) : (
            <View style={styles.list}>{staffList.map(renderStaffCard)}</View>
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.light.textSecondary,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  staffRole: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginLeft: 4,
  },
  cardRight: {
    marginLeft: 12,
    minWidth: 88,
    alignItems: 'flex-end',
  },
  clockInButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clockInButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  clockOutButton: {
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  clockOutButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});
