// RisaCare Mobile - Appointment Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DateOption {
  date: string;
  day: string;
  month: string;
}

const mockDoctor = {
  name: 'Dr. Priya Sharma',
  specialization: 'General Physician',
  fees: 800
};

const generateDates = (): DateOption[] => {
  const dates: DateOption[] = [];
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date: date.toISOString().split('T')[0],
      day: days[date.getDay()],
      month: `${date.getDate()} ${months[date.getMonth()]}`
    });
  }
  return dates;
};

const generateSlots = (): TimeSlot[] => {
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  return times.map(time => ({
    time,
    available: Math.random() > 0.3
  }));
};

export default function AppointmentScreen({ route, navigation }: any) {
  const [selectedDate, setSelectedDate] = useState<string>(generateDates()[0].date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'in_clinic' | 'teleconsult'>('in_clinic');
  const [slots] = useState<TimeSlot[]>(generateSlots());
  const dates = generateDates();

  const handleBook = () => {
    if (!selectedSlot) {
      Alert.alert('Select Time', 'Please select an appointment time');
      return;
    }

    Alert.alert(
      'Confirm Booking',
      `Book with ${mockDoctor.name}?\n\nDate: ${selectedDate}\nTime: ${selectedSlot}\nMode: ${selectedMode === 'in_clinic' ? 'In Clinic' : 'Video Call'}\nFee: ₹${mockDoctor.fees}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('Success', 'Appointment booked successfully!', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Doctor Info */}
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{mockDoctor.name.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{mockDoctor.name}</Text>
            <Text style={styles.doctorSpecialty}>{mockDoctor.specialization}</Text>
            <Text style={styles.doctorFee}>₹{mockDoctor.fees}</Text>
          </View>
        </View>

        {/* Consultation Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Mode</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeCard, selectedMode === 'in_clinic' && styles.modeCardActive]}
              onPress={() => setSelectedMode('in_clinic')}
            >
              <Text style={styles.modeIcon}>🏥</Text>
              <Text style={[styles.modeLabel, selectedMode === 'in_clinic' && styles.modeLabelActive]}>In Clinic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeCard, selectedMode === 'teleconsult' && styles.modeCardActive]}
              onPress={() => setSelectedMode('teleconsult')}
            >
              <Text style={styles.modeIcon}>📹</Text>
              <Text style={[styles.modeLabel, selectedMode === 'teleconsult' && styles.modeLabelActive]}>Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map(date => (
              <TouchableOpacity
                key={date.date}
                style={[styles.dateCard, selectedDate === date.date && styles.dateCardActive]}
                onPress={() => {
                  setSelectedDate(date.date);
                  setSelectedSlot(null);
                }}
              >
                <Text style={[styles.dateDay, selectedDate === date.date && styles.dateTextActive]}>{date.day}</Text>
                <Text style={[styles.dateNum, selectedDate === date.date && styles.dateTextActive]}>{date.month.split(' ')[0]}</Text>
                <Text style={[styles.dateMonth, selectedDate === date.date && styles.dateTextActive]}>{date.month.split(' ')[1]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.slotsContainer}>
            {slots.map(slot => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.slotCard,
                  !slot.available && styles.slotUnavailable,
                  selectedSlot === slot.time && styles.slotActive
                ]}
                onPress={() => slot.available && setSelectedSlot(slot.time)}
                disabled={!slot.available}
              >
                <Text style={[
                  styles.slotTime,
                  !slot.available && styles.slotTextUnavailable,
                  selectedSlot === slot.time && styles.slotTextActive
                ]}>
                  {formatTime(slot.time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doctor</Text>
            <Text style={styles.summaryValue}>{mockDoctor.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{selectedDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{selectedSlot ? formatTime(selectedSlot) : '-'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mode</Text>
            <Text style={styles.summaryValue}>{selectedMode === 'in_clinic' ? 'In Clinic' : 'Video Call'}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{mockDoctor.fees}</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, margin: 16, borderRadius: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  doctorSpecialty: { fontSize: 13, color: '#666', marginTop: 2 },
  doctorFee: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginTop: 4 },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  modeContainer: { flexDirection: 'row' },
  modeCard: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 12 },
  modeCardActive: { backgroundColor: '#007AFF' },
  modeIcon: { fontSize: 28, marginBottom: 8 },
  modeLabel: { fontSize: 13, color: '#666' },
  modeLabelActive: { color: '#fff', fontWeight: '600' },
  dateCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, alignItems: 'center', marginRight: 12, width: 60 },
  dateCardActive: { backgroundColor: '#007AFF' },
  dateDay: { fontSize: 12, color: '#666' },
  dateNum: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateMonth: { fontSize: 10, color: '#666' },
  dateTextActive: { color: '#fff' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  slotCard: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, marginRight: 10, marginBottom: 10, minWidth: 90, alignItems: 'center' },
  slotUnavailable: { backgroundColor: '#F0F0F0', opacity: 0.5 },
  slotActive: { backgroundColor: '#007AFF' },
  slotTime: { fontSize: 14, color: '#333', fontWeight: '500' },
  slotTextUnavailable: { color: '#999' },
  slotTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: '#fff', padding: 16, margin: 16, borderRadius: 12 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  summaryDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  bottomCta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  bookButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
