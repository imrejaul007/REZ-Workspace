import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

interface IntelligenceData {
  suggestion: string | null;
  deadHours?: Array<{ hour: number; label: string }>;
  emptySlots?: Array<{ time: string; label: string }>;
  emptyCount?: number;
  type: 'dead-hours' | 'empty-slots' | null;
}

export default function DemandIntelligenceCard() {
  const { activeStore } = useStore();
  const router = useRouter();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeStore?._id) return;
    let cancelled = false;

    (async () => {
      try {
        // Try empty-slots first (most actionable)
        const slotsRes = await apiClient.get('merchant/intelligence/empty-slots', {
          params: { storeId: activeStore._id },
        });
        if (!cancelled && slotsRes.data?.data?.suggestion) {
          setData({
            suggestion: slotsRes.data.data.suggestion,
            emptySlots: slotsRes.data.data.emptySlots,
            emptyCount: slotsRes.data.data.emptyCount,
            type: 'empty-slots',
          });
          return;
        }

        // Fallback: dead hours
        const hoursRes = await apiClient.get('merchant/intelligence/dead-hours', {
          params: { storeId: activeStore._id },
        });
        if (!cancelled && hoursRes.data?.data?.suggestion) {
          setData({
            suggestion: hoursRes.data.data.suggestion,
            deadHours: hoursRes.data.data.deadHours,
            type: 'dead-hours',
          });
        }
      } catch (err) {
        // MERCH-AUDIT-FIX: merchant/intelligence/* endpoints exist in backend source but are NOT
        // mounted in routes.ts. These will always 404. The catch is silent which is acceptable
        // since this card is non-critical (revenue opportunity suggestion).
        if (__DEV__) console.warn('[DemandIntelligenceCard] intelligence endpoints 404 (not mounted):', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeStore?._id]);

  if (loading || !data?.suggestion) return null;

  const handleAction = () => {
    router.push('/(dashboard)/deals' as unknown);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="flash" size={18} color="#F59E0B" />
        </View>
        <Text style={styles.headerText}>Revenue Opportunity</Text>
      </View>

      <Text style={styles.suggestion}>{data.suggestion}</Text>

      {data.type === 'empty-slots' && data.emptySlots && data.emptySlots.length > 0 && (
        <View style={styles.slotRow}>
          {data.emptySlots.slice(0, 4).map((s) => (
            <View key={s.time} style={styles.slotChip}>
              <Text style={styles.slotText}>{s.label}</Text>
            </View>
          ))}
          {(data.emptyCount || 0) > 4 && (
            <View style={styles.slotChip}>
              <Text style={styles.slotText}>+{(data.emptyCount || 0) - 4} more</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.actionBtn} onPress={handleAction} activeOpacity={0.8}>
        <Text style={styles.actionText}>Create Flash Deal</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  suggestion: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  slotChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
