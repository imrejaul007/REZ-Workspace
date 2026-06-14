import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/DesignTokens';
import dineInService, { TableStatus } from '@/services/api/dineIn';
import { storageService } from '@/services/storage';
import { logger } from '@/utils/logger';

interface TableOption {
  id: string;
  tableNumber: number;
  capacity: number;
}

export default function NewOrderScreen() {
  const insets = useSafeAreaInsets();
  const { tableId, tableNumber } = useLocalSearchParams();
  const [selectedTable, setSelectedTable] = useState<TableStatus | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [availableTables, setAvailableTables] = useState<TableStatus[]>([]);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    const loadAvailableTables = async () => {
      try {
        const merchantData = await storageService.getMerchantData<unknown>();
        const activeStoreId =
          merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
        if (!activeStoreId) return;
        setStoreId(activeStoreId);
        const data = await dineInService.getTableStatus(activeStoreId);
        const available = data.tables.filter((t) => t.status === 'available');
        setAvailableTables(available);

        // If tableId was passed, find and select that table
        if (tableId) {
          const table = available.find((t) => t.id === tableId);
          if (table) {
            setSelectedTable(table);
          }
        }
      } catch (error) {
        if (__DEV__) console.error('Failed to load available tables:', error);
      }
    };
    loadAvailableTables();
  }, [tableId]);

  const handleStartOrder = async () => {
    if (!selectedTable) {
      platformAlertSimple('Select Table', 'Please select a table first');
      return;
    }

    try {
      setLoading(true);
      await dineInService.startOrder({
        storeId,
        tableId: selectedTable.id,
        tableNumber: selectedTable.tableNumber,
        guestCount: parseInt(guestCount) || 1,
        customerPhone: customerPhone || undefined,
        customerName: customerName || undefined,
      });
      router.back();
    } catch (error) {
      platformAlertSimple('Error', error?.response?.data?.message || 'Failed to start order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Table Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Table</Text>
          <TouchableOpacity style={styles.card} onPress={() => setShowTablePicker(true)}>
            <View style={styles.cardContent}>
              <Ionicons name="grid-outline" size={20} color={Colors.primary[500]} />
              <View style={styles.cardText}>
                <Text style={styles.label}>Table</Text>
                <Text style={styles.value}>
                  {selectedTable ? `Table ${selectedTable.tableNumber}` : 'Select Table'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Guest Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Details</Text>
          <View style={styles.card}>
            <View style={styles.inputField}>
              <View style={styles.inputLabel}>
                <Ionicons name="people" size={20} color={Colors.primary[500]} />
                <Text style={styles.label}>Number of Guests</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g., 4"
                value={guestCount}
                onChangeText={setGuestCount}
              />
              {selectedTable && (
                <Text style={styles.helperText}>
                  Table capacity: {selectedTable.capacity} guests
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Customer Name (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Name (Optional)</Text>
          <View style={styles.card}>
            <View style={styles.inputField}>
              <View style={styles.inputLabel}>
                <Ionicons name="person-outline" size={20} color={Colors.primary[500]} />
                <Text style={styles.label}>Name</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Customer name"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
          </View>
        </View>

        {/* Customer Phone (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Phone (Optional)</Text>
          <View style={styles.card}>
            <View style={styles.inputField}>
              <View style={styles.inputLabel}>
                <Ionicons name="call-outline" size={20} color={Colors.primary[500]} />
                <Text style={styles.label}>Phone Number</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                maxLength={10}
              />
              <Text style={styles.helperText}>For loyalty rewards enrollment</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Order Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.startButton, loading && { opacity: 0.6 }]}
          onPress={handleStartOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="play" size={20} color={Colors.text.inverse} />
              <Text style={styles.startButtonText}>Start Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Table Picker Modal */}
      <Modal visible={showTablePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Table</Text>
              <TouchableOpacity onPress={() => setShowTablePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {availableTables.map((table) => (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableOption,
                    selectedTable?.id === table.id && styles.tableOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedTable(table);
                    setShowTablePicker(false);
                  }}
                >
                  <View style={styles.tableOptionContent}>
                    <Text style={styles.tableOptionText}>Table {table.tableNumber}</Text>
                    <Text style={styles.tableOptionCapacity}>{table.capacity} capacity</Text>
                  </View>
                  {selectedTable?.id === table.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  inputField: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
  },
  tableOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tableOptionActive: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  tableOptionContent: {
    flex: 1,
  },
  tableOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  tableOptionCapacity: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
