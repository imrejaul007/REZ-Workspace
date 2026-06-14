// RisaCare Mobile - Medication Tracking Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  purpose?: string;
  prescribedBy?: string;
  isActive: boolean;
  takenToday: boolean[];
  refillDate?: string;
  remainingPills?: number;
}

interface MedicationLog {
  id: string;
  medicationId: string;
  medicationName: string;
  takenAt: string;
  skipped: boolean;
  notes?: string;
}

const commonMedications = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Amlodipine',
  'Metoprolol', 'Omeprazole', 'Pantoprazole', 'Cetirizine', 'Vitamin D3',
  'Vitamin B12', 'Folic Acid', 'Iron Supplement', 'Calcium', 'Omega 3'
];

export default function MedicationScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('once_daily');
  const [times, setTimes] = useState(['08:00']);
  const [purpose, setPurpose] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = () => {
    // Mock data
    const mockMeds: Medication[] = [
      {
        id: 'med_001',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice_daily',
        times: ['08:00', '20:00'],
        startDate: '2026-01-15',
        purpose: 'Diabetes management',
        prescribedBy: 'Dr. Priya Sharma',
        isActive: true,
        takenToday: [true, false],
        remainingPills: 45,
        refillDate: '2026-06-15'
      },
      {
        id: 'med_002',
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'once_daily',
        times: ['09:00'],
        startDate: '2026-02-01',
        purpose: 'Blood pressure control',
        prescribedBy: 'Dr. Rajesh Kumar',
        isActive: true,
        takenToday: [true],
        remainingPills: 28
      },
      {
        id: 'med_003',
        name: 'Vitamin D3',
        dosage: '60000 IU',
        frequency: 'once_weekly',
        times: ['10:00'],
        startDate: '2026-03-01',
        purpose: 'Vitamin D deficiency',
        prescribedBy: 'Self',
        isActive: true,
        takenToday: [false],
        remainingPills: 8
      }
    ];
    setMedications(mockMeds);
  };

  const addMedication = () => {
    if (!name || !dosage) {
      Alert.alert('Error', 'Please fill in medication name and dosage');
      return;
    }

    const newMed: Medication = {
      id: 'med_' + Date.now(),
      name,
      dosage,
      frequency,
      times,
      startDate: new Date().toISOString().split('T')[0],
      endDate: endDate || undefined,
      purpose: purpose || undefined,
      prescribedBy: prescribedBy || undefined,
      isActive: true,
      takenToday: times.map(() => false)
    };

    setMedications([...medications, newMed]);
    resetForm();
    setShowAddModal(false);
    Alert.alert('Success', 'Medication added successfully');
  };

  const markAsTaken = (medId: string, doseIndex: number) => {
    setMedications(medications.map(med => {
      if (med.id === medId) {
        const newTakenToday = [...med.takenToday];
        newTakenToday[doseIndex] = true;
        return { ...med, takenToday: newTakenToday };
      }
      return med;
    }));

    const med = medications.find(m => m.id === medId);
    if (med) {
      const log: MedicationLog = {
        id: 'log_' + Date.now(),
        medicationId: medId,
        medicationName: med.name,
        takenAt: new Date().toISOString(),
        skipped: false
      };
      setLogs([log, ...logs]);
    }
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('once_daily');
    setTimes(['08:00']);
    setPurpose('');
    setPrescribedBy('');
    setEndDate('');
  };

  const getTodayProgress = () => {
    let total = 0;
    let taken = 0;
    medications.forEach(med => {
      if (med.isActive) {
        total += med.times.length;
        taken += med.takenToday.filter(Boolean).length;
      }
    });
    return { total, taken, percentage: total > 0 ? Math.round((taken / total) * 100) : 0 };
  };

  const progress = getTodayProgress();

  const activeMeds = medications.filter(m => m.isActive);
  const inactiveMeds = medications.filter(m => !m.isActive);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💊 Medications</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Text style={styles.headerAdd}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progress.percentage + '%' }]} />
          </View>
          <Text style={styles.progressText}>{progress.taken} of {progress.total} doses taken</Text>
        </View>

        {/* Upcoming Doses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Medications ({activeMeds.length})</Text>
          {activeMeds.map(med => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <View>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDosage}>{med.dosage}</Text>
                  <Text style={styles.medPurpose}>{med.purpose || 'General'}</Text>
                </View>
                <View style={styles.medStatus}>
                  <Text style={styles.medFrequency}>{formatFrequency(med.frequency)}</Text>
                  {med.remainingPills !== undefined && (
                    <Text style={styles.remainingPills}>{med.remainingPills} pills left</Text>
                  )}
                </View>
              </View>

              <View style={styles.doseTimes}>
                {med.times.map((time, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.doseButton, med.takenToday[idx] && styles.doseTaken]}
                    onPress={() => !med.takenToday[idx] && markAsTaken(med.id, idx)}
                  >
                    <Text style={[styles.doseTime, med.takenToday[idx] && styles.doseTimeTaken]}>
                      {time}
                    </Text>
                    <Text style={[styles.doseStatus, med.takenToday[idx] && styles.doseStatusTaken]}>
                      {med.takenToday[idx] ? '✓ Taken' : 'Take'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {med.prescribedBy && (
                <Text style={styles.prescribedBy}>Prescribed by: {med.prescribedBy}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Inactive Medications */}
        {inactiveMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inactive Medications</Text>
            {inactiveMeds.map(med => (
              <View key={med.id} style={[styles.medCard, styles.medCardInactive]}>
                <Text style={styles.medNameInactive}>{med.name}</Text>
                <Text style={styles.medDosageInactive}>{med.dosage}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Medication History */}
        {logs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            {logs.slice(0, 5).map(log => (
              <View key={log.id} style={styles.logItem}>
                <Text style={styles.logName}>{log.medicationName}</Text>
                <Text style={styles.logTime}>{new Date(log.takenAt).toLocaleTimeString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Medication Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Medication</Text>

            <Text style={styles.inputLabel}>Medication Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Metformin"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Dosage</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500mg"
              value={dosage}
              onChangeText={setDosage}
            />

            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.frequencyOptions}>
              {['once_daily', 'twice_daily', 'three_times', 'weekly'].map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.freqOption, frequency === freq && styles.freqOptionActive]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text style={[styles.freqOptionText, frequency === freq && styles.freqOptionTextActive]}>
                    {formatFrequency(freq)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Time(s)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 08:00, 20:00"
              value={times.join(', ')}
              onChangeText={t => setTimes(t.split(',').map(s => s.trim()))}
            />

            <Text style={styles.inputLabel}>Purpose (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Blood pressure control"
              value={purpose}
              onChangeText={setPurpose}
            />

            <Text style={styles.inputLabel}>Prescribed By (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dr. Sharma"
              value={prescribedBy}
              onChangeText={setPrescribedBy}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={addMedication}>
                <Text style={styles.addBtnText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function formatFrequency(freq: string): string {
  const map: Record<string, string> = {
    once_daily: '1x/day',
    twice_daily: '2x/day',
    three_times: '3x/day',
    weekly: 'Weekly',
    as_needed: 'As needed'
  };
  return map[freq] || freq;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#2196F3' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerAdd: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  progressCard: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressText: { marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center' },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  medCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  medName: { fontSize: 18, fontWeight: '600', color: '#333' },
  medDosage: { fontSize: 14, color: '#666', marginTop: 2 },
  medPurpose: { fontSize: 12, color: '#2196F3', marginTop: 4 },
  medStatus: { alignItems: 'flex-end' },
  medFrequency: { fontSize: 14, fontWeight: '500', color: '#333' },
  remainingPills: { fontSize: 12, color: '#FF9800', marginTop: 4 },
  doseTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doseButton: { flex: 1, minWidth: 80, backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, alignItems: 'center' },
  doseTaken: { backgroundColor: '#E8F5E9' },
  doseTime: { fontSize: 16, fontWeight: '600', color: '#1976D2' },
  doseTimeTaken: { color: '#4CAF50' },
  doseStatus: { fontSize: 11, color: '#666', marginTop: 4 },
  doseStatusTaken: { color: '#4CAF50' },
  prescribedBy: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },
  medCardInactive: { opacity: 0.6 },
  medNameInactive: { fontSize: 16, color: '#999' },
  medDosageInactive: { fontSize: 14, color: '#BBB' },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 8, marginBottom: 8 },
  logName: { fontSize: 14, color: '#333' },
  logTime: { fontSize: 12, color: '#4CAF50' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 16 },
  frequencyOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  freqOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E0E0E0' },
  freqOptionActive: { backgroundColor: '#2196F3' },
  freqOptionText: { fontSize: 12, color: '#333' },
  freqOptionTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 12 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8 },
  addBtn: { flex: 1, backgroundColor: '#2196F3', padding: 14, alignItems: 'center', borderRadius: 8 },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});
