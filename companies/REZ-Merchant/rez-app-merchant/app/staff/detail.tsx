/**
 * StaffDetailScreen
 * Shows full staff details with actions (edit, schedule, delete).
 * API: GET /staff/detail/:id
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import {
  staffService,
  Staff,
  StaffSchedule,
  getStaffRoleLabel,
  getStaffStatusLabel,
  getStaffStatusColor,
  formatSalary,
  formatWorkingHours,
} from '@/services/staffService';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

export default function StaffDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [schedule, setSchedule] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchStaffDetails = useCallback(async () => {
    if (!staffId) return;

    try {
      const [staffData, scheduleData] = await Promise.all([
        staffService.getStaffById(staffId),
        staffService.getStaffSchedule(staffId, {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      ]);

      setStaff(staffData);
      setSchedule(scheduleData);
    } catch (error) {
      logger.error('[StaffDetail] Error fetching staff:', error);
      showAlert('Error', error?.message || 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchStaffDetails();
  }, [fetchStaffDetails]);

  const handleEdit = useCallback(() => {
    router.push(`/staff/add?id=${staffId}`);
  }, [staffId]);

  const handleCall = useCallback(() => {
    if (staff?.phone) {
      Linking.openURL(`tel:${staff.phone}`);
    }
  }, [staff?.phone]);

  const handleEmail = useCallback(() => {
    if (staff?.email) {
      Linking.openURL(`mailto:${staff.email}`);
    }
  }, [staff?.email]);

  const handleViewSchedule = useCallback(() => {
    router.push(`/staff-shifts/index`);
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to remove ${staff?.name}? This will also remove their shifts. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await staffService.deleteStaff(staffId);
              showAlert('Success', 'Staff member removed successfully');
              router.back();
            } catch (error) {
              showAlert('Error', error?.message || 'Failed to delete staff');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [staff?.name, staffId]);

  const handleUpdateStatus = useCallback((newStatus: Staff['status']) => {
    Alert.alert(
      'Update Status',
      `Change ${staff?.name}'s status to ${getStaffStatusLabel(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await staffService.updateStaff(staffId, { status: newStatus });
              showAlert('Success', 'Status updated successfully');
              fetchStaffDetails();
            } catch (error) {
              showAlert('Error', error?.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  }, [staff?.name, staffId, fetchStaffDetails]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </ThemedView>
    );
  }

  if (!staff) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
        <Text style={styles.errorTitle}>Staff not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const statusColors = getStaffStatusColor(staff.status);
  const initials = staff.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const upcomingSchedule = schedule.slice(0, 5);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Details</Text>
        <TouchableOpacity onPress={handleEdit}>
          <Ionicons name="create-outline" size={26} color={Colors.light.card} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            {staff.avatar ? (
              <Text style={styles.avatarTextLarge}>{initials}</Text>
            ) : (
              <Text style={styles.avatarTextLarge}>{initials}</Text>
            )}
          </View>
          <Text style={styles.staffName}>{staff.name}</Text>
          <Text style={styles.staffRole}>{getStaffRoleLabel(staff.role)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStaffStatusLabel(staff.status)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {staff.phone && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={22} color={Colors.light.tint} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          {staff.email && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail" size={22} color={Colors.light.tint} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={handleViewSchedule}>
            <Ionicons name="calendar" size={22} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {staff.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={Colors.light.icon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{staff.phone}</Text>
                </View>
              </View>
            )}
            {staff.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={Colors.light.icon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{staff.email}</Text>
                </View>
              </View>
            )}
            {staff.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.light.icon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {[staff.address.addressLine1, staff.address.city, staff.address.state]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              </View>
            )}
            {!staff.phone && !staff.email && !staff.address && (
              <Text style={styles.noDataText}>No contact information available</Text>
            )}
          </View>
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color={Colors.light.icon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{getStaffRoleLabel(staff.role)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.light.icon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>
                  {new Date(staff.joiningDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            {staff.salary && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color={Colors.light.icon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Salary</Text>
                  <Text style={styles.infoValue}>{formatSalary(staff.salary)}</Text>
                </View>
              </View>
            )}
            {staff.workingHours && staff.workingHours.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={Colors.light.icon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Working Hours</Text>
                  <Text style={styles.infoValue}>{formatWorkingHours(staff.workingHours)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Status Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusActions}>
            {(['active', 'inactive', 'on_leave'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusActionButton,
                  staff.status === status && styles.statusActionButtonActive,
                ]}
                onPress={() => handleUpdateStatus(status)}
                disabled={staff.status === status}
              >
                <Text
                  style={[
                    styles.statusActionText,
                    staff.status === status && styles.statusActionTextActive,
                  ]}
                >
                  {getStaffStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Schedule */}
        {upcomingSchedule.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
              <TouchableOpacity onPress={handleViewSchedule}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scheduleCard}>
              {upcomingSchedule.map((item, index) => (
                <View key={item._id || index} style={styles.scheduleRow}>
                  <View style={styles.scheduleDate}>
                    <Text style={styles.scheduleDay}>
                      {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </Text>
                    <Text style={styles.scheduleDateNum}>
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleTimeText}>
                      {item.startTime} - {item.endTime}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delete Action */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.light.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                <Text style={styles.deleteButtonText}>Remove Staff Member</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </ThemedView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.card,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },

  scrollView: {
    flex: 1,
  },

  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTextLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.card,
  },
  staffName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  staffRole: {
    fontSize: 15,
    color: Colors.light.icon,
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
  },

  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.tint,
  },

  infoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    paddingVertical: 12,
  },

  statusActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusActionButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusActionButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  statusActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statusActionTextActive: {
    color: Colors.light.card,
  },

  scheduleCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  scheduleDate: {
    width: 50,
    alignItems: 'center',
  },
  scheduleDay: {
    fontSize: 11,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  scheduleDateNum: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scheduleTime: {
    flex: 1,
    marginLeft: 12,
  },
  scheduleTimeText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.error,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.error,
  },
});
