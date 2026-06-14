import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useStore } from '@/contexts/StoreContext';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';
import api from '@/services/api';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

interface PaymentSettings {
  acceptUPI: boolean;
  acceptCards: boolean;
  acceptPayLater: boolean;
  acceptRezCoins: boolean;
  acceptPromoCoins: boolean;
  acceptPayBill: boolean;
  maxCoinRedemptionPercent: number;
  allowHybridPayment: boolean;
  allowOffers: boolean;
  allowCashback: boolean;
  upiId: string;
  upiName: string;
}

interface VisitMilestone {
  visits: number;
  coinsReward: number;
}

interface RewardRules {
  baseCashbackPercent: number;
  reviewBonusCoins: number;
  reviewBonusCoinType?: 'rez' | 'branded';
  socialShareBonusCoins: number;
  minimumAmountForReward: number;
  firstVisitBonus?: number;
  visitMilestoneRewards?: VisitMilestone[];
  extraRewardThreshold?: number;
  extraRewardCoins?: number;
}

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    acceptUPI: true,
    acceptCards: true,
    acceptPayLater: false,
    acceptRezCoins: true,
    acceptPromoCoins: true,
    acceptPayBill: true,
    maxCoinRedemptionPercent: 100,
    allowHybridPayment: true,
    allowOffers: true,
    allowCashback: true,
    upiId: '',
    upiName: '',
  });

  const [rewardRules, setRewardRules] = useState<RewardRules>({
    baseCashbackPercent: 5,
    reviewBonusCoins: 5,
    socialShareBonusCoins: 10,
    minimumAmountForReward: 100,
    extraRewardThreshold: undefined,
    extraRewardCoins: undefined,
  });

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get(`/store-payment/settings/${storeId}`);
      if (response.success) {
        if (response.data?.paymentSettings) {
          setPaymentSettings(response.data.paymentSettings);
        }
        if (response.data?.rewardRules) {
          setRewardRules(response.data.rewardRules);
        }
      }
    } catch (error) {
      logger.error('Error fetching settings:', error);
      setErrorMessage({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to fetch payment settings',
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useFocusEffect(
    useCallback(() => {
      if (storeId) {
        fetchSettings();
      }
    }, [storeId, fetchSettings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  // Save settings
  const saveSettings = async () => {
    // Validate UPI configuration
    if (paymentSettings.acceptUPI) {
      if (!paymentSettings.upiId || !paymentSettings.upiId.trim()) {
        setErrorMessage({
          title: 'Validation Error',
          message: 'UPI ID is required when UPI payment is enabled',
        });
        setShowErrorModal(true);
        return;
      }
      // MA-GAP-138: NPCI-compliant UPI ID regex — allows hyphens and dots in handle after @
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;
      if (!upiRegex.test(paymentSettings.upiId.trim())) {
        setErrorMessage({
          title: 'Validation Error',
          message: 'Invalid UPI ID format (e.g., yourstore@upi)',
        });
        setShowErrorModal(true);
        return;
      }
    }

    setSaving(true);
    try {
      const response = await api.put(`/store-payment/settings/${storeId}`, {
        paymentSettings,
        rewardRules,
      });
      if (response.success) {
        setSuccessMessage({
          title: 'Success',
          message: 'Payment settings updated successfully',
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      logger.error('Error saving settings:', error);
      setErrorMessage({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save payment settings',
      });
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Update payment setting
  const updatePaymentSetting = (key: keyof PaymentSettings, value) => {
    setPaymentSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Update reward rule
  const updateRewardRule = (key: keyof RewardRules, value) => {
    setRewardRules((prev) => ({ ...prev, [key]: value }));
  };

  if (!storeId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Error: Store ID is missing</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Settings</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 20 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <Text style={styles.sectionDescription}>
            Control which payment methods customers can use at your store
          </Text>

          <View style={styles.settingsList}>
            <SettingToggle
              icon="card-outline"
              title="Accept UPI"
              description="Allow customers to pay via UPI apps"
              value={paymentSettings.acceptUPI}
              onValueChange={(value) => updatePaymentSetting('acceptUPI', value)}
            />

            <SettingToggle
              icon="card"
              title="Accept Cards"
              description="Allow credit/debit card payments"
              value={paymentSettings.acceptCards}
              onValueChange={(value) => updatePaymentSetting('acceptCards', value)}
            />

            <SettingToggle
              icon="time-outline"
              title="Accept Pay Later"
              description="Allow buy now, pay later options"
              value={paymentSettings.acceptPayLater}
              onValueChange={(value) => updatePaymentSetting('acceptPayLater', value)}
            />
          </View>
        </View>

        {/* Coin Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ReZ Coins</Text>
          <Text style={styles.sectionDescription}>
            Configure how customers can use their coins at your store
          </Text>

          <View style={styles.settingsList}>
            <SettingToggle
              icon="wallet-outline"
              title="Accept ReZ Coins"
              description="Allow customers to redeem their ReZ coins"
              value={paymentSettings.acceptRezCoins}
              onValueChange={(value) => updatePaymentSetting('acceptRezCoins', value)}
            />

            <SettingToggle
              icon="gift-outline"
              title="Accept Promo Coins"
              description="Allow promotional coin redemption"
              value={paymentSettings.acceptPromoCoins}
              onValueChange={(value) => updatePaymentSetting('acceptPromoCoins', value)}
            />

            <SettingToggle
              icon="receipt-outline"
              title="Accept PayBill Balance"
              description="Allow PayBill balance usage"
              value={paymentSettings.acceptPayBill}
              onValueChange={(value) => updatePaymentSetting('acceptPayBill', value)}
            />

            <SettingToggle
              icon="git-merge-outline"
              title="Allow Hybrid Payment"
              description="Let customers split payment between coins and UPI/card"
              value={paymentSettings.allowHybridPayment}
              onValueChange={(value) => updatePaymentSetting('allowHybridPayment', value)}
            />
          </View>

          {/* Max Coin Redemption Slider */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Max Coin Redemption</Text>
              <Text style={styles.sliderValue}>{paymentSettings.maxCoinRedemptionPercent}%</Text>
            </View>
            <Text style={styles.sliderDescription}>
              Maximum percentage of bill that can be paid using coins
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={paymentSettings.maxCoinRedemptionPercent}
              onValueChange={(value) => updatePaymentSetting('maxCoinRedemptionPercent', value)}
              minimumTrackTintColor={Colors.light.primary}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={Colors.light.primary}
            />
            <View style={styles.sliderMarks}>
              <Text style={styles.sliderMark}>0%</Text>
              <Text style={styles.sliderMark}>50%</Text>
              <Text style={styles.sliderMark}>100%</Text>
            </View>
          </View>
        </View>

        {/* Offers & Cashback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offers & Cashback</Text>
          <Text style={styles.sectionDescription}>Enable or disable promotional features</Text>

          <View style={styles.settingsList}>
            <SettingToggle
              icon="pricetag-outline"
              title="Allow Offers"
              description="Show available offers to customers"
              value={paymentSettings.allowOffers}
              onValueChange={(value) => updatePaymentSetting('allowOffers', value)}
            />

            <SettingToggle
              icon="cash-outline"
              title="Allow Cashback"
              description="Give cashback on payments"
              value={paymentSettings.allowCashback}
              onValueChange={(value) => updatePaymentSetting('allowCashback', value)}
            />
          </View>
        </View>

        {/* Reward Rules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reward Rules</Text>
          <Text style={styles.sectionDescription}>
            Configure how much customers earn when they pay at your store
          </Text>

          {/* Base Cashback */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Base Cashback %</Text>
              <Text style={styles.sliderValue}>{rewardRules.baseCashbackPercent}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={20}
              step={1}
              value={rewardRules.baseCashbackPercent}
              onValueChange={(value) => updateRewardRule('baseCashbackPercent', value)}
              minimumTrackTintColor={Colors.light.primary}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={Colors.light.primary}
            />
          </View>

          {/* Bonus Coins */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Review Bonus Coins</Text>
            <Text style={styles.inputDescription}>Coins awarded when customer leaves a review</Text>
            <TextInput
              style={styles.numberInput}
              value={rewardRules.reviewBonusCoins?.toString() || ''}
              onChangeText={(text) => updateRewardRule('reviewBonusCoins', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Social Share Bonus</Text>
            <Text style={styles.inputDescription}>Coins awarded for sharing on social media</Text>
            <TextInput
              style={styles.numberInput}
              value={rewardRules.socialShareBonusCoins?.toString() || ''}
              onChangeText={(text) =>
                updateRewardRule('socialShareBonusCoins', parseInt(text) || 0)
              }
              keyboardType="numeric"
              placeholder="10"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Minimum Amount for Rewards</Text>
            <Text style={styles.inputDescription}>Minimum bill amount to earn rewards (₹)</Text>
            <TextInput
              style={styles.numberInput}
              value={rewardRules.minimumAmountForReward?.toString() || ''}
              onChangeText={(text) =>
                updateRewardRule('minimumAmountForReward', parseInt(text) || 0)
              }
              keyboardType="numeric"
              placeholder="100"
            />
          </View>

          {/* First Visit Bonus */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Visit Bonus (coins)</Text>
            <Text style={styles.inputDescription}>
              Extra coins awarded on user's very first payment at your store
            </Text>
            <TextInput
              style={styles.numberInput}
              value={rewardRules.firstVisitBonus?.toString() || '0'}
              onChangeText={(text) => updateRewardRule('firstVisitBonus', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Review Coin Type */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Review Bonus Coin Type</Text>
            <Text style={styles.inputDescription}>
              Type of coins awarded for reviews (branded = only usable at your store)
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {(['branded', 'rez'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => updateRewardRule('reviewBonusCoinType', type)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      rewardRules.reviewBonusCoinType === type ? '#7C3AED' : '#F3F4F6',
                  }}
                >
                  <Text
                    style={{
                      color: rewardRules.reviewBonusCoinType === type ? '#FFF' : '#333',
                      fontWeight: '600',
                      fontSize: 13,
                    }}
                  >
                    {type === 'branded' ? 'Branded Coins' : 'REZ Coins'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Visit Milestone Rewards */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Visit Milestone Rewards</Text>
            <Text style={styles.inputDescription}>
              Bonus coins at specific visit counts (e.g. 5th visit = 50 coins)
            </Text>
            {(rewardRules.visitMilestoneRewards || []).map((m, idx) => (
              <View
                key={idx}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}
              >
                <TextInput
                  style={[styles.numberInput, { flex: 1 }]}
                  value={String(m.visits)}
                  onChangeText={(v) => {
                    const updated = [...(rewardRules.visitMilestoneRewards || [])];
                    updated[idx] = { ...updated[idx], visits: parseInt(v, 10) || 1 };
                    updateRewardRule('visitMilestoneRewards', updated);
                  }}
                  keyboardType="numeric"
                  placeholder="Visit #"
                />
                <TextInput
                  style={[styles.numberInput, { flex: 1 }]}
                  value={String(m.coinsReward)}
                  onChangeText={(v) => {
                    const updated = [...(rewardRules.visitMilestoneRewards || [])];
                    updated[idx] = { ...updated[idx], coinsReward: parseInt(v, 10) || 0 };
                    updateRewardRule('visitMilestoneRewards', updated);
                  }}
                  keyboardType="numeric"
                  placeholder="Coins"
                />
                <Pressable
                  onPress={() => {
                    const updated = (rewardRules.visitMilestoneRewards || []).filter(
                      (_, i: number) => i !== idx
                    );
                    updateRewardRule('visitMilestoneRewards', updated);
                  }}
                >
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => {
                const current = rewardRules.visitMilestoneRewards || [];
                updateRewardRule('visitMilestoneRewards', [
                  ...current,
                  { visits: 5, coinsReward: 50 },
                ]);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
            >
              <Ionicons name="add-circle" size={16} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontSize: 13 }}>Add Milestone</Text>
            </Pressable>
          </View>
        </View>

        {/* UPI Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPI Configuration</Text>
          <Text style={styles.sectionDescription}>Your UPI details for receiving payments</Text>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>UPI ID</Text>
            <TextInput
              style={styles.textInput}
              value={paymentSettings.upiId}
              onChangeText={(text) => updatePaymentSetting('upiId', text)}
              placeholder="yourstore@upi"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <Text style={styles.inputDescription}>Name shown to customers during payment</Text>
            <TextInput
              style={styles.textInput}
              value={paymentSettings.upiName}
              onChangeText={(text) => updatePaymentSetting('upiName', text)}
              placeholder="Your Store Name"
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <SuccessModal
        visible={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
      />

      <ErrorModal
        visible={showErrorModal}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

// Setting Toggle Component
interface SettingToggleProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
}) => (
  <View style={styles.settingItem}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={24} color={Colors.light.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E7EB', true: '#A5F3FC' }}
      thumbColor={value ? Colors.light.primary : '#9CA3AF'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  sliderSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  sliderDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderMark: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  inputSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.textHeading,
    width: 120,
  },
  textInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.textHeading,
  },
});
