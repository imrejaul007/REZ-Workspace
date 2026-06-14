/**
 * Onboarding Progress Checklist Screen
 * Displays merchant onboarding completion status with interactive checklist
 * Tracks: Store photo, first product, payment setup, first order, first campaign
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { onboardingService } from '@/services/api/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: string;
  actionRoute?: string;
  estimatedTime: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'store-photo',
    title: 'Add Store Photo',
    description: 'Upload a professional photo of your storefront',
    completed: false,
    icon: 'image',
    actionRoute: '/stores',
    estimatedTime: '2 min',
  },
  {
    id: 'first-product',
    title: 'Add Your First Product',
    description: 'Add at least one product or service to your menu',
    completed: false,
    icon: 'list',
    actionRoute: '/products/add',
    estimatedTime: '5 min',
  },
  {
    id: 'payment-setup',
    title: 'Set Up Payments',
    description: 'Configure your bank account for payouts',
    completed: false,
    icon: 'card',
    actionRoute: '/settings',
    estimatedTime: '3 min',
  },
  {
    id: 'first-order',
    title: 'Receive First Order',
    description: 'Enable orders and process your first customer transaction',
    completed: false,
    icon: 'checkmark-circle',
    estimatedTime: 'varies',
  },
  {
    id: 'first-campaign',
    title: 'Launch First Campaign',
    description: 'Create a coin bonus or promotion to drive traffic',
    completed: false,
    icon: 'gift',
    actionRoute: '/(dashboard)/bonus-campaigns',
    estimatedTime: '5 min',
  },
];

export default function OnboardingProgressChecklist() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: checklistData,
    isLoading,
    refetch,
  } = useQuery<{ items?: ChecklistItem[] }>({
    queryKey: ['onboarding-checklist'],
    queryFn: () => (onboardingService as unknown as { getOnboardingStatus: () => Promise<unknown> }).getOnboardingStatus() as Promise<{ items?: ChecklistItem[] }>,
    staleTime: 3 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const items: ChecklistItem[] =
    (checklistData?.items?.length ?? 0) > 0 ? (checklistData?.items ?? CHECKLIST_ITEMS) : CHECKLIST_ITEMS;
  const completedCount = items.filter((item) => item.completed).length;
  const completionPercentage = Math.round((completedCount / items.length) * 100);

  const handleActionPress = (item: ChecklistItem) => {
    if (item.actionRoute) {
      router.push(item.actionRoute);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading checklist...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Getting Started
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Complete these steps to unlock all features
          </ThemedText>
        </View>

        {/* Progress Circle */}
        <View style={styles.progressSection}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <ThemedText style={styles.progressPercentage}>{completionPercentage}%</ThemedText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
            </View>
          </View>
          <ThemedText style={styles.progressLabel}>
            {completedCount} of {items.length} steps completed
          </ThemedText>
        </View>

        {/* Checklist Items */}
        <View style={styles.checklistContainer}>
          <ThemedText style={styles.checklistTitle}>Your Checklist</ThemedText>

          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.checklistItem,
                item.completed && styles.checklistItemCompleted,
                index === items.length - 1 && styles.checklistItemLast,
              ]}
            >
              <View style={styles.checklistItemLeft}>
                <View
                  style={[styles.checkboxContainer, item.completed && styles.checkboxCompleted]}
                >
                  {item.completed ? (
                    <Ionicons name="checkmark" size={16} color={Colors.light.background} />
                  ) : (
                    <Ionicons name={item.icon as unknown as keyof typeof Ionicons.glyphMap} size={16} color={Colors.light.primary} />
                  )}
                </View>

                <View style={styles.itemContent}>
                  <ThemedText
                    style={[styles.itemTitle, item.completed && styles.itemTitleCompleted]}
                  >
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
                  <ThemedText style={styles.itemTime}>~{item.estimatedTime}</ThemedText>
                </View>
              </View>

              {!item.completed && item.actionRoute && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleActionPress(item)}
                >
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
              )}

              {item.completed && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <ThemedText style={styles.benefitsTitle}>What You'll Unlock</ThemedText>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="trending-up" size={20} color={Colors.light.success} />
              </View>
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitItemTitle}>Drive More Orders</ThemedText>
                <ThemedText style={styles.benefitItemDesc}>
                  Customers see your store on the REZ marketplace
                </ThemedText>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="wallet" size={20} color={Colors.light.warning} />
              </View>
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitItemTitle}>Earn More Revenue</ThemedText>
                <ThemedText style={styles.benefitItemDesc}>
                  Launch campaigns with coin bonuses to boost sales
                </ThemedText>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="analytics" size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitItemTitle}>Track Your ROI</ThemedText>
                <ThemedText style={styles.benefitItemDesc}>
                  See real-time insights on campaign performance
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        {completionPercentage < 100 && (
          <View style={styles.ctaSection}>
            <ThemedText style={styles.ctaText}>
              Complete your setup to start earning more
            </ThemedText>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                const firstIncomplete = items.find((item) => !item.completed);
                if (firstIncomplete?.actionRoute) {
                  handleActionPress(firstIncomplete);
                }
              }}
            >
              <ThemedText style={styles.primaryButtonText}>Continue Setup</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {completionPercentage === 100 && (
          <View style={styles.ctaSection}>
            <View style={styles.congratsContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.light.success} />
              <ThemedText style={styles.congratsTitle}>Setup Complete!</ThemedText>
              <ThemedText style={styles.congratsText}>
                You're all set to start selling and earning on REZ
              </ThemedText>
            </View>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  progressSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  progressCircleContainer: {
    marginBottom: 16,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.background,
  },
  progressTrack: {
    width: SCREEN_WIDTH - 32,
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  checklistContainer: {
    marginBottom: 40,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  checklistItemCompleted: {
    borderLeftColor: Colors.light.success,
    opacity: 0.7,
  },
  checklistItemLast: {
    marginBottom: 0,
  },
  checklistItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: Colors.light.success,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  actionButton: {
    padding: 8,
  },
  completedBadge: {
    marginLeft: 8,
  },
  benefitsSection: {
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitItemDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  ctaSection: {
    marginBottom: 32,
    backgroundColor: Colors.light.background,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
    fontSize: 14,
  },
  congratsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  congratsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
