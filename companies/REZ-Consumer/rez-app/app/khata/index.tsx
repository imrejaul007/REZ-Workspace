import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

interface KhataEntry {
  _id: string;
  merchantId: { _id: string; businessName: string };
  balance: number;
  transactions: { amount: number; type: string; note: string; createdAt: string }[];
  updatedAt: string;
}

interface KhataApiResponse {
  data?: {
    data?: KhataEntry[];
    credits?: KhataEntry[];
  };
  [key: string]: unknown;
}

function ConsumerKhataScreen() {
  const router = useRouter();
  const [credits, setCredits] = useState<KhataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCredits = async () => {
    try {
      const resp = (await apiClient.get('/consumer/khata')) as unknown as KhataApiResponse;
      setCredits(resp.data?.data || resp.data?.credits || []);
    } catch (e: unknown) {
      if (__DEV__) logger.error('Khata load error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const totalOwed = credits.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

  const renderItem = ({ item }: { item: KhataEntry }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.default }]}
      onPress={() => router.push({ pathname: '/khata/[merchantId]', params: { merchantId: item.merchantId._id } })}
    >
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: colors.brand.purpleLight + '20' }]}>
          <Ionicons name="storefront-outline" size={20} color={colors.brand.purpleLight} />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={[styles.merchantName, { color: colors.text.primary }]}>{item.merchantId.businessName}</Text>
          <Text style={[styles.lastTx, { color: colors.text.tertiary }]}>
            Last updated {new Date(item.updatedAt).toLocaleDateString('en-IN')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.balance, { color: item.balance > 0 ? Colors.error : colors.successScale[500] }]}>
            {item.balance > 0
              ? `₹${item.balance} owed`
              : item.balance < 0
                ? `₹${Math.abs(item.balance)} credit`
                : '₹0 settled'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purpleLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>My Credit (Khata)</Text>
        <View style={{ width: 24 }} />
      </View>

      {totalOwed > 0 && (
        <View
          style={[styles.summaryBanner, { backgroundColor: colors.tint.pink, borderColor: colors.brand.purpleLight }]}
        >
          <Text style={[styles.summaryText, { color: colors.brand.purple }]}>
            Total outstanding: <Text style={{ fontWeight: '700' }}>₹{totalOwed}</Text> across{' '}
            {credits.filter((c) => c.balance > 0).length} store
            {credits.filter((c) => c.balance > 0).length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={credits}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCredits();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No credit records yet</Text>
              <Text style={[styles.emptySub, { color: colors.text.tertiary }]}>
                Your outstanding balances at stores will appear here
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

export default withErrorBoundary(ConsumerKhataScreen, 'KhataIndex');

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerTitle: { ...Typography.h4, fontWeight: '700' },
  summaryBanner: {
    margin: Spacing.lg,
    marginBottom: 0,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  summaryText: { ...Typography.body, fontWeight: '500' },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  merchantName: { ...Typography.bodyLarge, fontWeight: '600' },
  lastTx: { ...Typography.bodySmall, marginTop: Spacing.xs },
  balance: { ...Typography.bodyLarge, fontWeight: '700', marginBottom: Spacing.xs },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { ...Typography.bodyLarge, fontWeight: '600' },
  emptySub: { ...Typography.bodySmall, textAlign: 'center' },
});
