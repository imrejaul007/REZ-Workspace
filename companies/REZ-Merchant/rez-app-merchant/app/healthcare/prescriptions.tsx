/**
 * Prescriptions Screen
 * Manage and issue prescriptions for patients
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
import { Card, Badge } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';

// Types
export type PrescriptionStatus = 'draft' | 'pending' | 'issued' | 'dispensed' | 'cancelled';

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: Date;
  status: PrescriptionStatus;
  medications: Medication[];
  diagnosis: string;
  instructions?: string;
  validUntil: Date;
  refills: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  notes?: string;
}

// Mock data
const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'John Smith',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    date: new Date(),
    status: 'pending',
    diagnosis: 'Hypertension',
    medications: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        duration: '30 days',
        quantity: 30,
      },
    ],
    instructions: 'Take with food. Monitor blood pressure daily.',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    refills: 2,
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Sarah Johnson',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'issued',
    diagnosis: 'Seasonal Allergies',
    medications: [
      {
        name: 'Cetirizine',
        dosage: '10mg',
        frequency: 'Once daily at night',
        duration: '14 days',
        quantity: 14,
      },
    ],
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    refills: 0,
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Michael Brown',
    doctorId: 'd2',
    doctorName: 'Dr. James Wilson',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'dispensed',
    diagnosis: 'Type 2 Diabetes',
    medications: [
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days',
        quantity: 180,
        notes: 'Take with meals',
      },
      {
        name: 'Glimepiride',
        dosage: '2mg',
        frequency: 'Once daily',
        duration: '90 days',
        quantity: 90,
      },
    ],
    validUntil: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
    refills: 3,
  },
  {
    id: '4',
    patientId: '4',
    patientName: 'Emily Davis',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    date: new Date(),
    status: 'draft',
    diagnosis: 'Common Cold',
    medications: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        duration: '5 days',
        quantity: 20,
      },
    ],
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    refills: 0,
  },
];

// Helper functions
const getStatusColor = (status: PrescriptionStatus): string => {
  const colors: Record<PrescriptionStatus, string> = {
    draft: Colors.light.textMuted,
    pending: Colors.light.warning,
    issued: Colors.light.info,
    dispensed: Colors.light.success,
    cancelled: Colors.light.danger,
  };
  return colors[status];
};

const getStatusLabel = (status: PrescriptionStatus): string => {
  const labels: Record<PrescriptionStatus, string> = {
    draft: 'Draft',
    pending: 'Pending',
    issued: 'Issued',
    dispensed: 'Dispensed',
    cancelled: 'Cancelled',
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

interface PrescriptionCardProps {
  prescription: Prescription;
  onPress: () => void;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Card variant="elevated" padding="md" style={styles.prescriptionCard}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.prescriptionId}>#{prescription.id}</Text>
          <Badge
            variant={
              prescription.status === 'dispensed'
                ? 'success'
                : prescription.status === 'pending'
                  ? 'warning'
                  : 'default'
            }
            size="small"
          >
            {getStatusLabel(prescription.status)}
          </Badge>
        </View>
        <Text style={styles.prescriptionDate}>{formatDate(prescription.date)}</Text>
      </View>

      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{prescription.patientName}</Text>
        <Text style={styles.doctorName}>{prescription.doctorName}</Text>
      </View>

      <View style={styles.diagnosisContainer}>
        <View style={styles.diagnosisLabel}>
          <Ionicons name="medical-outline" size={14} color={Colors.light.primary} />
          <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
        </View>
      </View>

      <View style={styles.medicationsPreview}>
        <Text style={styles.medicationsTitle}>
          Medications ({prescription.medications.length})
        </Text>
        {prescription.medications.slice(0, 2).map((med, index) => (
          <View key={index} style={styles.medicationItem}>
            <Text style={styles.medicationName}>{med.name}</Text>
            <Text style={styles.medicationDosage}>
              {med.dosage} - {med.frequency}
            </Text>
          </View>
        ))}
        {prescription.medications.length > 2 && (
          <Text style={styles.moreMedications}>
            +{prescription.medications.length - 2} more
          </Text>
        )}
      </View>

      <View style={styles.prescriptionFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="refresh-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>{prescription.refills} refills</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>Valid until {formatDate(prescription.validUntil)}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

export default function PrescriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PrescriptionStatus | 'all'>('all');

  const statusFilters: { label: string; value: PrescriptionStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Issued', value: 'issued' },
    { label: 'Dispensed', value: 'dispensed' },
  ];

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.medications.some((med) => med.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || rx.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrescriptions().finally(() => setRefreshing(false));
  }, [fetchPrescriptions]);

  const handlePrescriptionPress = useCallback((prescription: Prescription) => {
    router.push(`/healthcare/prescription/${prescription.id}`);
  }, []);

  const handleNewPrescription = useCallback(() => {
    Alert.alert('New Prescription', 'Prescription creation modal would open here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => {} },
    ]);
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search prescriptions..."
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

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {prescriptions.filter((p) => p.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.light.success }]}>
            {prescriptions.filter((p) => p.status === 'dispensed').length}
          </Text>
          <Text style={styles.statLabel}>Dispensed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {prescriptions.filter((p) => p.status === 'draft').length}
          </Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
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
        <Text style={styles.headerTitle}>Prescriptions</Text>
        <TouchableOpacity onPress={handleNewPrescription} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPrescriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <PrescriptionCard
                prescription={item}
                onPress={() => handlePrescriptionPress(item)}
              />
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
              <Ionicons name="document-text-outline" size={64} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No Prescriptions</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first prescription to get started'}
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
    marginBottom: 16,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  prescriptionCard: {
    marginBottom: 12,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  prescriptionDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  patientInfo: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  doctorName: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  diagnosisContainer: {
    marginBottom: 12,
  },
  diagnosisLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagnosisText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  medicationsPreview: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  medicationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  medicationItem: {
    marginBottom: 6,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  medicationDosage: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  moreMedications: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 4,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
