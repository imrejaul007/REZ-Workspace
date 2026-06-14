// Mobile Investment Calculator Screen
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useState, ScrollView } from 'react-native';

export default function CalculatorScreen() {
  const [price, setPrice] = useState('2000000');
  const [rent, setRent] = useState('12000');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const p = parseFloat(price) || 0;
    const r = parseFloat(rent) * 12;
    const total = p * Math.pow(1.08, 5) - p + r * 5;
    setResult({
      roi: ((total / p) * 100 / 5).toFixed(1),
      total: total.toFixed(0),
      yearly: ((r / p) * 100).toFixed(1),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>ROI Calculator</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Property Price (AED)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>Monthly Rent (AED)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={rent}
          onChangeText={setRent}
        />

        <TouchableOpacity style={styles.btn} onPress={calculate}>
          <Text style={styles.btnText}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Your ROI Analysis</Text>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>5-Year ROI</Text>
            <Text style={styles.statValue}>{result.roi}%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Return</Text>
            <Text style={styles.statValue}>AED {parseInt(result.total).toLocaleString()}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Yearly Yield</Text>
            <Text style={styles.statValue}>{result.yearly}%</Text>
          </View>
          {parseFloat(price) >= 2000000 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Golden Visa Eligible</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 16 },
  btn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  result: { backgroundColor: '#ecfdf5', margin: 16, padding: 20, borderRadius: 16 },
  resultTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  stat: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statLabel: { color: '#374151', fontSize: 14 },
  statValue: { fontWeight: '600', fontSize: 16 },
  badge: { backgroundColor: '#22c55e', padding: 12, borderRadius: 8, marginTop: 16 },
  badgeText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
