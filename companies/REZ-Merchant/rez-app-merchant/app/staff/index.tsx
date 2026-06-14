/**
 * StaffListScreen
 * Lists all staff members with search, filter, and quick actions.
 * API: GET /staff/:merchantId
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
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useMerchant } from '@/contexts/MerchantContext';
import { useStore } from '@/contexts/StoreContext';
import {
  staffService,
  Staff,
  StaffRole,
  StaffStatus,
  getStaffRoleLabel,
  getStaffStatusLabel,
  getStaffStatusColor,
} from '@/services/staffService';
import { showAlert } from '@/utils/alert';

// Staff role filter options
const ROLE_FILTERS: { label: string; value: StaffRole | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Manager', value: 'manager' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Server', value: 'server' },
  { label: 'Chef', value: 'chef' },
  { label: 'Delivery', value: 'delivery' },
];

// Staff status filter options
const STATUS_FILTERS: { label: string; value: StaffStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'On Leave', value: 'on_leave' },
];

export default function StaffListScreen() {
  const insets = useSafeAreaInsets();
  const { merchant } = useMerchant();
  const { activeStore } = useStore();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<StaffStatus | 'all'>('all');
  const [totalStaff, setTotalStaff] = useState(0);

  const merchantId = merchant?._id || '';
  const storeId = activeStore?._id || '';

  const fetchStaff = useCallback(async () => {
    if (!merchantId) return;

    try {
      const response = await staffService.getStaff({
        merchantId,
        storeId: storeId || undefined,
        query: searchQuery || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        limit: 50,
      });

      setStaffList(response.staff);
      setTotalStaff(response.total);
    } catch (error) {
      logger.error('[StaffList] Error fetching staff:', error);
      showAlert('Error', error?.message || 'Failed to load staff members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId, storeId, searchQuery, selectedRole, selectedStatus]);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [fetchStaff])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff();
  }, [fetchStaff]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleStaffPress = useCallback((staff: Staff) => {
    const staffId = staff._id || staff.id;
    router.push(`/staff/detail?id=${staffId}`);
  }, []);

  const handleAddStaff = useCallback(() => {
    router.push('/staff/add');
  }, []);

  const handleDeleteStaff = useCallback((staff: Staff) => {
    const staffId = staff._id || staff.id;
    Alert.alert(
      'Delete Staff',
      `Are you sure you want to remove ${staff.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffService.deleteStaff(staffId!);
              fetchStaff();
            } catch (error) {
              showAlert('Error', error?.message || 'Failed to delete staff');
            }
          },
        },
      ]
    );
  }, [fetchStaff]);

  const renderStaffCard = useCallback(({ item }: { item: Staff }) => {
    const statusColors = getStaffStatusColor(item.status);
    const initials = item.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        style={styles.staffCard}
        onPress={() => handleStaffPress(item)}
        onLongPress={() => handleDeleteStaff(item)}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.staffRole}>{getStaffRoleLabel(item.role)}</Text>
          {item.phone && <Text style={styles.staffPhone}>{item.phone}</Text>}
        </View>

        <View style={styles.staffActions}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStaffStatusLabel(item.status)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
        </View>
      </TouchableOpacity>
    );
  }, [handleStaffPress, handleDeleteStaff]);

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff..."
          placeholderTextColor={Colors.light.icon}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Filters */}
      <FlatList
        horizontal
        data={ROLE_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedRole === item.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedRole(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedRole === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Status Filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusFilterChip,
              selectedStatus === item.value && styles.statusFilterChipActive,
            ]}
            onPress={() => setSelectedStatus(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={Colors.light.icon} />
      <Text style={styles.emptyTitle}>No staff found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
          ? 'Try adjusting your filters'
          : 'Add your first team member to get started'}
      </Text>
      {!searchQuery && selectedRole === 'all' && selectedStatus === 'all' && (
        <TouchableOpacity style={styles.addButtonEmpty} onPress={handleAddStaff}>
          <Text style={styles.addButtonEmptyText}>Add Staff</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Staff</Text>
          <Text style={styles.headerSubtitle}>{totalStaff} team members</Text>
        </View>
        <TouchableOpacity onPress={handleAddStaff}>
          <Ionicons name="add-circle" size={28} color={Colors.light.card} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Staff List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <FlatList
          data={staffList}
          keyExtractor={(item) => item._id || item.id || ''}
          renderItem={renderStaffCard}
          contentContainerStyle={[
            styles.listContent,
            staffList.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {staffList.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 16 }]}
          onPress={handleAddStaff}
        >
          <Ionicons name="person-add" size={24} color={Colors.light.card} />
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.tint,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.card,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.card,
    opacity: 0.8,
  },

  filtersContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  filterChipTextActive: {
    color: Colors.light.card,
  },
  statusFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  statusFilterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },

  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.card,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  staffRole: {
    fontSize: 13,
    color: Colors.light.icon,
    marginTop: 2,
  },
  staffPhone: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  staffActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  addButtonEmpty: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  addButtonEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.card,
  },

  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
