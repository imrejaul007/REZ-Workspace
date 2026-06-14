/**
 * OfferReviewCard — Step 3 of offer creation wizard
 * Summary of the offer before publishing.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfferConfig } from './OfferConfigForm';

interface OfferReviewCardProps {
  config: OfferConfig;
  goalTitle: string;
  projectedROI?: number;
}

function OfferReviewCard({ config, goalTitle, projectedROI }: OfferReviewCardProps) {
  const typeLabels: Record<string, string> = {
    cashback: 'Cashback',
    discount: 'Discount',
    voucher: 'Voucher',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Your Offer</Text>
      <Text style={styles.subtitle}>Make sure everything looks good before publishing</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabels[config.type] || config.type}</Text>
          </View>
          <Text style={styles.goal}>Goal: {goalTitle}</Text>
        </View>

        <Text style={styles.offerTitle}>{config.title || 'Untitled Offer'}</Text>
        {config.description ? <Text style={styles.offerDesc}>{config.description}</Text> : null}

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <DetailItem icon="gift-outline" label="Reward" value={`${config.value}${config.type !== 'voucher' ? '%' : '₹'} ${typeLabels[config.type]}`} />
          <DetailItem icon="cash-outline" label="Min Spend" value={`₹${config.minSpend.toLocaleString()}`} />
          <DetailItem icon="calendar-outline" label="Duration" value={`${config.durationDays} days`} />
          <DetailItem icon="wallet-outline" label="Budget Cap" value={`₹${config.budgetCap.toLocaleString()}`} />
        </View>

        {projectedROI != null && projectedROI > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.roiSection}>
              <Ionicons name="analytics-outline" size={16} color="#7C3AED" />
              <Text style={styles.roiText}>Estimated ROI: {projectedROI.toFixed(1)}x</Text>
            </View>
          </>
        )}

        {/* Estimated payout */}
        <View style={styles.divider} />
        <View style={styles.payoutRow}>
          <Text style={styles.payoutLabel}>Estimated Max Payout</Text>
          <Text style={styles.payoutValue}>₹{config.budgetCap.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon as unknown} size={14} color="#6B7280" />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  goal: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  offerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  offerDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { width: '45%', flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  roiSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roiText: { fontSize: 14, color: '#7C3AED', fontWeight: '700' },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutLabel: { fontSize: 13, color: '#6B7280' },
  payoutValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
});

export default React.memo(OfferReviewCard);
