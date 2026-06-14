import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { apiClient } from '@/services';
import { logger } from '@/utils/logger';

// Simple debounce implementation
const debounce = (fn: Function, delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLS = 4;
const GRID_ROWS = 6;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / GRID_COLS);

interface Table {
  id?: string;
  _id?: string;
  tableNumber: number;
  capacity: number;
  x?: number; // grid column (legacy)
  y?: number; // grid row (legacy)
  status?: string;
  isOccupied?: boolean;
}

export default function FloorPlanScreen() {
  const { id: storeId } = useLocalSearchParams<{ id: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [addingTable, setAddingTable] = useState(false);
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [totalTables, setTotalTables] = useState(10);

  // Debounced save function
  const saveTables = useCallback(
    debounce(async (updatedTables: Table[]) => {
      try {
        setSaving(true);
        await apiClient.put(`merchant/stores/${storeId}`, {
          tableConfig: updatedTables,
          totalTables: updatedTables.length,
        });
      } catch (e) {
        logger.error('[FloorPlan] Save failed:', e);
        platformAlertSimple('Error', 'Failed to save floor plan');
      } finally {
        setSaving(false);
      }
    }, 1000),
    [storeId]
  );

  useEffect(() => {
    loadFloorPlan();
  }, [storeId]);

  const loadFloorPlan = async () => {
    try {
      const response = await apiClient.get(`merchant/stores/${storeId}`);
      const store = response.data?.data || response.data;
      setTotalTables(store.totalTables || 10);
      if (store.tableConfig && store.tableConfig.length > 0) {
        setTables(
          store.tableConfig.map((t) => ({
            id: t.id || t._id || String(t.tableNumber),
            tableNumber: t.tableNumber,
            capacity: t.capacity || 4,
            status: t.status || 'available',
            isOccupied: t.status === 'occupied' || t.isOccupied,
          }))
        );
      } else {
        // Generate default list
        const defaults: Table[] = [];
        for (let i = 0; i < (store.totalTables || 10); i++) {
          defaults.push({
            id: String(i + 1),
            tableNumber: i + 1,
            capacity: 4,
            status: 'available',
            isOccupied: false,
          });
        }
        setTables(defaults);
      }
    } catch {
      platformAlertSimple('Error', 'Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  };

  const handleTableLongPress = (table: Table) => {
    platformAlert(
      `Table ${table.tableNumber}`,
      `Capacity: ${table.capacity} guests\nStatus: ${table.isOccupied ? 'Occupied' : 'Available'}`,
      [
        { text: 'Cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = tables.filter((t) => t.id !== table.id);
            setTables(updated);
            saveTables(updated);
          },
        },
      ]
    );
  };

  const confirmAddTable = () => {
    const maxNum = tables.length > 0 ? Math.max(...tables.map((t) => t.tableNumber)) : 0;
    const newTable: Table = {
      id: String(maxNum + 1),
      tableNumber: maxNum + 1,
      capacity: parseInt(newTableCapacity) || 4,
      status: 'available',
      isOccupied: false,
    };
    const updated = [...tables, newTable];
    setTables(updated);
    saveTables(updated);
    setAddingTable(false);
    setSelectedCell(null);
  };

  const saveFloorPlan = async () => {
    try {
      setSaving(true);
      await apiClient.put(`merchant/stores/${storeId}`, {
        tableConfig: tables,
        totalTables: tables.length,
      });
      platformAlertSimple('Saved', 'Floor plan updated successfully');
    } catch (e) {
      logger.error('[FloorPlan] Save error:', e);
      platformAlertSimple('Error', 'Failed to save floor plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const occupiedCount = tables.filter((t) => t.isOccupied).length;

  const renderTableItem = ({ item, drag, isActive }: RenderItemParams<Table>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        onPress={() => handleTableLongPress(item)}
        style={[
          styles.tableItem,
          isActive && styles.tableItemActive,
          item.isOccupied && styles.tableOccupied,
        ]}
      >
        <Text style={styles.tableNumber}>T{item.tableNumber}</Text>
        <Text style={styles.tableCapacity}>{item.capacity} seats</Text>
        <Text style={styles.tableStatus}>{item.isOccupied ? '🔴 Occupied' : '🟢 Available'}</Text>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Floor Plan</Text>
          <TouchableOpacity onPress={saveFloorPlan} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {tables.length} tables · {occupiedCount} occupied · Long press to drag
          </Text>
        </View>

        {tables.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="grid-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No tables yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setAddingTable(true)}>
              <Text style={styles.addButtonText}>Add First Table</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <DraggableFlatList
            data={tables}
            keyExtractor={(item) => item.id || item._id || String(item.tableNumber)}
            onDragEnd={({ data }) => {
              setTables(data);
              saveTables(data);
            }}
            renderItem={renderTableItem}
            numColumns={2}
            containerStyle={styles.tableGrid}
          />
        )}

        <TouchableOpacity style={styles.addTableButton} onPress={() => setAddingTable(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addTableButtonText}>Add Table</Text>
        </TouchableOpacity>

        {/* Add Table Modal */}
        {addingTable && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add Table</Text>
              <Text style={styles.modalLabel}>Seating capacity</Text>
              <View style={styles.capacityRow}>
                {[2, 4, 6, 8].map((cap) => (
                  <TouchableOpacity
                    key={cap}
                    style={[
                      styles.capButton,
                      newTableCapacity === String(cap) && styles.capButtonActive,
                    ]}
                    onPress={() => setNewTableCapacity(String(cap))}
                  >
                    <Text
                      style={[
                        styles.capText,
                        newTableCapacity === String(cap) && styles.capTextActive,
                      ]}
                    >
                      {cap}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setAddingTable(false);
                    setSelectedCell(null);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={confirmAddTable}>
                  <Text style={styles.confirmText}>Add Table</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  statsBar: { backgroundColor: '#e0e7ff', padding: 10, alignItems: 'center' },
  statsText: { fontSize: 13, color: '#3730a3', fontWeight: '500' },
  tableGrid: { padding: 16, gap: 12 },
  tableItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    margin: 6,
  },
  tableItemActive: { backgroundColor: '#f0e7ff', transform: [{ scale: 1.05 }], shadowOpacity: 0.3 },
  tableOccupied: { backgroundColor: '#fee2e2', borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  tableNumber: { fontSize: 16, fontWeight: '800', color: '#4f46e5', marginBottom: 4 },
  tableCapacity: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  tableStatus: { fontSize: 11, color: '#374151', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  addTableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
  },
  addTableButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: SCREEN_WIDTH - 48 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  modalLabel: { fontSize: 14, color: '#374151', marginBottom: 10 },
  capacityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  capButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  capButtonActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  capText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  capTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
