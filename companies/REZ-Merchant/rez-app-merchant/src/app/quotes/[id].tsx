/**
 * Quote Detail Screen
 * Quote detail and accept/reject functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getQuoteById, updateQuoteStatus, Quote } from '@/services/b2bApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/common/Badge';

export default function QuoteDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { merchantId } = useAuth();

  // State
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getQuoteById(id);
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote');
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchQuote();
      setLoading(false);
    };
    load();
  }, [fetchQuote]);

  // Accept quote
  const handleAccept = async () => {
    Alert.alert(
      'Accept Quote',
      'Are you sure you want to accept this quote? This will create a purchase order.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            if (!quote) return;
            setUpdating(true);
            try {
              await updateQuoteStatus(quote.id, 'accepted');
              fetchQuote();
              Alert.alert('Success', 'Quote accepted successfully');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to accept quote');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  // Reject quote
  const handleReject = async () => {
    Alert.alert(
      'Reject Quote',
      'Are you sure you want to reject this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            if (!quote) return;
            setUpdating(true);
            try {
              await updateQuoteStatus(quote.id, 'rejected');
              fetchQuote();
              Alert.alert('Success', 'Quote rejected');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reject quote');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const STATUS_CONFIG = {
    draft: { variant: 'default' as const, label: 'Draft', color: colors.gray[500] },
    sent: { variant: 'info' as const, label: 'Sent', color: colors.primary[500] },
    quoted: { variant: 'warning' as const, label: 'Quoted', color: colors.warning[500] },
    accepted: { variant: 'success' as const, label: 'Accepted', color: colors.success[500] },
    rejected: { variant: 'error' as const, label: 'Rejected', color: colors.error[500] },
    expired: { variant: 'default' as const, label: 'Expired', color: colors.gray[500] },
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading quote..." />;
  }

  if (error || !quote) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Quote not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuote}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status];
  const canRespond = quote.status === 'quoted';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Quote Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.supplierName}>{quote.supplierName}</Text>
              <Text style={styles.quoteId}>Quote #{quote.id.slice(-8)}</Text>
            </View>
            <Badge label={statusConfig.label} variant={statusConfig.variant} />
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatCurrency(quote.totalAmount)}</Text>
          </View>

          <View style={styles.summaryDates}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Received</Text>
              <Text style={styles.dateValue}>{formatDate(quote.receivedAt)}</Text>
            </View>
            {quote.validUntil && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Valid Until</Text>
                <Text style={styles.dateValue}>{formatDate(quote.validUntil)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsCard}>
            {quote.items.map((item, index) => (
              <View
                key={item.itemId}
                style={[
                  styles.itemRow,
                  index < quote.items.length - 1 && styles.itemRowBorder,
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemQuantity}>
                    Qty: {item.quantity} x {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.totalPrice)}</Text>
              </View>
            ))}

            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(quote.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {canRespond && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
              disabled={updating}
            >
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                {updating ? 'Processing...' : 'Reject Quote'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={updating}
            >
              <Text style={[styles.actionButtonText, styles.acceptButtonText]}>
                {updating ? 'Processing...' : 'Accept Quote'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!canRespond && (
          <View style={styles.statusNote}>
            <Text style={styles.statusNoteText}>
              {quote.status === 'accepted'
                ? 'This quote has been accepted'
                : quote.status === 'rejected'
                ? 'This quote has been rejected'
                : 'Waiting for supplier to submit quote'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  } as TextStyle,
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  summaryCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  } as ViewStyle,
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  supplierName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  quoteId: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 4,
  } as TextStyle,
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  } as ViewStyle,
  totalSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  } as TextStyle,
  totalAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  } as TextStyle,
  summaryDates: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,
  dateItem: {
    alignItems: 'center',
  } as ViewStyle,
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 4,
  } as TextStyle,
  dateValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  section: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  itemsCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  } as ViewStyle,
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  } as ViewStyle,
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  itemInfo: {
    flex: 1,
  } as ViewStyle,
  itemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  } as TextStyle,
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  } as TextStyle,
  itemTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary[100],
    marginTop: spacing.sm,
  } as ViewStyle,
  grandTotalLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  grandTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  } as TextStyle,
  notesCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  } as ViewStyle,
  notesText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
  } as TextStyle,
  actionsSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  } as ViewStyle,
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  } as ViewStyle,
  rejectButton: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  acceptButton: {
    backgroundColor: colors.success[500],
  } as ViewStyle,
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  } as TextStyle,
  rejectButtonText: {
    color: colors.text.secondary,
  } as TextStyle,
  acceptButtonText: {
    color: colors.text.inverse,
  } as TextStyle,
  statusNote: {
    backgroundColor: colors.gray[100],
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  statusNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error[600],
    textAlign: 'center',
    marginBottom: spacing.md,
  } as TextStyle,
  retryButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
  } as ViewStyle,
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
});
