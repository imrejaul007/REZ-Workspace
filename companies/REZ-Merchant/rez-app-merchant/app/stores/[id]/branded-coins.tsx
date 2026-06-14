import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/contexts/StoreContext';
import {
  brandedCoinService,
  BrandedCoinAnalytics,
  BrandedCoinCustomer,
} from '@/services/api/brandedCoins';
import { logger } from '@/utils/logger';

export default function BrandedCoinsScreen() {
  const router = useRouter();
  const { id: storeId } = useLocalSearchParams<{ id: string }>();
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  // Data state
  const [analytics, setAnalytics] = useState<BrandedCoinAnalytics | null>(null);
  const [customers, setCustomers] = useState<BrandedCoinCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Award Modal state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardUserId, setAwardUserId] = useState('');
  const [awardAmount, setAwardAmount] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, customersRes] = await Promise.all([
        brandedCoinService.getAnalytics(storeId!),
        brandedCoinService.getCustomers(storeId!, 1, 20),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }

      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data.customers || []);
        setPage(1);
        setHasMore(customersRes.data.pagination?.hasNext || false);
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading branded coins data:', err);
      setError(err.message || 'Failed to load branded coin data');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreCustomers = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await brandedCoinService.getCustomers(storeId!, nextPage, 20);
      if (response.success && response.data) {
        setCustomers((prev) => [...prev, ...(response.data.customers || [])]);
        setPage(nextPage);
        setHasMore(response.data.pagination?.hasNext || false);
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading more customers:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [storeId]);

  const handleAward = async () => {
    if (!awardUserId.trim()) {
      showAlert('Validation Error', 'Please enter a customer ID');
      return;
    }
    const amount = parseFloat(awardAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive amount');
      return;
    }

    setAwarding(true);
    try {
      const response = await brandedCoinService.awardCoins(
        storeId!,
        awardUserId.trim(),
        amount,
        awardReason.trim() || undefined
      );

      if (response.success) {
        showAlert('Success', response.message || `${amount} branded coins awarded successfully`);
        setShowAwardModal(false);
        setAwardUserId('');
        setAwardAmount('');
        setAwardReason('');
        loadData();
      } else {
        showAlert('Error', response.message || 'Failed to award coins');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Failed to award coins');
    } finally {
      setAwarding(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCustomer = ({ item }: { item: BrandedCoinCustomer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerAvatar}>
        <Ionicons name="person-circle" size={40} color="#3B82F6" />
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.userName?.trim() || 'Unknown User'}</Text>
        {item.phoneNumber ? (
          <Text style={styles.customerPhone}>{item.phoneNumber}</Text>
        ) : (
          <Text style={styles.customerPhone}>ID: {item.userId}</Text>
        )}
        <Text style={styles.customerDate}>
          Earned: {formatDate(item.earnedDate)}
          {item.lastUsed ? ` | Last used: ${formatDate(item.lastUsed)}` : ''}
        </Text>
      </View>
      <View style={styles.customerBalance}>
        <Text style={styles.customerBalanceAmount}>{item.amount}</Text>
        <Text style={styles.customerBalanceLabel}>coins</Text>
      </View>
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Branded Coins</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading branded coin data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Branded Coins</Text>
        <TouchableOpacity onPress={() => setShowAwardModal(true)}>
          <Ionicons name="gift-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Store Info */}
      {store && (
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeSubtext}>Manage branded coin campaigns for your store</Text>
        </View>
      )}

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item, index) => `${item.userId}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMoreCustomers}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View>
            {/* Error Banner */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Analytics Cards */}
            {analytics && (
              <View style={styles.analyticsGrid}>
                <View style={[styles.analyticsCard, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="flash" size={24} color="#3B82F6" />
                  <Text style={styles.analyticsValue}>{analytics.totalInCirculation}</Text>
                  <Text style={styles.analyticsLabel}>In Circulation</Text>
                </View>
                <View style={[styles.analyticsCard, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="arrow-up-circle" size={24} color="#10B981" />
                  <Text style={styles.analyticsValue}>{analytics.totalAwarded}</Text>
                  <Text style={styles.analyticsLabel}>Total Awarded</Text>
                </View>
                <View style={[styles.analyticsCard, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="arrow-down-circle" size={24} color="#EF4444" />
                  <Text style={styles.analyticsValue}>{analytics.totalRedeemed}</Text>
                  <Text style={styles.analyticsLabel}>Total Redeemed</Text>
                </View>
                <View style={[styles.analyticsCard, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="people" size={24} color="#8B5CF6" />
                  <Text style={styles.analyticsValue}>{analytics.uniqueCustomers}</Text>
                  <Text style={styles.analyticsLabel}>Unique Customers</Text>
                </View>
              </View>
            )}

            {/* Award Button */}
            <TouchableOpacity style={styles.awardButton} onPress={() => setShowAwardModal(true)}>
              <Ionicons name="gift" size={20} color="#FFFFFF" />
              <Text style={styles.awardButtonText}>Award Branded Coins</Text>
            </TouchableOpacity>

            {/* Section Header */}
            <Text style={styles.sectionTitle}>
              Customers with Branded Coins
              {analytics ? ` (${analytics.uniqueCustomers})` : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Branded Coins Yet</Text>
              <Text style={styles.emptyText}>
                Award branded coins to your customers to build loyalty and encourage repeat visits.
              </Text>
              <TouchableOpacity style={styles.createButton} onPress={() => setShowAwardModal(true)}>
                <Ionicons name="gift" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Award Your First Coins</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      {/* Award Modal */}
      <Modal visible={showAwardModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAwardModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Award Branded Coins</Text>
            <TouchableOpacity onPress={handleAward} disabled={awarding}>
              {awarding ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.modalSave}>Award</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.awardInfo}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.awardInfoText}>
                Award branded coins to a customer. These coins can only be used at your store and
                help drive repeat visits.
              </Text>
            </View>

            {/* Customer ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Customer ID / Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={awardUserId}
                onChangeText={setAwardUserId}
                placeholder="Enter customer user ID"
                autoCapitalize="none"
              />
              <Text style={styles.formHint}>Enter the customer's user ID from the system.</Text>
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount (coins)</Text>
              <TextInput
                style={styles.formInput}
                value={awardAmount}
                onChangeText={setAwardAmount}
                keyboardType="decimal-pad"
                placeholder="e.g., 50"
              />
            </View>

            {/* Reason */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason (optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={awardReason}
                onChangeText={setAwardReason}
                placeholder="e.g., Loyalty reward, Special occasion"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Preview */}
            {awardAmount && !isNaN(parseFloat(awardAmount)) && (
              <View style={styles.awardPreview}>
                <Ionicons name="gift" size={24} color="#10B981" />
                <View style={styles.awardPreviewContent}>
                  <Text style={styles.awardPreviewTitle}>
                    {parseFloat(awardAmount)} Branded Coins
                  </Text>
                  <Text style={styles.awardPreviewSubtext}>
                    Will be added to {store?.name || 'your store'}'s branded coin balance for this
                    customer
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  storeInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  analyticsCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  awardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  awardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  customerDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  customerBalance: {
    alignItems: 'center',
    paddingLeft: 12,
  },
  customerBalanceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  customerBalanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  awardInfo: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    alignItems: 'flex-start',
  },
  awardInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  formTextArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  formHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  awardPreview: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  awardPreviewContent: {
    flex: 1,
  },
  awardPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  awardPreviewSubtext: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
});
