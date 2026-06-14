// OfferManager Component
// Manage merchant offers, deals, and promotions
//
// UX/UI FIXES APPLIED:
// 1. Replaced hardcoded colors with design tokens from constants/theme.ts
// 2. Replaced inline loading state with shared LoadingSpinner component
// 3. Replaced inline empty state with shared EmptyState component
// 4. Added accessibility attributes (accessibilityRole, accessibilityLabel)
// 5. Added keyboardShouldPersistTaps to ScrollViews
// 6. Replaced console.error with proper error state display

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useMerchant } from '../contexts/MerchantContext';
import { LoadingSpinner, EmptyState, ErrorState } from './common';
import {
  getOffers,
  updateOffer,
  getOfferStats,
  Offer,
  OfferStats,
} from '../services/merchant.service';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';

interface OfferManagerProps {
  onCreateOffer?: () => void;
}

type OfferType = 'percentage' | 'fixed' | 'bogo' | 'bundle' | 'loyalty';
type OfferStatus = 'active' | 'scheduled' | 'expired' | 'paused';
type TargetAudience = 'all' | 'new' | 'returning' | 'vip';

const OFFER_TYPE_CONFIG: Record<OfferType, { icon: string; label: string; color: string }> = {
  percentage: { icon: '💰', label: 'Percentage', color: colors.successMain },
  fixed: { icon: '🎟️', label: 'Fixed Off', color: colors.primaryMain },
  bogo: { icon: '买一送一', label: 'Buy 1 Get 1', color: colors.warningMain },
  bundle: { icon: '📦', label: 'Bundle', color: '#8B5CF6' },
  loyalty: { icon: '⭐', label: 'Loyalty', color: '#EC4899' },
};

const AUDIENCE_CONFIG: Record<TargetAudience, { label: string; color: string }> = {
  all: { label: 'Everyone', color: colors.text.secondary },
  new: { label: 'New Customers', color: colors.successMain },
  returning: { label: 'Returning', color: colors.primaryMain },
  vip: { label: 'VIP Only', color: colors.warningMain },
};

export function OfferManager({ onCreateOffer }: OfferManagerProps): React.JSX.Element {
  const { merchant } = useMerchant();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OfferStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const merchantId = merchant?.id || 'demo-merchant';

  const fetchOffers = useCallback(async () => {
    try {
      setError(null);
      const [offersData, statsData] = await Promise.all([
        getOffers(merchantId),
        getOfferStats(merchantId),
      ]);
      setOffers(offersData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load offers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
  }, [fetchOffers]);

  const getOfferStatus = (offer: Offer): OfferStatus => {
    if (!offer.isActive) return 'paused';
    const now = new Date();
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);
    if (now < startDate) return 'scheduled';
    if (now > endDate) return 'expired';
    return 'active';
  };

  const handleOfferPress = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  };

  const handleToggleOffer = async (offer: Offer) => {
    try {
      const updatedOffer = await updateOffer(offer.id, { isActive: !offer.isActive });
      setOffers(prev => prev.map(o => (o.id === offer.id ? updatedOffer : o)));
      setShowDetailModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update offer');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateRange = (start: string, end: string): string => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getStatusColor = (status: OfferStatus): string => {
    switch (status) {
      case 'active':
        return colors.successMain;
      case 'scheduled':
        return colors.primaryMain;
      case 'expired':
        return colors.gray[400];
      case 'paused':
        return colors.warningMain;
      default:
        return colors.text.secondary;
    }
  };

  const filteredOffers = offers.filter(offer => {
    const status = getOfferStatus(offer);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesSearch =
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading offers..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOffers} />;
  }

  return (
    <View style={styles.container} accessibilityRole="main" accessibilityLabel="Offer Manager">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offers</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateOffer}
          accessibilityRole="button"
          accessibilityLabel="Create new offer"
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      {stats && (
        <View style={styles.statsRow} accessibilityRole="group" accessibilityLabel="Offer Statistics">
          <View style={[styles.statCard, { borderLeftColor: colors.successMain }]}>
            <Text style={styles.statValue}>{stats.activeOffers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.primaryMain }]}>
            <Text style={styles.statValue}>{stats.totalRedemptions}</Text>
            <Text style={styles.statLabel}>Redemptions</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.warningMain }]}>
            <Text style={styles.statValue}>{formatCurrency(stats.totalSavings)}</Text>
            <Text style={styles.statLabel}>Total Savings</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search offers..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search offers"
          accessibilityRole="search"
        />
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
        keyboardShouldPersistTaps="handled"
      >
        {(['all', 'active', 'scheduled', 'expired', 'paused'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
            onPress={() => setFilterStatus(status)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterStatus === status }}
            accessibilityLabel={`Filter by ${status}`}
          >
            <Text style={[styles.filterPillText, filterStatus === status && styles.filterPillTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Offer List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryMain]} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessibilityRole="list"
      >
        {filteredOffers.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="No offers found"
            message="Create your first offer to attract customers"
            actionLabel="Create Offer"
            onAction={onCreateOffer}
          />
        ) : (
          filteredOffers.map(offer => {
            const status = getOfferStatus(offer);
            const typeConfig = OFFER_TYPE_CONFIG[offer.type as OfferType];
            return (
              <TouchableOpacity
                key={offer.id}
                style={styles.offerCard}
                onPress={() => handleOfferPress(offer)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${offer.title}, ${status} offer`}
              >
                <View style={styles.offerCardHeader}>
                  <View style={[styles.offerIconContainer, { backgroundColor: `${typeConfig.color}15` }]}>
                    <Text style={styles.offerIcon}>{typeConfig.icon}</Text>
                  </View>
                  <View style={styles.offerInfo}>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <View style={styles.offerMeta}>
                      <View
                        style={[styles.offerTypeBadge, { backgroundColor: `${typeConfig.color}15` }]}
                      >
                        <Text style={[styles.offerTypeText, { color: typeConfig.color }]}>
                          {typeConfig.label}
                        </Text>
                      </View>
                      <View
                        style={[styles.offerAudienceBadge, { backgroundColor: `${AUDIENCE_CONFIG[offer.targetAudience || 'all'].color}15` }]}
                      >
                        <Text
                          style={[
                            styles.offerAudienceText,
                            { color: AUDIENCE_CONFIG[offer.targetAudience || 'all'].color },
                          ]}
                        >
                          {AUDIENCE_CONFIG[offer.targetAudience || 'all'].label}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.offerStatus, { backgroundColor: `${getStatusColor(status)}15` }]}>
                    <View style={[styles.offerStatusDot, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[styles.offerStatusText, { color: getStatusColor(status) }]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.offerDescription} numberOfLines={2}>
                  {offer.description}
                </Text>

                <View style={styles.offerValueRow}>
                  <View style={styles.offerValue}>
                    <Text style={styles.offerValueText}>
                      {offer.type === 'percentage'
                        ? `${offer.value}% OFF`
                        : offer.type === 'bogo'
                          ? 'BUY 1 GET 1'
                          : `₹${offer.value} OFF`}
                    </Text>
                    {offer.minPurchase && (
                      <Text style={styles.offerMinPurchase}>
                        Min. order: {formatCurrency(offer.minPurchase)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.offerCardFooter}>
                  <View style={styles.offerStats}>
                    <View style={styles.offerStatItem}>
                      <Text style={styles.offerStatValue}>{offer.redemptions}</Text>
                      <Text style={styles.offerStatLabel}>Used</Text>
                    </View>
                    {offer.usageLimit && (
                      <View style={styles.offerStatItem}>
                        <Text style={styles.offerStatValue}>{offer.usageLimit - offer.usageCount}</Text>
                        <Text style={styles.offerStatLabel}>Remaining</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.offerExpiry}>
                    {status === 'expired'
                      ? 'Expired'
                      : status === 'scheduled'
                        ? `Starts ${formatDate(offer.startDate)}`
                        : `Until ${formatDate(offer.endDate)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Offer Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
        accessibilityRole="dialog"
        accessibilityLabel="Offer Details"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Offer Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {selectedOffer && (
              <>
                <View style={styles.modalOfferHeader}>
                  <Text style={styles.modalOfferTitle}>{selectedOffer.title}</Text>
                  <View
                    style={[
                      styles.modalOfferStatus,
                      { backgroundColor: `${getStatusColor(getOfferStatus(selectedOffer))}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOfferStatusText,
                        { color: getStatusColor(getOfferStatus(selectedOffer)) },
                      ]}
                    >
                      {getOfferStatus(selectedOffer).charAt(0).toUpperCase() +
                        getOfferStatus(selectedOffer).slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalOfferDescription}>{selectedOffer.description}</Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Offer Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Type</Text>
                    <Text style={styles.modalDetailValue}>
                      {OFFER_TYPE_CONFIG[selectedOffer.type as OfferType]?.icon}{' '}
                      {OFFER_TYPE_CONFIG[selectedOffer.type as OfferType]?.label}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Value</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedOffer.type === 'percentage'
                        ? `${selectedOffer.value}% OFF`
                        : selectedOffer.type === 'bogo'
                          ? 'BUY 1 GET 1'
                          : `₹${selectedOffer.value} OFF`}
                    </Text>
                  </View>
                  {selectedOffer.minPurchase && (
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Min. Purchase</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedOffer.minPurchase)}
                      </Text>
                    </View>
                  )}
                  {selectedOffer.maxDiscount && (
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Max Discount</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedOffer.maxDiscount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Valid Period</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatDateRange(selectedOffer.startDate, selectedOffer.endDate)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Target Audience</Text>
                    <Text style={styles.modalDetailValue}>
                      {AUDIENCE_CONFIG[selectedOffer.targetAudience || 'all'].label}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Usage Statistics</Text>
                  <View style={styles.modalStatsRow}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedOffer.redemptions}</Text>
                      <Text style={styles.modalStatLabel}>Redemptions</Text>
                    </View>
                    {selectedOffer.usageLimit && (
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatValue}>
                          {selectedOffer.usageLimit - selectedOffer.usageCount}
                        </Text>
                        <Text style={styles.modalStatLabel}>Remaining</Text>
                      </View>
                    )}
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>
                        {((selectedOffer.redemptions / (selectedOffer.usageLimit || selectedOffer.redemptions + 1)) * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.modalStatLabel}>Conversion</Text>
                    </View>
                  </View>
                </View>

                {selectedOffer.terms && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Terms & Conditions</Text>
                    <Text style={styles.modalTerms}>{selectedOffer.terms}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalToggleButton}
                    onPress={() => handleToggleOffer(selectedOffer)}
                    accessibilityRole="button"
                    accessibilityLabel={selectedOffer.isActive ? 'Pause offer' : 'Activate offer'}
                  >
                    <Text style={styles.modalToggleButtonText}>
                      {selectedOffer.isActive ? 'Pause Offer' : 'Activate Offer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primaryMain,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  createButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterPillActive: {
    backgroundColor: colors.primaryMain,
    borderColor: colors.primaryMain,
  },
  filterPillText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterPillTextActive: {
    color: colors.text.inverse,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  offerCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  offerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  offerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerIcon: {
    fontSize: 24,
  },
  offerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  offerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  offerMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  offerTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offerTypeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  offerAudienceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offerAudienceText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  offerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  offerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  offerStatusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  offerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  offerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  offerValue: {},
  offerValueText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.successMain,
  },
  offerMinPurchase: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  offerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  offerStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  offerStatItem: {
    alignItems: 'center',
  },
  offerStatValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  offerStatLabel: {
    fontSize: 11,
    color: colors.gray[400],
  },
  offerExpiry: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  modalCloseText: {
    fontSize: typography.fontSize.md,
    color: colors.primaryMain,
    fontWeight: typography.fontWeight.medium,
  },
  modalOfferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalOfferTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  modalOfferStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  modalOfferStatusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  modalOfferDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  modalSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalDetailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  modalDetailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  modalStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  modalTerms: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: spacing.sm,
  },
  modalToggleButton: {
    backgroundColor: colors.primaryMain,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalToggleButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default OfferManager;
