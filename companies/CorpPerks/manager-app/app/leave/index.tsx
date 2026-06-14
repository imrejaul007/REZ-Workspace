// ==========================================
// CorpPerks Manager App - Leave Overview Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Avatar, Badge, StatCard } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
} from '../src/utils/theme';
import { LeaveRequest } from '../src/types';

export default function LeaveOverviewScreen() {
  const navigation = useNavigation<any>();
  const { leaveRequests, setLeaveRequests, pendingLeaveCount } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const loadData = async () => {
    try {
      const response = await api.getLeaveRequests();
      if (response.success && response.data) {
        setLeaveRequests(response.data);
      }
    } catch (error) {
      logger.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredRequests = leaveRequests.filter((r) => {
    if (selectedTab === 'pending') return r.status === 'pending';
    if (selectedTab === 'approved') return r.status === 'approved';
    if (selectedTab === 'rejected') return r.status === 'rejected';
    return true;
  });

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'rejected').length;

  const TabButton = ({ label, value, count }: { label: string; value: typeof selectedTab; count: number }) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === value && styles.tabButtonActive]}
      onPress={() => setSelectedTab(value)}
    >
      <Text style={[styles.tabButtonText, selectedTab === value && styles.tabButtonTextActive]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[styles.tabBadge, selectedTab === value && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, selectedTab === value && styles.tabBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Pending"
            value={pendingCount}
            color={Colors.warning}
            style={styles.statCard}
          />
          <StatCard
            title="Approved"
            value={approvedCount}
            color={Colors.success}
            style={styles.statCard}
          />
          <StatCard
            title="Rejected"
            value={rejectedCount}
            color={Colors.error}
            style={styles.statCard}
          />
        </View>

        {/* Quick Action */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('LeaveApprovals')}
          >
            <View style={styles.pendingContent}>
              <Text style={styles.pendingIcon}>notifications</Text>
              <View>
                <Text style={styles.pendingTitle}>
                  {pendingCount} Pending Leave Request{pendingCount > 1 ? 's' : ''}
                </Text>
                <Text style={styles.pendingSubtitle}>Tap to review and approve</Text>
              </View>
            </View>
            <Text style={styles.pendingArrow}>{'>'}</Text>
          </TouchableOpacity>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TabButton label="Pending" value="pending" count={pendingCount} />
          <TabButton label="Approved" value="approved" count={approvedCount} />
          <TabButton label="Rejected" value="rejected" count={rejectedCount} />
        </View>

        {/* Leave Requests List */}
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <Avatar
                  uri={request.employeeAvatar}
                  name={request.employeeName}
                  size="md"
                />
                <View style={styles.headerInfo}>
                  <Text style={styles.employeeName}>{request.employeeName}</Text>
                  <Text style={styles.appliedDate}>
                    Applied {formatDate(request.appliedOn, 'relative')}
                  </Text>
                </View>
                <Badge
                  label={request.type}
                  variant="leaveType"
                  size="sm"
                />
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Duration:</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </Text>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Days:</Text>
                  <Text style={styles.daysValue}>{request.days} day{request.days > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{request.reason}</Text>
              </View>

              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Balance at time:</Text>
                <View style={styles.balanceGrid}>
                  <Text style={styles.balanceItem}>Sick: {request.leaveBalanceAtTime.sick}</Text>
                  <Text style={styles.balanceItem}>Casual: {request.leaveBalanceAtTime.casual}</Text>
                  <Text style={styles.balanceItem}>Earned: {request.leaveBalanceAtTime.earned}</Text>
                </View>
              </View>

              {request.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => navigation.navigate('LeaveApprovals')}
                  >
                    <Text style={styles.approveButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              )}

              {request.status === 'approved' && request.reviewedByName && (
                <View style={styles.reviewInfo}>
                  <Badge label="Approved" variant="success" size="sm" />
                  <Text style={styles.reviewText}>
                    by {request.reviewedByName} on {formatDate(request.reviewedOn || '')}
                  </Text>
                </View>
              )}

              {request.status === 'rejected' && (
                <View style={styles.reviewInfo}>
                  <Badge label="Rejected" variant="error" size="sm" />
                  {request.reviewComment && (
                    <Text style={styles.reviewComment}>
                      "{request.reviewComment}"
                    </Text>
                  )}
                </View>
              )}
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {selectedTab === 'pending' ? 'check_circle' : selectedTab === 'approved' ? 'event_available' : 'event_busy'}
            </Text>
            <Text style={styles.emptyTitle}>
              {selectedTab === 'pending'
                ? 'No Pending Requests'
                : selectedTab === 'approved'
                ? 'No Approved Leaves'
                : 'No Rejected Leaves'}
            </Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'pending'
                ? 'All leave requests have been processed'
                : 'No leave requests match this filter'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  pendingTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pendingSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingArrow: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.textInverse,
  },
  tabBadge: {
    marginLeft: Spacing.xs,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: Colors.textInverse + '30',
  },
  tabBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  tabBadgeTextActive: {
    color: Colors.primary,
  },
  requestCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  employeeName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  appliedDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  requestDetails: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  daysValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  reasonContainer: {
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  reasonText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  balanceInfo: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  balanceItem: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  approveButtonText: {
    color: Colors.textInverse,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  reviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reviewText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  reviewComment: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
