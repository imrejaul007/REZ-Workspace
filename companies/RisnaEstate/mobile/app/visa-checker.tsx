// Mobile - Visa Checker Screen
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VisaCheckerScreen() {
  const [step, setStep] = useState(1);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    country: 'AE',
    age: '',
    income: '',
    investment: ''
  });

  const checkEligibility = () => {
    const age = parseInt(form.age) || 0;
    const investment = parseInt(form.investment) || 0;
    setEligible(investment >= 2000000 && age >= 21);
    setStep(2);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Golden Visa Eligibility</Text>
        <Text style={styles.subtitle}>Check if you qualify for UAE Golden Visa</Text>
      </View>

      {step === 1 && (
        <View style={styles.form}>
          <View style={styles.input}>
            <Text style={styles.label}>Your Age</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter age"
              keyboardType="numeric"
              value={form.age}
              onChangeText={(age) => setForm({ ...form, age })}
            />
          </View>

          <View style={styles.input}>
            <Text style={styles.label}>Annual Income (AED)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 500000"
              keyboardType="numeric"
              value={form.income}
              onChangeText={(income) => setForm({ ...form, income })}
            />
          </View>

          <View style={styles.input}>
            <Text style={styles.label}>Property Investment (AED)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2500000"
              keyboardType="numeric"
              value={form.investment}
              onChangeText={(investment) => setForm({ ...form, investment })}
            />
            <Text style={styles.hint}>Minimum: AED 2,000,000</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={checkEligibility}>
            <Text style={styles.buttonText}>Check Eligibility</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && eligible !== null && (
        <View style={styles.result}>
          <View style={[styles.icon, eligible ? styles.iconGreen : styles.iconRed]}>
            <Ionicons name={eligible ? 'checkmark' : 'close'} size={48} color="#fff" />
          </View>
          <Text style={[styles.resultTitle, eligible ? styles.textGreen : styles.textRed]}>
            {eligible ? "You're Eligible!" : 'Not Eligible Yet'}
          </Text>
          <Text style={styles.resultDesc}>
            {eligible
              ? 'Based on your investment amount, you qualify for UAE Golden Visa!'
              : 'Investment amount needs to be at least AED 2,000,000'}
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => { setStep(1); setEligible(null); }}
          >
            <Text style={styles.buttonOutlineText}>Check Again</Text>
          </TouchableOpacity>

          {eligible && (
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Schedule Consultation</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#0ea5e9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { padding: 24 },
  input: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16 },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  button: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0ea5e9' },
  buttonOutlineText: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  result: { padding: 24, alignItems: 'center' },
  icon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconGreen: { backgroundColor: '#22c55e' },
  iconRed: { backgroundColor: '#ef4444' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  textGreen: { color: '#22c55e' },
  textRed: { color: '#ef4444' },
  resultDesc: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
});
