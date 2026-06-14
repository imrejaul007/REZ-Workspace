// RisaCare Mobile - Record Detail Screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native';

interface Biomarker {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'borderline';
  reference: string;
}

interface HealthRecord {
  id: string;
  title: string;
  type: string;
  lab: string;
  date: string;
  doctor: string;
  biomarkers: Biomarker[];
  summary: string;
}

const mockRecord: HealthRecord = {
  id: '1',
  title: 'Complete Blood Count (CBC)',
  type: 'blood_report',
  lab: 'Apollo Diagnostics',
  date: 'March 14, 2026',
  doctor: 'Dr. Priya Sharma',
  biomarkers: [
    { name: 'Hemoglobin', value: '14.5', unit: 'g/dL', status: 'normal', reference: '12.0 - 17.0' },
    { name: 'RBC', value: '5.2', unit: 'million/µL', status: 'normal', reference: '4.5 - 5.5' },
    { name: 'WBC', value: '8.5', unit: 'thousand/µL', status: 'normal', reference: '4.5 - 11.0' },
    { name: 'Platelets', value: '250', unit: 'thousand/µL', status: 'normal', reference: '150 - 400' },
    { name: 'Hematocrit', value: '42', unit: '%', status: 'low', reference: '41 - 53' }
  ],
  summary: 'Overall health appears good. Hemoglobin levels are within normal range indicating healthy oxygen-carrying capacity. One minor deviation in hematocrit level which is borderline.'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal': return '#34C759';
    case 'low': return '#FF9500';
    case 'high': return '#FF3B30';
    case 'borderline': return '#FFCC00';
    default: return '#999';
  }
};

export default function RecordDetailScreen({ route, navigation }: any) {
  const record = mockRecord;

  const abnormalCount = record.biomarkers.filter(b => b.status !== 'normal').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🩸</Text>
          </View>
          <Text style={styles.title}>{record.title}</Text>
          <Text style={styles.lab}>{record.lab}</Text>
          <Text style={styles.date}>{record.date}</Text>
        </View>

        {/* AI Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>🤖</Text>
            <Text style={styles.summaryTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{record.summary}</Text>
        </View>

        {/* Findings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Key Findings</Text>
            <View style={[styles.statusBadge, { backgroundColor: abnormalCount > 0 ? '#FF950020' : '#34C75920' }]}>
              <Text style={[styles.statusText, { color: abnormalCount > 0 ? '#FF9500' : '#34C759' }]}>
                {abnormalCount > 0 ? `${abnormalCount} Abnormality` : 'All Normal'}
              </Text>
            </View>
          </View>

          {record.biomarkers.map((biomarker, index) => (
            <View key={index} style={styles.biomarkerCard}>
              <View style={styles.biomarkerHeader}>
                <Text style={styles.biomarkerName}>{biomarker.name}</Text>
                <View style={[styles.biomarkerStatus, { backgroundColor: getStatusColor(biomarker.status) + '20' }]}>
                  <Text style={[styles.biomarkerStatusText, { color: getStatusColor(biomarker.status) }]}>
                    {biomarker.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.biomarkerValues}>
                <View style={styles.valueContainer}>
                  <Text style={styles.valueLabel}>Your Value</Text>
                  <Text style={[styles.valueNumber, { color: getStatusColor(biomarker.status) }]}>
                    {biomarker.value}
                  </Text>
                  <Text style={styles.valueUnit}>{biomarker.unit}</Text>
                </View>
                <View style={styles.valueContainer}>
                  <Text style={styles.valueLabel}>Reference</Text>
                  <Text style={styles.referenceValue}>{biomarker.reference}</Text>
                  <Text style={styles.valueUnit}>{biomarker.unit}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Doctor Info */}
        <View style={styles.doctorCard}>
          <Text style={styles.doctorIcon}>👨‍⚕️</Text>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{record.doctor}</Text>
            <Text style={styles.doctorLabel}>Ordering Physician</Text>
          </View>
          <TouchableOpacity style={styles.consultButton}>
            <Text style={styles.consultButtonText}>Consult</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📥</Text>
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Track</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#007AFF', padding: 20, alignItems: 'center', paddingTop: 10 },
  headerIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerIconText: { fontSize: 28 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  lab: { fontSize: 14, color: '#B3D4FF', marginTop: 8 },
  date: { fontSize: 12, color: '#90D5FF', marginTop: 4 },
  summaryCard: { backgroundColor: '#5856D620', margin: 16, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#5856D6' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryIcon: { fontSize: 18, marginRight: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#5856D6' },
  summaryText: { fontSize: 14, color: '#333', lineHeight: 20 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  biomarkerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  biomarkerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  biomarkerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  biomarkerStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  biomarkerStatusText: { fontSize: 10, fontWeight: 'bold' },
  biomarkerValues: { flexDirection: 'row' },
  valueContainer: { flex: 1 },
  valueLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  valueNumber: { fontSize: 24, fontWeight: 'bold' },
  valueUnit: { fontSize: 11, color: '#666', marginTop: 2 },
  referenceValue: { fontSize: 18, fontWeight: '600', color: '#666' },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  doctorIcon: { fontSize: 32 },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#333' },
  doctorLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  consultButton: { backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  consultButtonText: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, paddingBottom: 32 },
  actionButton: { alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionText: { fontSize: 12, color: '#666' }
});
