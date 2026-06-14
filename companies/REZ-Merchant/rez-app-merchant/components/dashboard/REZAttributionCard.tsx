import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

type Period = '7d' | '30d' | '90d';

interface AttributionData {
  rezRevenue: number;
  rezCustomers: number;
  repeatVisits: number;
  slotsFilled: number;
  roiRatio: number;
}

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
];

export default function REZAttributionCard() {
  const { activeStore } = useStore();
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeStore?._id) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('merchant/attribution/summary', {
        params: { storeId: activeStore._id, period },
      })
      .then((r) => {
        if (!cancelled) setData(r.data?.data ?? null);
      })
      .catch((err) => {
        if (__DEV__) console.warn('[REZAttributionCard] attribution/summary failed:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStore?._id, period]);

  // Hide card if no attribution data yet — zeros are demotivating
  if (loading || !data || data.rezRevenue <= 0) return null;

  const handleShare = async () => {
    const periodLabel =
      period === '7d' ? 'this week' : period === '30d' ? 'this month' : 'this quarter';
    try {
      await Share.share({
        message: `REZ generated ₹${(data.rezRevenue ?? 0).toLocaleString('en-IN')} in revenue for my store ${periodLabel} via ${data.rezCustomers ?? 0} customers! 🔥`,
      });
    } catch {
      // share dismissed — no-op
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>
        <Text style={styles.headerText}>REZ Revenue Attribution</Text>
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.periodBtn, period === opt.key && styles.periodBtnActive]}
              onPress={() => setPeriod(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodText, period === opt.key && styles.periodTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Primary stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>₹{(data.rezRevenue ?? 0).toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>via REZ coins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.rezCustomers}</Text>
          <Text style={styles.statLabel}>customers{'\n'}from network</Text>
        </View>
      </View>

      {/* Secondary stats row */}
      <View style={[styles.statsRow, styles.secondaryRow]}>
        <View style={styles.statBlock}>
          <Text style={styles.statValueSm}>{data.repeatVisits}</Text>
          <Text style={styles.statLabel}>repeat visits{'\n'}nudge-driven</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValueSm}>{data.slotsFilled}</Text>
          <Text style={styles.statLabel}>slots filled{'\n'}via intelligence</Text>
        </View>
      </View>

      {/* ROI highlight row */}
      <View style={styles.roiRow}>
        <Ionicons name="trending-up" size={14} color="#7C3AED" />
        <Text style={styles.roiText}>
          <Text style={styles.roiHighlight}>₹{(data.roiRatio ?? 0).toFixed(2)}</Text> earned per ₹1
          of REZ coins
        </Text>
      </View>

      {/* Share CTA */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Ionicons name="share-social-outline" size={16} color="#fff" />
        <Text style={styles.shareBtnText}>Share this report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireEmoji: {
    fontSize: 16,
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#4C1D95',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EDE9FE',
  },
  periodBtnActive: {
    backgroundColor: '#7C3AED',
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  periodTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  secondaryRow: {
    backgroundColor: '#F3F0FF',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4C1D95',
    marginBottom: 2,
  },
  statValueSm: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5B21B6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#7C3AED',
    textAlign: 'center',
    lineHeight: 15,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#DDD6FE',
  },
  roiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  roiText: {
    flex: 1,
    fontSize: 13,
    color: '#5B21B6',
    lineHeight: 18,
  },
  roiHighlight: {
    fontWeight: '800',
    color: '#4C1D95',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
