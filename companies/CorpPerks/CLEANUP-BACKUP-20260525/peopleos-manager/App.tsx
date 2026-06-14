import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Types
interface Alert {
  id: string;
  employee: string;
  type: 'exit' | 'late' | 'wfh';
  location: string;
  time: string;
  status: 'new' | 'acknowledged';
}

interface Employee {
  id: string;
  name: string;
  department: string;
  status: 'present' | 'absent' | 'late' | 'wfh';
}

// Mock data
const mockAlerts: Alert[] = [
  { id: '1', employee: 'Priya Sharma', type: 'exit', location: 'Main Office', time: '2 min ago', status: 'new' },
  { id: '2', employee: 'Rahul Verma', type: 'late', location: 'Main Office', time: '15 min ago', status: 'new' },
  { id: '3', employee: 'Sneha Patel', type: 'wfh', location: 'Home - Mumbai', time: '1 hour ago', status: 'acknowledged' },
];

const mockEmployees: Employee[] = [
  { id: '1', name: 'Priya Sharma', department: 'Engineering', status: 'present' },
  { id: '2', name: 'Rahul Verma', department: 'Marketing', status: 'late' },
  { id: '3', name: 'Sneha Patel', department: 'Sales', status: 'wfh' },
  { id: '4', name: 'Amit Kumar', department: 'Engineering', status: 'present' },
  { id: '5', name: 'Neha Singh', department: 'HR', status: 'absent' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'team' | 'quick'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (notificationStatus === 'granted' && locationStatus === 'granted') {
      setNotificationsEnabled(true);
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  };

  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Geo-Alert',
        body: 'Priya Sharma left Main Office',
        data: { type: 'exit' },
      },
      trigger: null,
    });
    Alert.alert('Notification Sent!', 'Check your notification center.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'wfh': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exit': return '🚪';
      case 'late': return '⏰';
      case 'wfh': return '🏠';
      default: return '⚠️';
    }
  };

  const newAlerts = alerts.filter(a => a.status === 'new');
  const presentCount = mockEmployees.filter(e => e.status === 'present').length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PeopleOS</Text>
          <Text style={styles.headerSubtitle}>Manager</Text>
        </View>
        <TouchableOpacity style={styles.notificationBadge} onPress={sendTestNotification}>
          <Text style={styles.notificationIcon}>🔔</Text>
          {newAlerts.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newAlerts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{presentCount}/{mockEmployees.length}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{newAlerts.length}</Text>
          <Text style={styles.statLabel}>New Alerts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            🔔 Alerts ({newAlerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.activeTab]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>
            👥 Team
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quick' && styles.activeTab]}
          onPress={() => setActiveTab('quick')}
        >
          <Text style={[styles.tabText, activeTab === 'quick' && styles.activeTabText]}>
            ⚡ Quick
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'alerts' && (
          <>
            <Text style={styles.sectionTitle}>Geo-Fence Alerts</Text>
            {alerts.map(alert => (
              <TouchableOpacity
                key={alert.id}
                style={[styles.alertCard, alert.status === 'new' && styles.newAlert]}
                onPress={() => alert.status === 'new' && acknowledgeAlert(alert.id)}
              >
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>{getAlertIcon(alert.type)}</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertEmployee}>{alert.employee}</Text>
                  <Text style={styles.alertDetail}>
                    {alert.type === 'exit' ? 'Left' : alert.type === 'late' ? 'Late' : 'WFH'}: {alert.location}
                  </Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
                {alert.status === 'new' && (
                  <TouchableOpacity
                    style={styles.ackButton}
                    onPress={() => acknowledgeAlert(alert.id)}
                  >
                    <Text style={styles.ackText}>ACK</Text>
                  </TouchableOpacity>
                )}
                {alert.status === 'acknowledged' && (
                  <Text style={styles.ackedText}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'team' && (
          <>
            <Text style={styles.sectionTitle}>Team Status</Text>
            {mockEmployees.map(emp => (
              <View key={emp.id} style={styles.employeeCard}>
                <View style={[styles.avatar, { backgroundColor: getStatusColor(emp.status) }]}>
                  <Text style={styles.avatarText}>
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{emp.name}</Text>
                  <Text style={styles.employeeDept}>{emp.department}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(emp.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(emp.status) }]}>
                    {emp.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'quick' && (
          <>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickIcon}>📍</Text>
                <Text style={styles.quickLabel}>View Geo-Fences</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickIcon}>🏠</Text>
                <Text style={styles.quickLabel}>WFH Approvals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickIcon}>📊</Text>
                <Text style={styles.quickLabel}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickIcon}>📋</Text>
                <Text style={styles.quickLabel}>All Employees</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationStatus}>
              <Text style={styles.notificationStatusText}>
                {notificationsEnabled ? '✅ Notifications Enabled' : '⚠️ Enable Notifications'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#10b981',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  notificationBadge: {
    position: 'relative',
    padding: 10,
  },
  notificationIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  newAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconText: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertEmployee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  alertDetail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  ackButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ackText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ackedText: {
    color: '#10b981',
    fontSize: 20,
  },
  employeeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  employeeDept: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  notificationStatus: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
  },
  notificationStatusText: {
    color: '#15803d',
    fontWeight: '500',
    textAlign: 'center',
  },
});
