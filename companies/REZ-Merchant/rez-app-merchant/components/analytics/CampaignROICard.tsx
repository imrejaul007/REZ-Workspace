/**
 * Campaign ROI Card Component
 * Displays coin campaign ROI metrics: coins spent vs revenue generated
 * Shows best performing campaigns and ROI percentage
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CampaignROI {
  campaignId: string;
  campaignName: string;
  coinsSpent: number;
  revenueGenerated: number;
  roi: number; // percentage
  orders: number;
  status: 'active' | 'completed';
  startDate: string;
  endDate?: string;
}

interface CampaignROICardProps {
  campaigns: CampaignROI[];
  isLoading?: boolean;
  onViewDetails?: (campaignId: string) => void;
}

export function CampaignROICard({
  campaigns,
  isLoading = false,
  onViewDetails,
}: CampaignROICardProps) {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatROI = (roi: number) => `${roi.toFixed(0)}%`;

  // Calculate totals
  const totalCoinsSpent = campaigns.reduce((sum, c) => sum + c.coinsSpent, 0);
  const totalRevenueGenerated = campaigns.reduce(
    (sum, c) => sum + c.revenueGenerated,
    0
  );
  const overallROI =
    totalCoinsSpent > 0
      ? Math.round(((totalRevenueGenerated - totalCoinsSpent) / totalCoinsSpent) * 100)
      : 0;

  // Get top performing campaign
  const topCampaign = campaigns.length > 0
    ? [...campaigns].sort((a, b) => b.roi - a.roi)[0]
    : null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading campaign ROI...</ThemedText>
      </View>
    );
  }

  if (campaigns.length === 0) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Ionicons
          name="gift-outline"
          size={32}
          color={Colors.light.textSecondary}
          style={styles.emptyIcon}
        />
        <ThemedText style={styles.emptyTitle}>No Campaigns Yet</ThemedText>
        <ThemedText style={styles.emptyText}>
          Create your first coin bonus campaign to drive traffic and revenue
        </ThemedText>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/(dashboard)/bonus-campaigns' as unknown)}
        >
          <Ionicons name="add-circle" size={20} color={Colors.light.background} />
          <ThemedText style={styles.emptyButtonText}>
            Create Campaign
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>Campaign ROI</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Coins invested vs revenue earned
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push('/(dashboard)/analytics' as unknown)
          }
          style={styles.headerAction}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>Coins Spent</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {formatCurrency(totalCoinsSpent)}
          </ThemedText>
        </View>

        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>Revenue Generated</ThemedText>
          <ThemedText style={[styles.summaryValue, styles.positiveValue]}>
            {formatCurrency(totalRevenueGenerated)}
          </ThemedText>
        </View>

        <View style={[styles.summaryCard, styles.highlightCard]}>
          <ThemedText style={styles.summaryLabel}>Overall ROI</ThemedText>
          <ThemedText style={[styles.summaryValue, styles.roiValue]}>
            {formatROI(overallROI)}
          </ThemedText>
        </View>
      </View>

      {/* Best Campaign */}
      {topCampaign && (
        <View style={styles.topCampaignSection}>
          <View style={styles.topCampaignHeader}>
            <Ionicons
              name="star"
              size={16}
              color={Colors.light.warning}
              style={styles.starIcon}
            />
            <ThemedText style={styles.topCampaignLabel}>
              Best Performing
            </ThemedText>
          </View>
          <View style={styles.topCampaignCard}>
            <View style={styles.topCampaignInfo}>
              <ThemedText style={styles.topCampaignName}>
                {topCampaign.campaignName}
              </ThemedText>
              <View style={styles.topCampaignStats}>
                <View style={styles.topCampaignStat}>
                  <ThemedText style={styles.topCampaignStatLabel}>
                    {topCampaign.orders} orders
                  </ThemedText>
                </View>
                <View style={styles.topCampaignStat}>
                  <ThemedText style={styles.topCampaignStatLabel}>
                    {formatCurrency(topCampaign.revenueGenerated)} revenue
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.topCampaignROI}>
              <ThemedText style={styles.topCampaignROIValue}>
                {formatROI(topCampaign.roi)}
              </ThemedText>
              <ThemedText style={styles.topCampaignROILabel}>ROI</ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Campaign List */}
      {campaigns.length > 1 && (
        <View style={styles.campaignListSection}>
          <ThemedText style={styles.campaignListTitle}>All Campaigns</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.campaignListScroll}
          >
            {campaigns.map((campaign) => (
              <TouchableOpacity
                key={campaign.campaignId}
                style={styles.campaignListItem}
                onPress={() =>
                  onViewDetails?.(campaign.campaignId)
                }
              >
                <View style={styles.campaignListItemHeader}>
                  <ThemedText
                    style={styles.campaignListItemName}
                    numberOfLines={1}
                  >
                    {campaign.campaignName}
                  </ThemedText>
                  <View
                    style={[
                      styles.campaignStatusBadge,
                      campaign.status === 'active'
                        ? styles.statusActive
                        : styles.statusCompleted,
                    ]}
                  >
                    <ThemedText style={styles.campaignStatusText}>
                      {campaign.status === 'active' ? 'Active' : 'Completed'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.campaignListItemMetric}>
                  <ThemedText style={styles.campaignListItemLabel}>
                    Spent:
                  </ThemedText>
                  <ThemedText style={styles.campaignListItemValue}>
                    {formatCurrency(campaign.coinsSpent)}
                  </ThemedText>
                </View>

                <View style={styles.campaignListItemMetric}>
                  <ThemedText style={styles.campaignListItemLabel}>
                    Revenue:
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.campaignListItemValue,
                      styles.positiveValue,
                    ]}
                  >
                    {formatCurrency(campaign.revenueGenerated)}
                  </ThemedText>
                </View>

                <View style={styles.campaignListItemRoi}>
                  <ThemedText style={styles.campaignListItemROIValue}>
                    {formatROI(campaign.roi)}
                  </ThemedText>
                  <ThemedText style={styles.campaignListItemROILabel}>
                    ROI
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() =>
          router.push('/(dashboard)/bonus-campaigns' as unknown)
        }
      >
        <Ionicons
          name="add"
          size={20}
          color={Colors.light.background}
          style={styles.ctaIcon}
        />
        <ThemedText style={styles.ctaButtonText}>
          Create New Campaign
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  headerAction: {
    padding: 4,
  },
  summaryGrid: {
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  positiveValue: {
    color: Colors.light.success,
  },
  highlightCard: {
    backgroundColor: Colors.light.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  roiValue: {
    color: Colors.light.primary,
  },
  topCampaignSection: {
    marginBottom: 16,
  },
  topCampaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 6,
  },
  topCampaignLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  topCampaignCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.warning,
  },
  topCampaignInfo: {
    flex: 1,
  },
  topCampaignName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  topCampaignStats: {
    flexDirection: 'row',
    gap: 8,
  },
  topCampaignStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCampaignStatLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  topCampaignROI: {
    alignItems: 'center',
    marginLeft: 12,
  },
  topCampaignROIValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.success,
  },
  topCampaignROILabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  campaignListSection: {
    marginBottom: 16,
  },
  campaignListTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  campaignListScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  campaignListItem: {
    width: 160,
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  campaignListItemHeader: {
    marginBottom: 8,
  },
  campaignListItemName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  campaignStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: Colors.light.success + '20',
  },
  statusCompleted: {
    backgroundColor: Colors.light.textSecondary + '20',
  },
  campaignStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.text,
  },
  campaignListItemMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  campaignListItemLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  campaignListItemValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.text,
  },
  campaignListItemRoi: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  campaignListItemROIValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  campaignListItemROILabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaIcon: {
    marginRight: 0,
  },
  ctaButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
    fontSize: 13,
  },
});
