// ==========================================
// CorpPerks Manager App - Team List Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Avatar, Badge, Searchbar } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  getStatusColor,
  formatDate,
} from '../src/utils/theme';
import { TeamMember } from '../src/types';

export default function TeamListScreen() {
  const navigation = useNavigation<any>();
  const { teamMembers, setTeamMembers } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const loadTeam = async () => {
    try {
      const response = await api.getTeamMembers();
      if (response.success && response.data) {
        setTeamMembers(response.data);
      }
    } catch (error) {
      logger.error('Error loading team:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [teamMembers, searchQuery, selectedFilter]);

  const filterMembers = () => {
    let filtered = [...teamMembers];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.designation.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === selectedFilter);
    }

    setFilteredMembers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeam();
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'on-leave':
        return 'warning';
      case 'inactive':
        return 'error';
      case 'probation':
        return 'info';
      default:
        return 'info';
    }
  };

  const renderMemberCard = ({ item }: { item: TeamMember }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => navigation.navigate('TeamMemberDetail', { memberId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.memberHeader}>
        <Avatar uri={item.avatar} name={item.name} size="lg" />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberDesignation}>{item.designation}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
        <Badge
          label={item.status}
          variant={getStatusBadgeVariant(item.status)}
          size="sm"
        />
      </View>

      <View style={styles.memberStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.leaveBalance.total}</Text>
          <Text style={styles.statLabel}>Leave Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {item.attendanceStatus ? item.attendanceStatus : '-'}
          </Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, item.performanceScore && { color: Colors.primary }]}>
            {item.performanceScore ? item.performanceScore.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.memberFooter}>
        <Text style={styles.joinDate}>
          Joined {formatDate(item.joinDate)}
        </Text>
        <Text style={styles.viewDetails}>View Details {'>'}</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterChip = ({ label, value }: { label: string; value: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === value && styles.filterChipActive,
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedFilter === value && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search team members..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FilterChip label="All" value="all" />
        <FilterChip label="Active" value="active" />
        <FilterChip label="On Leave" value="on-leave" />
        <FilterChip label="Probation" value="probation" />
      </View>

      {/* Team Stats Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{teamMembers.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {teamMembers.filter((m) => m.status === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>
            {teamMembers.filter((m) => m.status === 'on-leave').length}
          </Text>
          <Text style={styles.summaryLabel}>On Leave</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.info }]}>
            {teamMembers.filter((m) => m.status === 'probation').length}
          </Text>
          <Text style={styles.summaryLabel}>Probation</Text>
        </View>
      </View>

      {/* Team List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  memberCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberDesignation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberEmail: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  joinDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  viewDetails: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
