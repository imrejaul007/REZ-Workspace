/**
 * Employee Payouts Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type TabType = 'disbursements' | 'employees' | 'salary';

interface Disbursement {
  id: string;
  employeeName: string;
  type: string;
  amount: number;
  netAmount: number;
  status: string;
  reference: string;
  date: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
}

export default function EmployeePayoutsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('disbursements');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const fetchData = useCallback(async () => {
    // Mock data
    const mockDisbursements: Disbursement[] = [
      { id: '1', employeeName: 'Rajesh Kumar', type: 'Salary', amount: 85000, netAmount: 76500, status: 'completed', reference: 'SAL-ABC123', date: '2024-01-15' },
      { id: '2', employeeName: 'Priya Singh', type: 'Incentive', amount: 25000, netAmount: 23750, status: 'completed', reference: 'INC-DEF456', date: '2024-01-10' },
      { id: '3', employeeName: 'Amit Patel', type: 'Expense', amount: 15000, netAmount: 15000, status: 'pending', reference: 'EXP-GHI789', date: '2024-01-08' },
      { id: '4', employeeName: 'Sneha Reddy', type: 'Commission', amount: 45000, netAmount: 40500, status: 'processing', reference: 'COM-JKL012', date: '2024-01-05' },
    ];

    const mockEmployees: Employee[] = [
      { id: '1', name: 'Rajesh Kumar', department: 'Operations', designation: 'Manager' },
      { id: '2', name: 'Priya Singh', department: 'Sales', designation: 'Team Lead' },
      { id: '3', name: 'Amit Patel', department: 'Operations', designation: 'Supervisor' },
      { id: '4', name: 'Sneha Reddy', department: 'Sales', designation: 'Executive' },
      { id: '5', name: 'Vikram Joshi', department: 'Finance', designation: 'Accountant' },
    ];

    setDisbursements(mockDisbursements);
    setEmployees(mockEmployees);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.green[500];
      case 'pending': return Colors.orange[500];
      case 'processing': return Colors.blue[500];
      case 'failed': return Colors.red[500];
      default: return Colors.gray[500];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Salary': return 'cash-outline';
      case 'Incentive': return 'trophy-outline';
      case 'Expense': return 'receipt-outline';
      case 'Commission': return 'percent-outline';
      default: return 'wallet-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Salary': return Colors.blue[500];
      case 'Incentive': return Colors.orange[500];
      case 'Expense': return Colors.green[500];
      case 'Commission': return Colors.purple[500];
      default: return Colors.gray[500];
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'disbursements', label: 'Disbursements' },
    { key: 'employees', label: 'Employees' },
    { key: 'salary', label: 'Salary' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Employee Payouts</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'disbursements' && (
            <Animated.View entering={FadeInDown}>
              {/* Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{disbursements.length}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: Colors.green[600] }]}>
                      {formatCurrency(disbursements.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.netAmount, 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Completed</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: Colors.orange[600] }]}>
                      {formatCurrency(disbursements.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.netAmount, 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                  </View>
                </View>
              </View>

              {/* Disbursements List */}
              {disbursements.map((item) => (
                <View key={item.id} style={styles.disbursementCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.employeeInfo}>
                      <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                        <Ionicons name={getTypeIcon(item.type)} size={18} color={getTypeColor(item.type)} />
                      </View>
                      <View>
                        <Text style={styles.employeeName}>{item.employeeName}</Text>
                        <Text style={styles.disbursementType}>{item.type}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Net Amount</Text>
                      <Text style={[styles.netAmount]}>{formatCurrency(item.netAmount)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Reference</Text>
                      <Text style={styles.refValue}>{item.reference}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Date</Text>
                      <Text style={styles.dateValue}>{formatDate(item.date)}</Text>
                    </View>
                  </View>
                  {item.status === 'pending' && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.approveBtn}>
                        <Ionicons name="checkmark" size={18} color={Colors.green[600]} />
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.processBtn}>
                        <Ionicons name="send" size={18} color={Colors.blue[600]} />
                        <Text style={styles.processText}>Process</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </Animated.View>
          )}

          {activeTab === 'employees' && (
            <Animated.View entering={FadeInDown}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{employees.length}</Text>
                    <Text style={styles.summaryLabel}>Total Employees</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(disbursements.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.netAmount, 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Paid</Text>
                  </View>
                </View>
              </View>

              {employees.map((emp) => (
                <View key={emp.id} style={styles.employeeCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{emp.name.split(' ').map(n => n[0]).join('')}</Text>
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Text style={styles.empRole}>{emp.designation}</Text>
                    <Text style={styles.empDept}>{emp.department}</Text>
                  </View>
                  <TouchableOpacity style={styles.payBtn}>
                    <Ionicons name="cash-outline" size={20} color={Colors.primary[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.View>
          )}

          {activeTab === 'salary' && (
            <Animated.View entering={FadeInDown}>
              <View style={styles.salaryCard}>
                <View style={styles.salaryHeader}>
                  <Ionicons name="calendar" size={48} color={Colors.primary[500]} />
                  <Text style={styles.salaryTitle}>Salary Batch</Text>
                  <Text style={styles.salarySubtitle}>Process salaries for the month</Text>
                </View>
                <View style={styles.salaryStats}>
                  <View style={styles.salaryStat}>
                    <Text style={styles.salaryStatValue}>{employees.length}</Text>
                    <Text style={styles.salaryStatLabel}>Employees</Text>
                  </View>
                  <View style={styles.salaryStat}>
                    <Text style={styles.salaryStatValue}>{formatCurrency(350000)}</Text>
                    <Text style={styles.salaryStatLabel}>Total Payout</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.processSalaryBtn}>
                  <Ionicons name="play-circle" size={24} color={Colors.white} />
                  <Text style={styles.processSalaryText}>Run Salary Batch</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Salary Runs */}
              <Text style={styles.sectionTitle}>Recent Salary Runs</Text>
              {[
                { month: 'December 2023', employees: 4, amount: 340000, status: 'completed' },
                { month: 'November 2023', employees: 4, amount: 340000, status: 'completed' },
              ].map((run, index) => (
                <View key={index} style={styles.runCard}>
                  <View style={styles.runInfo}>
                    <Text style={styles.runMonth}>{run.month}</Text>
                    <Text style={styles.runDetails}>{run.employees} employees</Text>
                  </View>
                  <View style={styles.runAmount}>
                    <Text style={styles.runValue}>{formatCurrency(run.amount)}</Text>
                    <View style={[styles.runStatus, { backgroundColor: Colors.green[100] }]}>
                      <Text style={[styles.runStatusText, { color: Colors.green[700] }]}>
                        {run.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray[50] },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[500], justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary[500] },
  tabText: { fontSize: 14, color: Colors.gray[500] },
  tabTextActive: { color: Colors.primary[500], fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  summaryCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  summaryLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  disbursementCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  employeeInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  employeeName: { fontSize: 15, fontWeight: '600', color: Colors.gray[900] },
  disbursementType: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardBody: { borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amountLabel: { fontSize: 13, color: Colors.gray[500] },
  amountValue: { fontSize: 13, color: Colors.gray[800], fontWeight: '500' },
  netAmount: { fontSize: 15, fontWeight: '700', color: Colors.green[600] },
  refValue: { fontSize: 13, color: Colors.gray[600], fontFamily: 'monospace' },
  dateValue: { fontSize: 13, color: Colors.gray[600] },
  cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.green[300], gap: 6 },
  approveText: { fontSize: 13, fontWeight: '500', color: Colors.green[600] },
  processBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.blue[500], gap: 6 },
  processText: { fontSize: 13, fontWeight: '500', color: Colors.white },
  employeeCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary[500], justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  empInfo: { flex: 1, marginLeft: 12 },
  empName: { fontSize: 15, fontWeight: '600', color: Colors.gray[900] },
  empRole: { fontSize: 13, color: Colors.gray[600], marginTop: 2 },
  empDept: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  payBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[50], justifyContent: 'center', alignItems: 'center' },
  salaryCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  salaryHeader: { alignItems: 'center', marginBottom: 20 },
  salaryTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900], marginTop: 12 },
  salarySubtitle: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
  salaryStats: { flexDirection: 'row', gap: 40, marginBottom: 20 },
  salaryStat: { alignItems: 'center' },
  salaryStatValue: { fontSize: 24, fontWeight: '700', color: Colors.gray[900] },
  salaryStatLabel: { fontSize: 12, color: Colors.gray[500], marginTop: 4 },
  processSalaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary[500], paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, gap: 8 },
  processSalaryText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.gray[900], marginBottom: 12 },
  runCard: { backgroundColor: Colors.white, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  runInfo: {},
  runMonth: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  runDetails: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  runAmount: { alignItems: 'flex-end' },
  runValue: { fontSize: 14, fontWeight: '700', color: Colors.gray[900] },
  runStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  runStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
