/**
 * Trigger Rules List Screen
 *
 * Displays all trigger rules with filtering and search.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { showConfirm, showAlert } from '@/utils/alert';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { useTriggerRules, useToggleRuleStatus, useDeleteRule, useDuplicateRule } from './hooks';
import {
  TriggerRule,
  TriggerType,
  TriggerStatus,
  TriggerFilters,
  TriggerStats,
} from './types';
import { useTriggerStats } from './hooks';

const ACCENT = Colors.light.primary;

const TRIGGER_TYPE_CONFIG: Record<
  TriggerType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  inactivity: { label: 'Inactivity', icon: 'time-outline', color: '#8B5CF6' },
  location: { label: 'Location', icon: 'location-outline', color: '#3B82F6' },
  birthday: { label: 'Birthday', icon: 'gift-outline', color: '#EC4899' },
  first_visit: { label: 'First Visit', icon: 'footsteps-outline', color: '#10B981' },
  loyalty_milestone: { label: 'Loyalty', icon: 'star-outline', color: '#F59E0B' },
  custom: { label: 'Custom', icon: 'settings-outline', color: '#6B7280' },
};

const STATUS_CONFIG: Record<
  TriggerStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: 'Active', color: Colors.light.success, bgColor: Colors.light.successLight },
  inactive: { label: 'Inactive', color: Colors.light.textMuted, bgColor: Colors.light.backgroundTertiary },
  draft: { label: 'Draft', color: Colors.light.warning, bgColor: Colors.light.warningLight },
};

const TYPE_FILTERS: { key: TriggerType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'inactivity', label: 'Inactivity' },
  { key: 'location', label: 'Location' },
  { key: 'birthday', label: 'Birthday' },
  { key: 'first_visit', label: 'First Visit' },
  { key: 'loyalty_milestone', label: 'Loyalty' },
];

const STATUS_FILTERS: { key: TriggerStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'draft', label: 'Draft' },
];

export default function TriggersListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TriggerType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TriggerStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filters: TriggerFilters = {
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery.trim() || undefined,
  };

  const { rules, isLoading, isRefreshing, pagination, refresh, loadMore } = useTriggerRules(filters);
  const { stats } = useTriggerStats();
  const { toggleStatus, isLoading: togglingId } = useToggleRuleStatus();
  const { deleteRule, isLoading: deletingId } = useDeleteRule();
  const { duplicateRule } = useDuplicateRule();

  const handleRulePress = (rule: TriggerRule) => {
    router.push(`/triggers/${rule.id}`);
  };

  const handleToggleStatus = async (rule: TriggerRule, event) => {
    event.stopPropagation();
    const newStatus = rule.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    showConfirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Rule`,
      `Are you sure you want to ${action} "${rule.name}"?`,
      async () => {
        try {
          await toggleStatus(rule);
          showAlert('Success', `Rule ${action}d successfully`);
        } catch {
          showAlert('Error', `Failed to ${action} rule`);
        }
      }
    );
  };

  const handleDelete = (rule: TriggerRule, event) => {
    event.stopPropagation();
    showConfirm(
      'Delete Rule',
      `Are you sure you want to delete "${rule.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteRule(rule.id);
          showAlert('Success', 'Rule deleted successfully');
        } catch {
          showAlert('Error', 'Failed to delete rule');
        }
      }
    );
  };

  const handleDuplicate = async (rule: TriggerRule, event) => {
    event.stopPropagation();
    try {
      const newRule = await duplicateRule(rule);
      if (newRule) {
        showAlert('Success', 'Rule duplicated successfully');
      }
    } catch {
      showAlert('Error', 'Failed to duplicate rule');
    }
  };

  const renderHeader = () => (
    <View>
      {/* Stats Cards */}
      <LinearGradient
        colors={[ACCENT, '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.statsHeader}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.activeRules ?? 0}</Text>
              <Text style={styles.statLabel}>Active Rules</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.triggersLast30Days ?? 0}</Text>
              <Text style={styles.statLabel}>Triggers (30d)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.averageConversionRate?.toFixed(1) ?? '0'}%</Text>
              <Text style={styles.statLabel}>Conversion</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.light.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rules..."
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={showFilters ? ACCENT : Colors.light.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Trigger Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {TYPE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  typeFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => setTypeFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    typeFilter === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  statusFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderRuleCard = ({ item, index }: { item: TriggerRule; index: number }) => {
    const typeConfig = TRIGGER_TYPE_CONFIG[item.type];
    const statusConfig = STATUS_CONFIG[item.status];
    const relativeTime = item.updatedAt
      ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })
      : '';

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <TouchableOpacity
          style={styles.ruleCard}
          onPress={() => handleRulePress(item)}
          activeOpacity={0.7}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: typeConfig.color + '20' }]}>
              <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.ruleName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.ruleType}>{typeConfig.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Description */}
          {item.description && (
            <Text style={styles.ruleDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="flash-outline" size={14} color={Colors.light.textMuted} />
              <Text style={styles.statItemText}>
                {item.executionCount} executions
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.light.textMuted} />
              <Text style={styles.statItemText}>
                {item.analytics?.totalTriggers ?? 0} triggered
              </Text>
            </View>
            {item.lastTriggered && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color={Colors.light.textMuted} />
                <Text style={styles.statItemText}>
                  {formatDistanceToNow(new Date(item.lastTriggered), { addSuffix: true })}
                </Text>
              </View>
            )}
          </View>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => handleToggleStatus(item, e)}
              disabled={togglingId}
            >
              <Ionicons
                name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                size={18}
                color={item.status === 'active' ? Colors.light.warning : Colors.light.success}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: item.status === 'active' ? Colors.light.warning : Colors.light.success },
                ]}
              >
                {item.status === 'active' ? 'Pause' : 'Activate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => handleDuplicate(item, e)}
            >
              <Ionicons name="copy-outline" size={18} color={Colors.light.primary} />
              <Text style={[styles.actionBtnText, { color: Colors.light.primary }]}>Duplicate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => handleDelete(item, e)}
              disabled={deletingId}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.light.error} />
              <Text style={[styles.actionBtnText, { color: Colors.light.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.updateTime}>Updated {relativeTime}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.textMuted} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.emptyStateText}>Loading rules...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="pulse-outline" size={48} color={Colors.light.border} />
        </View>
        <Text style={styles.emptyStateTitle}>No Rules Yet</Text>
        <Text style={styles.emptyStateText}>
          Create your first trigger rule to automatically engage with your customers.
        </Text>
        <TouchableOpacity
          style={styles.emptyStateCTA}
          onPress={() => router.push('/triggers/create')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.emptyStateCTAText}>Create Your First Rule</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!pagination.page || pagination.page >= pagination.pages) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={ACCENT} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        renderItem={renderRuleCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.listContent,
          rules.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[ACCENT]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/triggers/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  listContent: {
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Stats Header
  statsGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  // Filters
  filtersContainer: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Rule Card
  ruleCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  ruleType: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ruleDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'spaceAround',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  updateTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyStateCTAText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
