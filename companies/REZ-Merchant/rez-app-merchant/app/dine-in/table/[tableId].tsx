import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/DesignTokens';
import dineInService, { TableOrder } from '@/services/api/dineIn';
import { storageService } from '@/services/storage';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

type Course = 'starter' | 'main' | 'dessert';

const durationColor = (mins: number): string => {
  if (mins < 30) return '#22c55e'; // green
  if (mins < 60) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

const CourseSelector = ({
  selectedCourse,
  setSelectedCourse,
}: {
  selectedCourse: Course;
  setSelectedCourse: (c: Course) => void;
}) => (
  <View style={styles.courseSelector}>
    {(['starter', 'main', 'dessert'] as Course[]).map((c) => (
      <TouchableOpacity
        key={c}
        style={[styles.courseTab, selectedCourse === c && styles.courseTabActive]}
        onPress={() => setSelectedCourse(c)}
      >
        <Text style={[styles.courseTabText, selectedCourse === c && styles.courseTabTextActive]}>
          {c === 'starter' ? '🥗 Starter' : c === 'main' ? '🍽 Main' : '🍰 Dessert'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function TableDetailScreen() {
  const insets = useSafeAreaInsets();
  const { tableId, tableNumber } = useLocalSearchParams();
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<Course>('main');
  const [firingCourse, setFiringCourse] = useState<Course | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(2);
  const [editSaving, setEditSaving] = useState(false);
  const [tableStatus, setTableStatus] = useState<'available' | 'occupied'>('occupied');

  useEffect(() => {
    const loadTableOrder = async () => {
      try {
        setLoading(true);
        const merchantData = await storageService.getMerchantData<unknown>();
        const activeStoreId =
          merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
        if (!activeStoreId) return;
        setStoreId(activeStoreId);
        const order = await dineInService.getTableOrder(tableId as string, activeStoreId);
        setTableOrder(order);
        // Set initial edit values from table number
        setEditName(tableNumber as string);
      } catch (error) {
        if (error?.response?.status === 404) {
          // No active order — table might have just been opened
          setTableOrder(null);
        } else {
          if (__DEV__) console.error('Failed to load table order:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTableOrder();
  }, [tableId]);

  const fireCourse = async (course: Course) => {
    try {
      setFiringCourse(course);
      const merchantData = await storageService.getMerchantData<unknown>();
      const courseStoreId =
        merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      await apiClient.post('merchant/dine-in/fire-course', {
        tableId,
        course,
        storeId: courseStoreId,
      });
      platformAlertSimple(
        'Fired!',
        `${course.charAt(0).toUpperCase() + course.slice(1)} course sent to kitchen`
      );
    } catch (e) {
      platformAlertSimple('Error', 'Failed to fire course');
    } finally {
      setFiringCourse(null);
    }
  };

  const handleEditTable = async () => {
    if (!editName.trim()) {
      platformAlertSimple('Validation Error', 'Please enter a table name/number');
      return;
    }
    try {
      setEditSaving(true);
      await apiClient.patch(`merchant/tables/${tableId}`, {
        tableNumber: editName,
        capacity: editCapacity,
      });
      platformAlertSimple('Success', 'Table updated successfully');
      setEditModalVisible(false);
    } catch (e) {
      platformAlertSimple(
        'Error',
        e?.response?.data?.message || e.message || 'Failed to update table'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleTableStatus = async (newStatus: 'available' | 'occupied') => {
    try {
      await apiClient.patch(`merchant/tables/${tableId}/status`, {
        status: newStatus,
      });
      setTableStatus(newStatus);
      platformAlertSimple('Success', `Table marked as ${newStatus}`);
    } catch (e) {
      platformAlertSimple('Error', e?.response?.data?.message || 'Failed to update table status');
    }
  };

  const handleCharge = async () => {
    if (!tableOrder || tableOrder.items.length === 0) {
      platformAlertSimple('No Items', 'Add items to the order before charging');
      return;
    }
    try {
      setCharging(true);
      const billPayload = {
        storeId,
        items: tableOrder.items,
        tableId: tableId as string,
        customerPhone: tableOrder.customerPhone,
        totalAmount: tableOrder.totalAmount,
      };
      const response = await apiClient.post('merchant/bills', billPayload);
      const bill = response.data?.data;

      // Update table session to available
      await dineInService.updateTableStatus(tableId as string, storeId, 'available');

      // Navigate to POS success or bill view
      router.replace({
        pathname: '/pos/success',
        params: { billId: bill?._id, amount: tableOrder.totalAmount },
      });
    } catch (error) {
      platformAlertSimple('Error', error?.response?.data?.message || 'Failed to create bill');
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (!tableOrder) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Table {tableNumber}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No order found for this table</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Table {tableNumber}</Text>
          {tableOrder.guestCount && (
            <Text style={styles.headerSubtitle}>{tableOrder.guestCount} guests</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <Ionicons name="pencil" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Course Selector */}
        <CourseSelector selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} />

        {/* Current Order Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Order</Text>

          {/* Group items by course */}
          {(() => {
            const itemsByCourse = {
              starter: (tableOrder.items || []).filter((i) => i.course === 'starter'),
              main: (tableOrder.items || []).filter((i) => !i.course || i.course === 'main'),
              dessert: (tableOrder.items || []).filter((i) => i.course === 'dessert'),
            };

            const courseLabels: Record<Course, string> = {
              starter: '🥗 Starters',
              main: '🍽 Main Course',
              dessert: '🍰 Dessert',
            };

            return (['starter', 'main', 'dessert'] as Course[]).map((course) => {
              const items = itemsByCourse[course];
              if (items.length === 0) return null;
              return (
                <View key={course} style={styles.courseSection}>
                  <View style={styles.courseSectionHeader}>
                    <Text style={styles.courseSectionTitle}>
                      {courseLabels[course]} ({items.length})
                    </Text>
                    <TouchableOpacity
                      style={[styles.fireCourseBtn, firingCourse === course && { opacity: 0.6 }]}
                      onPress={() => fireCourse(course)}
                      disabled={firingCourse === course}
                    >
                      {firingCourse === course ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.fireCourseBtnText}>Fire to Kitchen</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemsContainer}>
                    {items.map((item, idx: number) => (
                      <View key={item.productId || idx} style={styles.itemRow}>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName}>
                            {item.quantity}x {item.name}
                          </Text>
                        </View>
                        <Text style={styles.itemPrice}>
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </Text>
                        {idx < items.length - 1 && <View style={styles.itemDivider} />}
                      </View>
                    ))}
                  </View>
                </View>
              );
            });
          })()}

          {/* Add Items & Edit Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, { borderColor: Colors.primary[500], borderWidth: 1 }]}
              onPress={() =>
                platformAlertSimple('Coming Soon', 'Adding items inline is not yet available.')
              }
            >
              <Ionicons name="add" size={18} color={Colors.primary[500]} />
              <Text style={[styles.controlButtonText, { color: Colors.primary[500] }]}>
                Add Items
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { borderColor: Colors.error[500], borderWidth: 1 }]}
            >
              <Ionicons name="trash" size={18} color={Colors.error[500]} />
              <Text style={[styles.controlButtonText, { color: Colors.error[500] }]}>
                Cancel All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Table Status Toggle */}
          <View style={styles.statusToggleRow}>
            <TouchableOpacity
              style={[
                styles.statusToggleBtn,
                tableStatus === 'available' && styles.statusToggleBtnActive,
              ]}
              onPress={() => handleTableStatus('available')}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={tableStatus === 'available' ? '#fff' : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.statusToggleBtnText,
                  tableStatus === 'available' && styles.statusToggleBtnTextActive,
                ]}
              >
                Available
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusToggleBtn,
                tableStatus === 'occupied' && styles.statusToggleBtnActive,
              ]}
              onPress={() => handleTableStatus('occupied')}
            >
              <Ionicons
                name="person-circle"
                size={16}
                color={tableStatus === 'occupied' ? '#fff' : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.statusToggleBtnText,
                  tableStatus === 'occupied' && styles.statusToggleBtnTextActive,
                ]}
              >
                Occupied
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Billing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>

          <View style={styles.billContainer}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Total:</Text>
              <Text style={styles.billValue}>₹{tableOrder.totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={[styles.billRow, styles.billTotal]}>
              <Text style={styles.billTotalLabel}>AMOUNT DUE:</Text>
              <Text style={styles.billTotalValue}>₹{tableOrder.totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Charge Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.generateBillButton, charging && { opacity: 0.6 }]}
          onPress={handleCharge}
          disabled={charging}
        >
          {charging ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="card" size={20} color={Colors.text.inverse} />
              <Text style={styles.generateBillText}>
                Charge ₹{tableOrder.totalAmount.toLocaleString()}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Table Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Table</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Table Name / Number</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={styles.input}
                placeholder="e.g. Table 5 or T5"
                placeholderTextColor={Colors.text.secondary}
              />

              <Text style={[styles.label, { marginTop: Spacing.lg }]}>Capacity (seats)</Text>
              <View style={styles.capacityRow}>
                {[2, 4, 6, 8, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setEditCapacity(n)}
                    style={[styles.capBtn, editCapacity === n && styles.capBtnActive]}
                  >
                    <Text style={editCapacity === n ? styles.capBtnTextActive : styles.capBtnText}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditTable}
                disabled={editSaving}
                style={[styles.saveBtn, editSaving && { opacity: 0.6 }]}
              >
                {editSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  itemRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  itemDetails: {
    marginBottom: Spacing.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemSpecial: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginTop: Spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  billContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  billLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  billDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  billTotal: {
    marginBottom: 0,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary[600],
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  generateBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  generateBillText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  courseSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  courseTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  courseTabActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  courseTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  courseTabTextActive: {
    color: '#fff',
  },
  courseSection: {
    marginBottom: 16,
  },
  courseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  courseSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  fireCourseBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fireCourseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  statusToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statusToggleBtnActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  statusToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  statusToggleBtnTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.text.primary,
  },
  capacityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  capBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.gray[100],
  },
  capBtnActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  capBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  capBtnTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
