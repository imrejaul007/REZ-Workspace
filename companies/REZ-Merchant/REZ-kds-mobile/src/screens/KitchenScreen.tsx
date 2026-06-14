/**
 * KDS Mobile - KitchenScreen
 * Main kitchen display showing the order queue
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { KDSOrder, KitchenStation, OrderStatus } from '../types';
import { useKDSStore } from '../store/kdsStore';
import { useOrders, useNetworkStatus } from '../hooks/useOrders';
import { kdsNotifications } from '../services/notifications';
import { kdsPrinter } from '../services/printer';

import Header from '../components/Header';
import StationFilter from '../components/StationFilter';
import OrderCardGrid from '../components/OrderCardGrid';
import LoadingOverlay from '../components/LoadingOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Determine columns based on screen width
const getColumnsFromWidth = (width: number): number => {
  if (width >= 1200) return 5;
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
};

type RootStackParamList = {
  Kitchen: undefined;
  OrderDetail: { orderId: string };
  Settings: undefined;
  Recent: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Kitchen'>;

const KitchenScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Store state
  const {
    stations,
    activeStation,
    allStationActive,
    setActiveStation,
    toggleAllStation,
    settings,
    orders,
    isLoading,
    isRefreshing,
    error,
    fetchOrders,
    refreshOrders,
    bumpOrder,
    recallOrder,
    setSelectedOrder,
    recentOrders,
  } = useKDSStore();

  // Initialize
  useNetworkStatus();
  useEffect(() => {
    kdsNotifications.initialize();
    fetchOrders();
  }, []);

  // Columns based on screen size
  const columns = useMemo(() => getColumnsFromWidth(SCREEN_WIDTH), []);

  // Order counts by station
  const orderCounts = useMemo(() => {
    const counts: Record<KitchenStation, number> = {} as Record<KitchenStation, number>;

    orders.forEach((order) => {
      const orderStations = Array.isArray(order.station)
        ? order.station
        : [order.station];

      orderStations.forEach((station) => {
        if (
          [OrderStatus.PENDING, OrderStatus.ACKNOWLEDGED, OrderStatus.IN_PROGRESS].includes(
            order.status
          )
        ) {
          counts[station] = (counts[station] || 0) + 1;
        }
      });
    });

    return counts;
  }, [orders]);

  // Handle order press
  const handleOrderPress = useCallback(
    (order: KDSOrder) => {
      setSelectedOrder(order);
      navigation.navigate('OrderDetail', { orderId: order.id });
    },
    [navigation, setSelectedOrder]
  );

  // Handle order bump
  const handleOrderBump = useCallback(
    async (orderId: string) => {
      try {
        const order = orders.find((o) => o.id === orderId);
        if (!order) return;

        // If order is completed, mark as ready for pickup
        if (order.status === OrderStatus.READY) {
          Alert.alert(
            'Order Ready',
            `Mark order #${order.displayNumber} as completed?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Complete',
                onPress: async () => {
                  await bumpOrder(orderId);
                  await kdsNotifications.announceOrderBumped(order.displayNumber);
                },
              },
            ]
          );
        } else {
          await bumpOrder(orderId);
          // Print ticket if enabled
          if (settings.display?.showPrices) {
            kdsPrinter.queuePrintJob(order, 'ticket');
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to bump order. Please try again.');
      }
    },
    [orders, bumpOrder, settings]
  );

  // Handle order recall
  const handleOrderRecall = useCallback(
    async (orderId: string) => {
      try {
        await recallOrder(orderId);
        Alert.alert('Success', 'Order recalled successfully.');
      } catch (err) {
        Alert.alert('Error', 'Failed to recall order. Please try again.');
      }
    },
    [recallOrder]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshOrders();
  }, [refreshOrders]);

  // Handle settings press
  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  // Handle recall list press
  const handleRecallPress = useCallback(() => {
    navigation.navigate('Recent');
  }, [navigation]);

  // Show error toast
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK' }]);
    }
  }, [error]);

  // Station filter props
  const stationFilterProps = useMemo(
    () => ({
      stations,
      activeStation,
      allStationActive,
      onStationChange: setActiveStation,
      onToggleAll: toggleAllStation,
      orderCounts,
    }),
    [stations, activeStation, allStationActive, setActiveStation, toggleAllStation, orderCounts]
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <Header
        onSettingsPress={handleSettingsPress}
        onRefresh={handleRefresh}
        onRecallPress={handleRecallPress}
      />

      {/* Station Filter */}
      <StationFilter {...stationFilterProps} />

      {/* Order Grid */}
      <View style={styles.content}>
        <OrderCardGrid
          orders={orders}
          onOrderPress={handleOrderPress}
          onOrderBump={handleOrderBump}
          onOrderRecall={handleOrderRecall}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isCompact={columns <= 3}
          showPrices={settings.display?.showPrices}
          columns={columns}
        />
      </View>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} message="Loading orders..." />

      {/* Quick Actions (FAB) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>SCAN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('OrderDetail', { orderId: '' })}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121220',
  },
  content: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a3e',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default KitchenScreen;
