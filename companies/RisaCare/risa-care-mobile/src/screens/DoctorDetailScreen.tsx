// RisaCare Mobile - Doctor Detail Screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native';

interface Doctor {
  id: string;
  name: string;
  photo: string;
  specializations: string[];
  qualifications: string[];
  experience: number;
  languages: string[];
  registrationNumber: string;
  hospital: string;
  fees: { inClinic: number; teleconsult: number };
  rating: number;
  reviewCount: number;
  modes: string[];
  workingDays: string[];
  hours: string;
  nextAvailable: string;
  about: string;
}

const mockDoctor: Doctor = {
  id: '1',
  name: 'Dr. Priya Sharma',
  photo: '',
  specializations: ['General Physician', 'Internal Medicine'],
  qualifications: ['MBBS', 'MD - Internal Medicine'],
  experience: 12,
  languages: ['English', 'Hindi', 'Tamil'],
  registrationNumber: 'MCI-12345',
  hospital: 'Apollo Hospital',
  fees: { inClinic: 800, teleconsult: 600 },
  rating: 4.7,
  reviewCount: 234,
  modes: ['in_clinic', 'teleconsult'],
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  hours: '9:00 AM - 6:00 PM',
  nextAvailable: 'Today, 3:00 PM',
  about: 'Dr. Priya Sharma is a highly experienced General Physician with over 12 years of practice. She specializes in managing chronic conditions like diabetes and hypertension, as well as acute illnesses. She is known for her patient-centric approach and thorough consultations.'
};

export default function DoctorDetailScreen({ route, navigation }: any) {
  const doctor = mockDoctor;

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'in_clinic': return { icon: '🏥', label: 'In Clinic' };
      case 'teleconsult': return { icon: '📹', label: 'Video Call' };
      case 'home_visit': return { icon: '🏠', label: 'Home Visit' };
      default: return { icon: '📋', label: mode };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{doctor.name.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <Text style={styles.name}>{doctor.name}</Text>
          <Text style={styles.specializations}>{doctor.specializations.join(' • ')}</Text>
          <Text style={styles.hospital}>🏥 {doctor.hospital}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingNumber}>{doctor.rating}</Text>
              <Text style={styles.ratingLabel}>⭐ Rating</Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingNumber}>{doctor.experience}</Text>
              <Text style={styles.ratingLabel}>Years Exp.</Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingNumber}>{doctor.reviewCount}</Text>
              <Text style={styles.ratingLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{doctor.about}</Text>
        </View>

        {/* Qualifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qualifications</Text>
          <View style={styles.qualifications}>
            {doctor.qualifications.map((qual, index) => (
              <View key={index} style={styles.qualBadge}>
                <Text style={styles.qualText}>{qual}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.languages}>{doctor.languages.join(' • ')}</Text>
        </View>

        {/* Consultation Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Options</Text>
          <View style={styles.modesContainer}>
            {doctor.modes.map(mode => {
              const modeInfo = getModeIcon(mode);
              return (
                <View key={mode} style={styles.modeCard}>
                  <Text style={styles.modeIcon}>{modeInfo.icon}</Text>
                  <Text style={styles.modeLabel}>{modeInfo.label}</Text>
                  <Text style={styles.modeFee}>
                    ₹{mode === 'in_clinic' ? doctor.fees.inClinic : doctor.fees.teleconsult}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>Working Days</Text>
              <Text style={styles.availabilityValue}>{doctor.workingDays.join(', ')}</Text>
            </View>
            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>Hours</Text>
              <Text style={styles.availabilityValue}>{doctor.hours}</Text>
            </View>
            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>Next Available</Text>
              <Text style={[styles.availabilityValue, { color: '#34C759' }]}>{doctor.nextAvailable}</Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <View style={styles.ctaInfo}>
          <Text style={styles.ctaLabel}>Starting from</Text>
          <Text style={styles.ctaPrice}>₹{Math.min(...Object.values(doctor.fees))}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Appointment', { doctorId: doctor.id })}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#007AFF', padding: 20, alignItems: 'center', paddingTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#007AFF' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  specializations: { fontSize: 14, color: '#B3D4FF', marginTop: 4 },
  hospital: { fontSize: 14, color: '#90D5FF', marginTop: 4 },
  ratingContainer: { flexDirection: 'row', marginTop: 16 },
  ratingBox: { alignItems: 'center', marginHorizontal: 20 },
  ratingNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  ratingLabel: { fontSize: 11, color: '#B3D4FF', marginTop: 2 },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  aboutText: { fontSize: 14, color: '#666', lineHeight: 22 },
  qualifications: { flexDirection: 'row', flexWrap: 'wrap' },
  qualBadge: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  qualText: { fontSize: 13, color: '#333' },
  languages: { fontSize: 14, color: '#666' },
  modesContainer: { flexDirection: 'row' },
  modeCard: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 12 },
  modeIcon: { fontSize: 28, marginBottom: 8 },
  modeLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  modeFee: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  availabilityCard: {},
  availabilityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  availabilityLabel: { fontSize: 14, color: '#666' },
  availabilityValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  bottomCta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  ctaInfo: {},
  ctaLabel: { fontSize: 12, color: '#666' },
  ctaPrice: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  bookButton: { flex: 1, backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginLeft: 16 },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
