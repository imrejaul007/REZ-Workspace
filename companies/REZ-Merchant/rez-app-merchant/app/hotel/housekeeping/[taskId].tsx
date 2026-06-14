/**
 * Task Detail Screen
 * Shows detailed view of a housekeeping task
 * API: GET /housekeeping/tasks/:taskId
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import type { HousekeepingTask, TaskStatus } from './index';

// Mock task data
const mockTask: HousekeepingTask = {
  id: '1',
  roomNumber: '101',
  roomType: 'Standard',
  taskType: 'cleaning',
  status: 'pending',
  priority: 'high',
  dueTime: new Date(Date.now() + 30 * 60000),
  notes: 'VIP guest checking in at 3 PM. Please ensure extra attention to detail.',
  createdAt: new Date(Date.now() - 30 * 60000),
};

const mockStaffList = [
  { id: '1', name: 'Maria Santos', role: 'Head Housekeeper', available: true },
  { id: '2', name: 'John Smith', role: 'Housekeeper', available: true },
  { id: '3', name: 'Ana Garcia', role: 'Housekeeper', available: false },
  { id: '4', name: 'Carlos Rodriguez', role: 'Room Attendant', available: true },
];

const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    pending: Colors.light.warning,
    in_progress: Colors.light.info,
    completed: Colors.light.success,
    verified: Colors.light.primary,
  };
  return colors[status];
};

const getStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    verified: 'Verified',
  };
  return labels[status];
};

const getTaskTypeIcon = (taskType: HousekeepingTask['taskType']): keyof typeof Ionicons.glyphMap => {
  const icons: Record<HousekeepingTask['taskType'], keyof typeof Ionicons.glyphMap> = {
    cleaning: 'broom-outline',
    deep_clean: 'sparkles-outline',
    turndown: 'moon-outline',
    inspection: 'search-outline',
  };
  return icons[taskType];
};

const getPriorityLabel = (priority: HousekeepingTask['priority']): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  const [task, setTask] = useState<HousekeepingTask>(mockTask);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  const handleStartTask = useCallback(() => {
    Alert.alert('Start Task', 'Are you ready to start this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: () => {
          setTask((prev) => ({ ...prev, status: 'in_progress' }));
          Alert.alert('Success', 'Task has been started');
        },
      },
    ]);
  }, []);

  const handleCompleteTask = useCallback(() => {
    Alert.alert('Complete Task', 'Mark this task as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          setTask((prev) => ({ ...prev, status: 'completed', completedAt: new Date() }));
          Alert.alert('Success', 'Task marked as completed');
        },
      },
    ]);
  }, []);

  const handleVerifyTask = useCallback(() => {
    Alert.alert('Verify Task', 'Approve this cleaning task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        onPress: () => {
          setTask((prev) => ({ ...prev, status: 'verified' }));
          Alert.alert('Success', 'Task has been verified');
        },
      },
    ]);
  }, []);

  const handleAssignStaff = useCallback(
    (staff: (typeof mockStaffList)[0]) => {
      if (!staff.available) {
        Alert.alert('Unavailable', 'This staff member is not available');
        return;
      }
      setTask((prev) => ({
        ...prev,
        assignedTo: { id: staff.id, name: staff.name },
      }));
      setShowStaffPicker(false);
      Alert.alert('Assigned', `${staff.name} has been assigned to this task`);
    },
    []
  );

  const handleUnassignStaff = useCallback(() => {
    Alert.alert('Unassign Staff', 'Remove staff assignment from this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unassign',
        style: 'destructive',
        onPress: () => {
          setTask((prev) => ({ ...prev, assignedTo: undefined }));
        },
      },
    ]);
  }, []);

  const renderActionButtons = () => {
    const buttons: React.ReactNode[] = [];

    if (task.status === 'pending') {
      buttons.push(
        <TouchableOpacity
          key="start"
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleStartTask}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Start Task</Text>
        </TouchableOpacity>
      );
    }

    if (task.status === 'in_progress') {
      buttons.push(
        <TouchableOpacity
          key="complete"
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleCompleteTask}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      );
    }

    if (task.status === 'completed') {
      buttons.push(
        <TouchableOpacity
          key="verify"
          style={[styles.actionButton, styles.successButton]}
          onPress={handleVerifyTask}
        >
          <Ionicons name="checkmark-done" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Verify & Approve</Text>
        </TouchableOpacity>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Info Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated" padding="lg" style={styles.roomCard}>
            <View style={styles.roomHeader}>
              <View style={styles.roomNumberContainer}>
                <Text style={styles.roomNumber}>{task.roomNumber}</Text>
                <Text style={styles.roomType}>{task.roomType}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(task.status)}20` },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]}
                />
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {getStatusLabel(task.status)}
                </Text>
              </View>
            </View>

            <View style={styles.taskTypeContainer}>
              <View style={styles.taskTypeIcon}>
                <Ionicons
                  name={getTaskTypeIcon(task.taskType)}
                  size={24}
                  color={Colors.light.primary}
                />
              </View>
              <View>
                <Text style={styles.taskTypeTitle}>
                  {task.taskType === 'cleaning'
                    ? 'Standard Clean'
                    : task.taskType === 'deep_clean'
                      ? 'Deep Clean'
                      : task.taskType === 'turndown'
                        ? 'Turndown Service'
                        : 'Room Inspection'}
                </Text>
                <Text style={styles.taskTypeSubtitle}>
                  {task.priority === 'urgent'
                    ? 'Urgent Priority'
                    : `${getPriorityLabel(task.priority)} Priority`}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Task Info */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card variant="default" padding="md" style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Task Information</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Due Time</Text>
                <Text style={styles.infoValue}>
                  {task.dueTime ? formatDateTime(task.dueTime) : 'Not set'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDateTime(task.createdAt)}</Text>
              </View>
            </View>

            {task.completedAt && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Completed</Text>
                  <Text style={styles.infoValue}>{formatDateTime(task.completedAt)}</Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Staff Assignment */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card variant="default" padding="md" style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assigned Staff</Text>
              <TouchableOpacity
                onPress={() => setShowStaffPicker(!showStaffPicker)}
                style={styles.changeButton}
              >
                <Text style={styles.changeButtonText}>
                  {task.assignedTo ? 'Change' : 'Assign'}
                </Text>
              </TouchableOpacity>
            </View>

            {task.assignedTo ? (
              <TouchableOpacity
                style={styles.staffCard}
                onPress={handleUnassignStaff}
              >
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffInitials}>
                    {task.assignedTo.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{task.assignedTo.name}</Text>
                  <Text style={styles.staffRole}>Housekeeping Staff</Text>
                </View>
                <Ionicons name="close-circle" size={24} color={Colors.light.danger} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.unassignedCard}
                onPress={() => setShowStaffPicker(true)}
              >
                <Ionicons name="person-add-outline" size={32} color={Colors.light.textMuted} />
                <Text style={styles.unassignedText}>Tap to assign staff</Text>
              </TouchableOpacity>
            )}

            {/* Staff Picker */}
            {showStaffPicker && (
              <View style={styles.staffPicker}>
                <Text style={styles.pickerTitle}>Select Staff</Text>
                {mockStaffList.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.staffPickerItem,
                      !staff.available && styles.staffPickerItemDisabled,
                    ]}
                    onPress={() => handleAssignStaff(staff)}
                    disabled={!staff.available}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffInitials}>
                        {staff.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={styles.staffRole}>
                        {staff.role} {staff.available ? '' : '(Busy)'}
                      </Text>
                    </View>
                    {staff.available && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Card variant="default" padding="md" style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this task..."
              placeholderTextColor={Colors.light.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.actionsContainer}>
          {renderActionButtons()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  menuButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  roomCard: {
    marginBottom: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  roomNumberContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  roomNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  roomType: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  taskTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  taskTypeSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight2,
  },
  changeButtonText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  staffRole: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  unassignedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
  },
  unassignedText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  staffPicker: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  staffPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  staffPickerItemDisabled: {
    opacity: 0.5,
  },
  notesInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 100,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  successButton: {
    backgroundColor: Colors.light.success,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
