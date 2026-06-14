/**
 * Store Loyalty Program Screen
 * Manage loyalty tiers, members, and rewards
 * Connected to: https://rez-karma-service.onrender.com
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Colors, Shadows, Spacing } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';
import {
  loyaltyService,
  useLoyaltyProgram,
  useTierManagement,
  useMemberStats,
  usePunchCards,
  LoyaltyTier,
  LoyaltyProgram,
  MemberStats,
} from '@/services/loyalty';

interface LocalTier {
  id: string;
  name: string;
  minSpend: number;
  coinMultiplier: number;
  perks: string;
  color: string;
}

interface TierMember {
  tier: string;
  percentage: number;
  count: number;
  color?: string;
}

const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
const DEFAULT_TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum'];

// Convert local tier to service tier format
function localToServiceTier(local: LocalTier, programId: string): Partial<LoyaltyTier> {
  return {
    id: local.id,
    name: local.name,
    minSpend: local.minSpend,
    coinMultiplier: local.coinMultiplier,
    perks: local.perks.split(',').map((p) => p.trim()).filter(Boolean),
    color: local.color,
  };
}

export default function LoyaltyProgramScreen() {
  const { id: storeId } = useLocalSearchParams<{ id: string }>();
  const [programName, setProgramName] = useState('Loyalty Program');
  const [isActive, setIsActive] = useState(true);
  const [tiers, setTiers] = useState<LocalTier[]>(
    DEFAULT_TIER_NAMES.map((name, idx) => ({
      id: `tier-${idx}`,
      name,
      minSpend: idx === 0 ? 0 : idx * 10000,
      coinMultiplier: 1 + idx * 0.5,
      perks: 'Special benefits and rewards',
      color: DEFAULT_COLORS[idx],
    }))
  );
  const [members, setMembers] = useState<TierMember[]>([
    { tier: 'Bronze', percentage: 68, count: 680, color: '#EF4444' },
    { tier: 'Silver', percentage: 22, count: 220, color: '#F59E0B' },
    { tier: 'Gold', percentage: 8, count: 80, color: '#10B981' },
    { tier: 'Platinum', percentage: 2, count: 20, color: '#3B82F6' },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTier, setEditingTier] = useState<LocalTier | null>(null);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedColorTierId, setSelectedColorTierId] = useState<string | null>(null);
  const [serviceConnected, setServiceConnected] = useState(false);

  // Use the new loyalty service hooks
  const { program, loading: serviceLoading, error: serviceError, refetch } = useLoyaltyProgram(storeId || '');
  const { stats, loading: statsLoading } = useMemberStats(storeId || '');
  const { punchCards, loading: cardsLoading } = usePunchCards(storeId || '');

  // Update local state from service
  useEffect(() => {
    if (program) {
      setProgramName(program.name);
      setIsActive(program.isActive);
      setTiers(
        program.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          minSpend: t.minSpend,
          coinMultiplier: t.coinMultiplier,
          perks: t.perks.join(', '),
          color: t.color,
        }))
      );
      setServiceConnected(true);
    }
  }, [program]);

  // Update member distribution from stats
  useEffect(() => {
    if (stats?.tierDistribution) {
      setMembers(
        stats.tierDistribution.map((td) => ({
          tier: td.tier,
          percentage: td.percentage,
          count: td.count,
          color: td.color,
        }))
      );
    }
  }, [stats]);

  const loadLoyaltyProgram = useCallback(async () => {
    try {
      setLoading(true);
      if (!storeId) return;

      // Check if karma service is connected
      try {
        await loyaltyService.healthCheck();
        setServiceConnected(true);
      } catch {
        setServiceConnected(false);
        logger.warn('[LoyaltyProgram] Karma service not available, using local defaults');
      }

      // Try to load from service
      const serviceProgram = await loyaltyService.getProgram(storeId);
      if (serviceProgram) {
        setProgramName(serviceProgram.name);
        setIsActive(serviceProgram.isActive);
        setTiers(
          serviceProgram.tiers.map((t) => ({
            id: t.id,
            name: t.name,
            minSpend: t.minSpend,
            coinMultiplier: t.coinMultiplier,
            perks: t.perks.join(', '),
            color: t.color,
          }))
        );
      }

      // Load member stats
      try {
        const memberStats = await loyaltyService.getMemberStats(storeId);
        if (memberStats.tierDistribution.length > 0) {
          setMembers(
            memberStats.tierDistribution.map((td) => ({
              tier: td.tier,
              percentage: td.percentage,
              count: td.count,
              color: td.color,
            }))
          );
        }
      } catch {
        // Use default member data
      }
    } catch (error) {
      logger.error('[Loyalty Program] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useFocusEffect(
    useCallback(() => {
      loadLoyaltyProgram();
    }, [loadLoyaltyProgram])
  );

  const handleSaveProgram = async () => {
    if (!programName.trim()) {
      platformAlertSimple('Required', 'Program name cannot be empty');
      return;
    }

    if (tiers.some((t) => !t.name.trim())) {
      platformAlertSimple('Required', 'All tier names must be filled');
      return;
    }

    setSubmitting(true);
    try {
      if (!storeId) throw new Error('Store ID not found');

      const programData = {
        name: programName,
        isActive,
        tiers: tiers.map((t) => ({
          id: t.id,
          name: t.name,
          minSpend: t.minSpend,
          coinMultiplier: t.coinMultiplier,
          perks: t.perks.split(',').map((p) => p.trim()).filter(Boolean),
          color: t.color,
        })),
      };

      if (program) {
        // Update existing program
        await loyaltyService.updateProgram(program.id, programData);
        platformAlertSimple('Success', 'Loyalty program updated successfully!');
      } else {
        // Create new program
        const newProgram = await loyaltyService.createProgram(storeId, programData);
        platformAlertSimple('Success', 'Loyalty program created successfully!');
        // Reload to get the new program ID
        await refetch();
      }
    } catch (error) {
      logger.error('[LoyaltyProgram] Save error:', error);
      // Fall back to local API if karma service fails
      try {
        await fetch(`/merchant/loyalty-tiers/${storeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programName,
            isActive,
            tiers: tiers.map(({ id, name, minSpend, coinMultiplier, perks, color }) => ({
              id,
              name,
              minSpend,
              coinMultiplier,
              perks,
              color,
            })),
          }),
        });
        platformAlertSimple('Success', 'Loyalty program saved (local)');
      } catch {
        platformAlertSimple('Error', error?.message || 'Failed to save loyalty program');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTier = (field: string, value) => {
    if (!editingTier) return;
    const updated = { ...editingTier, [field]: value };
    setEditingTier(updated);
    setTiers(tiers.map((t) => (t.id === editingTier.id ? updated : t)));
  };

  const handleAddTier = () => {
    const newTier: LocalTier = {
      id: `tier-${Date.now()}`,
      name: `Tier ${tiers.length + 1}`,
      minSpend: (tiers.length + 1) * 10000,
      coinMultiplier: 1 + tiers.length * 0.5,
      perks: 'Exclusive benefits',
      color: DEFAULT_COLORS[tiers.length % DEFAULT_COLORS.length],
    };
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (tierId: string) => {
    if (tiers.length <= 1) {
      platformAlertSimple('Error', 'You must have at least one tier');
      return;
    }
    Alert.alert(
      'Remove Tier',
      'Are you sure you want to remove this tier? Members at this tier will be moved to the previous tier.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setTiers(tiers.filter((t) => t.id !== tierId));
          },
        },
      ]
    );
  };

  const handleAnnounce = () => {
    router.push({
      pathname: '/broadcast',
      params: {
        storeId,
        prefilledMessage: `Check out our new ${programName} tiers and earn exclusive rewards!`,
      },
    });
  };

  if (loading || serviceLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading loyalty program...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalMembers = members.reduce((sum, m) => sum + m.count, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F3F4F6', '#ffffff']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Program</Text>
        <View style={styles.serviceStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: serviceConnected ? '#10B981' : '#F59E0B' },
            ]}
          />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.disabledButton]}
          onPress={handleSaveProgram}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Status Banner */}
        {!serviceConnected && (
          <Animated.View entering={FadeIn} style={styles.warningBanner}>
            <Ionicons name="warning" size={18} color="#92400E" />
            <Text style={styles.warningText}>
              Karma service unavailable. Changes will be saved locally.
            </Text>
          </Animated.View>
        )}

        {/* Program Info Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Program Settings</Text>
            {stats && (
              <Text style={styles.memberCount}>{stats.totalMembers.toLocaleString()} members</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Program Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Brew Club"
              value={programName}
              onChangeText={setProgramName}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Active Status</Text>
              <Text style={styles.helperText}>Members can earn rewards</Text>
            </View>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: Colors.primary[600] }} />
          </View>
        </Animated.View>

        {/* Tiers Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loyalty Tiers</Text>
            <TouchableOpacity onPress={handleAddTier} style={styles.addTierButton}>
              <Ionicons name="add" size={20} color={Colors.primary[600]} />
              <Text style={styles.addTierText}>Add Tier</Text>
            </TouchableOpacity>
          </View>

          {tiers.map((tier, index) => (
            <Animated.View
              key={tier.id}
              entering={ZoomIn.delay(300 + index * 50)}
              style={styles.tierCard}
            >
              <View style={[styles.tierColorBar, { backgroundColor: tier.color }]} />

              <View style={styles.tierContent}>
                <View style={styles.tierNameRow}>
                  <TextInput
                    style={styles.tierNameInput}
                    value={tier.name}
                    onChangeText={(value) => handleUpdateTier('name', value)}
                    placeholder="Tier name"
                  />
                  <TouchableOpacity
                    style={styles.colorButton}
                    onPress={() => {
                      setEditingTier(tier);
                      setSelectedColorTierId(tier.id);
                      setColorPickerVisible(true);
                    }}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: tier.color }]} />
                  </TouchableOpacity>
                  {tiers.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeTierButton}
                      onPress={() => handleRemoveTier(tier.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.tierRow}>
                  <View style={styles.tierField}>
                    <Text style={styles.fieldLabel}>Min Spend (Rs)</Text>
                    <TextInput
                      style={styles.numberInput}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      value={tier.minSpend.toString()}
                      onChangeText={(value) => handleUpdateTier('minSpend', parseFloat(value) || 0)}
                    />
                  </View>

                  <View style={styles.tierField}>
                    <Text style={styles.fieldLabel}>Coin Multiplier</Text>
                    <TextInput
                      style={styles.numberInput}
                      placeholder="1.0"
                      keyboardType="decimal-pad"
                      value={tier.coinMultiplier.toString()}
                      onChangeText={(value) =>
                        handleUpdateTier('coinMultiplier', parseFloat(value) || 1)
                      }
                    />
                  </View>
                </View>

                <View style={styles.tierField}>
                  <Text style={styles.fieldLabel}>Perks (comma-separated)</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 60 }]}
                    placeholder="e.g., Priority booking, Free upgrade, Exclusive access"
                    multiline
                    numberOfLines={2}
                    value={tier.perks}
                    onChangeText={(value) => handleUpdateTier('perks', value)}
                  />
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Punch Cards Section */}
        {punchCards.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Punch Cards</Text>
              <TouchableOpacity style={styles.addTierButton}>
                <Ionicons name="add" size={20} color={Colors.primary[600]} />
                <Text style={styles.addTierText}>New Card</Text>
              </TouchableOpacity>
            </View>

            {punchCards.map((card) => (
              <View key={card.id} style={styles.punchCardItem}>
                <View style={styles.punchCardInfo}>
                  <Text style={styles.punchCardName}>{card.name}</Text>
                  <Text style={styles.punchCardDesc}>{card.description}</Text>
                </View>
                <View style={styles.punchCardStats}>
                  <Text style={styles.punchCardCount}>{card.activeCount} active</Text>
                  <Text style={styles.punchCardCompleted}>{card.completedCount} completed</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Member Distribution */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Member Distribution</Text>
            <Text style={styles.memberCount}>{totalMembers.toLocaleString()} members</Text>
          </View>

          {members.map((member) => (
            <View key={member.tier} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberTier}>{member.tier}</Text>
                <Text style={styles.memberPercent}>{member.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[Colors.primary[400], Colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${member.percentage}%`,
                      backgroundColor: member.color || Colors.primary[500],
                    },
                  ]}
                />
              </View>
              <Text style={styles.memberCount}>{member.count.toLocaleString()}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Quick Stats */}
        {stats && (
          <Animated.View entering={FadeInDown.delay(350)} style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeMembers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.averageVisits.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Visits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.totalPointsIssued / 1000)}K</Text>
              <Text style={styles.statLabel}>Points Issued</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.totalPointsRedeemed / 1000)}K</Text>
              <Text style={styles.statLabel}>Points Redeemed</Text>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.announceButton}
            onPress={handleAnnounce}
            activeOpacity={0.85}
          >
            <Ionicons name="megaphone" size={18} color="white" />
            <Text style={styles.announceButtonText}>Announce to Members</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal visible={colorPickerVisible} transparent animationType="slide">
        <SafeAreaView style={styles.colorModalSafeArea}>
          <View style={styles.colorModalHeader}>
            <TouchableOpacity onPress={() => setColorPickerVisible(false)}>
              <Text style={styles.colorModalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.colorModalTitle}>Choose Color</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.colorGrid}>
            {[
              '#EF4444',
              '#F97316',
              '#EAB308',
              '#84CC16',
              '#10B981',
              '#06B6D4',
              '#3B82F6',
              '#6366F1',
              '#A855F7',
              '#D946EF',
              '#EC4899',
              '#F43F5E',
            ].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color,
                    borderColor: editingTier?.color === color ? 'white' : 'transparent',
                    borderWidth: editingTier?.color === color ? 3 : 0,
                  },
                ]}
                onPress={() => {
                  if (selectedColorTierId) {
                    handleUpdateTier('color', color);
                  }
                  setColorPickerVisible(false);
                }}
              >
                {editingTier?.color === color && (
                  <Ionicons name="checkmark" size={24} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  serviceStatus: {
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[600],
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: Spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  memberCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTierText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  tierCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: 'hidden',
  },
  tierColorBar: {
    height: 4,
  },
  tierContent: {
    padding: 16,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tierNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingVertical: 8,
  },
  colorButton: {
    padding: 8,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  removeTierButton: {
    padding: 8,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tierField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  numberInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text.primary,
  },
  punchCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  punchCardInfo: {
    flex: 1,
  },
  punchCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  punchCardDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  punchCardStats: {
    alignItems: 'flex-end',
  },
  punchCardCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  punchCardCompleted: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  memberInfo: {
    width: 80,
  },
  memberTier: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  memberPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  actionSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  announceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    ...Shadows.sm,
  },
  announceButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  colorModalSafeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  colorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  colorModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  colorModalCloseText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  colorOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
