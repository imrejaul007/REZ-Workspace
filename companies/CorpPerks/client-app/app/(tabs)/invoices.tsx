// ==========================================
// CorpPerks Client App - Invoices List Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Badge, Button, EmptyState } from '../../src/components';
import { api } from '../../src/services/api';
import { useStore } from '../../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatCurrency,
  formatDate,
  getInvoiceStatusColor,
} from '../../src/utils/theme';
import { Invoice } from '../../src/types';

export default function InvoicesListScreen() {
  const navigation = useNavigation<any>();
  const { setInvoices } = useStore();
  const [invoices, setInvoicesData] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'sent', label: 'Sent' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  const loadInvoices = async () => {
    try {
      const response = await api.getInvoices();
      if (response.success && response.data) {
        setInvoicesData(response.data);
        setFilteredInvoices(response.data);
        setInvoices(response.data);
      }
    } catch (error) {
      logger.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredInvoices(invoices);
    } else {
      setFilteredInvoices(invoices.filter((inv) => inv.status === selectedFilter));
    }
  }, [selectedFilter, invoices]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const handlePayNow = (invoice: Invoice) => {
    Alert.alert(
      'Pay Invoice',
      `Would you like to pay ${formatCurrency(invoice.total)} for invoice ${invoice.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => logger.info('Pay:', invoice.id) },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'settled':
        return 'check_circle';
      case 'sent':
      case 'pending':
        return 'schedule';
      case 'overdue':
      case 'past_due':
        return 'warning';
      case 'draft':
        return 'edit';
      default:
        return 'receipt';
    }
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'settled') return Colors.textMuted;
    const daysUntil = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return Colors.error;
    if (daysUntil <= 7) return Colors.warning;
    return Colors.textSecondary;
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const isOverdue = item.status === 'overdue';
    const isPending = item.status === 'pending' || item.status === 'sent';

    return (
      <Card style={[styles.invoiceCard, isOverdue && styles.invoiceOverdue]}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceInfo}>
            <View style={styles.invoiceNumberRow}>
              <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
              <Badge
                label={item.status}
                variant="status"
                size="sm"
              />
            </View>
            {item.projectName && (
              <Text style={styles.projectName}>{item.projectName}</Text>
            )}
          </View>
          <View style={styles.invoiceAmount}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.total)}</Text>
          </View>
        </View>

        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Issue Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.issueDate, 'short')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getDueDateColor(item.dueDate, item.status) },
                ]}
              >
                {formatDate(item.dueDate, 'short')}
              </Text>
            </View>
          </View>

          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(item.amount)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Tax ({((item.tax / item.amount) * 100).toFixed(0)}%)</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(item.tax)}</Text>
            </View>
            <View style={[styles.breakdownItem, styles.breakdownTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.invoiceActions}>
            <Button
              title="View Details"
              onPress={() => {}}
              variant="outline"
              size="sm"
              style={styles.actionButton}
            />
            <Button
              title="Pay Now"
              onPress={() => handlePayNow(item)}
              size="sm"
              style={styles.actionButton}
            />
          </View>
        )}

        {item.status === 'paid' && item.paidDate && (
          <View style={styles.paidBanner}>
            <Text style={styles.paidIcon}>check_circle</Text>
            <Text style={styles.paidText}>
              Paid on {formatDate(item.paidDate, 'long')}
              {item.paymentMethod && ` via ${item.paymentMethod}`}
            </Text>
          </View>
        )}

        {item.status === 'overdue' && (
          <View style={styles.overdueBanner}>
            <Text style={styles.overdueIcon}>warning</Text>
            <Text style={styles.overdueText}>
              Overdue by {Math.ceil(
                (new Date().getTime() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24)
              )} days
            </Text>
          </View>
        )}
      </Card>
    );
  };

  // Summary stats
  const totalPending = invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOverdue = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(totalPending)}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            {formatCurrency(totalOverdue)}
          </Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {formatCurrency(totalPaid)}
          </Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item.key && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Invoices List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt_long"
            title="No Invoices Found"
            description={
              selectedFilter === 'all'
                ? 'You don\'t have any invoices yet.'
                : `No ${selectedFilter} invoices.`
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  filterContainer: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  invoiceCard: {
    marginBottom: Spacing.md,
  },
  invoiceOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  invoiceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  invoiceNumber: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  projectName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  amountValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  invoiceDetails: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  breakdown: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  breakdownTotal: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  invoiceActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  paidIcon: {
    fontSize: 16,
    color: Colors.success,
    marginRight: Spacing.sm,
  },
  paidText: {
    fontSize: FontSize.sm,
    color: Colors.success,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  overdueIcon: {
    fontSize: 16,
    color: Colors.error,
    marginRight: Spacing.sm,
  },
  overdueText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: '500',
  },
});
