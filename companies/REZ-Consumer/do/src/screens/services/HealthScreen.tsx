/**
 * Health Screen
 *
 * RisaCare healthcare integration for DO App
 * Features: Appointments, Prescriptions, Health Records, Telemedicine
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { risacareClient } from '../services/clients';

interface Props {
  navigation?: any;
}

const HealthScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientId] = useState('PATIENT001');

  const [dashboard, setDashboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'records'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await risacareClient.getDOAppDashboard(patientId);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load health dashboard:', error);
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
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading Health...</Text>
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
        <Text style={styles.headerTitle}>Health</Text>
        <Text style={styles.headerSubtitle}>RisaCare Integration</Text>
      </View>

      {/* Health Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>82</Text>
          <Text style={styles.scoreLabel}>Health Score</Text>
        </View>
        <View style={styles.scoreDetails}>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalIcon}>❤️</Text>
            <Text style={styles.vitalValue}>72</Text>
            <Text style={styles.vitalLabel}>BPM</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalIcon}>🩸</Text>
            <Text style={styles.vitalValue}>120/80</Text>
            <Text style={styles.vitalLabel}>BP</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalIcon}>👣</Text>
            <Text style={styles.vitalValue}>5,200</Text>
            <Text style={styles.vitalLabel}>Steps</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionText}>Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>💊</Text>
          <Text style={styles.quickActionText}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📹</Text>
          <Text style={styles.quickActionText}>TeleMed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>Records</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {['overview', 'appointments', 'prescriptions', 'records'].map((tab) => (
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

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <View>
            {/* Upcoming Appointments */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Upcoming Appointments</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              {[
                { doctor: 'Dr. Sharma', specialty: 'Cardiologist', date: 'Tomorrow, 10:00 AM', type: 'in-person' },
              ].map((apt, index) => (
                <View key={index} style={styles.appointmentItem}>
                  <View style={styles.appointmentIcon}>
                    <Text style={styles.appointmentIconText}>👨‍⚕️</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.doctorName}>{apt.doctor}</Text>
                    <Text style={styles.specialty}>{apt.specialty}</Text>
                    <Text style={styles.appointmentDate}>{apt.date}</Text>
                  </View>
                  <View style={styles.appointmentType}>
                    <Text style={styles.appointmentTypeText}>{apt.type === 'telemedicine' ? '📹' : '🏥'}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Active Prescriptions */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Active Medications</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              {[
                { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', refills: 2 },
                { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', refills: 5 },
              ].map((med, index) => (
                <View key={index} style={styles.medicationItem}>
                  <View style={styles.medicationIcon}>
                    <Text style={styles.medicationIconText}>💊</Text>
                  </View>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDosage}>{med.dosage} - {med.frequency}</Text>
                  </View>
                  <View style={styles.refillBadge}>
                    <Text style={styles.refillText}>{med.refills} refills</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Health Tips */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Health Tips</Text>
              {[
                { icon: '💤', title: 'Sleep Well', tip: 'Aim for 7-9 hours of sleep' },
                { icon: '💧', title: 'Stay Hydrated', tip: 'Drink 8 glasses of water daily' },
                { icon: '🚶', title: 'Stay Active', tip: 'Take 10,000 steps daily' },
              ].map((item, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipIcon}>{item.icon}</Text>
                  <View style={styles.tipInfo}>
                    <Text style={styles.tipTitle}>{item.title}</Text>
                    <Text style={styles.tipText}>{item.tip}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'appointments' && (
          <View>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>+ Book New Appointment</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Upcoming</Text>
              {[
                { doctor: 'Dr. Sharma', specialty: 'Cardiologist', date: 'Jun 8, 10:00 AM', status: 'Confirmed' },
              ].map((apt, index) => (
                <View key={index} style={styles.appointmentDetail}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.doctorName}>{apt.doctor}</Text>
                    <Text style={styles.specialty}>{apt.specialty}</Text>
                    <Text style={styles.appointmentDate}>{apt.date}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{apt.status}</Text>
                    </View>
                  </View>
                  <View style={styles.appointmentActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                      <Text style={[styles.actionButtonText, styles.cancelText]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Past Appointments</Text>
              {[
                { doctor: 'Dr. Patel', specialty: 'General Physician', date: 'May 15, 2026', diagnosis: 'Common cold' },
                { doctor: 'Dr. Gupta', specialty: 'Dermatologist', date: 'Apr 20, 2026', diagnosis: 'Skin checkup' },
              ].map((apt, index) => (
                <View key={index} style={styles.pastAppointment}>
                  <Text style={styles.doctorName}>{apt.doctor}</Text>
                  <Text style={styles.specialty}>{apt.specialty}</Text>
                  <Text style={styles.appointmentDate}>{apt.date}</Text>
                  <Text style={styles.diagnosis}>{apt.diagnosis}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'prescriptions' && (
          <View>
            <TouchableOpacity style={styles.orderButton}>
              <Text style={styles.orderButtonText}>+ Order Medicines</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Active Prescriptions</Text>
              {[
                { name: 'Metformin 500mg', frequency: 'Twice daily', prescribedBy: 'Dr. Sharma', refills: 2, nextRefill: 'Jun 15' },
                { name: 'Amlodipine 5mg', frequency: 'Once daily', prescribedBy: 'Dr. Sharma', refills: 5, nextRefill: 'Jun 20' },
                { name: 'Vitamin D3', frequency: 'Once weekly', prescribedBy: 'Dr. Patel', refills: 1, nextRefill: 'Jul 1' },
              ].map((med, index) => (
                <View key={index} style={styles.prescriptionItem}>
                  <View style={styles.prescriptionHeader}>
                    <Text style={styles.prescriptionName}>{med.name}</Text>
                    <TouchableOpacity style={styles.refillButton}>
                      <Text style={styles.refillButtonText}>Refill</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.prescriptionDetails}>{med.frequency}</Text>
                  <Text style={styles.prescribedBy}>By {med.prescribedBy}</Text>
                  <View style={styles.refillInfo}>
                    <Text style={styles.refillCount}>{med.refills} refills remaining</Text>
                    <Text style={styles.nextRefill}>Next: {med.nextRefill}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'records' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medical Records</Text>
              {[
                { type: 'lab', name: 'Blood Panel', date: 'Dec 2025', icon: '🩸' },
                { type: 'imaging', name: 'Chest X-Ray', date: 'Nov 2025', icon: '🫁' },
                { type: 'checkup', name: 'Annual Checkup', date: 'Jan 2026', icon: '🩺' },
                { type: 'prescription', name: 'Cardiology Visit', date: 'Jun 2025', icon: '💊' },
              ].map((record, index) => (
                <TouchableOpacity key={index} style={styles.recordItem}>
                  <Text style={styles.recordIcon}>{record.icon}</Text>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordName}>{record.name}</Text>
                    <Text style={styles.recordDate}>{record.date}</Text>
                  </View>
                  <Text style={styles.recordArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lab Reports</Text>
              {[
                { name: 'Complete Blood Count', date: 'Dec 15, 2025', status: 'Normal' },
                { name: 'Lipid Profile', date: 'Dec 15, 2025', status: 'Normal' },
                { name: 'Blood Sugar', date: 'Dec 15, 2025', status: 'Elevated' },
              ].map((lab, index) => (
                <View key={index} style={styles.labItem}>
                  <View>
                    <Text style={styles.labName}>{lab.name}</Text>
                    <Text style={styles.labDate}>{lab.date}</Text>
                  </View>
                  <View style={[styles.labStatus, lab.status === 'Normal' ? styles.normalStatus : styles.elevatedStatus]}>
                    <Text style={[styles.labStatusText, lab.status === 'Normal' ? styles.normalText : styles.elevatedText]}>
                      {lab.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

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
    backgroundColor: '#FF6B6B',
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
  scoreCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 20,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    marginTop: 16,
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
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 11,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewAll: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentIconText: {
    fontSize: 20,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  specialty: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appointmentDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  appointmentType: {},
  appointmentTypeText: {
    fontSize: 20,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationIconText: {
    fontSize: 20,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refillBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refillText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  bookButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  appointmentDetail: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
  },
  cancelText: {
    color: '#F44336',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  pastAppointment: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  diagnosis: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  prescriptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  refillButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refillButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  prescriptionDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  prescribedBy: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  refillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refillCount: {
    fontSize: 11,
    color: '#4CAF50',
  },
  nextRefill: {
    fontSize: 11,
    color: '#999',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recordIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  recordArrow: {
    fontSize: 16,
    color: '#CCC',
  },
  labItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  labName: {
    fontSize: 14,
    color: '#333',
  },
  labDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  labStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  normalStatus: {
    backgroundColor: '#E8F5E9',
  },
  elevatedStatus: {
    backgroundColor: '#FFF3E0',
  },
  labStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  normalText: {
    color: '#4CAF50',
  },
  elevatedText: {
    color: '#FF9800',
  },
  bottomPadding: {
    height: 40,
  },
});

export default HealthScreen;
