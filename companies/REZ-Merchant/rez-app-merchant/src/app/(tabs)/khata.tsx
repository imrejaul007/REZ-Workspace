/**
 * Khata Screen
 * Digital khata book with party-wise balances
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getSupplierBalances, getSupplierLedger, SupplierLedger } from '@/services/b2bApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

interface PartyBalance {
  supplierId: string;
  supplierName: string;
  balance: number;
  lastTransaction?: string;
}

export default function KhataScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [parties, setParties] = useState<PartyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<PartyBalance | null>(null);
  const [ledger, setLedger] = useState<SupplierLedger | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Fetch parties
  const fetchParties = useCallback(async () => {
    if (!merchantId) return;

    try {
      setError(null);
      const balances = await getSupplierBalances(merchantId);
      setParties(balances.map((b) => ({
        supplierId: b.supplierId,
        supplierName: b.supplierName,
        balance: b.balance,
        lastTransaction: undefined,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parties');
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchParties();
      setLoading(false);
    };
    load();
  }, [fetchParties]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParties();
    setRefreshing(false);
  }, [fetchParties]);

  // Select party
  const handleSelectParty = async (party: PartyBalance) => {
    if (selectedParty?.supplierId === party.supplierId) {
      setSelectedParty(null);
      setLedger(null);
      return;
    }

    setSelectedParty(party);
    setLoadingLedger(true);

    try {
      const ledgerData = await getSupplierLedger(party.supplierId, { limit: 20 });
      setLedger(ledgerData);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoadingLedger(false);
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Filter parties
  const filteredParties = parties.filter((p) =>
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalReceivable = parties.filter((p) => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
  const totalPayable = parties.filter((p) => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
  const settledCount = parties.filter((p) => p.balance === 0).length;

  // Party item
  const renderPartyItem = ({ item }: { item: PartyBalance }) => {
    const isSelected = selectedParty?.supplierId === item.supplierId;
    const isReceivable = item.balance > 0;
    const isPayable = item.balance < 0;

    return (
      <TouchableOpacity
        style={[styles.partyItem, isSelected && styles.partyItemSelected]}
        onPress={() => handleSelectParty(item)}
      >
        <View style={styles.partyLeft}>
          <View style={[styles.partyAvatar, isReceivable && styles.partyAvatarReceive, isPayable && styles.partyAvatarPay]}>
            <Text style={styles.partyAvatarText}>
              {item.supplierName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.partyInfo}>
            <Text style={styles.partyName} numberOfLines={1}>
              {item.supplierName}
            </Text>
            <Text style={styles.partyStatus}>
              {isReceivable ? 'To receive' : isPayable ? 'To pay' : 'Settled'}
            </Text>
          </View>
        </View>
        <View style={styles.partyRight}>
          <Text
            style={[
              styles.partyBalance,
              { color: isReceivable ? colors.success[600] : isPayable ? colors.error[600] : colors.text.secondary },
            ]}
          >
            {formatCurrency(Math.abs(item.balance))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Ledger entry item
  const renderLedgerEntry = ({ item, index }: { item: { id: string; type: 'credit' | 'debit'; amount: number; runningBalance: number; description: string; createdAt: string } }) => {
    const isCredit = item.type === 'credit';

    return (
      <View style={styles.ledgerItem}>
        <View style={[styles.ledgerIndicator, { backgroundColor: isCredit ? colors.success[500] : colors.error[500] }]} />
        <View style={styles.ledgerContent}>
          <View style={styles.ledgerHeader}>
            <Text style={styles.ledgerType}>{isCredit ? 'Received' : 'Given'}</Text>
            <Text style={[styles.ledgerAmount, { color: isCredit ? colors.success[600] : colors.error[600] }]}>
              {isCredit ? '+' : '-'} {formatCurrency(item.amount)}
            </Text>
          </View>
          <Text style={styles.ledgerDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.ledgerFooter}>
            <Text style={styles.ledgerDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.ledgerBalance}>
              Bal: {formatCurrency(item.runningBalance)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen message="Loading khata..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Khata Book</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>To Receive</Text>
          <Text style={[styles.statValue, styles.statValueReceive]}>
            {formatCurrency(totalReceivable)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>To Pay</Text>
          <Text style={[styles.statValue, styles.statValuePay]}>
            {formatCurrency(totalPayable)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Settled</Text>
          <Text style={styles.statValue}>{settledCount}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search parties..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Parties List */}
      <View style={styles.partiesContainer}>
        <FlatList
          data={filteredParties}
          renderItem={renderPartyItem}
          keyExtractor={(item) => item.supplierId}
          contentContainerStyle={styles.partiesListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primaryMain]}
              tintColor={colors.primaryMain}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No parties"
              message={searchQuery ? "No parties match your search" : "Add suppliers to track their balances"}
            />
          }
        />
      </View>

      {/* Ledger Panel */}
      {selectedParty && (
        <View style={styles.ledgerPanel}>
          <View style={styles.ledgerPanelHeader}>
            <Text style={styles.ledgerPanelTitle}>{selectedParty.supplierName}</Text>
            <TouchableOpacity onPress={() => { setSelectedParty(null); setLedger(null); }}>
              <Text style={styles.ledgerPanelClose}>Close</Text>
            </TouchableOpacity>
          </View>

          {loadingLedger ? (
            <LoadingSpinner message="Loading entries..." />
          ) : ledger ? (
            <FlatList
              data={ledger.entries.slice(0, 10)}
              renderItem={renderLedgerEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.ledgerListContent}
              ListEmptyComponent={
                <EmptyState
                  title="No transactions"
                  message="No transactions yet"
                />
              }
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  } as ViewStyle,
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 4,
  } as TextStyle,
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  statValueReceive: {
    color: colors.success[600],
  } as TextStyle,
  statValuePay: {
    color: colors.error[600],
  } as TextStyle,
  searchContainer: {
    padding: spacing.base,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  searchInput: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  } as TextStyle,
  partiesContainer: {
    flex: 1,
  } as ViewStyle,
  partiesListContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  partyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  } as ViewStyle,
  partyItemSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
  } as ViewStyle,
  partyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  partyAvatarReceive: {
    backgroundColor: colors.success[100],
  } as ViewStyle,
  partyAvatarPay: {
    backgroundColor: colors.error[100],
  } as ViewStyle,
  partyAvatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  partyInfo: {
    marginLeft: spacing.md,
    flex: 1,
  } as ViewStyle,
  partyName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  partyStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  } as TextStyle,
  partyRight: {
    alignItems: 'flex-end',
  } as ViewStyle,
  partyBalance: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  ledgerPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
  ledgerPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  ledgerPanelTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  ledgerPanelClose: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  ledgerListContent: {
    padding: spacing.base,
  } as ViewStyle,
  ledgerItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  } as ViewStyle,
  ledgerIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: spacing.sm,
  } as ViewStyle,
  ledgerContent: {
    flex: 1,
  } as ViewStyle,
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  } as ViewStyle,
  ledgerType: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  ledgerAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  } as TextStyle,
  ledgerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  } as TextStyle,
  ledgerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  ledgerDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  ledgerBalance: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
});
