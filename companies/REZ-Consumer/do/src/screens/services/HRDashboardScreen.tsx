/**
 * HR Dashboard Screen
 *
 * CorpPerks HRMS integration for DO App
 * Features: Payroll, Leave, Attendance, Expenses, Learning
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { corpperksClient } from '../services/clients';

interface Props {
  navigation?: any;
}

const HRDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeId] = useState('EMP001'); // Replace with actual user ID

  const [dashboard, setDashboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leave' | 'attendance' | 'expenses'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await corpperksClient.getDOAppDashboard(employeeId);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading HR Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HR Dashboard</Text>
        <Text style={styles.headerSubtitle}>CorpPerks Integration</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation?.navigate('CheckIn')}
        >
          <Text style={styles.quickActionIcon}>🕐</Text>
          <Text style={styles.quickActionText}>Check In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setActiveTab('leave')}
        >
          <Text style={styles.quickActionIcon}>🏖️</Text>
          <Text style={styles.quickActionText}>Leave</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation?.navigate('Payslip')}
        >
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionText}>Payslip</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {['overview', 'leave', 'attendance', 'expenses'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content based on tab */}
      {activeTab === 'overview' && (
        <View style={styles.content}>
          {/* Attendance Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Attendance</Text>
            <View style={styles.attendanceRow}>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceLabel}>Check In</Text>
                <Text style={styles.attendanceValue}>9:15 AM</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceLabel}>Check Out</Text>
                <Text style={styles.attendanceValue}>-</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceLabel}>Hours</Text>
                <Text style={styles.attendanceValue}>6.5 hrs</Text>
              </View>
            </View>
          </View>

          {/* Leave Balance Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Leave Balance</Text>
            <View style={styles.leaveGrid}>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveNumber}>{dashboard?.leaveBalance?.casual || 12}</Text>
                <Text style={styles.leaveLabel}>Casual</Text>
              </View>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveNumber}>{dashboard?.leaveBalance?.earned || 8}</Text>
                <Text style={styles.leaveLabel}>Earned</Text>
              </View>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveNumber}>{dashboard?.leaveBalance?.sick || 3}</Text>
                <Text style={styles.leaveLabel}>Sick</Text>
              </View>
            </View>
          </View>

          {/* Payslip Preview Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest Payslip</Text>
            <View style={styles.payslipRow}>
              <View>
                <Text style={styles.payslipLabel}>June 2026</Text>
                <Text style={styles.payslipAmount}>₹85,000</Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Expense Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expenses This Month</Text>
            <View style={styles.expenseRow}>
              <View>
                <Text style={styles.expenseLabel}>Pending</Text>
                <Text style={styles.expenseValue}>₹2,500</Text>
              </View>
              <View>
                <Text style={styles.expenseLabel}>Approved</Text>
                <Text style={styles.expenseValue}>₹15,000</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'leave' && (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Request Leave</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>+ New Leave Request</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Requests</Text>
            <View style={styles.leaveRequestItem}>
              <View>
                <Text style={styles.leaveType}>Casual Leave</Text>
                <Text style={styles.leaveDates}>Jun 20-22, 2026</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>
            <View style={styles.leaveRequestItem}>
              <View>
                <Text style={styles.leaveType}>Sick Leave</Text>
                <Text style={styles.leaveDates}>Jun 10, 2026</Text>
              </View>
              <View style={[styles.statusBadge, styles.approvedBadge]}>
                <Text style={[styles.statusText, styles.approvedText]}>Approved</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'attendance' && (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>22</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Half Day</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week</Text>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <View key={day} style={styles.dayRow}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={[styles.dayStatus, i < 4 && styles.presentBadge]}>
                  <Text style={styles.dayStatusText}>
                    {i < 4 ? '9:15 AM' : i === 4 ? 'Week Off' : 'Week Off'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'expenses' && (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit Expense</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>+ New Expense</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pending Approval</Text>
            <View style={styles.expenseItem}>
              <View>
                <Text style={styles.expenseTitle}>Client Meeting</Text>
                <Text style={styles.expenseAmount}>₹1,500</Text>
              </View>
              <Text style={styles.expenseStatus}>Pending</Text>
            </View>
            <View style={styles.expenseItem}>
              <View>
                <Text style={styles.expenseTitle}>Travel - Mumbai Trip</Text>
                <Text style={styles.expenseAmount}>₹1,000</Text>
              </View>
              <Text style={styles.expenseStatus}>Pending</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Approved</Text>
            <View style={styles.expenseItem}>
              <View>
                <Text style={styles.expenseTitle}>Office Supplies</Text>
                <Text style={styles.expenseAmount}>₹5,000</Text>
              </View>
              <Text style={styles.approvedStatus}>Approved</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#6C63FF',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#666',
  },
  attendanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  leaveGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaveItem: {
    alignItems: 'center',
  },
  leaveNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  leaveLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payslipLabel: {
    fontSize: 14,
    color: '#666',
  },
  payslipAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  viewButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  expenseLabel: {
    fontSize: 12,
    color: '#666',
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#E8E8E8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  leaveRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  leaveDates: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  approvedBadge: {
    backgroundColor: '#E8F5E9',
  },
  approvedText: {
    color: '#4CAF50',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 14,
    color: '#333',
  },
  dayStatus: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentBadge: {
    backgroundColor: '#E8F5E9',
  },
  dayStatusText: {
    fontSize: 12,
    color: '#666',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  expenseTitle: {
    fontSize: 14,
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  expenseStatus: {
    fontSize: 12,
    color: '#FF9800',
  },
  approvedStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  bottomPadding: {
    height: 40,
  },
});

export default HRDashboardScreen;
