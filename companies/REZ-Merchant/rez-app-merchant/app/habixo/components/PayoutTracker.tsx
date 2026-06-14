// Habixo Payout Tracker Component
// Display and track payout status for merchant app
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

// Types
export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: string;
  completedDate?: string;
  method: 'bank_transfer' | 'upi' | 'wallet';
  methodDetails: string;
  bookingsIncluded: string[];
  failureReason?: string;
}

export interface PayoutTrackerProps {
  payouts: Payout[];
  pendingPayout: number;
  nextPayoutDate: string;
  onPayoutDetails?: (payoutId: string) => void;
  onManagePayout?: () => void;
}

// Status configurations
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: '⏳',
  },
  processing: {
    label: 'Processing',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: '🔄',
  },
  completed: {
    label: 'Completed',
    color: '#10b981',
    bgColor: '#dcfce7',
    icon: '✅',
  },
  failed: {
    label: 'Failed',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: '❌',
  },
};

const METHOD_CONFIG = {
  bank_transfer: { label: 'Bank Transfer', icon: '🏦' },
  upi: { label: 'UPI', icon: '📱' },
  wallet: { label: 'Wallet', icon: '💳' },
};

export function PayoutTracker({
  payouts,
  pendingPayout,
  nextPayoutDate,
  onPayoutDetails,
  onManagePayout,
}: PayoutTrackerProps) {
  // Get recent payouts (last 5)
  const recentPayouts = payouts.slice(0, 5);

  // Calculate stats
  const completedPayouts = payouts.filter((p) => p.status === 'completed');
  const totalEarnings = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const failedPayouts = payouts.filter((p) => p.status === 'failed');

  return (
    <View style={styles.container}>
      {/* Pending Payout Card */}
      <View style={styles.pendingCard}>
        <View style={styles.pendingHeader}>
          <Text style={styles.pendingLabel}>Next Payout</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Scheduled</Text>
          </View>
        </View>

        <Text style={styles.pendingAmount}>₹{pendingPayout.toLocaleString()}</Text>

        <View style={styles.pendingDetails}>
          <Text style={styles.pendingDateText}>
            Expected on {nextPayoutDate}
          </Text>
          <Text style={styles.pendingBookingsText}>
            From {payouts[0]?.bookingsIncluded.length || 0} bookings
          </Text>
        </View>

        <TouchableOpacity
          style={styles.manageButton}
          onPress={onManagePayout}
        >
          <Text style={styles.manageButtonText}>Manage Payout Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{(totalEarnings / 1000).toFixed(0)}K</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedPayouts.length}</Text>
          <Text style={styles.statLabel}>Payouts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, failedPayouts.length > 0 && styles.statValueWarning]}>
            {failedPayouts.length}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Recent Payouts */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Payouts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentPayouts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentPayouts.map((payout) => (
              <PayoutCard
                key={payout.id}
                payout={payout}
                onPress={() => onPayoutDetails?.(payout.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No payouts yet</Text>
          </View>
        )}
      </View>

      {/* Payout Methods */}
      <View style={styles.methodsSection}>
        <Text style={styles.sectionTitle}>Payout Methods</Text>
        <View style={styles.methodsList}>
          <TouchableOpacity style={styles.methodItem}>
            <View style={styles.methodIcon}>
              <Text>🏦</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Bank Account</Text>
              <Text style={styles.methodDetails}>HDFC Bank ****4521</Text>
            </View>
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeText}>Primary</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.methodItem}>
            <View style={styles.methodIcon}>
              <Text>📱</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>UPI</Text>
              <Text style={styles.methodDetails}>host@upi</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.methodItem, styles.addMethodItem]}>
            <View style={styles.addMethodIcon}>
              <Text style={styles.addMethodText}>+</Text>
            </View>
            <Text style={styles.addMethodLabel}>Add Payout Method</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Individual payout card
function PayoutCard({ payout, onPress }: { payout: Payout; onPress?: () => void }) {
  const statusConfig = STATUS_CONFIG[payout.status];
  const methodConfig = METHOD_CONFIG[payout.method];

  return (
    <TouchableOpacity style={styles.payoutCard} onPress={onPress}>
      <View style={[styles.payoutStatus, { backgroundColor: statusConfig.bgColor }]}>
        <Text style={styles.payoutStatusIcon}>{statusConfig.icon}</Text>
        <Text style={[styles.payoutStatusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>

      <Text style={styles.payoutAmount}>₹{payout.amount.toLocaleString()}</Text>

      <Text style={styles.payoutDate}>
        {payout.status === 'completed' && payout.completedDate
          ? payout.completedDate
          : payout.scheduledDate}
      </Text>

      <View style={styles.payoutMethod}>
        <Text style={styles.payoutMethodIcon}>{methodConfig.icon}</Text>
        <Text style={styles.payoutMethodText}>{methodConfig.label}</Text>
      </View>

      {payout.failureReason && (
        <Text style={styles.failureReason} numberOfLines={2}>
          {payout.failureReason}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Timeline view for single payout
export function PayoutTimeline({ payout }: { payout: Payout }) {
  const timeline = [
    {
      label: 'Payout Initiated',
      date: payout.scheduledDate,
      status: 'completed',
      icon: '📋',
    },
    {
      label: 'Processing',
      date: 'Usually 1-3 business days',
      status: payout.status === 'pending' ? 'pending' : 'completed',
      icon: '🔄',
    },
    {
      label: 'Bank Processing',
      date: 'Dependent on bank',
      status: payout.status === 'processing' ? 'completed' : 'pending',
      icon: '🏦',
    },
    {
      label: payout.status === 'completed' ? 'Funds Credited' : 'Estimated Credit',
      date: payout.status === 'completed' ? payout.completedDate : payout.scheduledDate,
      status: payout.status === 'completed' ? 'completed' : 'pending',
      icon: payout.status === 'completed' ? '✅' : '⏳',
    },
  ];

  return (
    <View style={styles.timeline}>
      {timeline.map((item, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View
              style={[
                styles.timelineDot,
                item.status === 'completed' && styles.timelineDotCompleted,
                item.status === 'pending' && styles.timelineDotPending,
              ]}
            >
              <Text style={styles.timelineDotIcon}>{item.icon}</Text>
            </View>
            {index < timeline.length - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  item.status === 'completed' && styles.timelineLineCompleted,
                ]}
              />
            )}
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>{item.label}</Text>
            <Text style={styles.timelineDate}>{item.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pendingCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  pendingBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  pendingAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  pendingDetails: {
    marginBottom: 16,
  },
  pendingDateText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  pendingBookingsText: {
    fontSize: 13,
    color: '#6b7280',
  },
  manageButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statValueWarning: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 16,
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
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  payoutCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  payoutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  payoutStatusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  payoutStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  payoutMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutMethodIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  payoutMethodText: {
    fontSize: 12,
    color: '#6b7280',
  },
  failureReason: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#f9fafb',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  methodsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
  },
  methodsList: {
    marginTop: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  methodDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  methodBadge: {
    backgroundColor: '#6366f1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  addMethodItem: {
    borderBottomWidth: 0,
    paddingVertical: 16,
  },
  addMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
  },
  addMethodText: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  addMethodLabel: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  // Timeline styles
  timeline: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
  },
  timelineDotPending: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  timelineDotIcon: {
    fontSize: 14,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#10b981',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default PayoutTracker;
