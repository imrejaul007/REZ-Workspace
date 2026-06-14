/**
 * RendezBookingsCard — shows merchant how many Rendez plan bookings
 * are associated with their store, and what REZ coins were earned.
 *
 * Rendez users book through REZ, so the merchant already gets paid normally.
 * This card just surfaces "Rendez source" bookings for visibility.
 *
 * API: GET /api/merchant/dashboard/rendez-bookings
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dashboardService } from '@/services/api/dashboard';

interface Props {
  storeId?: string;
}

interface RendezBookingSummary {
  totalBookings: number;
  totalRevenuePaise: number;
  pendingBookings: number;
}

export default function RendezBookingsCard({ storeId }: Props) {
  const [summary, setSummary] = useState<RendezBookingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getRendezBookings(storeId)
      .then((data) => {
        if (data) {
          setSummary({
            totalBookings: data.total ?? 0,
            totalRevenuePaise: data.totalRevenuePaise ?? 0,
            pendingBookings: data.pending ?? 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading || !summary) return null;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => Linking.openURL('https://rendez.in').catch((e) => console.warn('[RendezBookings] Failed to open rendez.in:', e))}
      >
        <View style={styles.leftAccent} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💜</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>Rendez</Text>
              <Text style={styles.sub}>Social dating partner — bookings via Rendez app</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#7c3aed" />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.totalBookings}</Text>
              <Text style={styles.statLabel}>Total bookings</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                ₹{Math.round(summary.totalRevenuePaise / 100).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Revenue earned</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, summary.pendingBookings > 0 && { color: '#d97706' }]}>
                {summary.pendingBookings}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={13} color="#a78bfa" />
            <Text style={styles.footerText}>
              Rendez users book your venue for social meetups. Bookings processed through REZ.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  leftAccent: { width: 4, backgroundColor: '#7c3aed' },
  content: { flex: 1, padding: 14 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  sub: { fontSize: 11, color: '#888', marginTop: 1 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#7c3aed' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2, fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: '#e9d5ff' },

  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  footerText: { fontSize: 11, color: '#a78bfa', flex: 1, lineHeight: 16 },
});
