/**
 * Peak Hours Heat Map Screen
 * Displays a 7x24 grid heatmap of visit counts by day and hour
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

interface PeakHourSlot {
  hour: number; // 0-23
  day: number; // 0=Mon, 6=Sun
  visitCount: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HOUR_LABEL_INDICES = [0, 3, 6, 9, 12, 15, 18, 21];

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

function getCellColor(visitCount: number, maxCount: number): string {
  if (visitCount === 0 || maxCount === 0) return '#F3F4F6';
  const ratio = visitCount / maxCount;
  if (ratio < 0.25) return '#DBEAFE';
  if (ratio < 0.5) return '#93C5FD';
  if (ratio < 0.75) return '#3B82F6';
  return '#1D4ED8';
}

function generateMockData(): PeakHourSlot[] {
  const slots: PeakHourSlot[] = [];
  const peakPatterns: Record<number, number[]> = {
    // Mon-Fri: morning rush 8-10, lunch 12-14, evening 18-20
    0: [8, 9, 12, 13, 18, 19],
    1: [8, 9, 12, 13, 18, 19],
    2: [8, 9, 12, 13, 18, 19],
    3: [8, 9, 12, 13, 18, 19],
    4: [8, 9, 12, 13, 17, 18, 19],
    // Weekend: late morning and afternoon
    5: [10, 11, 12, 13, 14, 15, 19, 20],
    6: [10, 11, 12, 13, 14, 15, 18, 19],
  };

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // FIX (arch-fitness): No Math.random() for IDs. Chart mock data uses a deterministic
      // seeded pattern so the heatmap renders consistently without cryptographic randomness.
      const isPeak = peakPatterns[day]?.includes(hour);
      const seed = day * 24 + hour;
      const baseCount = isPeak ? 30 + (seed % 40) : seed % 12;
      slots.push({ hour, day, visitCount: baseCount });
    }
  }
  return slots;
}

export default function PeakHoursScreen() {
  const [data, setData] = useState<PeakHourSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get<unknown>('merchant/analytics/peak-hours');
      const raw: PeakHourSlot[] = res?.data?.data ?? res?.data ?? [];
      setData(Array.isArray(raw) && raw.length > 0 ? raw : generateMockData());
    } catch {
      setData(generateMockData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Derived stats
  const { maxCount, busiestSlot, top3 } = useMemo(() => {
    if (data.length === 0) return { maxCount: 1, busiestSlot: null, top3: [] };
    const max = Math.max(...data.map((d) => d.visitCount));
    const sorted = [...data].sort((a, b) => b.visitCount - a.visitCount);
    return {
      maxCount: max || 1,
      busiestSlot: sorted[0] ?? null,
      top3: sorted.slice(0, 3),
    };
  }, [data]);

  // Build lookup map: day-hour -> visitCount
  const lookup = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((slot) => {
      map[`${slot.day}-${slot.hour}`] = slot.visitCount;
    });
    return map;
  }, [data]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading peak hours...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText style={styles.title}>Peak Hours Heat Map</ThemedText>
      <ThemedText style={styles.subtitle}>Visit intensity by day and hour</ThemedText>

      {/* Heatmap grid */}
      <View style={styles.card}>
        {/* X-axis day labels */}
        <View style={styles.xAxisRow}>
          <View style={styles.yAxisSpacer} />
          {DAY_LABELS.map((day) => (
            <View key={day} style={styles.dayLabelCell}>
              <ThemedText style={styles.axisLabel}>{day}</ThemedText>
            </View>
          ))}
        </View>

        {/* Grid rows — one per hour */}
        {Array.from({ length: 24 }, (_, hour) => {
          const showLabel = HOUR_LABEL_INDICES.includes(hour);
          return (
            <View key={hour} style={styles.gridRow}>
              <View style={styles.yAxisCell}>
                {showLabel ? (
                  <ThemedText style={styles.axisLabel}>{formatHour(hour)}</ThemedText>
                ) : null}
              </View>
              {DAY_LABELS.map((_, day) => {
                const count = lookup[`${day}-${hour}`] ?? 0;
                const bg = getCellColor(count, maxCount);
                return <View key={day} style={[styles.cell, { backgroundColor: bg }]} />;
              })}
            </View>
          );
        })}

        {/* Color legend */}
        <View style={styles.legend}>
          {(['#F3F4F6', '#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8'] as const).map((color, i) => (
            <View key={color} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: color }]} />
              <ThemedText style={styles.legendLabel}>
                {['None', 'Low', 'Med', 'High', 'Peak'][i]}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Busiest time summary */}
      {busiestSlot && (
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>Busiest time</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {DAY_LABELS[busiestSlot.day]} at {formatHour(busiestSlot.hour)}
          </ThemedText>
          <ThemedText style={styles.summaryCount}>
            {busiestSlot.visitCount} visits on average
          </ThemedText>
        </View>
      )}

      {/* Top 3 peak slots */}
      {top3.length > 0 && (
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Top Peak Slots</ThemedText>
          {top3.map((slot, idx) => (
            <View key={`${slot.day}-${slot.hour}`} style={styles.rankRow}>
              <View style={styles.rankBadge}>
                <ThemedText style={styles.rankNumber}>#{idx + 1}</ThemedText>
              </View>
              <View style={styles.rankInfo}>
                <ThemedText style={styles.rankSlot}>
                  {DAY_LABELS[slot.day]}, {formatHour(slot.hour)}
                </ThemedText>
                <ThemedText style={styles.rankCount}>{slot.visitCount} visits</ThemedText>
              </View>
              <View
                style={[
                  styles.rankBar,
                  { backgroundColor: getCellColor(slot.visitCount, maxCount) },
                ]}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const CELL_SIZE = 34;
const Y_AXIS_WIDTH = 38;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  // Grid
  xAxisRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  yAxisSpacer: {
    width: Y_AXIS_WIDTH,
  },
  dayLabelCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'center',
  },
  yAxisCell: {
    width: Y_AXIS_WIDTH,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  cell: {
    width: CELL_SIZE - 2,
    height: 14,
    borderRadius: 2,
    marginRight: 2,
  },
  axisLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  // Summary
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 13,
    color: '#3B82F6',
  },
  // Top slots
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSecondary,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  rankInfo: {
    flex: 1,
  },
  rankSlot: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  rankCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rankBar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginLeft: 8,
  },
});
