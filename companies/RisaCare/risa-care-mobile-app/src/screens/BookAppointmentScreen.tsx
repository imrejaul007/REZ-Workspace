import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../App';

const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];

export default function BookAppointmentScreen({ navigation, route }: any) {
  const doctor = route?.params?.doctor || { name: 'Dr. Amit Sharma', specialty: 'Cardiologist', fee: 500 };
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('');

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const handleBook = () => {
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.doctorCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👨‍⚕️</Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          <Text style={styles.doctorFee}>₹{doctor.fee} consultation</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dateCard, selectedDate === index && styles.dateCardActive]}
            onPress={() => setSelectedDate(index)}
          >
            <Text style={[styles.dayName, selectedDate === index && styles.textActive]}>
              {date.toLocaleDateString('en', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dayNum, selectedDate === index && styles.textActive]}>
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Select Time</Text>
      <View style={styles.slotsGrid}>
        {timeSlots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.slotCard, selectedSlot === slot && styles.slotCardActive]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text style={[styles.slotText, selectedSlot === slot && styles.textActive]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Reason for Visit</Text>
      <TextInput
        style={styles.reasonInput}
        placeholder="Brief description of your symptoms..."
        placeholderTextColor={COLORS.textLight}
        multiline
        numberOfLines={4}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Consultation Fee</Text>
          <Text style={styles.summaryValue}>₹{doctor.fee}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Platform Fee</Text>
          <Text style={styles.summaryValue}>₹50</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{doctor.fee + 50}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleBook}>
        <Text style={styles.confirmBtnText}>Confirm Booking</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  doctorCard: { flexDirection: 'row', backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 15 },
  avatar: { width: 80, height: 80, backgroundColor: COLORS.accent, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40 },
  doctorInfo: { marginLeft: 20, justifyContent: 'center' },
  doctorName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  doctorSpecialty: { fontSize: 14, color: COLORS.textLight, marginTop: 3 },
  doctorFee: { fontSize: 16, color: COLORS.success, fontWeight: '600', marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  dateScroll: { paddingHorizontal: 20 },
  dateCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginRight: 10, alignItems: 'center', minWidth: 60 },
  dateCardActive: { backgroundColor: COLORS.primary },
  dayName: { fontSize: 12, color: COLORS.textLight },
  dayNum: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 5 },
  textActive: { color: COLORS.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15 },
  slotCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 10, margin: 5, minWidth: '30%', alignItems: 'center' },
  slotCardActive: { backgroundColor: COLORS.primary },
  slotText: { color: COLORS.text },
  reasonInput: { backgroundColor: COLORS.white, marginHorizontal: 20, padding: 15, borderRadius: 15, height: 100, textAlignVertical: 'top' },
  summary: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 15 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  summaryLabel: { color: COLORS.textLight },
  summaryValue: { color: COLORS.text },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.background, paddingTop: 10, marginTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  confirmBtn: { backgroundColor: COLORS.primary, marginHorizontal: 20, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
