/**
 * Customer Detail Page - REZ Merchant CRM
 *
 * Full customer profile with:
 * - Customer info and stats
 * - Lifetime value visualization
 * - Order history
 * - Notes management
 * - Segmentation
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import {
  customerService,
  Customer,
  CustomerNote,
  CustomerOrder,
  CustomerLifetimeValue,
  SEGMENT_CONFIG,
  LTV_TIER_CONFIG,
  CustomerSegment,
} from '@/services/customerService';
import { Colors } from '@/constants/Colors';

type TabType = 'overview' | 'orders' | 'notes';

export default function CustomerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);

  // Fetch customer details
  const {
    data: customer,
    isLoading: customerLoading,
    error: customerError,
    refetch: refetchCustomer,
  } = useQuery<Customer, Error>({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });

  // Fetch customer orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery<{
    orders: CustomerOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }, Error>({
    queryKey: ['customer-orders', id],
    queryFn: () => customerService.getCustomerOrders(id!, { limit: 50 }),
    enabled: !!id,
  });

  // Fetch customer notes
  const {
    data: notes,
    isLoading: notesLoading,
    refetch: refetchNotes,
  } = useQuery<CustomerNote[], Error>({
    queryKey: ['customer-notes', id],
    queryFn: () => customerService.getCustomerNotes(id!),
    enabled: !!id,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      customerService.addCustomerNote(id!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', id] });
      setShowAddNote(false);
      setNewNoteContent('');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to add note');
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      customerService.updateCustomerNote(id!, noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', id] });
      setEditingNote(null);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update note');
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      customerService.deleteCustomerNote(id!, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', id] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete note');
    },
  });

  // Update segment mutation
  const updateSegmentMutation = useMutation({
    mutationFn: (segment: CustomerSegment) =>
      customerService.updateCustomerSegment(id!, segment, 'manual'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update segment');
    },
  });

  // Calculate CLV
  const clv = useMemo(() => {
    if (!customer) return null;
    return customerService.calculateCLV(customer);
  }, [customer]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Handle delete note
  const handleDeleteNote = useCallback(
    (note: CustomerNote) => {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNoteMutation.mutate(note._id || note.id),
        },
      ]);
    },
    [deleteNoteMutation]
  );

  // Render CLV Card
  const renderCLVCard = useCallback(() => {
    if (!clv) return null;
    const tierConfig = LTV_TIER_CONFIG[clv.tier];

    return (
      <View style={styles.clvCard}>
        <View style={styles.clvHeader}>
          <Text style={styles.clvTitle}>Lifetime Value</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierConfig.bgColor }]}>
            <Text style={[styles.tierBadgeText, { color: tierConfig.color }]}>
              {tierConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.clvScoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{clv.score}</Text>
            <Text style={styles.scoreLabel}>LTV Score</Text>
          </View>
        </View>

        <View style={styles.clvMetrics}>
          <View style={styles.clvMetric}>
            <Text style={styles.clvMetricLabel}>Current Value</Text>
            <Text style={styles.clvMetricValue}>
              {formatCurrency(clv.currentValue)}
            </Text>
          </View>
          <View style={styles.clvMetricDivider} />
          <View style={styles.clvMetric}>
            <Text style={styles.clvMetricLabel}>Predicted (12mo)</Text>
            <Text style={styles.clvMetricValue}>
              {formatCurrency(clv.predictedValue)}
            </Text>
          </View>
          <View style={styles.clvMetricDivider} />
          <View style={styles.clvMetric}>
            <Text style={styles.clvMetricLabel}>Potential</Text>
            <Text style={[styles.clvMetricValue, styles.potentialValue]}>
              {formatCurrency(clv.potentialValue)}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [clv, formatCurrency]);

  // Render Segment Selector
  const renderSegmentSelector = useCallback(() => {
    if (!customer) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segment</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentSelector}
        >
          {Object.entries(SEGMENT_CONFIG).map(([key, config]) => {
            const segment = key as CustomerSegment;
            const isSelected = customer.segment === segment;
            return (
              <TouchableOpacity
                key={segment}
                style={[
                  styles.segmentOption,
                  { borderColor: config.color },
                  isSelected && { backgroundColor: config.bgColor },
                ]}
                onPress={() => updateSegmentMutation.mutate(segment)}
                disabled={updateSegmentMutation.isPending}
              >
                <Text
                  style={[
                    styles.segmentOptionText,
                    { color: config.color },
                    isSelected && styles.segmentOptionTextSelected,
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [customer, updateSegmentMutation]);

  // Render Overview Tab
  const renderOverviewTab = useCallback(() => {
    if (!customer) return null;

    const segmentConfig = customer.segment
      ? SEGMENT_CONFIG[customer.segment]
      : SEGMENT_CONFIG.new;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tabContentContainer}
      >
        {/* Customer Header */}
        <View style={styles.customerHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <View style={[styles.segmentBadge, { backgroundColor: segmentConfig.bgColor }]}>
            <Text style={[styles.segmentBadgeText, { color: segmentConfig.color }]}>
              {segmentConfig.label}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {customer.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={Colors.gray[500]} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
            )}
            {customer.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={Colors.gray[500]} />
                <Text style={styles.infoText}>{customer.email}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.gray[500]} />
              <Text style={styles.infoText}>
                Customer since {format(new Date(customer.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>
                {formatCurrency(customer.totalSpent || clv?.currentValue || 0)}
              </Text>
              <Text style={styles.statCardLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{customer.totalOrders || 0}</Text>
              <Text style={styles.statCardLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>
                {formatCurrency(
                  customer.averageOrderValue ||
                    (customer.totalOrders
                      ? (customer.totalSpent || 0) / customer.totalOrders
                      : 0)
                )}
              </Text>
              <Text style={styles.statCardLabel}>Avg. Order</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{customer.visitCount || 0}</Text>
              <Text style={styles.statCardLabel}>Visits</Text>
            </View>
          </View>
        </View>

        {/* CLV Card */}
        {renderCLVCard()}

        {/* Segment Selector */}
        {renderSegmentSelector()}

        {/* Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {customer.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Addresses */}
        {customer.addresses && customer.addresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Addresses</Text>
            {customer.addresses.map((address, index) => (
              <View key={index} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Ionicons
                    name={address.isDefault ? 'star' : 'location-outline'}
                    size={18}
                    color={address.isDefault ? Colors.warning[500] : Colors.gray[500]}
                  />
                  <Text style={styles.addressLabel}>
                    {address.label || `Address ${index + 1}`}
                    {address.isDefault && ' (Default)'}
                  </Text>
                </View>
                <Text style={styles.addressText}>
                  {[address.addressLine1, address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }, [customer, clv, renderCLVCard, renderSegmentSelector, formatCurrency]);

  // Render Orders Tab
  const renderOrdersTab = useCallback(() => {
    if (ordersLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      );
    }

    if (!ordersData?.orders || ordersData.orders.length === 0) {
      return (
        <View style={styles.emptyTabContainer}>
          <Ionicons name="receipt-outline" size={48} color={Colors.gray[300]} />
          <Text style={styles.emptyTabTitle}>No Orders</Text>
          <Text style={styles.emptyTabSubtitle}>
            This customer hasn't placed unknown orders yet
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={ordersData.orders}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.ordersList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>
                #{item.orderNumber || item.orderId}
              </Text>
              <Text style={styles.orderDate}>
                {format(new Date(item.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.orderItems}>
              {item.items.slice(0, 3).map((orderItem, index) => (
                <Text key={index} style={styles.orderItemText} numberOfLines={1}>
                  {orderItem.quantity}x {orderItem.productName || orderItem.name}
                </Text>
              ))}
              {item.items.length > 3 && (
                <Text style={styles.moreItemsText}>
                  +{item.items.length - 3} more items
                </Text>
              )}
            </View>
            <View style={styles.orderFooter}>
              <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.orderStatusText}>{item.status}</Text>
              </View>
              <Text style={styles.orderTotal}>
                {formatCurrency(item.totalAmount)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  }, [ordersLoading, ordersData, formatCurrency]);

  // Render Notes Tab
  const renderNotesTab = useCallback(() => {
    return (
      <View style={styles.notesTabContainer}>
        <TouchableOpacity
          style={styles.addNoteButton}
          onPress={() => setShowAddNote(true)}
        >
          <Ionicons name="add" size={20} color={Colors.primary[500]} />
          <Text style={styles.addNoteButtonText}>Add Note</Text>
        </TouchableOpacity>

        {notesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : !notes || notes.length === 0 ? (
          <View style={styles.emptyTabContainer}>
            <Ionicons name="document-text-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTabTitle}>No Notes</Text>
            <Text style={styles.emptyTabSubtitle}>
              Add notes to track customer interactions
            </Text>
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={styles.notesList}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteContent}>{item.content}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteNote(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.error[500]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.noteFooter}>
                  <Text style={styles.noteMeta}>
                    {item.createdByName || 'Staff'} -{' '}
                    {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.noteTags}>
                    {item.tags.map((tag, index) => (
                      <View key={index} style={styles.noteTag}>
                        <Text style={styles.noteTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    );
  }, [notes, notesLoading, handleDeleteNote]);

  // Helper to get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      placed: '#FEF3C7',
      confirmed: '#EFF6FF',
      preparing: '#F5F3FF',
      ready: '#F0FDF4',
      dispatched: '#FFF7ED',
      delivered: '#F3F4F6',
      cancelled: '#FEF2F2',
    };
    return statusColors[status] || Colors.gray[100];
  };

  // Loading state
  if (customerLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading customer...</Text>
      </View>
    );
  }

  // Error state
  if (customerError || !customer) {
    return (
      <View style={[styles.container, styles.emptyTabContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.emptyTabTitle}>Error Loading Customer</Text>
        <Text style={styles.emptyTabSubtitle}>
          {customerError?.message || 'Customer not found'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetchCustomer()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {customer.name}
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/customers/${id}/edit`)}
        >
          <Ionicons name="create-outline" size={22} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.tabTextActive,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'orders' && styles.tabTextActive,
            ]}
          >
            Orders ({ordersData?.total || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'notes' && styles.tabTextActive,
            ]}
          >
            Notes ({notes?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'notes' && renderNotesTab()}

      {/* Add Note Modal */}
      <Modal
        visible={showAddNote}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddNote(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top || 20 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddNote(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity
              onPress={() => addNoteMutation.mutate(newNoteContent)}
              disabled={!newNoteContent.trim() || addNoteMutation.isPending}
            >
              <Text
                style={[
                  styles.modalSave,
                  !newNoteContent.trim() && styles.modalSaveDisabled,
                ]}
              >
                {addNoteMutation.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Enter your note..."
            placeholderTextColor={Colors.gray[400]}
            value={newNoteContent}
            onChangeText={setNewNoteContent}
            multiline
            autoFocus
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary[500],
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    paddingBottom: 32,
  },
  emptyTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyTabSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  customerHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.white,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 12,
  },
  segmentBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  segmentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  clvCard: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  clvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clvTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clvScoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary[50],
    borderWidth: 4,
    borderColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.gray[500],
  },
  clvMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clvMetric: {
    flex: 1,
    alignItems: 'center',
  },
  clvMetricDivider: {
    width: 1,
    backgroundColor: Colors.border.default,
  },
  clvMetricLabel: {
    fontSize: 10,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  clvMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  potentialValue: {
    color: Colors.primary[600],
  },
  segmentSelector: {
    gap: 8,
    paddingRight: 16,
  },
  segmentOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  segmentOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentOptionTextSelected: {
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: Colors.gray[700],
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addressText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginLeft: 26,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  orderItems: {
    marginBottom: 8,
  },
  orderItemText: {
    fontSize: 13,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: Colors.gray[400],
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[700],
    textTransform: 'capitalize',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  notesTabContainer: {
    flex: 1,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
  },
  addNoteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteContent: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  noteFooter: {
    marginTop: 12,
  },
  noteMeta: {
    fontSize: 12,
    color: Colors.gray[400],
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  noteTag: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteTagText: {
    fontSize: 11,
    color: Colors.gray[600],
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  modalSaveDisabled: {
    color: Colors.gray[300],
  },
  noteInput: {
    flex: 1,
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.text.primary,
    textAlignVertical: 'top',
  },
});
