/**
 * Restaurant Table Management
 * Visual table layout and real-time occupancy status
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { TableMap } from './components/TableMap';
import { storageService } from '@/services/storage';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';
import { format, differenceInMinutes } from 'date-fns';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: {
    orderId: string;
    customerName: string;
    items: number;
    startedAt: string;
    estimatedTime: number; // minutes
  };
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
  size: 'small' | 'medium' | 'large';
}

interface ActiveOrder {
  tableNumber: string;
  customerName: string;
  items: number;
  status: string;
  startedAt: string;
  elapsedMinutes: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    padding: 2,
    marginTop: Spacing.md,
  },
  viewButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: Colors.background.primary,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  viewButtonTextActive: {
    color: Colors.text.primary,
  },
  mapContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    padding: Spacing.lg,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  setupButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  // List view styles
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  tableCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tableIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableInfo: {
    flex: 1,
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tableCapacity: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  tableCustomer: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  tableTimer: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalClose: {
    padding: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tableOption: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  tableOptionNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tableOptionCapacity: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activeOrdersSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  activeOrdersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  activeOrderCard: {
    backgroundColor: Colors.warning[50],
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[500],
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeOrderTable: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  activeOrderTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning[600],
  },
  activeOrderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  activeOrderDetail: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  available: { color: Colors.success[700], bgColor: Colors.success[100], label: 'Available' },
  occupied: { color: Colors.warning[700], bgColor: Colors.warning[100], label: 'Occupied' },
  reserved: { color: Colors.primary[700], bgColor: Colors.primary[100], label: 'Reserved' },
  cleaning: { color: Colors.info[700], bgColor: Colors.info[100], label: 'Cleaning' },
};

type ViewType = 'map' | 'list';

export default function RestaurantTables() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const socketRef = React.useRef<Socket | null>(null);
  const [viewMode, setViewMode] = useState<ViewType>('list');
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);

  const loadTables = useCallback(async () => {
    try {
      // Mock data - in production would be API call
      const mockTables: Table[] = [
        {
          id: '1',
          number: 'T1',
          capacity: 4,
          status: 'available',
          position: { x: 20, y: 20 },
          shape: 'square',
          size: 'medium',
        },
        {
          id: '2',
          number: 'T2',
          capacity: 2,
          status: 'occupied',
          currentOrder: {
            orderId: 'ord-001',
            customerName: 'John Doe',
            items: 4,
            startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            estimatedTime: 30,
          },
          position: { x: 140, y: 20 },
          shape: 'round',
          size: 'small',
        },
        {
          id: '3',
          number: 'T3',
          capacity: 6,
          status: 'occupied',
          currentOrder: {
            orderId: 'ord-002',
            customerName: 'Jane Smith',
            items: 8,
            startedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            estimatedTime: 40,
          },
          position: { x: 260, y: 20 },
          shape: 'rectangle',
          size: 'large',
        },
        {
          id: '4',
          number: 'T4',
          capacity: 4,
          status: 'reserved',
          position: { x: 20, y: 140 },
          shape: 'square',
          size: 'medium',
        },
        {
          id: '5',
          number: 'T5',
          capacity: 8,
          status: 'available',
          position: { x: 140, y: 140 },
          shape: 'rectangle',
          size: 'large',
        },
        {
          id: '6',
          number: 'T6',
          capacity: 2,
          status: 'cleaning',
          position: { x: 260, y: 140 },
          shape: 'round',
          size: 'small',
        },
        {
          id: '7',
          number: 'T7',
          capacity: 4,
          status: 'available',
          position: { x: 20, y: 260 },
          shape: 'square',
          size: 'medium',
        },
        {
          id: '8',
          number: 'T8',
          capacity: 4,
          status: 'occupied',
          currentOrder: {
            orderId: 'ord-003',
            customerName: 'Bob Wilson',
            items: 6,
            startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            estimatedTime: 30,
          },
          position: { x: 140, y: 260 },
          shape: 'square',
          size: 'medium',
        },
      ];

      setTables(mockTables);

      // Extract active orders from occupied tables
      const orders = mockTables
        .filter(t => t.status === 'occupied' && t.currentOrder)
        .map(t => ({
          tableNumber: t.number,
          customerName: t.currentOrder!.customerName,
          items: t.currentOrder!.items,
          status: 'serving',
          startedAt: t.currentOrder!.startedAt,
          elapsedMinutes: differenceInMinutes(new Date(), new Date(t.currentOrder!.startedAt)),
        }));
      setActiveOrders(orders);
    } catch (error) {
      logger.error('[Tables] Failed to load tables:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initialize socket for real-time updates
  useEffect(() => {
    const initializeSocket = async () => {
      const authToken = await storageService.getAuthToken();

      if (!authToken || !API_CONFIG.SOCKET_URL) return;

      socketRef.current = io(`${API_CONFIG.SOCKET_URL}/tables`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      socketRef.current.on('table-updated', (data) => {
        setTables(prev =>
          prev.map(t =>
            t.id === data.tableId ? { ...t, status: data.status, currentOrder: data.currentOrder } : t
          )
        );
      });

      socketRef.current.on('new-reservation', (data) => {
        setTables(prev =>
          prev.map(t =>
            t.id === data.tableId ? { ...t, status: 'reserved' } : t
          )
        );
      });

      return () => {
        socketRef.current?.disconnect();
      };
    };

    initializeSocket();
    loadTables();
  }, [loadTables]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTables();
  }, [loadTables]);

  const handleTablePress = useCallback((table: Table) => {
    if (table.status === 'occupied' && table.currentOrder) {
      router.push(`/orders?orderId=${table.currentOrder.orderId}`);
    } else if (table.status === 'available') {
      router.push(`/pos?table=${table.id}`);
    } else {
      router.push(`/restaurant/tables?table=${table.id}`);
    }
  }, [router]);

  const stats = useMemo(() => ({
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    capacity: tables.reduce((sum, t) => sum + t.capacity, 0),
    occupiedCapacity: tables.filter(t => t.status === 'occupied').reduce((sum, t) => sum + t.capacity, 0),
  }), [tables]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tables</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSetupModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.headerButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'list' && styles.viewButtonTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'map' && styles.viewButtonTextActive]}>
              Floor Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <>
          <ScrollView style={styles.mapContainer} contentContainerStyle={{ paddingBottom: 100 }}>
            {tables.length > 0 ? (
              <TableMap
                tables={tables}
                onTablePress={handleTablePress}
                canvasWidth={width - Spacing.lg * 2}
                canvasHeight={400}
              />
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="grid-outline" size={64} color={Colors.gray[300]} />
                <Text style={styles.mapPlaceholderText}>
                  No tables configured yet. Set up your floor layout to get started.
                </Text>
                <TouchableOpacity style={styles.setupButton} onPress={() => setShowSetupModal(true)}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.setupButtonText}>Set Up Tables</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Legend */}
          <View style={styles.legend}>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <View key={status} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: config.bgColor, borderWidth: 2, borderColor: config.color }]} />
                <Text style={styles.legendText}>{config.label}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Summary */}
          <View style={styles.listContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: Colors.success[500] }]}>
                    {stats.available}
                  </Text>
                  <Text style={styles.summaryLabel}>Available</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: Colors.warning[500] }]}>
                    {stats.occupied}
                  </Text>
                  <Text style={styles.summaryLabel}>Occupied</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: Colors.primary[500] }]}>
                    {stats.reserved}
                  </Text>
                  <Text style={styles.summaryLabel}>Reserved</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {stats.occupiedCapacity}/{stats.capacity}
                  </Text>
                  <Text style={styles.summaryLabel}>Seats Used</Text>
                </View>
              </View>
            </View>

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <View style={styles.activeOrdersSection}>
                <Text style={styles.activeOrdersTitle}>Active Orders</Text>
                {activeOrders.map((order, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activeOrderCard}
                    onPress={() => router.push(`/orders?orderId=ord-${index}`)}
                  >
                    <View style={styles.activeOrderHeader}>
                      <Text style={styles.activeOrderTable}>Table {order.tableNumber}</Text>
                      <Text style={styles.activeOrderTime}>{order.elapsedMinutes} min</Text>
                    </View>
                    <View style={styles.activeOrderDetails}>
                      <Text style={styles.activeOrderDetail}>{order.customerName}</Text>
                      <Text style={styles.activeOrderDetail}>{order.items} items</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>All Tables</Text>

            {tables.map(table => {
              const statusConfig = STATUS_CONFIG[table.status];
              return (
                <View key={table.id} style={styles.tableCard}>
                  <View
                    style={[
                      styles.tableIcon,
                      { backgroundColor: statusConfig.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={table.shape === 'round' ? 'ellipse-outline' : 'square-outline'}
                      size={28}
                      color={statusConfig.color}
                    />
                  </View>
                  <View style={styles.tableInfo}>
                    <Text style={styles.tableNumber}>Table {table.number}</Text>
                    <Text style={styles.tableCapacity}>{table.capacity} seats</Text>
                    {table.currentOrder && (
                      <>
                        <Text style={styles.tableCustomer}>{table.currentOrder.customerName}</Text>
                        <Text style={styles.tableTimer}>
                          {differenceInMinutes(new Date(), new Date(table.currentOrder.startedAt))} min
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                  <View style={styles.tableActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleTablePress(table)}
                    >
                      <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Setup Modal */}
      <Modal
        visible={showSetupModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Up Tables</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowSetupModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Quick Add Tables</Text>
              <View style={styles.tableGrid}>
                {['T9', 'T10', 'T11', 'T12'].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.tableOption}
                    onPress={() => {
                      // In production, would add to database
                      setTables(prev => [
                        ...prev,
                        {
                          id: `new-${Date.now()}-${num}`,
                          number: num,
                          capacity: 4,
                          status: 'available',
                          position: { x: 0, y: 0 },
                          shape: 'square',
                          size: 'medium',
                        },
                      ]);
                      setShowSetupModal(false);
                    }}
                  >
                    <Text style={styles.tableOptionNumber}>{num}</Text>
                    <Text style={styles.tableOptionCapacity}>4 seats</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Or add custom table</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Table Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., T15"
                  placeholderTextColor={Colors.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Capacity</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Number of seats"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => setShowSetupModal(false)}
              >
                <Text style={styles.submitButtonText}>Add Table</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
