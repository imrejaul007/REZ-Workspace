import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/DesignTokens';
import dineInService, { TableStatus } from '@/services/api/dineIn';
import { useStore } from '@/contexts/StoreContext';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');
const COLUMNS = 2;
const ITEM_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / COLUMNS;

const durationColor = (mins: number): string => {
  if (mins < 30) return '#22c55e'; // green
  if (mins < 60) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

const TableCard = ({ table, onPress }: { table: TableStatus; onPress: () => void }) => {
  const isOccupied = table.status === 'occupied';
  const statusColor = isOccupied ? Colors.error[500] : Colors.success[500];
  const statusBgColor = isOccupied ? Colors.error[50] : Colors.success[50];

  return (
    <TouchableOpacity
      style={[
        styles.tableCard,
        {
          backgroundColor: statusBgColor,
          borderColor: statusColor,
          width: ITEM_WIDTH,
        },
      ]}
      onPress={onPress}
    >
      {/* Table Number & Status */}
      <View style={styles.cardHeader}>
        <Text style={styles.tableNumber}>TABLE {table.tableNumber}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      {/* Capacity */}
      <View style={styles.cardRow}>
        <Ionicons name="people" size={16} color={Colors.text.secondary} />
        <Text style={styles.cardText}>{table.capacity} capacity</Text>
      </View>

      {/* If Occupied: Show guests and duration */}
      {isOccupied && (
        <>
          <View style={styles.cardRow}>
            <Ionicons name="person" size={16} color={Colors.text.secondary} />
            <Text style={styles.cardText}>{table.guestCount || 0} guests</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="time" size={16} color={durationColor(table.seatedDuration)} />
            <Text style={[styles.cardText, { color: durationColor(table.seatedDuration) }]}>
              {table.seatedDuration ? `${table.seatedDuration}m seated` : 'Recently seated'}
            </Text>
          </View>
          {table.currentAmount && (
            <View style={styles.amountBadge}>
              <Text style={styles.amountText}>₹{table.currentAmount.toLocaleString()}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary[500] }]}
            onPress={onPress}
          >
            <Text style={styles.actionButtonText}>View Order</Text>
          </TouchableOpacity>
        </>
      )}

      {/* If Available: Open button */}
      {!isOccupied && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.success[500] }]}
          onPress={onPress}
        >
          <Text style={styles.actionButtonText}>Open</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function DineInScreen() {
  const insets = useSafeAreaInsets();
  // H7 FIX: use StoreContext instead of raw storage guesses
  const { activeStore } = useStore();
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [waiterAlerts, setWaiterAlerts] = useState<
    Array<{
      id: string;
      tableNumber: string | null;
      reason: string;
      orderNumber: string | null;
      receivedAt: Date;
    }>
  >([]);
  const [showWaiterAlert, setShowWaiterAlert] = useState(false);

  const loadTables = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true);
        const storeId = activeStore?._id;
        if (!storeId) {
          if (showSpinner) setLoading(false);
          return;
        }
        const data = await dineInService.getTableStatus(storeId);
        setTables(data.tables);
      } catch (error) {
        if (__DEV__) console.error('Failed to load tables:', error);
        // Keep existing tables if refresh fails
      } finally {
        if (showSpinner) setLoading(false);
        setRefreshing(false);
      }
    },
    [activeStore?._id]
  );

  useEffect(() => {
    loadTables(true);
    // Set up silent background refresh every 30 seconds
    const interval = setInterval(() => {
      loadTables(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadTables]);

  useEffect(() => {
    const { socketService } = require('@/services');
    const handleWaiterCall = (data: {
      tableNumber: string | null;
      reason: string;
      orderNumber: string | null;
      requestId: string;
    }) => {
      const alert = {
        id: data.requestId,
        tableNumber: data.tableNumber,
        reason: data.reason,
        orderNumber: data.orderNumber,
        receivedAt: new Date(),
      };
      setWaiterAlerts((prev) => [alert, ...prev.slice(0, 9)]); // keep last 10
      setShowWaiterAlert(true);
    };
    socketService.on('waiter-call', handleWaiterCall);
    return () => {
      socketService.off('waiter-call', handleWaiterCall);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTables(false);
  }, [loadTables]);

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading tables...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tables</Text>
        <TouchableOpacity onPress={() => router.push('/dine-in/new-order')}>
          <Ionicons name="add-circle" size={28} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Waiter Call Alert Banner */}
      {showWaiterAlert && waiterAlerts.length > 0 && (
        <View style={waiterAlertStyles.banner}>
          <View style={waiterAlertStyles.bannerContent}>
            <Ionicons name="hand-left" size={20} color="#fff" />
            <Text style={waiterAlertStyles.bannerText}>
              {waiterAlerts[0].tableNumber
                ? `Table ${waiterAlerts[0].tableNumber} needs assistance`
                : 'A customer needs assistance'}
              {waiterAlerts[0].reason !== 'Need assistance' ? ` — ${waiterAlerts[0].reason}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowWaiterAlert(false)}
            style={waiterAlertStyles.bannerClose}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors.error[50] }]}>
          <Text style={[styles.statValue, { color: Colors.error[600] }]}>{occupiedCount}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.success[50] }]}>
          <Text style={[styles.statValue, { color: Colors.success[600] }]}>{availableCount}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      {/* Tables Grid */}
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TableCard
            table={item}
            onPress={() => {
              if (item.status === 'occupied') {
                router.push(`/dine-in/table/${item.id}`);
              } else {
                router.push({
                  pathname: '/dine-in/new-order',
                  params: { tableId: item.id, tableNumber: item.tableNumber.toString() },
                });
              }
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No tables found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  statCard: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tableCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  amountBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    marginTop: Spacing.xs,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
});

const waiterAlertStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#e53e3e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bannerClose: {
    padding: 4,
  },
});
