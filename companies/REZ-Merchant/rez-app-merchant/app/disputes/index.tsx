/**
 * Dispute Management Screen
 * View, filter, and respond to customer disputes
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { disputesApi } from '@/services/api/disputes';
import { Colors } from '@/constants/Colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DisputeType = 'refund' | 'complaint' | 'missing_coins';
// Includes all backend Dispute.status enum values so no dispute is silently hidden.
type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'escalated'
  | 'resolved'
  | 'rejected'
  | 'resolved_refund'
  | 'resolved_reject'
  | 'auto_resolved'
  | 'closed';
type FilterKey = 'all' | 'open' | 'under_review' | 'resolved' | 'rejected';

interface DisputeItem {
  _id: string;
  userId?: string;
  userName?: string;
  storeId?: string;
  type: DisputeType;
  description: string;
  status: DisputeStatus;
  createdAt: string;
  amount?: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#D97706', bg: '#FEF3C7' },
  under_review: { label: 'Under Review', color: '#2563EB', bg: '#DBEAFE' },
  escalated: { label: 'Escalated', color: '#9333EA', bg: '#F3E8FF' },
  resolved: { label: 'Resolved', color: '#16A34A', bg: '#DCFCE7' },
  resolved_refund: { label: 'Refunded', color: '#16A34A', bg: '#DCFCE7' },
  resolved_reject: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
  auto_resolved: { label: 'Auto-Resolved', color: '#0891B2', bg: '#CFFAFE' },
  closed: { label: 'Closed', color: '#6B7280', bg: '#F3F4F6' },
};

const TYPE_CONFIG: Record<DisputeType, { label: string; color: string; bg: string }> = {
  refund: { label: 'Refund', color: '#2563EB', bg: '#DBEAFE' },
  complaint: { label: 'Complaint', color: '#7C3AED', bg: '#EDE9FE' },
  missing_coins: { label: 'Missing Coins', color: '#D97706', bg: '#FEF3C7' },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'rejected', label: 'Rejected' },
];

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchDisputes(filter: FilterKey): Promise<DisputeItem[]> {
  const params: { page: number; limit: number; status?: string } = { page: 1, limit: 20 };
  if (filter !== 'all') params.status = filter;
  const res = await disputesApi.getAll(params);
  // Backend returns { success: true, data: { disputes: [...], pagination: {...} } }
  // Handle multiple possible response shapes for resilience.
  const raw = (res as unknown as { data?: { disputes?: unknown[] } })?.data?.disputes ?? (res as unknown as { disputes?: unknown[] })?.disputes ?? (res as unknown as { data?: unknown[] })?.data ?? res;
  return (Array.isArray(raw) ? raw : []) as DisputeItem[];
}

async function updateDisputeStatus(
  id: string,
  status: 'resolved' | 'rejected',
  notes: string
): Promise<void> {
  await disputesApi.updateStatus(id, { status, notes });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DisputeStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: DisputeType }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.complaint;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface DisputeCardProps {
  item: DisputeItem;
  expanded: boolean;
  onToggle: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  submitting: boolean;
}

function DisputeCard({
  item,
  expanded,
  onToggle,
  onApprove,
  onReject,
  submitting,
}: DisputeCardProps) {
  const [notes, setNotes] = useState('');

  // Action is only available for open/under_review disputes (not already resolved/closed).
  const canAct = item.status === 'open' || item.status === 'under_review';

  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Type + Amount Row */}
      <View style={styles.cardMeta}>
        <TypeBadge type={item.type} />
        {item.amount != null && (
          <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
        )}
      </View>

      {/* Description (truncated when collapsed) */}
      <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
        {item.description}
      </Text>

      {/* Expanded: notes + action buttons */}
      {expanded && (
        <View style={styles.expandedSection}>
          {canAct && (
            <>
              <Text style={styles.notesLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a note for this action..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn, submitting && styles.btnDisabled]}
                  onPress={() => onApprove(item._id, notes)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn, submitting && styles.btnDisabled]}
                  onPress={() => onReject(item._id, notes)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
          {!canAct &&
            (() => {
              const isPositive =
                item.status === 'resolved' ||
                item.status === 'resolved_refund' ||
                item.status === 'auto_resolved';
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.closed;
              return (
                <View style={styles.resolvedNote}>
                  <Ionicons
                    name={isPositive ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={cfg.color}
                  />
                  <Text style={[styles.resolvedNoteText, { color: cfg.color }]}>
                    This dispute has been {cfg.label.toLowerCase()}
                  </Text>
                </View>
              );
            })()}
        </View>
      )}

      {/* Expand chevron */}
      <View style={styles.chevronRow}>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DisputesScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: disputes = [],
    isLoading,
    isRefetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['disputes', filter],
    queryFn: () => fetchDisputes(filter),
    staleTime: 2 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: 'resolved' | 'rejected';
      notes: string;
    }) => updateDisputeStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setExpandedId(null);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update dispute status');
    },
  });

  const handleToggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleApprove = useCallback(
    (id: string, notes: string) => {
      Alert.alert('Approve Dispute', 'Mark this dispute as resolved?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setSubmittingId(id);
            mutation.mutate(
              { id, status: 'resolved', notes },
              { onSettled: () => setSubmittingId(null) }
            );
          },
        },
      ]);
    },
    [mutation]
  );

  const handleReject = useCallback(
    (id: string, notes: string) => {
      Alert.alert('Reject Dispute', 'Mark this dispute as rejected?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setSubmittingId(id);
            mutation.mutate(
              { id, status: 'rejected', notes },
              { onSettled: () => setSubmittingId(null) }
            );
          },
        },
      ]);
    },
    [mutation]
  );

  const handleFilterChange = useCallback((key: FilterKey) => {
    setFilter(key);
    setExpandedId(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DisputeItem }) => (
      <DisputeCard
        item={item}
        expanded={expandedId === item._id}
        onToggle={() => handleToggle(item._id)}
        onApprove={handleApprove}
        onReject={handleReject}
        submitting={submittingId === item._id}
      />
    ),
    [expandedId, handleToggle, handleApprove, handleReject, submittingId]
  );

  const EmptyState = renderEmptyState(filter);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Disputes' }} />

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => handleFilterChange(f.key)}
          >
            <Text style={[styles.filterPillText, filter === f.key && styles.filterPillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading disputes...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Failed to load disputes</Text>
          <Text style={styles.emptySubtitle}>
            {(queryError as unknown as { message?: string })?.message || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity
            style={[styles.filterPill, styles.filterPillActive, { marginTop: 12 }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.filterPillText, styles.filterPillTextActive]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={EmptyState}
        />
      )}
    </SafeAreaView>
  );
}

function renderEmptyState(filter: FilterKey) {
  const labels: Record<FilterKey, string> = {
    all: 'No disputes found',
    open: 'No open disputes',
    under_review: 'No disputes under review',
    resolved: 'No resolved disputes',
    rejected: 'No rejected disputes',
  };
  return (
    <View style={styles.emptyState}>
      <Ionicons name="shield-checkmark-outline" size={56} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>{labels[filter]}</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? 'No customer disputes have been raised yet.'
          : `No disputes with ${filter.replace(/_/g, ' ')} status.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },

  // Filter
  filterScroll: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  dateText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  description: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Expanded
  expandedSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    minHeight: 72,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  approveBtn: {
    backgroundColor: '#16A34A',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  resolvedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  resolvedNoteText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Chevron
  chevronRow: {
    alignItems: 'center',
    marginTop: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },

  // Loading
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
