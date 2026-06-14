/**
 * Housekeeping Dashboard
 * Manages room cleaning tasks and staff assignments
 * API: GET /housekeeping/tasks
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card, Badge } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';

// Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'verified';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType: string;
  taskType: 'cleaning' | 'deep_clean' | 'turndown' | 'inspection';
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueTime?: Date;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface RoomTask {
  roomNumber: string;
  roomType: string;
  status: 'dirty' | 'clean' | 'occupied' | 'maintenance';
  pendingTasks: number;
  currentTask?: HousekeepingTask;
}

// Mock data
const mockTasks: HousekeepingTask[] = [
  {
    id: '1',
    roomNumber: '101',
    roomType: 'Standard',
    taskType: 'cleaning',
    status: 'pending',
    priority: 'high',
    dueTime: new Date(Date.now() + 30 * 60000),
    createdAt: new Date(),
  },
  {
    id: '2',
    roomNumber: '102',
    roomType: 'Deluxe',
    taskType: 'deep_clean',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: { id: '1', name: 'Maria Santos' },
    dueTime: new Date(Date.now() + 60 * 60000),
    notes: 'VIP guest checking in at 3 PM',
    createdAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: '3',
    roomNumber: '103',
    roomType: 'Suite',
    taskType: 'turndown',
    status: 'completed',
    priority: 'low',
    assignedTo: { id: '2', name: 'John Smith' },
    completedAt: new Date(Date.now() - 15 * 60000),
    createdAt: new Date(Date.now() - 90 * 60000),
  },
  {
    id: '4',
    roomNumber: '201',
    roomType: 'Standard',
    taskType: 'inspection',
    status: 'verified',
    priority: 'medium',
    assignedTo: { id: '1', name: 'Maria Santos' },
    completedAt: new Date(Date.now() - 60 * 60000),
    createdAt: new Date(Date.now() - 120 * 60000),
  },
  {
    id: '5',
    roomNumber: '202',
    roomType: 'Deluxe',
    taskType: 'cleaning',
    status: 'pending',
    priority: 'urgent',
    dueTime: new Date(Date.now() + 15 * 60000),
    notes: 'Early check-in requested',
    createdAt: new Date(Date.now() - 20 * 60000),
  },
];

const mockRooms: RoomTask[] = [
  { roomNumber: '101', roomType: 'Standard', status: 'dirty', pendingTasks: 1 },
  { roomNumber: '102', roomType: 'Deluxe', status: 'clean', pendingTasks: 0 },
  { roomNumber: '103', roomType: 'Suite', status: 'occupied', pendingTasks: 1 },
  { roomNumber: '201', roomType: 'Standard', status: 'clean', pendingTasks: 0 },
  { roomNumber: '202', roomType: 'Deluxe', status: 'dirty', pendingTasks: 1 },
  { roomNumber: '203', roomType: 'Suite', status: 'maintenance', pendingTasks: 0 },
];

// Helper functions
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

const getPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    low: Colors.light.textMuted,
    medium: Colors.light.info,
    high: Colors.light.warning,
    urgent: Colors.light.danger,
  };
  return colors[priority];
};

const getTaskTypeLabel = (taskType: HousekeepingTask['taskType']): string => {
  const labels: Record<HousekeepingTask['taskType'], string> = {
    cleaning: 'Standard Clean',
    deep_clean: 'Deep Clean',
    turndown: 'Turndown Service',
    inspection: 'Room Inspection',
  };
  return labels[taskType];
};

const formatDueTime = (date?: Date): string => {
  if (!date) return '';
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 0) return 'Overdue';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

interface TaskCardProps {
  task: HousekeepingTask;
  onPress: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Card variant="elevated" padding="md" style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomNumber}>{task.roomNumber}</Text>
          <Text style={styles.roomType}>{task.roomType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(task.status)}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
            {getStatusLabel(task.status)}
          </Text>
        </View>
      </View>

      <View style={styles.taskDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="construct-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>{getTaskTypeLabel(task.taskType)}</Text>
        </View>
        {task.assignedTo && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>{task.assignedTo.name}</Text>
          </View>
        )}
        {task.dueTime && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={getPriorityColor(task.priority)} />
            <Text style={[styles.detailText, { color: getPriorityColor(task.priority) }]}>
              {formatDueTime(task.dueTime)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.priorityIndicator}>
        <View
          style={[
            styles.priorityBar,
            { backgroundColor: getPriorityColor(task.priority), width: `${(task.priority === 'urgent' ? 100 : task.priority === 'high' ? 75 : task.priority === 'medium' ? 50 : 25)}%` },
          ]}
        />
      </View>
    </Card>
  </TouchableOpacity>
);

export default function HousekeepingScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [tasks, setTasks] = useState<HousekeepingTask[]>(mockTasks);
  const [rooms] = useState<RoomTask[]>(mockRooms);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');

  const statusFilters: { label: string; value: TaskStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Verified', value: 'verified' },
  ];

  const priorityFilters: { label: string; value: TaskPriority | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.roomType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const taskCounts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed' || t.status === 'verified').length,
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks().finally(() => setRefreshing(false));
  }, [fetchTasks]);

  const handleTaskPress = useCallback((task: HousekeepingTask) => {
    router.push(`/hotel/housekeeping/${task.id}`);
  }, []);

  const handleCreateTask = useCallback(() => {
    Alert.alert('Create Task', 'Task creation modal would open here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => {} },
    ]);
  }, []);

  const handleAssignStaff = useCallback(() => {
    router.push('/hotel/housekeeping/assign');
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rooms..."
          placeholderTextColor={Colors.light.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Room Status Overview */}
      <View style={styles.roomOverview}>
        <Text style={styles.sectionTitle}>Room Status</Text>
        <View style={styles.roomStatusGrid}>
          {rooms.map((room) => (
            <View
              key={room.roomNumber}
              style={[
                styles.roomStatusItem,
                {
                  backgroundColor:
                    room.status === 'dirty'
                      ? Colors.light.errorLight
                      : room.status === 'clean'
                        ? Colors.light.successLight
                        : room.status === 'occupied'
                          ? Colors.light.infoLight
                          : Colors.light.warningLight,
                },
              ]}
            >
              <Text style={styles.roomStatusNumber}>{room.roomNumber}</Text>
              <Text
                style={[
                  styles.roomStatusLabel,
                  {
                    color:
                      room.status === 'dirty'
                        ? Colors.light.danger
                        : room.status === 'clean'
                          ? Colors.light.success
                          : room.status === 'occupied'
                            ? Colors.light.info
                            : Colors.light.warning,
                  },
                ]}
              >
                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.sectionTitle}>Tasks by Status</Text>
        <View style={styles.statusTabs}>
          <View style={styles.statusTab}>
            <Text style={styles.statusCount}>{taskCounts.pending}</Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          <View style={styles.statusTab}>
            <Text style={[styles.statusCount, { color: Colors.light.info }]}>
              {taskCounts.in_progress}
            </Text>
            <Text style={styles.statusLabel}>In Progress</Text>
          </View>
          <View style={styles.statusTab}>
            <Text style={[styles.statusCount, { color: Colors.light.success }]}>
              {taskCounts.completed}
            </Text>
            <Text style={styles.statusLabel}>Done</Text>
          </View>
        </View>
      </View>

      {/* Priority Filters */}
      <View style={styles.priorityFilters}>
        <FlatList
          horizontal
          data={priorityFilters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPriority === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPriority(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPriority === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tasks List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          Tasks ({filteredTasks.length})
        </Text>
        <TouchableOpacity style={styles.assignButton} onPress={handleAssignStaff}>
          <Ionicons name="people-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.assignButtonText}>Assign Staff</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Housekeeping</Text>
        <TouchableOpacity onPress={handleCreateTask} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <TaskCard task={item} onPress={() => handleTaskPress(item)} />
            </Animated.View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.light.success} />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>No tasks match your filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerBar: {
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
  addButton: {
    padding: 4,
  },
  header: {
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  roomOverview: {
    marginBottom: 16,
  },
  roomStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomStatusItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  roomStatusNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  roomStatusLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  statusLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  priorityFilters: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight2,
  },
  assignButtonText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  roomType: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  priorityIndicator: {
    height: 3,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  priorityBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});
