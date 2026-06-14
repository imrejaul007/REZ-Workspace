// RisaCare Mobile - Booking Screen (Doctor Search)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView
} from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  fees: number;
  nextAvailable: string;
  languages: string[];
  modes: string[];
}

const mockDoctors: Doctor[] = [
  { id: '1', name: 'Dr. Priya Sharma', specialization: 'General Physician', experience: 12, rating: 4.7, fees: 800, nextAvailable: 'Today', languages: ['English', 'Hindi'], modes: ['in_clinic', 'teleconsult'] },
  { id: '2', name: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', experience: 15, rating: 4.9, fees: 1500, nextAvailable: 'Tomorrow', languages: ['English', 'Hindi'], modes: ['in_clinic', 'teleconsult', 'home_visit'] },
  { id: '3', name: 'Dr. Ananya Patel', specialization: 'Dermatologist', experience: 8, rating: 4.6, fees: 700, nextAvailable: 'Today', languages: ['English', 'Hindi', 'Gujarati'], modes: ['in_clinic', 'teleconsult'] },
  { id: '4', name: 'Dr. Vikram Singh', specialization: 'Orthopedic', experience: 20, rating: 4.8, fees: 1200, nextAvailable: 'In 2 days', languages: ['English', 'Hindi', 'Punjabi'], modes: ['in_clinic'] },
  { id: '5', name: 'Dr. Meera Gupta', specialization: 'Pediatrician', experience: 10, rating: 4.5, fees: 600, nextAvailable: 'Today', languages: ['English', 'Hindi'], modes: ['in_clinic', 'teleconsult'] }
];

const specialties = ['All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 'Neurologist', 'Gynecologist'];

export default function BookingScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [doctors] = useState<Doctor[]>(mockDoctors);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.split(' ').map(n => n[0]).join('')}</Text>
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.specialty}>{item.specialization}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>📅 {item.experience} yrs</Text>
          <Text style={styles.meta}>⭐ {item.rating}</Text>
        </View>
        <View style={styles.modeRow}>
          {item.modes.map(mode => (
            <View key={mode} style={styles.modeTag}>
              <Text style={styles.modeText}>{mode === 'in_clinic' ? '🏥' : mode === 'teleconsult' ? '📹' : '🏠'}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.feeContainer}>
        <Text style={styles.fee}>₹{item.fees}</Text>
        <Text style={styles.nextAvailable}>{item.nextAvailable}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, specialties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Specialties Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {specialties.map(specialty => (
          <TouchableOpacity
            key={specialty}
            style={[styles.filterChip, selectedSpecialty === specialty && styles.filterChipActive]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text style={[styles.filterText, selectedSpecialty === specialty && styles.filterTextActive]}>
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No doctors found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 16, borderRadius: 12 },
  searchIcon: { fontSize: 18, marginRight: 12 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  filterScroll: { paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 8 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingTop: 0 },
  doctorCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#333' },
  specialty: { fontSize: 13, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  meta: { fontSize: 12, color: '#666', marginRight: 12 },
  modeRow: { flexDirection: 'row', marginTop: 6 },
  modeTag: { backgroundColor: '#F0F0F0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  modeText: { fontSize: 12 },
  feeContainer: { alignItems: 'flex-end' },
  fee: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  nextAvailable: { fontSize: 11, color: '#34C759', marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666' }
});
