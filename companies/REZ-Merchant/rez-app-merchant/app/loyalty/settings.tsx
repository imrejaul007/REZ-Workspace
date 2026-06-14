/**
 * Loyalty Settings Screen
 *
 * Configures points earned per Rs spent, points expiry, and bonus-category multipliers.
 * Connected to: https://rez-karma-service.onrender.com
 *
 * Endpoints:
 * - GET  /loyalty/:merchantId  - Get loyalty settings
 * - PATCH /loyalty/:id         - Update loyalty settings
 * - POST /loyalty              - Create loyalty settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loyaltyService,
  useLoyaltySettings,
  LoyaltySettings,
} from '@/services/loyalty';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'merchant_loyalty_config';

interface ServiceCategory {
  slug: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { slug: 'hair', label: 'Hair', icon: 'cut-outline' },
  { slug: 'nails', label: 'Nails', icon: 'color-palette-outline' },
  { slug: 'spa', label: 'Spa', icon: 'water-outline' },
  { slug: 'skin', label: 'Skin', icon: 'sunny-outline' },
  { slug: 'makeup', label: 'Makeup', icon: 'brush-outline' },
  { slug: 'massage', label: 'Massage', icon: 'body-outline' },
  { slug: 'beard', label: 'Beard', icon: 'man-outline' },
];

const DEFAULT_CONFIG: Partial<LoyaltySettings> = {
  pointsPerRupee: 0.1,
  pointsToRupeeRatio: 10,
  joiningBonus: 100,
  birthdayBonus: 50,
  referralBonus: 25,
  minimumRedemptionPoints: 100,
  pointsExpiryMonths: 365,
  bonusCategories: [],
  isActive: true,
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

interface SettingsScreenProps {
  merchantId?: string;
}

export default function LoyaltySettingsScreen({ merchantId: propMerchantId }: SettingsScreenProps = {}) {
  const [localMerchantId, setLocalMerchantId] = useState<string | null>(propMerchantId || null);
  const [config, setConfig] = useState<Partial<LoyaltySettings>>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceConnected, setServiceConnected] = useState(false);

  // Get merchant ID from storage or props
  useEffect(() => {
    const getMerchantId = async () => {
      if (propMerchantId) {
        setLocalMerchantId(propMerchantId);
        return;
      }
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const merchantData = await AsyncStorage.getItem('merchant_data');
        if (merchantData) {
          const parsed = JSON.parse(merchantData);
          setLocalMerchantId(parsed.id || parsed.merchantId);
        }
      } catch (e) {
        logger.error('[LoyaltySettings] Failed to get merchant ID:', e);
      }
    };
    getMerchantId();
  }, [propMerchantId]);

  // Check karma service health
  useEffect(() => {
    const checkService = async () => {
      try {
        await loyaltyService.healthCheck();
        setServiceConnected(true);
      } catch {
        setServiceConnected(false);
      }
    };
    checkService();
  }, []);

  // Load settings from karma service
  const loadConfig = useCallback(async () => {
    if (!localMerchantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Try karma service first
      if (serviceConnected) {
        const data = await loyaltyService.getLoyaltySettings(localMerchantId);
        if (data) {
          setConfig({
            id: data.id,
            merchantId: data.merchantId,
            name: data.name,
            description: data.description,
            isActive: data.isActive,
            pointsPerRupee: data.pointsPerRupee,
            pointsToRupeeRatio: data.pointsToRupeeRatio,
            joiningBonus: data.joiningBonus,
            birthdayBonus: data.birthdayBonus,
            referralBonus: data.referralBonus,
            maxPointsPerTransaction: data.maxPointsPerTransaction,
            pointsExpiryMonths: data.pointsExpiryMonths,
            minimumRedemptionPoints: data.minimumRedemptionPoints,
            bonusCategories: data.bonusCategories || [],
          });
          setLoading(false);
          return;
        }
      }

      // Fall back to local storage
      await loadFromStorage();
    } catch {
      await loadFromStorage();
    } finally {
      setLoading(false);
    }
  }, [localMerchantId, serviceConnected]);

  const loadFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setConfig({ ...DEFAULT_CONFIG, ...saved });
      }
    } catch {
      // use defaults
    }
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!localMerchantId) {
      Alert.alert('Error', 'Merchant ID not found');
      return;
    }

    const ppr = config.pointsPerRupee || 0.1;
    const exp = config.pointsExpiryMonths || 365;

    if (isNaN(ppr) || ppr < 0) {
      Alert.alert('Validation', 'Points per Rs must be 0 or greater');
      return;
    }
    if (isNaN(exp) || exp < 1) {
      Alert.alert('Validation', 'Expiry must be at least 1 day');
      return;
    }

    setSaving(true);
    try {
      // Try karma service first
      if (serviceConnected) {
        if (config.id) {
          // Update existing settings
          await loyaltyService.updateLoyaltySettings(config.id, {
            pointsPerRupee: ppr,
            pointsExpiryMonths: exp,
            bonusCategories: config.bonusCategories || [],
            isActive: config.isActive,
          });
          logger.info('[LoyaltySettings] Updated via karma service');
        } else {
          // Create new settings
          const result = await loyaltyService.createLoyaltySettings(localMerchantId, {
            name: 'Default Loyalty Program',
            pointsPerRupee: ppr,
            pointsExpiryMonths: exp,
            bonusCategories: config.bonusCategories || [],
            isActive: config.isActive ?? true,
            minimumRedemptionPoints: config.minimumRedemptionPoints || 100,
          });
          setConfig((prev) => ({ ...prev, id: result.id }));
          logger.info('[LoyaltySettings] Created via karma service');
        }
        Alert.alert('Saved', 'Loyalty settings updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // Fall back to AsyncStorage
      await saveToStorage();
      Alert.alert('Saved locally', 'Settings saved on your device. They will sync when online.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      logger.error('[LoyaltySettings] Save failed:', e);
      await saveToStorage();
      Alert.alert('Saved locally', 'Settings saved on your device. They will sync when online.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const toggleCategory = (slug: string) => {
    const currentCategories = config.bonusCategories || [];
    const newCategories = currentCategories.includes(slug)
      ? currentCategories.filter((c) => c !== slug)
      : [...currentCategories, slug];
    setConfig((prev) => ({ ...prev, bonusCategories: newCategories }));
  };

  const handlePointsPerRupeeChange = (text: string) => {
    // User types "10" meaning 1 point per Rs10 -> store as 0.1
    const rupees = parseFloat(text);
    const ppr = isNaN(rupees) || rupees <= 0 ? 0 : 1 / rupees;
    setConfig((prev) => ({
      ...prev,
      pointsPerRupee: ppr,
      pointsToRupeeRatio: rupees || 10,
    }));
  };

  // Derived display: "1 point per RsX"
  const rupeePerPoint = config.pointsToRupeeRatio || (config.pointsPerRupee && config.pointsPerRupee > 0 ? Math.round(1 / config.pointsPerRupee) : 10);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading settings...</Text>
          {serviceConnected && (
            <Text style={styles.serviceStatus}>Connected to Karma Service</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Settings</Text>
        {serviceConnected && (
          <View style={styles.connectedBadge}>
            <View style={styles.connectedDot} />
          </View>
        )}
      </View>

      {/* Service Status Banner */}
      {!serviceConnected && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={16} color="#92400E" />
          <Text style={styles.warningText}>
            Karma service unavailable. Settings will be saved locally.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Points per Rs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points Earning Rate</Text>
          <Text style={styles.sectionDesc}>
            How many Rs does a customer need to spend to earn 1 point?
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>1 point per</Text>
            <TextInput
              style={styles.inlineInput}
              keyboardType="decimal-pad"
              value={rupeePerPoint > 0 ? String(rupeePerPoint) : ''}
              onChangeText={handlePointsPerRupeeChange}
              placeholder="10"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.fieldLabel}>Rs spent</Text>
          </View>
          <Text style={styles.hint}>Default: 1 point per Rs10 (= 0.1 points per Rs1)</Text>
        </View>

        {/* Expiry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points Expiry</Text>
          <Text style={styles.sectionDesc}>How many days before unused points expire?</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.inlineInput}
              keyboardType="number-pad"
              value={String(config.pointsExpiryMonths || 365)}
              onChangeText={(text) => {
                const days = parseInt(text, 10);
                setConfig((prev) => ({ ...prev, pointsExpiryMonths: isNaN(days) ? 365 : days }));
              }}
              placeholder="365"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.fieldLabel}>days (default 365)</Text>
          </View>
        </View>

        {/* Bonus categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Double Points On</Text>
          <Text style={styles.sectionDesc}>
            Customers earn 2x points when these service types are billed.
          </Text>
          <View style={styles.categoryGrid}>
            {SERVICE_CATEGORIES.map((cat) => {
              const active = (config.bonusCategories || []).includes(cat.slug);
              return (
                <TouchableOpacity
                  key={cat.slug}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => toggleCategory(cat.slug)}
                >
                  <Ionicons name={cat.icon} size={18} color={active ? '#fff' : '#6b7280'} />
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Loyalty Programme Active</Text>
              <Text style={styles.sectionDesc}>
                Turn off to pause points earning across all services.
              </Text>
            </View>
            <Switch
              value={config.isActive ?? true}
              onValueChange={(v) => setConfig((prev) => ({ ...prev, isActive: v }))}
              trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
              thumbColor={(config.isActive ?? true) ? '#6366f1' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Summary */}
        {(config.pointsPerRupee || rupeePerPoint) > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              Customers earn <Text style={styles.summaryBold}>1 point per Rs{rupeePerPoint}</Text>{' '}
              spent.
              {((config.bonusCategories || []).length) > 0
                ? ` Double points on: ${(config.bonusCategories || []).join(', ')}.`
                : ''}
              {` Points expire after ${config.pointsExpiryMonths || 365} days.`}
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  serviceStatus: { marginTop: 8, fontSize: 12, color: '#059669' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  connectedBadge: {
    width: 24,
    alignItems: 'flex-end',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#6b7280', marginBottom: 12 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#f9fafb',
    minWidth: 72,
    textAlign: 'center',
  },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 6 },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  categoryChipTextActive: { color: '#fff' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleInfo: { flex: 1 },

  summary: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#6366f1', marginBottom: 6 },
  summaryText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  summaryBold: { fontWeight: '700', color: '#3730a3' },

  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
