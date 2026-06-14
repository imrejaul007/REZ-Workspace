/**
 * Patients List Screen
 * Displays all patients with search and filter capabilities
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import { Avatar } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';

// Types
export type PatientStatus = 'active' | 'inactive' | 'new';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  status: PatientStatus;
  lastVisit?: Date;
  upcomingAppointment?: Date;
  medicalHistory?: string[];
  allergies?: string[];
  avatar?: string;
}

// Mock data
const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1 234 567 8901',
    dateOfBirth: new Date(1985, 3, 15),
    gender: 'male',
    bloodGroup: 'O+',
    status: 'active',
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    medicalHistory: ['Hypertension', 'Diabetes Type 2'],
    allergies: ['Penicillin'],
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 234 567 8902',
    dateOfBirth: new Date(1992, 7, 22),
    gender: 'female',
    bloodGroup: 'A+',
    status: 'active',
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    upcomingAppointment: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'm.brown@email.com',
    phone: '+1 234 567 8903',
    dateOfBirth: new Date(1978, 11, 8),
    gender: 'male',
    bloodGroup: 'B+',
    status: 'inactive',
    lastVisit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@email.com',
    phone: '+1 234 567 8904',
    dateOfBirth: new Date(2000, 5, 30),
    gender: 'female',
    bloodGroup: 'AB-',
    status: 'new',
    medicalHistory: [],
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'r.wilson@email.com',
    phone: '+1 234 567 8905',
    dateOfBirth: new Date(1965, 2, 14),
    gender: 'male',
    bloodGroup: 'A-',
    status: 'active',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    allergies: ['Sulfa drugs'],
  },
];

// Helper functions
const getStatusColor = (status: PatientStatus): string => {
  const colors: Record<PatientStatus, string> = {
    active: Colors.light.success,
    inactive: Colors.light.textMuted,
    new: Colors.light.info,
  };
  return colors[status];
};

const getStatusLabel = (status: PatientStatus): string => {
  const labels: Record<PatientStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    new: 'New',
  };
  return labels[status];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
};

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Card variant="elevated" padding="md" style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <Avatar
          size="medium"
          initials={`${patient.firstName[0]}${patient.lastName[0]}`}
          backgroundColor={Colors.light.primaryLight2}
          textColor={Colors.light.primary}
        />
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {patient.firstName} {patient.lastName}
          </Text>
          <Text style={styles.patientAge}>
            {getAge(patient.dateOfBirth)} years, {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(patient.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(patient.status) }]}>
            {getStatusLabel(patient.status)}
          </Text>
        </View>
      </View>

      <View style={styles.patientDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>{patient.phone}</Text>
        </View>
        {patient.bloodGroup && (
          <View style={styles.detailRow}>
            <Ionicons name="water-outline" size={16} color={Colors.light.danger} />
            <Text style={styles.detailText}>{patient.bloodGroup}</Text>
          </View>
        )}
        {patient.lastVisit && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>Last visit: {formatDate(patient.lastVisit)}</Text>
          </View>
        )}
        {patient.allergies && patient.allergies.length > 0 && (
          <View style={styles.allergyContainer}>
            <Ionicons name="warning-outline" size={16} color={Colors.light.warning} />
            <Text style={styles.allergyText}>Allergies: {patient.allergies.join(', ')}</Text>
          </View>
        )}
      </View>
    </Card>
  </TouchableOpacity>
);

export default function PatientsScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | 'all'>('all');

  const statusFilters: { label: string; value: PatientStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'New', value: 'new' },
  ];

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery);
    const matchesStatus = selectedStatus === 'all' || patient.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients().finally(() => setRefreshing(false));
  }, [fetchPatients]);

  const handlePatientPress = useCallback((patient: Patient) => {
    router.push(`/healthcare/patient/${patient.id}`);
  }, []);

  const handleAddPatient = useCallback(() => {
    Alert.alert('Add Patient', 'Patient registration modal would open here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: () => {} },
    ]);
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor={Colors.light.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patients</Text>
        <TouchableOpacity onPress={handleAddPatient} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <PatientCard patient={item} onPress={() => handlePatientPress(item)} />
            </Animated.View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No Patients Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first patient to get started'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  addButton: {
    padding: 4,
  },
  header: {
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.light.text,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  patientCard: {
    marginBottom: 12,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  patientAge: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  patientDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  allergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    padding: 8,
    backgroundColor: Colors.light.warningLight,
    borderRadius: 8,
  },
  allergyText: {
    fontSize: 12,
    color: Colors.light.warning,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
