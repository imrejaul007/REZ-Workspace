// RisaCare Mobile - Risk Alerts Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RiskAlert {
  id: string;
  type: 'warning' | 'urgent' | 'info';
  title: string;
  description: string;
  source: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'dismissed' | 'resolved';
  actionRequired: boolean;
  recommendedAction?: string;
  relatedRecordId?: string;
}

export default function RiskAlertsScreen() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    // Mock data
    const mockAlerts: RiskAlert[] = [
      {
        id: 'alert_001',
        type: 'warning',
        title: 'Blood Pressure Elevated',
        description: 'Your recent readings show systolic BP consistently above 140 mmHg. This may indicate hypertension.',
        source: 'Blood Pressure Monitor',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        actionRequired: true,
        recommendedAction: 'Schedule appointment with cardiologist within 1 week',
        relatedRecordId: 'bp_reading_123',
      },
      {
        id: 'alert_002',
        type: 'info',
        title: 'Vaccination Due',
        description: 'Tetanus booster is due in 14 days. Please schedule an appointment.',
        source: 'Vaccination Tracker',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        actionRequired: true,
        recommendedAction: 'Book vaccination appointment',
      },
      {
        id: 'alert_003',
        type: 'warning',
        title: 'Vitamin D Deficiency',
        description: 'Your latest blood test shows Vitamin D levels below normal range.',
        source: 'Lab Report - May 2026',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'acknowledged',
        actionRequired: false,
        recommendedAction: 'Consider Vitamin D supplements after consulting doctor',
        relatedRecordId: 'lab_report_456',
      },
      {
        id: 'alert_004',
        type: 'urgent',
        title: 'Annual Checkup Overdue',
        description: 'Your annual health checkup was due 30 days ago. Regular checkups are important for early detection.',
        source: 'Preventive Care Reminder',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        actionRequired: true,
        recommendedAction: 'Schedule comprehensive health checkup',
      },
      {
        id: 'alert_005',
        type: 'info',
        title: 'Cholesterol Monitoring',
        description: 'LDL cholesterol slightly elevated. Continue monitoring with diet and exercise.',
        source: 'Health Score Engine',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'resolved',
        actionRequired: false,
      },
      {
        id: 'alert_006',
        type: 'warning',
        title: 'Low Water Intake',
        description: 'Average daily water intake is 60% of recommended. Staying hydrated is important for kidney health.',
        source: 'Wellness Tracker',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        actionRequired: false,
        recommendedAction: 'Set reminders to drink water throughout the day',
      },
    ];
    setAlerts(mockAlerts);
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, status: 'acknowledged' as const } : alert
    ));
    Alert.alert('Acknowledged', 'You have acknowledged this alert.');
  };

  const dismissAlert = (id: string) => {
    Alert.alert(
      'Dismiss Alert',
      'Are you sure you want to dismiss this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => {
            setAlerts(alerts.map(alert =>
              alert.id === id ? { ...alert, status: 'dismissed' as const } : alert
            ));
          },
        },
      ]
    );
  };

  const markResolved = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, status: 'resolved' as const } : alert
    ));
    Alert.alert('Resolved', 'Alert marked as resolved.');
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'active':
        return alerts.filter(a => a.status === 'active');
      case 'acknowledged':
        return alerts.filter(a => a.status === 'acknowledged');
      default:
        return alerts.filter(a => a.status !== 'dismissed');
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return { color: '#F44336', bgColor: '#FFEBEE', icon: '🚨' };
      case 'warning':
        return { color: '#FF9800', bgColor: '#FFF3E0', icon: '⚠️' };
      default:
        return { color: '#2196F3', bgColor: '#E3F2FD', icon: 'ℹ️' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'Active', color: '#F44336' };
      case 'acknowledged':
        return { text: 'Acknowledged', color: '#FF9800' };
      case 'resolved':
        return { text: 'Resolved', color: '#4CAF50' };
      default:
        return { text: 'Dismissed', color: '#9E9E9E' };
    }
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const urgentCount = alerts.filter(a => a.type === 'urgent' && a.status === 'active').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚠️ Health Alerts</Text>
          <View style={styles.headerStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            {urgentCount > 0 && (
              <View style={[styles.statBadge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.statNumber, { color: '#F44336' }]}>{urgentCount}</Text>
                <Text style={[styles.statLabel, { color: '#F44336' }]}>Urgent</Text>
              </View>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['all', 'active', 'acknowledged'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alerts List */}
        {getFilteredAlerts().length > 0 ? (
          getFilteredAlerts().map(alert => {
            const style = getAlertStyle(alert.type);
            const statusBadge = getStatusBadge(alert.status);

            return (
              <View key={alert.id} style={[styles.alertCard, { backgroundColor: style.bgColor }]}>
                {/* Alert Header */}
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    <Text style={styles.alertIconText}>{style.icon}</Text>
                  </View>
                  <View style={styles.alertInfo}>
                    <Text style={[styles.alertTitle, { color: style.color }]}>{alert.title}</Text>
                    <Text style={styles.alertSource}>{alert.source}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                    <Text style={styles.statusText}>{statusBadge.text}</Text>
                  </View>
                </View>

                {/* Alert Description */}
                <Text style={styles.alertDescription}>{alert.description}</Text>

                {/* Recommended Action */}
                {alert.recommendedAction && alert.status === 'active' && (
                  <View style={styles.actionCard}>
                    <Text style={styles.actionLabel}>Recommended Action:</Text>
                    <Text style={styles.actionText}>{alert.recommendedAction}</Text>
                  </View>
                )}

                {/* Timestamp */}
                <Text style={styles.alertTime}>
                  {new Date(alert.createdAt).toLocaleDateString()} • {new Date(alert.createdAt).toLocaleTimeString()}
                </Text>

                {/* Action Buttons */}
                {alert.status === 'active' && (
                  <View style={styles.alertActions}>
                    {alert.actionRequired && (
                      <TouchableOpacity style={styles.primaryAction}>
                        <Text style={styles.primaryActionText}>Take Action</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      onPress={() => acknowledgeAlert(alert.id)}
                    >
                      <Text style={styles.secondaryActionText}>Acknowledge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      onPress={() => dismissAlert(alert.id)}
                    >
                      <Text style={styles.dismissText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {alert.status === 'acknowledged' && (
                  <View style={styles.alertActions}>
                    <TouchableOpacity
                      style={styles.primaryAction}
                      onPress={() => markResolved(alert.id)}
                    >
                      <Text style={styles.primaryActionText}>Mark Resolved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      onPress={() => dismissAlert(alert.id)}
                    >
                      <Text style={styles.dismissText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptyText}>
              {filter === 'active' ? 'Great! You have no active alerts.' : 'No alerts in this category.'}
            </Text>
          </View>
        )}

        {/* Health Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Proactive Health Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📊</Text>
            <Text style={styles.tipText}>Regular monitoring helps detect issues early</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🩺</Text>
            <Text style={styles.tipText}>Annual checkups are essential for preventive care</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💊</Text>
            <Text style={styles.tipText}>Take medications as prescribed to manage conditions</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerStats: { flexDirection: 'row', marginTop: 12, gap: 12 },
  statBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1976D2' },
  statLabel: { fontSize: 12, color: '#1976D2', textAlign: 'center' },
  filterTabs: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#FFF' },
  filterTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F0F0F0', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#2196F3' },
  filterTabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  filterTabTextActive: { color: '#FFF' },
  alertCard: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  alertIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  alertIconText: { fontSize: 18 },
  alertInfo: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 16, fontWeight: '600' },
  alertSource: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, color: '#FFF', fontWeight: '600' },
  alertDescription: { fontSize: 14, color: '#333', marginTop: 12, lineHeight: 20 },
  actionCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginTop: 12 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  actionText: { fontSize: 14, color: '#333' },
  alertTime: { fontSize: 11, color: '#999', marginTop: 12 },
  alertActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  primaryAction: { flex: 1, backgroundColor: '#2196F3', padding: 12, borderRadius: 8, alignItems: 'center' },
  primaryActionText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  secondaryAction: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  secondaryActionText: { color: '#333', fontSize: 14 },
  dismissText: { color: '#F44336', fontSize: 14 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  tipsSection: { padding: 16, marginTop: 16 },
  tipsTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8 },
  tipIcon: { fontSize: 20, marginRight: 12 },
  tipText: { flex: 1, fontSize: 14, color: '#333' },
});
