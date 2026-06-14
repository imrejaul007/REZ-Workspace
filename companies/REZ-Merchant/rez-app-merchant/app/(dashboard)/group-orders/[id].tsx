/**
 * Group Order Detail Screen
 *
 * Shows detailed view of a single group order session
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface GroupMember {
  id: string;
  name: string;
  isHost: boolean;
  items: unknown[];
  totalAmount: number;
  joinedAt: string;
}

interface SharedItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  addedBy: string;
  addedByName: string;
  addedAt: string;
}

interface GroupSession {
  id: string;
  code: string;
  storeSlug: string;
  storeName: string;
  hostId: string;
  members: GroupMember[];
  items: SharedItem[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  totalAmount: number;
  tableNumber?: string;
}

const formatINR = (amount: number): string => {
  return `₹${(amount / 100).toFixed(2)}`;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function GroupOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeStore } = useStore();
  const { token } = useAuth();

  const [session, setSession] = useState<GroupSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'members'>('items');

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;

      try {
        const response = await apiClient.get(`/group-orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.session) {
          setSession(response.data.session);
        }
      } catch (error) {
        logger.error('[GroupOrderDetail] Failed to fetch session:', error);
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id, token]);

  // Update session status
  const updateStatus = async (newStatus: 'completed' | 'cancelled') => {
    if (!session) return;

    Alert.alert(
      `${newStatus === 'completed' ? 'Complete' : 'Cancel'} Order`,
      `Are you sure you want to ${newStatus} this group order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await apiClient.patch(
                `/group-orders/${session.id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setSession({ ...session, status: newStatus });
            } catch (error) {
              logger.error('[GroupOrderDetail] Failed to update status:', error);
              Alert.alert('Error', 'Failed to update order status');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = {
    active: Colors.success[500],
    completed: Colors.gray[500],
    cancelled: Colors.error[500],
  };

  const GST_PERCENT = 18;
  const subtotal = session.totalAmount;
  const tax = Math.round(subtotal * (GST_PERCENT / 100));
  const grandTotal = subtotal + tax;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Order #${session.code}`,
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Group Code</Text>
              <Text style={styles.code}>{session.code}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[session.status] }]}>
              <Text style={styles.statusText}>{session.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>{formatTime(session.createdAt)}</Text>
            </View>
            {session.tableNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Table</Text>
                <Text style={styles.detailValue}>{session.tableNumber}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Members</Text>
              <Text style={styles.detailValue}>{session.members.length}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Items</Text>
              <Text style={styles.detailValue}>{session.items.length}</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'items' && styles.tabActive]}
            onPress={() => setActiveTab('items')}
          >
            <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
              Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.tabActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              Members
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on tab */}
        {activeTab === 'items' && (
          <View style={styles.itemsSection}>
            {session.items.length === 0 ? (
              <Text style={styles.emptyText}>No shared items yet</Text>
            ) : (
              session.items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      Added by {item.addedByName} at {formatTime(item.addedAt)}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatINR(item.price * item.quantity)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersSection}>
            {session.members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.isHost && (
                      <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>HOST</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberMeta}>
                    {member.items.length} items | Joined {formatTime(member.joinedAt)}
                  </Text>
                </View>
                <Text style={styles.memberTotal}>{formatINR(member.totalAmount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatINR(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({GST_PERCENT}%)</Text>
            <Text style={styles.summaryValue}>{formatINR(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatINR(grandTotal)}</Text>
          </View>
        </View>

        {/* Actions */}
        {session.status === 'active' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateStatus('completed')}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.actionButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => updateStatus('cancelled')}
            >
              <Ionicons name="close-circle" size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  backButtonLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  codeContainer: {},
  codeLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  code: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  statusDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: 'white',
  },
  itemsSection: {},
  emptyText: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    paddingVertical: Spacing.lg,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  membersSection: {},
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100] ?? Colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  hostBadge: {
    backgroundColor: Colors.warning[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning[700],
  },
  memberMeta: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  memberTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: Colors.success[500],
  },
  cancelButton: {
    backgroundColor: Colors.error[500],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
