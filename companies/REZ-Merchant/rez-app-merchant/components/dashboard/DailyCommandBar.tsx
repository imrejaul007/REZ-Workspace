/**
 * DailyCommandBar — Sticky quick-stats bar for merchant dashboard
 * Shows today's scans, liability, and a quick scan CTA.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DailyCommandBarProps {
  todayScans: number;
  liabilityAmount: number;
  currencySymbol?: string;
}

function DailyCommandBar({ todayScans, liabilityAmount, currencySymbol = '₹' }: DailyCommandBarProps) {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#1E3A5F', '#2D5A8E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.statItem}>
        <Ionicons name="scan-outline" size={18} color="rgba(255,255,255,0.7)" />
        <View>
          <Text style={styles.statValue}>{todayScans}</Text>
          <Text style={styles.statLabel}>Today's Scans</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <Ionicons name="wallet-outline" size={18} color="rgba(255,255,255,0.7)" />
        <View>
          <Text style={styles.statValue}>{currencySymbol}{liabilityAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Liability</Text>
        </View>
      </View>

      <Pressable
        style={styles.scanButton}
        onPress={() => router.push('/deals' as unknown)}
      >
        <Ionicons name="qr-code-outline" size={18} color="#1E3A5F" />
        <Text style={styles.scanButtonText}>Scan</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#1E3A5F', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F',
  },
});

export default React.memo(DailyCommandBar);
