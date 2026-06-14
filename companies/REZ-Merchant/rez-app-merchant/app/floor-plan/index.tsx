import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

const CELL_SIZE = 60;
const GRID_COLS = 8;
const GRID_ROWS = 10;

// Table types
type TableShape = 'square_2' | 'square_4' | 'round_2' | 'round_4' | 'round_6' | 'bar';
type TableStatus = 'available' | 'occupied' | 'reserved' | 'needs_attention';

interface FloorTable {
  id: string;
  tableNumber: string;
  shape: TableShape;
  capacity: number;
  x: number; // grid column (0-based)
  y: number; // grid row (0-based)
  status: TableStatus;
  currentBookingId?: string;
}

// Shape configurations
const SHAPE_CONFIG: Record<
  TableShape,
  { label: string; emoji: string; cols: number; rows: number; capacity: number }
> = {
  square_2: { label: 'Square 2', emoji: '⬛', cols: 1, rows: 1, capacity: 2 },
  square_4: { label: 'Square 4', emoji: '⬛', cols: 1, rows: 1, capacity: 4 },
  round_2: { label: 'Round 2', emoji: '🔵', cols: 1, rows: 1, capacity: 2 },
  round_4: { label: 'Round 4', emoji: '🔵', cols: 1, rows: 1, capacity: 4 },
  round_6: { label: 'Round 6', emoji: '🔵', cols: 2, rows: 2, capacity: 6 },
  bar: { label: 'Bar', emoji: '▬', cols: 3, rows: 1, capacity: 8 },
};

const STATUS_COLORS: Record<TableStatus, string> = {
  available: '#22c55e',
  occupied: '#ef4444',
  reserved: '#f59e0b',
  needs_attention: '#8b5cf6',
};

// Default layout for new stores
const DEFAULT_LAYOUT: FloorTable[] = [
  { id: '1', tableNumber: '1', shape: 'square_2', capacity: 2, x: 0, y: 0, status: 'available' },
  { id: '2', tableNumber: '2', shape: 'square_2', capacity: 2, x: 2, y: 0, status: 'available' },
  { id: '3', tableNumber: '3', shape: 'square_4', capacity: 4, x: 4, y: 0, status: 'available' },
  { id: '4', tableNumber: '4', shape: 'round_4', capacity: 4, x: 0, y: 2, status: 'available' },
  { id: '5', tableNumber: '5', shape: 'round_4', capacity: 4, x: 2, y: 2, status: 'available' },
  { id: '6', tableNumber: '6', shape: 'bar', capacity: 8, x: 0, y: 4, status: 'available' },
];

// Draggable table component
function DraggableTable({
  table,
  editMode,
  onMove,
  onTap,
  onDelete,
}: {
  table: FloorTable;
  editMode: boolean;
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onTap: (table: FloorTable) => void;
  onDelete: (id: string) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const onPanEvent = (event: { translationX: number; translationY: number }) => {
    if (!editMode) return;
    translateX.value = event.translationX;
    translateY.value = event.translationY;
    scale.value = 1.1;
    isDragging.value = true;
  };

  const onPanEnd = (event: { translationX: number; translationY: number }) => {
    if (!editMode) return;
    const deltaX = Math.round(event.translationX / CELL_SIZE);
    const deltaY = Math.round(event.translationY / CELL_SIZE);

    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    isDragging.value = false;

    if (deltaX !== 0 || deltaY !== 0) {
      runOnJS(onMove)(table.id, deltaX, deltaY);
    }
  };

  const shape = SHAPE_CONFIG[table.shape];
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 999 : 1,
  }));

  const isRound = table.shape.startsWith('round');

  return (
    <PanGestureHandler onGestureEvent={onPanEvent} onEnded={onPanEnd} enabled={editMode}>
      <Animated.View
        style={[
          styles.table,
          animStyle,
          {
            width: shape.cols * CELL_SIZE - 4,
            height: shape.rows * CELL_SIZE - 4,
            position: 'absolute',
            left: table.x * CELL_SIZE + 2,
            top: table.y * CELL_SIZE + 2,
            backgroundColor: STATUS_COLORS[table.status] + '20',
            borderColor: STATUS_COLORS[table.status],
            borderWidth: 2,
            borderRadius: isRound ? (shape.cols * CELL_SIZE) / 2 : 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => !editMode && onTap(table)}
          style={styles.tableInner}
          disabled={editMode}
        >
          <Text style={styles.tableNumber}>{table.tableNumber}</Text>
          <Text style={styles.tableCapacity}>👥 {table.capacity}</Text>
          {table.status !== 'available' && (
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[table.status] }]} />
          )}
        </TouchableOpacity>
        {editMode && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(table.id)}>
            <Ionicons name={'close-circle' as keyof typeof Ionicons.glyphMap} size={16} color={Colors.error[500]} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
}

// Add table panel
function AddTablePanel({
  onAdd,
  onClose,
}: {
  onAdd: (shape: TableShape) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.addPanel}>
      <View style={styles.addPanelHeader}>
        <Text style={styles.addPanelTitle}>Add Table</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name={'close' as keyof typeof Ionicons.glyphMap} size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.addPanelContent}>
        {Object.entries(SHAPE_CONFIG).map(([shape, config]) => (
          <TouchableOpacity
            key={shape}
            onPress={() => {
              onAdd(shape as TableShape);
              onClose();
            }}
            style={styles.addOption}
          >
            <Text style={styles.addOptionEmoji}>{config.emoji}</Text>
            <View style={styles.addOptionText}>
              <Text style={styles.addOptionLabel}>{config.label}</Text>
              <Text style={styles.addOptionCap}>up to {config.capacity} guests</Text>
            </View>
            <Ionicons name={'chevron-forward' as keyof typeof Ionicons.glyphMap} size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Main component
export default function FloorPlanScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;
  const router = useRouter();

  const [tables, setTables] = useState<FloorTable[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadFloorPlan();
      // Refresh table status every 30 seconds
      const refresh = setInterval(() => loadFloorPlan(), 30000);
      return () => clearInterval(refresh);
    }
  }, [storeId]);

  const loadFloorPlan = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get(`/merchant/floor-plan?storeId=${storeId}`);
      if (resp.data?.data?.tables && Array.isArray(resp.data.data.tables)) {
        setTables(resp.data.data.tables);
      } else {
        setTables(DEFAULT_LAYOUT);
      }
    } catch (error) {
      logger.error('Error loading floor plan:', error);
      // Use default layout if error
      setTables(DEFAULT_LAYOUT);
    } finally {
      setLoading(false);
    }
  };

  const saveFloorPlan = async () => {
    if (!storeId) {
      platformAlertSimple('Error', 'Store ID not found');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/merchant/floor-plan', { storeId, tables });
      platformAlertSimple('Saved!', 'Floor plan saved successfully.');
      setEditMode(false);
    } catch (error) {
      logger.error('Error saving floor plan:', error);
      platformAlertSimple('Error', 'Could not save floor plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveTable = (id: string, deltaX: number, deltaY: number) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === id) {
          const newX = Math.max(0, Math.min(table.x + deltaX, GRID_COLS - 1));
          const newY = Math.max(0, Math.min(table.y + deltaY, GRID_ROWS - 1));
          return { ...table, x: newX, y: newY };
        }
        return table;
      })
    );
  };

  const handleAddTable = (shape: TableShape) => {
    const newId = String(Math.max(...tables.map((t) => parseInt(t.id) || 0), 0) + 1);
    const newTableNumber = String(
      Math.max(...tables.map((t) => parseInt(t.tableNumber) || 0), 0) + 1
    );

    // Find empty space on grid
    let foundSpot = false;
    for (let y = 0; y < GRID_ROWS && !foundSpot; y++) {
      for (let x = 0; x < GRID_COLS && !foundSpot; x++) {
        const shape_config = SHAPE_CONFIG[shape];
        if (x + shape_config.cols <= GRID_COLS && y + shape_config.rows <= GRID_ROWS) {
          setTables((prev) => [
            ...prev,
            {
              id: newId,
              tableNumber: newTableNumber,
              shape,
              capacity: shape_config.capacity,
              x,
              y,
              status: 'available',
            },
          ]);
          foundSpot = true;
        }
      }
    }

    if (!foundSpot) {
      platformAlertSimple('No Space', 'Not enough space on the floor plan to add this table.');
    }
  };

  const handleDeleteTable = (id: string) => {
    platformAlertDestructive('Delete Table', 'Are you sure you want to delete this table?', () => {
      setTables((prev) => prev.filter((t) => t.id !== id));
    });
  };

  const handleTapTable = (table: FloorTable) => {
    setSelectedTable(table);
    setShowTableModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name={'chevron-back' as keyof typeof Ionicons.glyphMap} size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Floor Plan</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setEditMode(!editMode)}>
              <Ionicons
                name={(editMode ? 'checkmark' : 'pencil') as keyof typeof Ionicons.glyphMap}
                size={20}
                color={Colors.primary[500]}
              />
              <Text style={styles.headerBtnText}>{editMode ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Grid visualization */}
          <View style={styles.gridContainer}>
            <View
              style={[
                styles.grid,
                {
                  width: GRID_COLS * CELL_SIZE,
                  height: GRID_ROWS * CELL_SIZE,
                },
              ]}
            >
              {/* Grid background */}
              {Array.from({ length: GRID_ROWS }).map((_, y) =>
                Array.from({ length: GRID_COLS }).map((_, x) => (
                  <View
                    key={`${x}-${y}`}
                    style={[
                      styles.gridCell,
                      {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        borderColor: Colors.border.default,
                      },
                    ]}
                  />
                ))
              )}

              {/* Tables */}
              {tables.map((table) => (
                <DraggableTable
                  key={table.id}
                  table={table}
                  editMode={editMode}
                  onMove={handleMoveTable}
                  onTap={handleTapTable}
                  onDelete={handleDeleteTable}
                />
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Status</Text>
            <View style={styles.legendItems}>
              {(Object.keys(STATUS_COLORS) as TableStatus[]).map((status) => (
                <View key={status} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
                  <Text style={styles.legendLabel}>{status}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Total tables info */}
          <View style={styles.infoBox}>
            <Ionicons name={'information-circle' as keyof typeof Ionicons.glyphMap} size={20} color={Colors.info} />
            <Text style={styles.infoText}>Total tables: {tables.length}</Text>
          </View>

          {/* Actions */}
          {editMode && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.addBtn]}
                onPress={() => setShowAddPanel(true)}
              >
                <Ionicons name={'add-circle' as keyof typeof Ionicons.glyphMap} size={20} color={Colors.text.inverse} />
                <Text style={styles.actionBtnText}>Add Table</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn]}
                onPress={saveFloorPlan}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.text.inverse} size="small" />
                ) : (
                  <>
                    <Ionicons name={'cloud-upload' as keyof typeof Ionicons.glyphMap} size={20} color={Colors.text.inverse} />
                    <Text style={styles.actionBtnText}>Save Layout</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: Spacing.lg }} />
        </ScrollView>

        {/* Add Table Panel Modal */}
        <Modal visible={showAddPanel} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <AddTablePanel onAdd={handleAddTable} onClose={() => setShowAddPanel(false)} />
          </View>
        </Modal>

        {/* Table Detail Modal */}
        <Modal visible={showTableModal} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              <View style={styles.detailModalHeader}>
                <Text style={styles.detailModalTitle}>Table {selectedTable?.tableNumber}</Text>
                <TouchableOpacity onPress={() => setShowTableModal(false)}>
                  <Ionicons name={'close' as keyof typeof Ionicons.glyphMap} size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shape</Text>
                  <Text style={styles.detailValue}>
                    {selectedTable && SHAPE_CONFIG[selectedTable.shape].label}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Capacity</Text>
                  <Text style={styles.detailValue}>{selectedTable?.capacity} guests</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: STATUS_COLORS[selectedTable?.status || 'available'] + '30',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusBadgeDot,
                        { backgroundColor: STATUS_COLORS[selectedTable?.status || 'available'] },
                      ]}
                    />
                    <Text style={styles.statusBadgeText}>{selectedTable?.status}</Text>
                  </View>
                </View>

                {selectedTable?.currentBookingId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Booking</Text>
                    <Text style={styles.detailValue}>{selectedTable.currentBookingId}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setShowTableModal(false)}
              >
                <Text style={styles.detailCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  },
  headerBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  gridContainer: {
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  grid: {
    position: 'relative',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    ...Shadows.md,
  },
  gridCell: {
    position: 'absolute',
    borderWidth: 1,
  },
  table: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  tableInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
  },
  tableNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  tableCapacity: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  deleteBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
  },
  legend: {
    marginBottom: Spacing.lg,
  },
  legendTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
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
  legendLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.info + '1A',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addBtn: {
    backgroundColor: Colors.primary[500],
  },
  saveBtn: {
    backgroundColor: Colors.success[500],
  },
  actionBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addPanel: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    maxHeight: '80%',
  },
  addPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  addPanelTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addPanelContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  addOptionEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  addOptionText: {
    flex: 1,
  },
  addOptionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addOptionCap: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  detailModal: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
    marginTop: 'auto',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  detailModalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  detailContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statusBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  detailCloseBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  detailCloseBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
