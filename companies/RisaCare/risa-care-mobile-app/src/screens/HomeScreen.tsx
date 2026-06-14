import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { COLORS } from '../../App';

const services = [
  { id: '1', name: 'Book Appointment', icon: '📅', color: '#00B4D8' },
  { id: '2', name: 'Lab Tests', icon: '🧪', color: '#0077B6' },
  { id: '3', name: 'Pharmacy', icon: '💊', color: '#28A745' },
  { id: '4', name: 'Video Consult', icon: '📹', color: '#6C757D' },
  { id: '5', name: 'Health Records', icon: '📋', color: '#FFC107' },
  { id: '6', name: 'Health Wallet', icon: '💰', color: '#DC3545' },
];

const specialists = [
  { id: '1', name: 'General Physician', image: '👨‍⚕️' },
  { id: '2', name: 'Cardiologist', image: '❤️' },
  { id: '3', name: 'Dermatologist', image: '🧑‍⚕️' },
  { id: '4', name: 'Orthopedic', image: '🦴' },
  { id: '5', name: 'Pediatrician', image: '👶' },
  { id: '6', name: 'Neurologist', image: '🧠' },
];

export default function HomeScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning! 👋</Text>
          <Text style={styles.title}>How can we help you today?</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Text>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, specialists..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Services */}
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceCard, { backgroundColor: service.color + '20' }]}
            onPress={() => {
              if (service.name === 'Lab Tests') navigation.navigate('LabTests');
              if (service.name === 'Pharmacy') navigation.navigate('Pharmacy');
              if (service.name === 'Health Wallet') navigation.navigate('HealthWallet');
              if (service.name === 'Video Consult') navigation.navigate('Consultation');
            }}
          >
            <Text style={styles.serviceIcon}>{service.icon}</Text>
            <Text style={[styles.serviceName, { color: service.color }]}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Specialists */}
      <Text style={styles.sectionTitle}>Find Specialists</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialistsScroll}>
        {specialists.map((spec) => (
          <TouchableOpacity
            key={spec.id}
            style={styles.specialistCard}
            onPress={() => navigation.navigate('Doctors', { specialization: spec.name })}
          >
            <Text style={styles.specialistIcon}>{spec.image}</Text>
            <Text style={styles.specialistName}>{spec.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Top Doctors */}
      <Text style={styles.sectionTitle}>Top Doctors</Text>
      {[1, 2, 3].map((_, index) => (
        <TouchableOpacity
          key={index}
          style={styles.doctorCard}
          onPress={() => navigation.navigate('DoctorDetail')}
        >
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorEmoji}>👨‍⚕️</Text>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr. Amit Sharma</Text>
            <Text style={styles.doctorSpecialty}>Cardiologist • 15 yrs exp</Text>
            <View style={styles.doctorMeta}>
              <Text style={styles.doctorRating}>⭐ 4.8</Text>
              <Text style={styles.doctorFee}>₹500</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('BookAppointment')}
          >
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* Health Tips */}
      <Text style={styles.sectionTitle}>Health Tips</Text>
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Stay Hydrated</Text>
        <Text style={styles.tipText}>Drink at least 8 glasses of water daily for better health.</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { fontSize: 14, color: COLORS.textLight },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  notificationBtn: { width: 45, height: 45, backgroundColor: COLORS.white, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15 },
  serviceCard: { width: '30%', margin: 5, padding: 15, borderRadius: 15, alignItems: 'center' },
  serviceIcon: { fontSize: 30, marginBottom: 8 },
  serviceName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  specialistsScroll: { paddingLeft: 20 },
  specialistCard: { alignItems: 'center', marginRight: 20 },
  specialistIcon: { fontSize: 50 },
  specialistName: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
  doctorCard: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 20, marginVertical: 8, padding: 15, borderRadius: 15, elevation: 2 },
  doctorAvatar: { width: 60, height: 60, backgroundColor: COLORS.accent, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  doctorEmoji: { fontSize: 30 },
  doctorInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  doctorSpecialty: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  doctorMeta: { flexDirection: 'row', marginTop: 5 },
  doctorRating: { fontSize: 13, color: COLORS.warning },
  doctorFee: { fontSize: 13, color: COLORS.success, marginLeft: 15 },
  bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, alignSelf: 'center' },
  bookBtnText: { color: COLORS.white, fontWeight: '600' },
  tipCard: { backgroundColor: COLORS.white, marginHorizontal: 20, padding: 20, borderRadius: 15 },
  tipTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  tipText: { fontSize: 14, color: COLORS.textLight },
});
