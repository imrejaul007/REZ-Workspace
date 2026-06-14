import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import {
  coinsService,
  CoinStats,
  CoinAwardHistoryItem,
  CustomerSearchResult,
  RecentCustomer,
  WalletBalanceResponse,
} from '@/services/api/coins';
import { customerInsightsService, CustomerProfile } from '@/services/api/customerInsights';
import { useStore } from '@/contexts/StoreContext';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

type TabType = 'award' | 'history' | 'stats';

export default function CoinsScreen() {
  const { activeStore } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('award');
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [history, setHistory] = useState<CoinAwardHistoryItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<WalletBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Award form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [coinAmount, setCoinAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const storeId = activeStore?._id;

        setIsLoadingRecent(true);
        const [statsData, historyData, balanceData, recentData] = await Promise.all([
          coinsService.getStats(storeId),
          coinsService.getAwardHistory(1, 50, storeId),
          coinsService.getWalletBalance().catch(() => null),
          coinsService.getRecentCustomers(storeId).catch(() => []),
        ]);

        setStats(statsData);
        setHistory(historyData.transactions);
        if (balanceData) setWalletBalance(balanceData);
        setRecentCustomers(recentData);
        setIsLoadingRecent(false);
      } catch (error) {
        if (__DEV__) console.error('Error fetching coin data:', error);
        // Don't show error on initial load if no data exists yet
        if (!isLoading) {
          showAlert('Error', error.message || 'Failed to load coin data');
        }
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [activeStore?._id]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh stats and history whenever the merchant returns to this screen
  // (e.g. after awarding coins to a customer and navigating back)
  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [fetchData])
  );

  // Debounced live search as user types
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Wait 400ms after user stops typing before searching
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await coinsService.searchCustomer(text.trim());
        setSearchResults(results);
      } catch (error) {
        if (__DEV__) console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleSelectCustomer = async (customer: CustomerSearchResult | RecentCustomer) => {
    setSelectedCustomer({
      id: customer.id,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      avatar: customer.avatar,
    });
    setSearchResults([]);
    setSearchQuery('');

    // Fetch customer profile
    try {
      setLoadingProfile(true);
      const result = await customerInsightsService.getProfile(customer.id);
      setCustomerProfile(result.data);
    } catch (error) {
      if (__DEV__) console.error('Failed to load customer profile:', error);
      setCustomerProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAwardCoins = async () => {
    if (!selectedCustomer) {
      showAlert('Select Customer', 'Please search and select a customer first');
      return;
    }

    if (!activeStore?._id) {
      showAlert('No Store', 'Please select a store first');
      return;
    }

    const amount = parseInt(coinAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid coin amount');
      return;
    }

    if (amount > (stats?.limits.maxCoinsPerAward || 1000)) {
      showAlert(
        'Amount Too High',
        `Maximum coins per award is ${stats?.limits.maxCoinsPerAward || 1000}`
      );
      return;
    }

    try {
      setIsAwarding(true);
      const result = await coinsService.awardCoins({
        userId: selectedCustomer.id,
        storeId: activeStore._id,
        amount,
        reason: reason.trim() || undefined,
      });

      showAlert('Success', result.message);

      // Update wallet balance from response
      if (result.data?.merchantWalletBalance) {
        setWalletBalance(result.data.merchantWalletBalance);
      }

      // Reset form
      setSelectedCustomer(null);
      setCustomerProfile(null);
      setCoinAmount('');
      setReason('');

      // Refresh data
      fetchData();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to award coins');
    } finally {
      setIsAwarding(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatRelativeDate = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return Colors.light.primary;
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getCustomerName = (item: CoinAwardHistoryItem) => {
    if (item.user?.profile) {
      const { firstName, lastName } = item.user.profile;
      return `${firstName || ''} ${lastName || ''}`.trim() || item.user.phoneNumber;
    }
    return item.user?.phoneNumber || 'Unknown';
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
    >
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Reward Coins
            </ThemedText>
            <ThemedText style={styles.subtitle}>Award branded coins to your customers</ThemedText>
          </View>
        </View>

        {/* Quick Stats */}
        {stats && (
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatValue}>
                {stats.overall.totalCoinsAwarded}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Total Awarded</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatValue}>{stats.today.coinsAwarded}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Today</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatValue}>{stats.overall.uniqueCustomers}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Customers</ThemedText>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['award', 'history', 'stats'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'award' ? 'Award Coins' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Award Tab */}
        {activeTab === 'award' && (
          <View style={styles.awardContainer}>
            {/* Wallet Balance */}
            {walletBalance && (
              <View style={styles.walletBalanceCard}>
                <View style={styles.walletBalanceRow}>
                  <View style={styles.walletBalanceInfo}>
                    <ThemedText style={styles.walletBalanceLabel}>Available Balance</ThemedText>
                    <ThemedText style={styles.walletBalanceValue}>
                      {walletBalance.available} coins
                    </ThemedText>
                  </View>
                  <Ionicons name="wallet" size={28} color={Colors.light.primary} />
                </View>
                {walletBalance.available < 100 && (
                  <View style={styles.lowBalanceWarning}>
                    <Ionicons name="warning" size={16} color={Colors.light.warning} />
                    <ThemedText style={styles.lowBalanceText}>
                      Low balance - top up your wallet to continue awarding coins
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Customer Search */}
            <View style={styles.searchSection}>
              <ThemedText style={styles.sectionLabel}>Find Customer</ThemedText>
              <View style={styles.searchInputWrapper}>
                <Ionicons
                  name="search"
                  size={18}
                  color={Colors.light.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, phone, or email"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && (
                  <ActivityIndicator
                    size="small"
                    color={Colors.light.primary}
                    style={styles.searchSpinner}
                  />
                )}
                {searchQuery.length > 0 && !isSearching && (
                  <TouchableOpacity
                    onPress={() => handleSearchChange('')}
                    style={styles.searchClear}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Results Dropdown */}
              {searchQuery.trim().length > 0 && !isSearching && searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectCustomer(customer)}
                    >
                      <View style={styles.customerAvatar}>
                        <Ionicons name="person" size={20} color={Colors.light.textSecondary} />
                      </View>
                      <View style={styles.customerInfo}>
                        <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
                        <ThemedText style={styles.customerPhone}>{customer.phoneNumber}</ThemedText>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={Colors.light.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No results message */}
              {searchQuery.trim().length > 0 && !isSearching && searchResults.length === 0 && (
                <View style={styles.noResults}>
                  <ThemedText style={styles.noResultsText}>No customers found</ThemedText>
                </View>
              )}
            </View>

            {/* Recent Customers - Your Customers who purchased from store */}
            {!selectedCustomer && searchQuery.trim().length === 0 && (
              <View style={styles.recentSection}>
                <ThemedText style={styles.sectionLabel}>Your Customers</ThemedText>
                {isLoadingRecent ? (
                  <View style={styles.recentLoading}>
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                  </View>
                ) : recentCustomers.length === 0 ? (
                  <View style={styles.recentEmpty}>
                    <Ionicons name="people-outline" size={32} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.recentEmptyText}>
                      Customers who order from your store will appear here
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.recentList}>
                    {recentCustomers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.recentItem}
                        onPress={() => handleSelectCustomer(customer)}
                      >
                        <View style={styles.customerAvatar}>
                          <Ionicons name="person" size={20} color={Colors.light.primary} />
                        </View>
                        <View style={styles.recentInfo}>
                          <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
                          <ThemedText style={styles.customerPhone}>
                            {customer.phoneNumber}
                          </ThemedText>
                        </View>
                        <View style={styles.recentMeta}>
                          <ThemedText style={styles.recentOrders}>
                            {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Selected Customer */}
            {selectedCustomer && (
              <>
                <View style={styles.selectedCustomer}>
                  <View style={styles.selectedCustomerInfo}>
                    <View style={styles.selectedAvatar}>
                      <Ionicons name="person" size={24} color={Colors.light.primary} />
                    </View>
                    <View>
                      <ThemedText style={styles.selectedName}>{selectedCustomer.name}</ThemedText>
                      <ThemedText style={styles.selectedPhone}>
                        {selectedCustomer.phoneNumber}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCustomer(null);
                      setCustomerProfile(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Customer Profile Card */}
                {loadingProfile ? (
                  <View style={styles.profileLoading}>
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                  </View>
                ) : customerProfile ? (
                  <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                      <View
                        style={[
                          styles.tierBadge,
                          { backgroundColor: getTierColor(customerProfile.tier) },
                        ]}
                      >
                        <Ionicons name="trophy" size={16} color="white" />
                        <ThemedText style={styles.tierText}>
                          {getTierLabel(customerProfile.tier)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.profileStats}>
                        {customerProfile.visitCount}{' '}
                        {customerProfile.visitCount === 1 ? 'visit' : 'visits'}
                      </ThemedText>
                    </View>
                    <View style={styles.profileSpend}>
                      <ThemedText style={styles.profileLabel}>Total spent here:</ThemedText>
                      <ThemedText style={styles.profileValue}>
                        ₹{customerProfile.totalSpend.toLocaleString('en-IN')}
                      </ThemedText>
                    </View>
                    {customerProfile.lastVisitDate && (
                      <ThemedText style={styles.lastVisit}>
                        Last visit: {formatRelativeDate(customerProfile.lastVisitDate)}
                      </ThemedText>
                    )}
                    {customerProfile.isFirstVisit && (
                      <View style={styles.firstVisitBadge}>
                        <Ionicons name="sparkles" size={14} color={Colors.light.warning} />
                        <ThemedText style={styles.firstVisitText}>First visit today!</ThemedText>
                      </View>
                    )}
                  </View>
                ) : null}
              </>
            )}

            {/* Coin Amount */}
            <View style={styles.inputSection}>
              <ThemedText style={styles.sectionLabel}>Coin Amount</ThemedText>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter coins to award"
                keyboardType="numeric"
                value={coinAmount}
                onChangeText={setCoinAmount}
              />
              <ThemedText style={styles.inputHint}>
                Max: {stats?.limits.maxCoinsPerAward || 1000} coins per award
              </ThemedText>
            </View>

            {/* Reason */}
            <View style={styles.inputSection}>
              <ThemedText style={styles.sectionLabel}>Reason (Optional)</ThemedText>
              <TextInput
                style={styles.reasonInput}
                placeholder="e.g., Loyalty reward, Birthday bonus"
                value={reason}
                onChangeText={setReason}
                multiline
              />
            </View>

            {/* Award Button */}
            <TouchableOpacity
              style={[
                styles.awardButton,
                (!selectedCustomer || !coinAmount || isAwarding) && styles.disabledButton,
              ]}
              onPress={handleAwardCoins}
              disabled={!selectedCustomer || !coinAmount || isAwarding}
            >
              <Ionicons name="gift" size={20} color={Colors.light.background} />
              <ThemedText style={styles.awardButtonText}>
                {isAwarding ? 'Awarding...' : 'Award Coins'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.historyContainer}>
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={48} color={Colors.light.textSecondary} />
                <ThemedText style={styles.emptyText}>No coin awards yet</ThemedText>
                <ThemedText style={styles.emptySubtext}>Start rewarding your customers!</ThemedText>
              </View>
            ) : (
              history.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="gift" size={24} color={Colors.light.primary} />
                  </View>
                  <View style={styles.historyDetails}>
                    <ThemedText style={styles.historyCustomer}>{getCustomerName(item)}</ThemedText>
                    <ThemedText style={styles.historyReason}>
                      {item.reason || 'Bonus coins'}
                    </ThemedText>
                    <ThemedText style={styles.historyDate}>{formatDate(item.createdAt)}</ThemedText>
                  </View>
                  <View style={styles.historyAmount}>
                    <ThemedText style={styles.historyCoins}>+{item.amount}</ThemedText>
                    <ThemedText style={styles.coinsLabel}>coins</ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="gift" size={28} color={Colors.light.primary} />
                <ThemedText style={styles.statValue}>{stats.overall.totalCoinsAwarded}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Coins Awarded</ThemedText>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-done" size={28} color={Colors.light.success} />
                <ThemedText style={styles.statValue}>{stats.overall.totalAwards}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Awards</ThemedText>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={28} color={Colors.light.warning} />
                <ThemedText style={styles.statValue}>{stats.overall.uniqueCustomers}</ThemedText>
                <ThemedText style={styles.statLabel}>Unique Customers</ThemedText>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="analytics" size={28} color={Colors.light.textSecondary} />
                <ThemedText style={styles.statValue}>{stats.overall.avgCoinsPerAward}</ThemedText>
                <ThemedText style={styles.statLabel}>Avg per Award</ThemedText>
              </View>
            </View>

            <ThemedText type="subtitle" style={styles.monthlyTitle}>
              Monthly Breakdown
            </ThemedText>
            {stats.monthlyBreakdown.length === 0 ? (
              <View style={styles.noMonthlyData}>
                <ThemedText style={styles.noDataText}>No monthly data yet</ThemedText>
              </View>
            ) : (
              stats.monthlyBreakdown.map((month, index) => (
                <View key={index} style={styles.monthlyCard}>
                  <ThemedText style={styles.monthlyLabel}>
                    {new Date(month.year, month.month - 1).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </ThemedText>
                  <View style={styles.monthlyStats}>
                    <ThemedText style={styles.monthlyCoins}>{month.coinsAwarded} coins</ThemedText>
                    <ThemedText style={styles.monthlyAwards}>{month.awardCount} awards</ThemedText>
                  </View>
                </View>
              ))
            )}
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
  header: {
    marginBottom: 16,
  },
  title: {
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    color: Colors.light.background,
    fontSize: 22,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.light.background,
  },
  awardContainer: {},
  walletBalanceCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletBalanceInfo: {},
  walletBalanceLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  walletBalanceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  lowBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  lowBalanceText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.warning,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  searchClear: {
    marginLeft: 8,
    padding: 4,
  },
  searchResults: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  noResults: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginTop: 6,
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentLoading: {
    padding: 20,
    alignItems: 'center',
  },
  recentEmpty: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  recentEmptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  recentList: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  recentInfo: {
    flex: 1,
  },
  recentMeta: {
    alignItems: 'flex-end',
  },
  recentOrders: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  selectedCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedPhone: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  profileLoading: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  tierText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  profileStats: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  profileSpend: {
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  profileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
    marginTop: 2,
  },
  lastVisit: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  firstVisitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.warning}15`,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
  },
  firstVisitText: {
    fontSize: 12,
    color: Colors.light.warning,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  amountInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  reasonInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  awardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  awardButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {},
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyCustomer: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  historyReason: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyCoins: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  coinsLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  statsContainer: {},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  monthlyTitle: {
    marginBottom: 12,
    color: Colors.light.text,
  },
  noMonthlyData: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    color: Colors.light.textSecondary,
  },
  monthlyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  monthlyLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  monthlyStats: {
    alignItems: 'flex-end',
  },
  monthlyCoins: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  monthlyAwards: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
