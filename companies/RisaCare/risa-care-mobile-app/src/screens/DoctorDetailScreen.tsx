import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../App';

export default function DoctorDetailScreen({ navigation, route }: any) {
  const doctor = route?.params?.doctor || { name: 'Dr. Amit Sharma', specialty: 'Cardiologist', experience: 15, rating: 4.8, fee: 500 };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👨‍⚕️</Text>
        </View>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{doctor.experience}</Text>
            <Text style={styles.statLabel}>Years Exp.</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>⭐ {doctor.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>500+</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Dr. {doctor.name.split(' ')[1]} is a highly experienced {doctor.specialty} with {doctor.experience} years of practice.
          Specializes in diagnosis and treatment of cardiovascular conditions.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.educationItem}>
          <Text style={styles.eduTitle}>MBBS</Text>
          <Text style={styles.eduSub}>AIIMS Delhi</Text>
        </View>
        <View style={styles.educationItem}>
          <Text style={styles.eduTitle}>MD - {doctor.specialty}</Text>
          <Text style={styles.eduSub}>PGI Chandigarh</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.services}>
          {['Video Consultation', 'ECG', 'Stress Test', '2D Echo'].map((s, i) => (
            <View key={i} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('BookAppointment', { doctor })}>
        <Text style={styles.bookBtnText}>Book Appointment • ₹{doctor.fee}</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 50 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.white, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: COLORS.text },
  profileCard: { backgroundColor: COLORS.primary, padding: 30, paddingTop: 0, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 120, height: 120, backgroundColor: COLORS.white, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginTop: -60, elevation: 5 },
  avatarText: { fontSize: 60 },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginTop: 15 },
  specialty: { fontSize: 16, color: COLORS.white, opacity: 0.9, marginTop: 5 },
  stats: { flexDirection: 'row', marginTop: 20, marginBottom: 20 },
  stat: { alignItems: 'center', marginHorizontal: 20 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  statLabel: { fontSize: 12, color: COLORS.white, opacity: 0.8, marginTop: 3 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  aboutText: { fontSize: 14, color: COLORS.textLight, lineHeight: 22 },
  educationItem: { backgroundColor: COLORS.white, padding: 15, borderRadius: 10, marginBottom: 10 },
  eduTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  eduSub: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  services: { flexDirection: 'row', flexWrap: 'wrap' },
  serviceTag: { backgroundColor: COLORS.accent, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  serviceText: { fontSize: 13, color: COLORS.text },
  bookBtn: { backgroundColor: COLORS.primary, marginHorizontal: 20, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  bookBtnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
