/**
 * Triggered Events Screen
 *
 * Displays a list of all triggered events across all rules.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { useTriggeredEvents } from './hooks';
import { TriggeredEvent, TriggerType, ActionType } from './types';

const ACCENT = Colors.light.primary;

const TRIGGER_TYPE_CONFIG: Record<TriggerType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  inactivity: { label: 'Inactivity', icon: 'time-outline', color: '#8B5CF6' },
  location: { label: 'Location', icon: 'location-outline', color: '#3B82F6' },
  birthday: { label: 'Birthday', icon: 'gift-outline', color: '#EC4899' },
  first_visit: { label: 'First Visit', icon: 'footsteps-outline', color: '#10B981' },
  loyalty_milestone: { label: 'Loyalty', icon: 'star-outline', color: '#F59E0B' },
  custom: { label: 'Custom', icon: 'settings-outline', color: '#6B7280' },
};

const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  push: { label: 'Push', icon: 'notifications-outline', color: '#3B82F6' },
  sms: { label: 'SMS', icon: 'chatbubbles-outline', color: '#10B981' },
  email: { label: 'Email', icon: 'mail-outline', color: '#8B5CF6' },
  in_app: { label: 'In-App', icon: 'alert-circle-outline', color: '#F59E0B' },
};

type StatusFilter = 'all' | 'success' | 'failed' | 'pending';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'failed', label: 'Failed' },
  { key: 'pending', label: 'Pending' },
];

export default function TriggeredEventsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { events, isLoading, isRefreshing, pagination, refresh, loadMore } = useTriggeredEvents();

  const filteredEvents = statusFilter === 'all'
    ? events
    : events.filter((event) => event.status === statusFilter);

  const renderEventItem = ({ item }: { item: TriggeredEvent }) => {
    const typeConfig = TRIGGER_TYPE_CONFIG[item.ruleType] || TRIGGER_TYPE_CONFIG.custom;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/triggers/${item.ruleId}`)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.eventHeader}>
          <View style={[styles.ruleIcon, { backgroundColor: typeConfig.color + '20' }]}>
            <Ionicons name={typeConfig.icon} size={18} color={typeConfig.color} />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventRuleName} numberOfLines={1}>
              {item.ruleName}
            </Text>
            <Text style={styles.eventTime}>
              {formatDistanceToNow(new Date(item.triggeredAt), { addSuffix: true })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'success'
                    ? Colors.light.successLight
                    : item.status === 'failed'
                      ? Colors.light.errorLight
                      : Colors.light.warningLight,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === 'success'
                      ? Colors.light.success
                      : item.status === 'failed'
                        ? Colors.light.error
                        : Colors.light.warning,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={14} color={Colors.light.textMuted} />
            <Text style={styles.customerText}>
              {item.customerName || 'Unknown Customer'}
            </Text>
          </View>
          {item.customerPhone && (
            <View style={styles.customerInfo}>
              <Ionicons name="call-outline" size={14} color={Colors.light.textMuted} />
              <Text style={styles.customerText}>{item.customerPhone}</Text>
            </View>
          )}
        </View>

        {/* Actions Executed */}
        <View style={styles.actionsRow}>
          {item.actionsExecuted.map((actionType, idx) => {
            const config = ACTION_TYPE_CONFIG[actionType];
            return (
              <View key={idx} style={[styles.actionBadge, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon} size={12} color={config.color} />
                <Text style={[styles.actionText, { color: config.color }]}>{config.label}</Text>
              </View>
            );
          })}
          {item.executionDuration && (
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={12} color={Colors.light.textMuted} />
              <Text style={styles.durationText}>{item.executionDuration}ms</Text>
            </View>
          )}
        </View>

        {/* Error Message */}
        {item.errorMessage && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={Colors.light.error} />
            <Text style={styles.errorText}>{item.errorMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.emptyStateText}>Loading events...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="pulse-outline" size={48} color={Colors.light.border} />
        </View>
        <Text style={styles.emptyStateTitle}>No Events Yet</Text>
        <Text style={styles.emptyStateText}>
          Triggered events will appear here when customers match your rule conditions.
        </Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Triggered Events</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
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
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pagination.total}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {events.filter((e) => e.status === 'success').length}
          </Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {events.filter((e) => e.status === 'failed').length}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredEvents.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[ACCENT]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
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
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: ACCENT,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.light.border,
  },

  // List
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Event Card
  eventCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 10,
  },
  eventRuleName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Customer Row
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },

  // Error Row
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.error,
    lineHeight: 18,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
