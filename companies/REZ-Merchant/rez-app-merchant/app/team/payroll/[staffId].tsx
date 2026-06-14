import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function StaffPayrollDetailScreen() {
  const { staffId, month } = useLocalSearchParams<{ staffId: string; month: string }>();
  const [payroll, setPayroll] = useState<unknown>(null);
  const [attendance, setAttendance] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [staffId, month]);

  const loadData = async () => {
    try {
      setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      // Do NOT fall back to merchantData.id — that is the merchant/user ID, not a store ID.
      const storeId =
        merchantData?.activeStoreId || merchantData?.storeId || merchantData?.stores?.[0]?._id;

      const [payrollRes, attendanceRes] = await Promise.all([
        apiClient.get(`merchant/payroll/${staffId}?month=${month}&storeId=${storeId}`),
        apiClient.get(
          `merchant/attendance/monthly?staffId=${staffId}&month=${month}&storeId=${storeId}`
        ),
      ]);

      setPayroll(payrollRes.data?.data || payrollRes.data);
      setAttendance(attendanceRes.data?.data || []);
    } catch {
      // use empty state
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    platformAlertConfirm(
      'Mark as Paid',
      `Confirm payment of ₹${payroll?.netSalary?.toLocaleString('en-IN')} to ${payroll?.staffId?.name}?`,
      async () => {
        try {
          await apiClient.patch(`merchant/payroll/${payroll?._id}/mark-paid`);
          await loadData();
          platformAlertSimple('Done', 'Salary marked as paid');
        } catch {
          platformAlertSimple('Error', 'Failed to mark as paid');
        }
      },
      'Confirm'
    );
  };

  const exportSlip = async () => {
    if (!payroll) return;
    const slip = [
      'SALARY SLIP',
      '='.repeat(40),
      `Employee: ${payroll.staffId?.name || 'Staff'}`,
      `Month: ${payroll.month}`,
      `Role: ${payroll.staffId?.role || 'Employee'}`,
      '',
      'EARNINGS',
      '-'.repeat(40),
      `Basic Salary:      ₹${(payroll.baseSalary || 0).toLocaleString('en-IN')}`,
      `Days Present:      ${payroll.daysPresent}/${payroll.workingDays}`,
      `Overtime:          ₹${(payroll.overtime || 0).toLocaleString('en-IN')}`,
      `Bonus:             ₹${(payroll.bonus || 0).toLocaleString('en-IN')}`,
      ...(payroll.commission > 0
        ? [
            `Commission (${payroll.commissionRate || 0}%):  ₹${(payroll.commission || 0).toLocaleString('en-IN')}`,
          ]
        : []),
      '',
      'DEDUCTIONS',
      '-'.repeat(40),
      `Absent Deduction:  ₹${(payroll.deductions || 0).toLocaleString('en-IN')}`,
      '',
      '='.repeat(40),
      `NET SALARY:        ₹${(payroll.netSalary || 0).toLocaleString('en-IN')}`,
      '='.repeat(40),
      `Status: ${payroll.status === 'paid' ? 'PAID' : 'PENDING'}`,
      payroll.paidAt ? `Paid on: ${new Date(payroll.paidAt).toLocaleDateString('en-IN')}` : '',
    ].join('\n');

    try {
      const fileUri = `${FileSystem.documentDirectory}SalarySlip_${payroll.staffId?.name?.replace(/ /g, '_')}_${payroll.month}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, slip);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Salary Slip' });
      } else {
        platformAlertSimple('Saved', fileUri);
      }
    } catch {
      platformAlertSimple('Error', 'Failed to export slip');
    }
  };

  const [year, mon] = (month || '').split('-');
  const monthName = month
    ? new Date(parseInt(year), parseInt(mon) - 1).toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const isPaid = payroll?.status === 'paid';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Salary Slip</Text>
        <TouchableOpacity onPress={exportSlip}>
          <Ionicons name="share-outline" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Employee Card */}
        <View style={styles.employeeCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(payroll?.staffId?.name || 'S')[0]?.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.empName}>{payroll?.staffId?.name || 'Staff Member'}</Text>
            <Text style={styles.empRole}>{payroll?.staffId?.role || 'Employee'}</Text>
            <Text style={styles.empMonth}>{monthName}</Text>
          </View>
          <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.pendingBadge]}>
            <Text style={[styles.statusText, isPaid ? styles.paidText : styles.pendingText]}>
              {isPaid ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Basic Salary</Text>
            <Text style={styles.rowValue}>
              ₹{(payroll?.baseSalary || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Days Present</Text>
            <Text style={styles.rowValue}>
              {payroll?.daysPresent || 0}/{payroll?.workingDays || 26}
            </Text>
          </View>
          {(payroll?.overtime || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Overtime</Text>
              <Text style={[styles.rowValue, { color: '#16a34a' }]}>
                +₹{payroll.overtime.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          {(payroll?.bonus || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Bonus</Text>
              <Text style={[styles.rowValue, { color: '#16a34a' }]}>
                +₹{payroll.bonus.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          {(payroll?.commission || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Commission ({payroll?.commissionRate || 0}%)</Text>
              <Text style={[styles.rowValue, { color: '#16a34a' }]}>
                +₹{payroll.commission.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        {/* Deductions */}
        {(payroll?.deductions || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Absent Days</Text>
              <Text style={[styles.rowValue, { color: '#ef4444' }]}>
                -₹{payroll.deductions.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* Net Salary */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Net Salary</Text>
          <Text style={styles.netAmount}>₹{(payroll?.netSalary || 0).toLocaleString('en-IN')}</Text>
          {isPaid && payroll?.paidAt && (
            <Text style={styles.paidOn}>
              Paid on {new Date(payroll.paidAt).toLocaleDateString('en-IN')}
            </Text>
          )}
        </View>

        {/* Attendance Summary */}
        {attendance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance ({attendance.length} days)</Text>
            <View style={styles.attendanceGrid}>
              {attendance.map((a, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.attendanceDay,
                    a.status === 'present'
                      ? styles.present
                      : a.status === 'half_day'
                        ? styles.halfDay
                        : styles.absent,
                  ]}
                >
                  <Text style={styles.attendanceDayText}>{new Date(a.date).getDate()}</Text>
                </View>
              ))}
            </View>
            <View style={styles.attendanceLegend}>
              <View style={[styles.legendDot, styles.present]} />
              <Text style={styles.legendText}>Present</Text>
              <View style={[styles.legendDot, styles.halfDay]} />
              <Text style={styles.legendText}>Half day</Text>
              <View style={[styles.legendDot, styles.absent]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
          </View>
        )}

        {/* Pay Button */}
        {!isPaid && (
          <TouchableOpacity style={styles.payButton} onPress={markAsPaid}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.payButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 16, paddingBottom: 40 },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#4f46e5' },
  empName: { fontSize: 16, fontWeight: '700', color: '#111' },
  empRole: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  empMonth: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusBadge: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  paidBadge: { backgroundColor: '#dcfce7' },
  pendingBadge: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 13, fontWeight: '700' },
  paidText: { color: '#166534' },
  pendingText: { color: '#92400e' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLabel: { fontSize: 14, color: '#374151' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  netCard: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  netLabel: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  netAmount: { fontSize: 32, fontWeight: '800', color: '#fff' },
  paidOn: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  attendanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  attendanceDay: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceDayText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  present: { backgroundColor: '#22c55e' },
  halfDay: { backgroundColor: '#f59e0b' },
  absent: { backgroundColor: '#ef4444' },
  attendanceLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#6b7280', marginRight: 10 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  payButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
