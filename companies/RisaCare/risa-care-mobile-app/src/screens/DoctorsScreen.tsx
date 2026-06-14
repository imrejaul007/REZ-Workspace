import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../App';

const specializations = ['All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 'Neurologist'];

const mockDoctors = [
  { id: '1', name: 'Dr. Amit Sharma', specialty: 'Cardiologist', experience: 15, rating: 4.8, fee: 500, image: '👨‍⚕️' },
  { id: '2', name: 'Dr. Priya Patel', specialty: 'Dermatologist', experience: 10, rating: 4.9, fee: 600, image: '👩‍⚕️' },
  { id: '3', name: 'Dr. Rajesh Kumar', specialty: 'General Physician', experience: 20, rating: 4.7, fee: 400, image: '👨‍⚕️' },
  { id: '4', name: 'Dr. Sneha Gupta', specialty: 'Pediatrician', experience: 12, rating: 4.8, fee: 550, image: '👩‍⚕️' },
  { id: '5', name: 'Dr. Vikram Singh', specialty: 'Orthopedic', experience: 18, rating: 4.6, fee: 700, image: '👨‍⚕️' },
];

export default function DoctorsScreen({ navigation, route }: any) {
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockDoctors.filter(d => {
    const matchSpec = selectedSpec === 'All' || d.specialty === selectedSpec;
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSpec && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Doctors</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={specializations}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedSpec === item && styles.filterChipActive]}
              onPress={() => setSelectedSpec(item)}
            >
              <Text style={[styles.filterText, selectedSpec === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.doctorCard}
            onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.image}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.specialty}>{item.specialty}</Text>
              <View style={styles.meta}>
                <Text style={styles.exp}>{item.experience} yrs exp</Text>
                <Text style={styles.rating}>⭐ {item.rating}</Text>
              </View>
            </View>
            <View style={styles.feeContainer}>
              <Text style={styles.fee}>₹{item.fee}</Text>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => navigation.navigate('BookAppointment', { doctor: item })}
              >
                <Text style={styles.bookBtnText}>Book</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  searchInput: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, fontSize: 16 },
  filters: { paddingHorizontal: 20, marginBottom: 10 },
  filterChip: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.text },
  filterTextActive: { color: COLORS.white },
  doctorCard: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 20, marginVertical: 8, padding: 15, borderRadius: 15, elevation: 2 },
  avatar: { width: 70, height: 70, backgroundColor: COLORS.accent, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 35 },
  info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  specialty: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  meta: { flexDirection: 'row', marginTop: 5 },
  exp: { fontSize: 12, color: COLORS.textLight },
  rating: { fontSize: 12, color: COLORS.warning, marginLeft: 15 },
  feeContainer: { alignItems: 'flex-end', justifyContent: 'space-between' },
  fee: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, marginTop: 10 },
  bookBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 12 },
});
