// RisaCare Mobile - Vaccination Tracking Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VaccineRecord {
  id: string;
  childName: string;
  dateOfBirth: string;
  vaccines: Vaccine[];
  reminders: ReminderSettings;
}

interface Vaccine {
  id: string;
  vaccineType: string;
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'due' | 'overdue' | 'completed';
  administeredBy?: string;
  hospitalName?: string;
  sideEffects?: string[];
}

interface ReminderSettings {
  enabled: boolean;
  advanceDays: number;
}

const vaccinationSchedule = [
  { name: 'BCG', type: 'bcg', doses: 1, age: 'At birth' },
  { name: 'Hepatitis B', type: 'hepb', doses: 3, age: '0, 1, 6 months' },
  { name: 'OPV', type: 'opv', doses: 4, age: '0, 2, 4, 6 months' },
  { name: 'DTP', type: 'dtap', doses: 5, age: '2, 4, 6, 18 months, 5 years' },
  { name: 'Hib', type: 'hib', doses: 3, age: '2, 4, 6 months' },
  { name: 'PCV', type: 'pcv', doses: 4, age: '2, 4, 6, 12 months' },
  { name: 'Rotavirus', type: 'rv', doses: 3, age: '2, 4, 6 months' },
  { name: 'MMR', type: 'mmr', doses: 2, age: '9, 15 months' },
  { name: 'Varicella', type: 'varicella', doses: 2, age: '12, 15 months' },
  { name: 'Hepatitis A', type: 'hepa', doses: 2, age: '12, 18 months' },
];

export default function VaccinationScreen() {
  const [children, setChildren] = useState<VaccineRecord[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    loadVaccinationRecords();
  }, []);

  const loadVaccinationRecords = async () => {
    // Mock data - replace with actual API call
    const mockRecords: VaccineRecord[] = [
      {
        id: 'child_001',
        childName: 'Aarav',
        dateOfBirth: '2025-09-15',
        vaccines: [
          { id: 'v1', vaccineType: 'bcg', vaccineName: 'BCG', doseNumber: 1, totalDoses: 1, dueDate: '2025-09-15', completedDate: '2025-09-15', status: 'completed' },
          { id: 'v2', vaccineType: 'hepb', vaccineName: 'Hepatitis B', doseNumber: 1, totalDoses: 3, dueDate: '2025-09-15', completedDate: '2025-09-15', status: 'completed' },
          { id: 'v3', vaccineType: 'opv', vaccineName: 'OPV', doseNumber: 1, totalDoses: 4, dueDate: '2025-09-15', completedDate: '2025-09-15', status: 'completed' },
          { id: 'v4', vaccineType: 'dtap', vaccineName: 'DTP', doseNumber: 1, totalDoses: 5, dueDate: '2025-11-15', completedDate: '2025-11-15', status: 'completed' },
          { id: 'v5', vaccineType: 'dtap', vaccineName: 'DTP', doseNumber: 2, totalDoses: 5, dueDate: '2026-01-15', completedDate: '2026-01-15', status: 'completed' },
          { id: 'v6', vaccineType: 'pcv', vaccineName: 'PCV', doseNumber: 3, totalDoses: 4, dueDate: '2026-03-15', status: 'due', hospitalName: 'Apollo Clinic' },
          { id: 'v7', vaccineType: 'mmr', vaccineName: 'MMR', doseNumber: 1, totalDoses: 2, dueDate: '2026-06-15', status: 'pending' },
        ],
        reminders: { enabled: true, advanceDays: 7 },
      },
    ];
    setChildren(mockRecords);
    if (mockRecords.length > 0) {
      setSelectedChild(mockRecords[0].id);
    }
  };

  const addChild = async () => {
    if (!childName || !dateOfBirth) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // API call to create child profile
    // await fetch(`${API_URL}/vaccination/child`, { method: 'POST', body: JSON.stringify({ childName, dateOfBirth }) });

    const newChild: VaccineRecord = {
      id: 'child_' + Date.now(),
      childName,
      dateOfBirth,
      vaccines: generateVaccines(dateOfBirth),
      reminders: { enabled: true, advanceDays: 7 },
    };

    setChildren([...children, newChild]);
    setSelectedChild(newChild.id);
    setShowAddChild(false);
    setChildName('');
    setDateOfBirth('');
    Alert.alert('Success', 'Child profile created');
  };

  const generateVaccines = (dob: string): Vaccine[] => {
    const vaccines: Vaccine[] = [];
    // Generate based on schedule - simplified
    return vaccines;
  };

  const markDoseComplete = async (vaccineId: string) => {
    const updatedChildren = children.map(child => {
      if (child.id === selectedChild) {
        const updatedVaccines = child.vaccines.map(v => {
          if (v.id === vaccineId) {
            return { ...v, status: 'completed' as const, completedDate: new Date().toISOString().split('T')[0] };
          }
          return v;
        });
        return { ...child, vaccines: updatedVaccines };
      }
      return child;
    });
    setChildren(updatedChildren);
    Alert.alert('Success', 'Vaccination recorded!');
  };

  const currentChild = children.find(c => c.id === selectedChild);
  const today = new Date();

  const pendingVaccines = currentChild?.vaccines.filter(v => v.status === 'pending' || v.status === 'due' || v.status === 'overdue') || [];
  const completedVaccines = currentChild?.vaccines.filter(v => v.status === 'completed') || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'due': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (children.length === 0 && !showAddChild) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💉</Text>
          <Text style={styles.emptyTitle}>No Children Added</Text>
          <Text style={styles.emptyText}>Add your child's profile to track vaccinations</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddChild(true)}>
            <Text style={styles.addButtonText}>+ Add Child</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vaccination Tracker</Text>
          <TouchableOpacity onPress={() => setShowAddChild(true)}>
            <Text style={styles.headerAdd}>+ Add Child</Text>
          </TouchableOpacity>
        </View>

        {/* Child Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childChip, selectedChild === child.id && styles.childChipSelected]}
              onPress={() => setSelectedChild(child.id)}
            >
              <Text style={[styles.childChipText, selectedChild === child.id && styles.childChipTextSelected]}>
                {child.childName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.summaryNumber}>{completedVaccines.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.summaryNumber}>{pendingVaccines.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.summaryNumber}>{currentChild?.vaccines.filter(v => v.status === 'overdue').length || 0}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
        </View>

        {/* Due/Vaccines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Vaccines</Text>
          {pendingVaccines.length > 0 ? (
            pendingVaccines.map(vaccine => (
              <View key={vaccine.id} style={styles.vaccineCard}>
                <View style={styles.vaccineInfo}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(vaccine.status) }]} />
                  <View style={styles.vaccineDetails}>
                    <Text style={styles.vaccineName}>{vaccine.vaccineName}</Text>
                    <Text style={styles.vaccineDose}>Dose {vaccine.doseNumber} of {vaccine.totalDoses}</Text>
                    <Text style={styles.vaccineDue}>Due: {vaccine.dueDate}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.markDoneButton}
                  onPress={() => markDoseComplete(vaccine.id)}
                >
                  <Text style={styles.markDoneText}>Mark Done</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noData}>All vaccines up to date! 🎉</Text>
          )}
        </View>

        {/* Completed Vaccines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Vaccines</Text>
          {completedVaccines.map(vaccine => (
            <View key={vaccine.id} style={styles.completedCard}>
              <View style={styles.vaccineInfo}>
                <Text style={styles.completedCheck}>✓</Text>
                <View style={styles.vaccineDetails}>
                  <Text style={styles.completedName}>{vaccine.vaccineName}</Text>
                  <Text style={styles.completedDose}>Dose {vaccine.doseNumber} of {vaccine.totalDoses}</Text>
                  {vaccine.completedDate && (
                    <Text style={styles.completedDate}>Completed: {vaccine.completedDate}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vaccination Schedule</Text>
          {vaccinationSchedule.map(schedule => (
            <View key={schedule.type} style={styles.scheduleCard}>
              <Text style={styles.scheduleName}>{schedule.name}</Text>
              <Text style={styles.scheduleDoses}>{schedule.doses} dose(s)</Text>
              <Text style={styles.scheduleAge}>{schedule.age}</Text>
            </View>
          ))}
        </View>

        {/* Add Child Modal */}
        {showAddChild && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add Child</Text>
              <TextInput
                style={styles.input}
                placeholder="Child's name"
                value={childName}
                onChangeText={setChildName}
              />
              <TextInput
                style={styles.input}
                placeholder="Date of birth (YYYY-MM-DD)"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddChild(false)}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={addChild}>
                  <Text style={styles.confirmBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerAdd: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  childSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  childChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginRight: 8,
  },
  childChipSelected: {
    backgroundColor: '#2196F3',
  },
  childChipText: {
    color: '#333',
    fontWeight: '500',
  },
  childChipTextSelected: {
    color: '#FFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  vaccineCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaccineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  vaccineDetails: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vaccineDose: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vaccineDue: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
  },
  markDoneButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markDoneText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  completedCard: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedCheck: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 12,
  },
  completedName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  completedDose: {
    fontSize: 12,
    color: '#666',
  },
  completedDate: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
  scheduleCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scheduleDoses: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  scheduleAge: {
    fontSize: 12,
    color: '#2196F3',
  },
  noData: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    padding: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
