import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showAlert, showConfirm } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/contexts/StoreContext';
import { coinDropService, MerchantCoinDrop } from '@/services/api/coinDrops';
import { logger } from '@/utils/logger';

interface CoinDropFormData {
  multiplier: string;
  normalCashback: string;
  category: string;
  startTime: string;
  endTime: string;
  minOrderValue: string;
  maxCashback: string;
  isActive: boolean;
  priority: string;
}

const INITIAL_FORM: CoinDropFormData = {
  multiplier: '2',
  normalCashback: '5',
  category: '',
  startTime: '',
  endTime: '',
  minOrderValue: '',
  maxCashback: '',
  isActive: true,
  priority: '0',
};

const CATEGORY_OPTIONS = [
  'food-dining',
  'beauty-wellness',
  'grocery-essentials',
  'fitness-sports',
  'healthcare',
  'fashion',
  'education-learning',
  'home-services',
  'travel-experiences',
  'entertainment',
  'financial-lifestyle',
  'electronics',
];

export default function CoinDropsScreen() {
  const router = useRouter();
  const { id: storeId } = useLocalSearchParams<{ id: string }>();
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  // Data state
  const [coinDrops, setCoinDrops] = useState<MerchantCoinDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary stats
  const [statsLoading, setStatsLoading] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    activeDrops: 0,
    totalUsage: 0,
    totalCashback: 0,
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CoinDropFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadCoinDrops();
    }
  }, [storeId]);

  const loadCoinDrops = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coinDropService.getStoreCoinDrops(storeId!, 1, 50);
      if (response.success && response.data) {
        const drops = response.data.coinDrops || [];
        setCoinDrops(drops);
        calculateSummary(drops);
      } else {
        setError(response.message || 'Failed to load CoinDrops');
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading CoinDrops:', err);
      setError(err.message || 'Failed to load CoinDrops');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = async (drops: MerchantCoinDrop[]) => {
    const activeDrops = drops.filter(
      (d) => d.status === 'running' || d.status === 'upcoming'
    ).length;
    const totalUsage = drops.reduce((sum, d) => sum + (d.usageCount || 0), 0);

    // Fetch stats for each drop to get total cashback
    let totalCashback = 0;
    setStatsLoading(true);
    try {
      const statsPromises = drops.map((d) =>
        coinDropService.getCoinDropStats(storeId!, d._id).catch(() => ({
          success: false,
          data: { totalCashbackAwarded: 0 },
        }))
      );
      const statsResults = await Promise.all(statsPromises);
      totalCashback = statsResults.reduce((sum: number, s) => {
        return sum + (s.data?.totalCashbackAwarded || 0);
      }, 0);
    } catch {
      // Fallback: no stats available
    }
    setStatsLoading(false);

    setSummaryStats({ activeDrops, totalUsage, totalCashback });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCoinDrops();
    setRefreshing(false);
  }, [storeId]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const handleEdit = (coinDrop: MerchantCoinDrop) => {
    setEditingId(coinDrop._id);
    setFormData({
      multiplier: String(coinDrop.multiplier),
      normalCashback: String(coinDrop.normalCashback),
      category: coinDrop.category,
      startTime: coinDrop.startTime ? new Date(coinDrop.startTime).toISOString().slice(0, 16) : '',
      endTime: coinDrop.endTime ? new Date(coinDrop.endTime).toISOString().slice(0, 16) : '',
      minOrderValue: coinDrop.minOrderValue ? String(coinDrop.minOrderValue) : '',
      maxCashback: coinDrop.maxCashback ? String(coinDrop.maxCashback) : '',
      isActive: coinDrop.isActive,
      priority: String(coinDrop.priority || 0),
    });
    setShowModal(true);
  };

  const handleDelete = (coinDrop: MerchantCoinDrop) => {
    if (coinDrop.status === 'running') {
      showAlert(
        'Cannot Delete',
        'Cannot delete a currently running CoinDrop. Deactivate it first.'
      );
      return;
    }
    showConfirm('Delete CoinDrop', 'Are you sure you want to delete this CoinDrop?', async () => {
      try {
        const response = await coinDropService.deleteCoinDrop(storeId!, coinDrop._id);
        if (response.success) {
          showAlert('Success', 'CoinDrop deleted successfully');
          loadCoinDrops();
        } else {
          showAlert('Error', response.message || 'Failed to delete CoinDrop');
        }
      } catch (err) {
        showAlert('Error', err.message || 'Failed to delete CoinDrop');
      }
    });
  };

  const handleSubmit = async () => {
    // Validate
    const multiplier = parseFloat(formData.multiplier);
    const normalCashback = parseFloat(formData.normalCashback);

    if (isNaN(multiplier) || multiplier < 1.5 || multiplier > 5) {
      showAlert('Validation Error', 'Multiplier must be between 1.5 and 5');
      return;
    }
    if (isNaN(normalCashback) || normalCashback < 0 || normalCashback > 100) {
      showAlert('Validation Error', 'Normal cashback must be between 0 and 100');
      return;
    }
    if (!formData.category) {
      showAlert('Validation Error', 'Please select a category');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      showAlert('Validation Error', 'Please set both start and end times');
      return;
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    if (endDate <= startDate) {
      showAlert('Validation Error', 'End time must be after start time');
      return;
    }

    setSubmitting(true);
    try {
      const payload: unknown = {
        multiplier,
        normalCashback,
        category: formData.category,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        isActive: formData.isActive,
        priority: parseInt(formData.priority) || 0,
      };
      if (formData.minOrderValue) payload.minOrderValue = parseFloat(formData.minOrderValue);
      if (formData.maxCashback) payload.maxCashback = parseFloat(formData.maxCashback);

      let response;
      if (editingId) {
        response = await coinDropService.updateCoinDrop(storeId!, editingId, payload);
      } else {
        response = await coinDropService.createCoinDrop(storeId!, payload);
      }

      if (response.success) {
        showAlert(
          'Success',
          editingId ? 'CoinDrop updated successfully' : 'CoinDrop created successfully'
        );
        setShowModal(false);
        loadCoinDrops();
      } else {
        showAlert('Error', response.message || 'Failed to save CoinDrop');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Failed to save CoinDrop');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return '#10B981';
      case 'upcoming':
        return '#3B82F6';
      case 'expired':
        return '#EF4444';
      case 'inactive':
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'upcoming':
        return 'Upcoming';
      case 'expired':
        return 'Expired';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const boostedCashbackPreview = () => {
    const m = parseFloat(formData.multiplier);
    const n = parseFloat(formData.normalCashback);
    if (isNaN(m) || isNaN(n)) return '---';
    return (m * n).toFixed(1) + '%';
  };

  const renderCoinDrop = ({ item }: { item: MerchantCoinDrop }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
          >
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.multiplierText}>{item.multiplier}x Cashback</Text>
        <Text style={styles.cashbackInfo}>
          {item.normalCashback}% &rarr; {item.boostedCashback}%
        </Text>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatDate(item.startTime)} - {formatDate(item.endTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Category: {item.category}</Text>
        </View>

        {item.minOrderValue ? (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Min Order: {item.minOrderValue} RC</Text>
          </View>
        ) : null}

        {item.maxCashback ? (
          <View style={styles.detailRow}>
            <Ionicons name="trending-up-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Max Cashback: {item.maxCashback} RC</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Usage: {item.usageCount || 0} times</Text>
        </View>
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
          <Text style={styles.headerTitle}>Coin Drops</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading CoinDrops...</Text>
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
        <Text style={styles.headerTitle}>Coin Drops</Text>
        <TouchableOpacity onPress={handleCreate}>
          <Ionicons name="add-circle" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Store Info */}
      {store && (
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeSubtext}>Manage boosted cashback events for your store</Text>
        </View>
      )}

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summaryStats.activeDrops}</Text>
          <Text style={styles.statLabel}>Active Drops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summaryStats.totalUsage}</Text>
          <Text style={styles.statLabel}>Total Usage</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '...' : summaryStats.totalCashback}</Text>
          <Text style={styles.statLabel}>Total Cashback</Text>
        </View>
      </View>

      {/* Upcoming Drop Banner */}
      {coinDrops.length > 0 &&
        (() => {
          const upcomingDrop = coinDrops.find(
            (d) => new Date(d.startTime) > new Date() && d.status === 'upcoming'
          );
          return upcomingDrop ? (
            <View style={styles.upcomingBanner}>
              <Text style={styles.upcomingTitle}>⏰ Next Drop Scheduled</Text>
              <Text style={styles.upcomingSubtitle}>
                {upcomingDrop.multiplier}x cashback on{' '}
                {new Date(upcomingDrop.startTime).toLocaleString('en-IN')}
              </Text>
            </View>
          ) : null;
        })()}

      {/* CoinDrop List */}
      <FlatList
        data={coinDrops}
        renderItem={renderCoinDrop}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flash-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Coin Drops</Text>
            <Text style={styles.emptyText}>
              Create boosted cashback events to attract more customers to your store.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create First CoinDrop</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadCoinDrops} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      {coinDrops.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreate}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit CoinDrop' : 'Create CoinDrop'}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {/* Multiplier */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Multiplier (1.5x - 5x)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.multiplier}
                onChangeText={(v) => setFormData({ ...formData, multiplier: v })}
                keyboardType="decimal-pad"
                placeholder="2"
              />
              <Text style={styles.formHint}>
                How many times the normal cashback. E.g., 2 means double.
              </Text>
            </View>

            {/* Normal Cashback */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Normal Cashback (%)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.normalCashback}
                onChangeText={(v) => setFormData({ ...formData, normalCashback: v })}
                keyboardType="decimal-pad"
                placeholder="5"
              />
            </View>

            {/* Boosted Preview */}
            <View style={styles.boostPreview}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
              <Text style={styles.boostPreviewText}>
                Boosted Cashback: {boostedCashbackPreview()}
              </Text>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <TouchableOpacity
                style={styles.formSelect}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={[styles.formSelectText, !formData.category && styles.formPlaceholder]}>
                  {formData.category || 'Select a category'}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        formData.category === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, category: cat });
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          formData.category === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Start Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Time (YYYY-MM-DDTHH:mm)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.startTime}
                onChangeText={(v) => setFormData({ ...formData, startTime: v })}
                placeholder="2026-03-01T09:00"
              />
            </View>

            {/* End Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Time (YYYY-MM-DDTHH:mm)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.endTime}
                onChangeText={(v) => setFormData({ ...formData, endTime: v })}
                placeholder="2026-03-07T23:59"
              />
            </View>

            {/* Min Order Value */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Min Order Value (optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.minOrderValue}
                onChangeText={(v) => setFormData({ ...formData, minOrderValue: v })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>

            {/* Max Cashback */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Max Cashback (optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.maxCashback}
                onChangeText={(v) => setFormData({ ...formData, maxCashback: v })}
                keyboardType="decimal-pad"
                placeholder="No limit"
              />
            </View>

            {/* Active Toggle */}
            <View style={styles.formGroupRow}>
              <Text style={styles.formLabel}>Active</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(v) => setFormData({ ...formData, isActive: v })}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={formData.isActive ? '#3B82F6' : '#9CA3AF'}
              />
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority (0-100)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.priority}
                onChangeText={(v) => setFormData({ ...formData, priority: v })}
                keyboardType="number-pad"
                placeholder="0"
              />
              <Text style={styles.formHint}>Higher priority CoinDrops are shown first.</Text>
            </View>

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
  statsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  multiplierText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  cashbackInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardDetails: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
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
    backgroundColor: '#3B82F6',
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
  upcomingBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE799',
  },
  upcomingTitle: {
    fontWeight: '700',
    color: '#1a3a52',
    fontSize: 15,
    marginBottom: 4,
  },
  upcomingSubtitle: {
    color: '#2A5577',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  formGroup: {
    marginBottom: 16,
  },
  formGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  formHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  formSelect: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formSelectText: {
    fontSize: 16,
    color: '#1F2937',
  },
  formPlaceholder: {
    color: '#9CA3AF',
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  boostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  boostPreviewText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
});
