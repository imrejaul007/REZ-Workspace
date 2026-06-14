/**
 * Assign Housekeeper Screen
 * Assigns staff to housekeeping tasks
 * API: GET /staff, POST /housekeeping/tasks/:id/assign
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

// Types
interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  available: boolean;
  currentTasks: number;
  specialties: string[];
  rating?: number;
}

interface TaskToAssign {
  id: string;
  roomNumber: string;
  roomType: string;
  taskType: string;
  priority: string;
  dueTime?: Date;
}

// Mock data
const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Maria Santos',
    role: 'Head Housekeeper',
    available: true,
    currentTasks: 2,
    specialties: ['Deep Clean', 'VIP Service'],
    rating: 4.8,
  },
  {
    id: '2',
    name: 'John Smith',
    role: 'Housekeeper',
    available: true,
    currentTasks: 1,
    specialties: ['Standard Clean', 'Turndown'],
    rating: 4.6,
  },
  {
    id: '3',
    name: 'Ana Garcia',
    role: 'Housekeeper',
    available: false,
    currentTasks: 4,
    specialties: ['Inspection', 'Maintenance'],
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Carlos Rodriguez',
    role: 'Room Attendant',
    available: true,
    currentTasks: 0,
    specialties: ['Quick Clean', 'Restock'],
    rating: 4.5,
  },
  {
    id: '5',
    name: 'Elena Perez',
    role: 'Housekeeper',
    available: true,
    currentTasks: 3,
    specialties: ['Deep Clean', 'Suite Service'],
    rating: 4.7,
  },
];

const mockTasks: TaskToAssign[] = [
  { id: '1', roomNumber: '101', roomType: 'Standard', taskType: 'cleaning', priority: 'high' },
  { id: '2', roomNumber: '102', roomType: 'Deluxe', taskType: 'deep_clean', priority: 'medium' },
  { id: '3', roomNumber: '201', roomType: 'Suite', taskType: 'turndown', priority: 'low' },
  { id: '4', roomNumber: '202', roomType: 'Standard', taskType: 'inspection', priority: 'urgent' },
];

export default function AssignHousekeeperScreen() {
  const insets = useSafeAreaInsets();

  const [staffList, setStaffList] = useState<StaffMember[]>(mockStaff);
  const [tasks] = useState<TaskToAssign[]>(mockTasks);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !showAvailableOnly || staff.available;
    return matchesSearch && matchesAvailability;
  });

  const handleStaffSelect = useCallback((staff: StaffMember) => {
    if (!staff.available) {
      Alert.alert('Unavailable', 'This staff member is currently busy with other tasks.');
      return;
    }
    setSelectedStaff(staff);
    setSelectedTasks([]);
  }, []);

  const handleTaskToggle = useCallback((taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleAssign = useCallback(async () => {
    if (!selectedStaff) {
      Alert.alert('Select Staff', 'Please select a staff member to assign tasks.');
      return;
    }
    if (selectedTasks.length === 0) {
      Alert.alert('Select Tasks', 'Please select at least one task to assign.');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === selectedStaff.id
            ? { ...s, currentTasks: s.currentTasks + selectedTasks.length }
            : s
        )
      );

      Alert.alert(
        'Assignment Complete',
        `${selectedTasks.length} task(s) assigned to ${selectedStaff.name}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to assign tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedStaff, selectedTasks]);

  const handleQuickAssign = useCallback(
    (task: TaskToAssign) => {
      // Find the first available staff member
      const availableStaff = staffList.filter((s) => s.available).sort((a, b) => a.currentTasks - b.currentTasks);

      if (availableStaff.length === 0) {
        Alert.alert('No Staff Available', 'All staff members are currently busy.');
        return;
      }

      const staff = availableStaff[0];
      setSelectedStaff(staff);
      setSelectedTasks([task.id]);

      Alert.alert(
        'Quick Assign',
        `Assign Room ${task.roomNumber} to ${staff.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Assign',
            onPress: async () => {
              setLoading(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                Alert.alert('Success', `${task.roomNumber} assigned to ${staff.name}`);
                router.back();
              } catch {
                Alert.alert('Error', 'Failed to assign task');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    },
    [staffList]
  );

  const renderStaffCard = ({ item, index }: { item: StaffMember; index: number }) => {
    const isSelected = selectedStaff?.id === item.id;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
          style={[
            styles.staffCard,
            isSelected && styles.staffCardSelected,
            !item.available && styles.staffCardUnavailable,
          ]}
          onPress={() => handleStaffSelect(item)}
          activeOpacity={0.8}
        >
          <View style={styles.staffHeader}>
            <View style={[styles.staffAvatar, !item.available && styles.staffAvatarBusy]}>
              <Text style={styles.staffInitials}>
                {item.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.staffRole}>{item.role}</Text>
            </View>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.staffDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="briefcase-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>{item.currentTasks} tasks</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star-outline" size={14} color={Colors.light.warning} />
              <Text style={styles.detailText}>{item.rating?.toFixed(1) || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.specialtiesContainer}>
            {item.specialties.map((specialty) => (
              <View key={specialty} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>

          {!item.available && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Currently busy</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTaskItem = ({ item }: { item: TaskToAssign }) => {
    const isSelected = selectedTasks.includes(item.id);
    const priorityColor =
      item.priority === 'urgent'
        ? Colors.light.danger
        : item.priority === 'high'
          ? Colors.light.warning
          : Colors.light.textSecondary;

    return (
      <TouchableOpacity
        style={[styles.taskItem, isSelected && styles.taskItemSelected]}
        onPress={() => handleTaskToggle(item.id)}
      >
        <View style={styles.taskInfo}>
          <View style={styles.taskRoomRow}>
            <Text style={styles.taskRoom}>{item.roomNumber}</Text>
            <Text style={styles.taskType}>{item.roomType}</Text>
          </View>
          <Text style={[styles.taskPriority, { color: priorityColor }]}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.quickAssignButton}
          onPress={() => handleQuickAssign(item)}
        >
          <Ionicons name="flash-outline" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Staff</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Tasks to Assign Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
            <Text style={styles.sectionSubtitle}>Select tasks to assign</Text>
          </View>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tasksList}
          />
        </View>

        {/* Selected Tasks Summary */}
        {selectedTasks.length > 0 && (
          <View style={styles.selectedSummary}>
            <Text style={styles.selectedSummaryText}>
              {selectedTasks.length} task(s) selected
            </Text>
          </View>
        )}

        {/* Staff List Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowAvailableOnly(!showAvailableOnly)}
            >
              <Text style={[styles.filterText, showAvailableOnly && styles.filterTextActive]}>
                {showAvailableOnly ? 'Available' : 'All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.light.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search staff..."
              placeholderTextColor={Colors.light.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id}
            renderItem={renderStaffCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.staffList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={Colors.light.textMuted} />
                <Text style={styles.emptyText}>No staff found</Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.selectedStaffInfo}>
          {selectedStaff ? (
            <>
              <View style={styles.selectedStaffAvatar}>
                <Text style={styles.selectedStaffInitials}>
                  {selectedStaff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </View>
              <View>
                <Text style={styles.selectedStaffName}>{selectedStaff.name}</Text>
                <Text style={styles.selectedStaffRole}>{selectedStaff.role}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.selectPrompt}>Select a staff member</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.assignButton,
            (!selectedStaff || selectedTasks.length === 0) && styles.assignButtonDisabled,
          ]}
          onPress={handleAssign}
          disabled={!selectedStaff || selectedTasks.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.assignButtonText}>Assign</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.light.primary,
  },
  tasksList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskItemSelected: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  taskInfo: {
    flex: 1,
  },
  taskRoomRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  taskRoom: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  taskType: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  taskType: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  taskPriority: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  quickAssignButton: {
    padding: 4,
    marginRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  selectedSummary: {
    backgroundColor: Colors.light.primaryLight2,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedSummaryText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.light.text,
  },
  staffList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  staffCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  staffCardSelected: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  staffCardUnavailable: {
    opacity: 0.6,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffAvatarBusy: {
    backgroundColor: Colors.light.textMuted,
  },
  staffInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  staffRole: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  specialtyText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.light.errorLight,
  },
  unavailableText: {
    fontSize: 11,
    color: Colors.light.danger,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 8,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  selectedStaffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedStaffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedStaffInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  selectedStaffName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  selectedStaffRole: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  selectPrompt: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  assignButtonDisabled: {
    backgroundColor: Colors.light.textMuted,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
