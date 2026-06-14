'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// QR Hub types
interface QRHubStats {
  menuQr: { scans: number; orders: number; revenue: number };
  roomQr: { activeRooms: number; requests: number; revenue: number };
  adsQr: { campaigns: number; scans: number; conversions: number };
  linkQr: { views: number; clicks: number };
}

export default function QRHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QRHubStats | null>(null);

  useEffect(() => {
    // Simulated stats - replace with actual API call
    setTimeout(() => {
      setStats({
        menuQr: { scans: 1247, orders: 89, revenue: 45600 },
        roomQr: { activeRooms: 24, requests: 156, revenue: 23400 },
        adsQr: { campaigns: 3, scans: 3420, conversions: 234 },
        linkQr: { views: 8934, clicks: 1245 },
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading QR Hub...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>QR Hub</Text>
        <Text style={styles.subtitle}>Manage all your QR codes in one place</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.menuQr.scans || 0}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{(stats?.menuQr.revenue || 0) + (stats?.roomQr.revenue || 0)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      </View>

      {/* Menu QR Card */}
      <TouchableOpacity
        style={styles.qrCard}
        onPress={() => router.push('/(dashboard)/qr-hub/menu-qr')}
      >
        <View style={[styles.cardIcon, { backgroundColor: '#10B98120' }]}>
          <Ionicons name="restaurant" size={28} color="#10B981" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Menu QR</Text>
          <Text style={styles.cardDesc}>Restaurant digital menu</Text>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.menuQr.orders || 0}</Text>
              <Text style={styles.statItemLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.menuQr.scans || 0}</Text>
              <Text style={styles.statItemLabel}>Scans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>₹{stats?.menuQr.revenue || 0}</Text>
              <Text style={styles.statItemLabel}>Revenue</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Room QR Card */}
      <TouchableOpacity
        style={styles.qrCard}
        onPress={() => router.push('/(dashboard)/qr-hub/room-qr')}
      >
        <View style={[styles.cardIcon, { backgroundColor: '#8B5CF620' }]}>
          <Ionicons name="bed" size={28} color="#8B5CF6" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Room QR</Text>
          <Text style={styles.cardDesc}>Hotel room services</Text>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.roomQr.activeRooms || 0}</Text>
              <Text style={styles.statItemLabel}>Active Rooms</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.roomQr.requests || 0}</Text>
              <Text style={styles.statItemLabel}>Requests</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>₹{stats?.roomQr.revenue || 0}</Text>
              <Text style={styles.statItemLabel}>Revenue</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Ads QR Card */}
      <TouchableOpacity
        style={styles.qrCard}
        onPress={() => router.push('/(dashboard)/qr-hub/ads-qr')}
      >
        <View style={[styles.cardIcon, { backgroundColor: '#F59E0B20' }]}>
          <Ionicons name="megaphone" size={28} color="#F59E0B" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Ads QR</Text>
          <Text style={styles.cardDesc}>Campaign QR codes</Text>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.adsQr.campaigns || 0}</Text>
              <Text style={styles.statItemLabel}>Campaigns</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.adsQr.scans || 0}</Text>
              <Text style={styles.statItemLabel}>Scans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.adsQr.conversions || 0}</Text>
              <Text style={styles.statItemLabel}>Conversions</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Link QR Card */}
      <TouchableOpacity
        style={styles.qrCard}
        onPress={() => router.push('/(dashboard)/qr-hub/link-qr')}
      >
        <View style={[styles.cardIcon, { backgroundColor: '#EC489920' }]}>
          <Ionicons name="link" size={28} color="#EC4899" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Link QR</Text>
          <Text style={styles.cardDesc}>Rez Now linktree</Text>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.linkQr.views || 0}</Text>
              <Text style={styles.statItemLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{stats?.linkQr.clicks || 0}</Text>
              <Text style={styles.statItemLabel}>Clicks</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(dashboard)/qr-generator')}
          >
            <Ionicons name="qr-code" size={24} color="#6366F1" />
            <Text style={styles.actionText}>Generate QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(dashboard)/qr-hub/analytics')}
          >
            <Ionicons name="analytics" size={24} color="#6366F1" />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(dashboard)/qr-hub/qr-codes')}
          >
            <Ionicons name="download" size={24} color="#6366F1" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statItemLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  quickActions: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 8,
    fontWeight: '500',
  },
});
