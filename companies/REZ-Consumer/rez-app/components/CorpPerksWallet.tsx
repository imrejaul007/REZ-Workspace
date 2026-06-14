// @ts-nocheck
/**
 * CorpPerksWallet
 * Shows corporate meal benefit balance using existing corporateService
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { corporateService } from '@/services';

interface CorpPerksWalletProps {
  employeeId?: string;
  onWalletSelect?: (walletType: 'personal' | 'corporate') => void;
  showBalance?: boolean;
  style?: object;
}

interface MealBenefitBalance {
  employeeId: string;
  monthlyAllocation: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  dailyLimit: number;
  dailyUsed: number;
  categories: string[];
  expiresAt: string;
}

const CorpPerksWallet: React.FC<CorpPerksWalletProps> = ({
  employeeId,
  onWalletSelect,
  showBalance = true,
  style,
}) => {
  const [balance, setBalance] = useState<MealBenefitBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<'personal' | 'corporate'>('personal');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [employeeId]);

  const fetchBalance = async () => {
    if (!employeeId) return;

    setLoading(true);
    setError(null);

    try {
      // Use existing corporateService
      const result = await corporateService.getEmployeeBenefits(employeeId);
      if (result.success && result.data) {
        const data = result.data as unknown;
        setBalance({
          employeeId,
          monthlyAllocation: data.mealAllowance?.monthlyLimit || 5000,
          monthlyUsed: data.mealAllowance?.monthlyUsed || 0,
          monthlyRemaining: data.mealAllowance?.monthlyRemaining || 5000,
          dailyLimit: data.mealAllowance?.dailyLimit || 500,
          dailyUsed: data.mealAllowance?.dailyUsed || 0,
          categories: data.mealAllowance?.categories || ['food', 'dining'],
          expiresAt: data.mealAllowance?.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        setError('Unable to load meal benefits');
      }
    } catch {
      setError('Service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSelect = useCallback((wallet: 'personal' | 'corporate') => {
    setSelectedWallet(wallet);
    onWalletSelect?.(wallet);
  }, [onWalletSelect]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  const percentUsed = balance
    ? Math.round((balance.monthlyUsed / balance.monthlyAllocation) * 100)
    : 0;

  if (!employeeId) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#5856D6" />
        <Text style={styles.loadingText}>Loading meal benefits...</Text>
      </View>
    );
  }

  if (error || !balance) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🍽️</Text>
          </View>
          <View>
            <Text style={styles.title}>Meal Benefit</Text>
            <Text style={styles.subtitle}>
              {balance.monthlyRemaining > 0
                ? `${formatCurrency(balance.monthlyRemaining)} remaining this month`
                : 'No balance remaining'}
            </Text>
          </View>
        </View>
        {balance.expiresAt && (
          <View style={styles.expiresBadge}>
            <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
            <Text style={styles.expiresText}>
              Expires {new Date(balance.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {showBalance && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(percentUsed, 100)}%` },
                percentUsed > 80 && styles.progressFillWarning
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {formatCurrency(balance.monthlyUsed)} used of {formatCurrency(balance.monthlyAllocation)}
            </Text>
            <Text style={styles.progressPercent}>{percentUsed}%</Text>
          </View>
        </View>
      )}

      {/* Daily Limit */}
      {balance.dailyLimit > 0 && (
        <View style={styles.dailyLimit}>
          <Ionicons name="time-outline" size={14} color="#8E8E93" />
          <Text style={styles.dailyLimitText}>
            Daily limit: {formatCurrency(balance.dailyLimit - balance.dailyUsed)} remaining today
          </Text>
        </View>
      )}

      {/* Wallet Toggle */}
      <View style={styles.walletToggle}>
        <Pressable
          style={[styles.walletOption, selectedWallet === 'personal' && styles.walletOptionActive]}
          onPress={() => handleWalletSelect('personal')}
        >
          <Ionicons
            name={selectedWallet === 'personal' ? 'radio-button-on' : 'radio-button-off'}
            size={18}
            color={selectedWallet === 'personal' ? '#5856D6' : '#8E8E93'}
          />
          <Text style={[styles.walletOptionText, selectedWallet === 'personal' && styles.walletOptionTextActive]}>
            Personal Wallet
          </Text>
        </Pressable>

        <Pressable
          style={[styles.walletOption, selectedWallet === 'corporate' && styles.walletOptionActive]}
          onPress={() => handleWalletSelect('corporate')}
        >
          <Ionicons
            name={selectedWallet === 'corporate' ? 'radio-button-on' : 'radio-button-off'}
            size={18}
            color={selectedWallet === 'corporate' ? '#5856D6' : '#8E8E93'}
          />
          <Text style={[styles.walletOptionText, selectedWallet === 'corporate' && styles.walletOptionTextActive]}>
            Meal Benefit
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  expiresBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  expiresText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5856D6',
    borderRadius: 4,
  },
  progressFillWarning: {
    backgroundColor: '#FF9500',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5856D6',
  },
  dailyLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  dailyLimitText: {
    fontSize: 12,
    color: '#6B7280',
  },
  walletToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  walletOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  walletOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  walletOptionText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  walletOptionTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
});

export default CorpPerksWallet;
