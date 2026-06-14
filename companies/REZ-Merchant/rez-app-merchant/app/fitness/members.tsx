/**
 * Fitness Members Management
 * View and manage gym members
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

interface Member {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  membershipPlan: string;
  joinDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'paused';
  avatar?: string;
  attendedClasses: number;
  totalVisits: number;
}

// Mock data
const MOCK_MEMBERS: Member[] = [
  {
    _id: '1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul@example.com',
    membershipPlan: 'Premium',
    joinDate: '2025-01-15',
    expiryDate: '2026-07-15',
    status: 'active',
    attendedClasses: 45,
    totalVisits: 120,
  },
  {
    _id: '2',
    name: 'Priya Patel',
    phone: '+91 98765 43211',
    email: 'priya@example.com',
    membershipPlan: 'Standard',
    joinDate: '2024-08-20',
    expiryDate: '2026-05-20',
    status: 'active',
    attendedClasses: 78,
    totalVisits: 200,
  },
  {
    _id: '3',
    name: 'Amit Kumar',
    phone: '+91 98765 43212',
    membershipPlan: 'Basic',
    joinDate: '2025-03-01',
    expiryDate: '2026-03-01',
    status: 'expired',
    attendedClasses: 25,
    totalVisits: 65,
  },
  {
    _id: '4',
    name: 'Sneha Reddy',
    phone: '+91 98765 43213',
    email: 'sneha@example.com',
    membershipPlan: 'Premium',
    joinDate: '2024-11-10',
    expiryDate: '2026-11-10',
    status: 'active',
    attendedClasses: 92,
    totalVisits: 280,
  },
  {
    _id: '5',
    name: 'Vikram Singh',
    phone: '+91 98765 43214',
    membershipPlan: 'Standard',
    joinDate: '2025-02-28',
    expiryDate: '2026-08-28',
    status: 'paused',
    attendedClasses: 15,
    totalVisits: 40,
  },
];

type FilterType = 'all' | 'active' | 'expired' | 'paused';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Paused', value: 'paused' },
];

const MemberCard: React.FC<{ member: Member; index: number; onPress: () => void }> = ({
  member,
  index,
  onPress,
}) => {
  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'active':
        return Colors.light.success;
      case 'expired':
        return Colors.light.error;
      case 'paused':
        return Colors.light.warning;
      default:
        return Colors.light.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(member.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card variant="elevated" padding="md" style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <View style={styles.avatarContainer}>
              {member.avatar ? (
                <View style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.light.primaryLight2 }]}>
                  <Text style={styles.avatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(member.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.memberPhone}>{member.phone}</Text>
              <Text style={styles.memberPlan}>{member.membershipPlan} Plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
          </View>

          <View style={styles.memberStats}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.statText}>
                Joined: {formatDate(member.joinDate)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.statText}>
                {member.totalVisits} visits
              </Text>
            </View>
          </View>

          {member.status === 'active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
            <View style={styles.expiryWarning}>
              <Ionicons name="warning-outline" size={14} color={Colors.light.warning} />
              <Text style={styles.expiryWarningText}>
                Expires in {daysUntilExpiry} days
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MembersScreen() {
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Fetch members
  const fetchMembers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 500));
      setMembers(MOCK_MEMBERS);
    } catch (error) {
      console.error('[Members] fetchMembers error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filter members based on search and filter
  useEffect(() => {
    let result = members;

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter(m => m.status === activeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.name.toLowerCase().includes(query) ||
          m.phone.includes(query) ||
          m.email?.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(result);
  }, [members, searchQuery, activeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers(true);
  };

  const handleMemberPress = (member: Member) => {
    Alert.alert(
      member.name,
      `Phone: ${member.phone}\nPlan: ${member.membershipPlan}\nStatus: ${member.status}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => console.log('Navigate to member details'),
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or email..."
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

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterTab,
              activeFilter === filter.value && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter.value && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{members.length}</Text>
          <Text style={styles.statBoxLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: Colors.light.border }]}>
          <Text style={[styles.statBoxValue, { color: Colors.light.success }]}>
            {members.filter(m => m.status === 'active').length}
          </Text>
          <Text style={styles.statBoxLabel}>Active</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: Colors.light.border }]}>
          <Text style={[styles.statBoxValue, { color: Colors.light.warning }]}>
            {members.filter(m => m.status === 'expired').length}
          </Text>
          <Text style={styles.statBoxLabel}>Expired</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={Colors.light.textMuted} />
      <Text style={styles.emptyStateTitle}>No members found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try adjusting your search or filters'
          : 'Add your first member to get started'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderHeader()}

      <FlatList
        data={filteredMembers}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <MemberCard
            member={item}
            index={index}
            onPress={() => handleMemberPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statBoxLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  memberCard: {
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  memberPlan: {
    fontSize: 13,
    color: Colors.light.primary,
    marginTop: 2,
  },
  memberStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  expiryWarningText: {
    fontSize: 12,
    color: Colors.light.warning,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
