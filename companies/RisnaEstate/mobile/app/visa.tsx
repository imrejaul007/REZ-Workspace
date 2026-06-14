// Mobile - Visa Eligibility Screen
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

const visaPrograms = [
  { id: 'golden', name: 'Golden Visa', country: 'UAE', minInvestment: 2000000, currency: 'AED', validity: '10 years' },
  { id: 'investor', name: 'Investor Visa', country: 'UAE', minInvestment: 545000, currency: 'AED', validity: '3 years' },
  { id: 'golden_india', name: 'Golden Visa', country: 'UAE', minInvestment: 45000000, currency: 'INR', validity: '10 years' },
];

export default function VisaScreen() {
  const [investment, setInvestment] = useState('2000000');
  const [eligible, setEligible] = useState<any>(null);

  const checkEligibility = () => {
    const amount = parseInt(investment) || 0;
    const result = visaPrograms.find(p => {
      if (p.currency === 'AED') return amount >= p.minInvestment;
      return amount >= p.minInvestment;
    });
    setEligible(result || null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🌍 Golden Visa Eligibility</Text>
      <Text style={styles.subtitle}>Check if you qualify for UAE residency by investment</Text>

      {/* Investment Input */}
      <View style={styles.inputCard}>
        <Text style={styles.label}>Your Investment Amount</Text>
        <View style={styles.inputRow}>
          <Text style={styles.currency}>AED</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={investment}
            onChangeText={setInvestment}
            placeholder="0"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.checkBtn} onPress={checkEligibility}>
        <Text style={styles.checkBtnText}>Check Eligibility</Text>
      </TouchableOpacity>

      {/* Result */}
      {eligible && (
        <View style={styles.resultCard}>
          <View style={styles.eligibleBadge}>
            <Text style={styles.eligibleText}>✓ Eligible</Text>
          </View>
          <Text style={styles.programName}>{eligible.name}</Text>
          <Text style={styles.programDetails}>
            {eligible.validity} validity • {eligible.country}
          </Text>
          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>Benefits:</Text>
            <Text style={styles.benefit}>✓ Residency for you & family</Text>
            <Text style={styles.benefit}>✓ Multi-entry visa</Text>
            <Text style={styles.benefit}>✓ Business setup support</Text>
            <Text style={styles.benefit}>✓ 100% ownership</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* All Programs */}
      <View style={styles.programs}>
        <Text style={styles.programsTitle}>Available Programs</Text>
        {visaPrograms.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <Text style={styles.programCardName}>{program.name}</Text>
            <Text style={styles.programCardMin}>
              Min: {program.currency === 'AED' ? 'AED ' : '₹'}{program.minInvestment.toLocaleString()}
            </Text>
            <Text style={styles.programCardValidity}>{program.validity}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 24 },
  inputCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadow: 2 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 18, color: '#6b7280', marginRight: 8 },
  input: { flex: 1, fontSize: 24, fontWeight: 'bold', borderBottomWidth: 2, borderBottomColor: '#0ea5e9', paddingVertical: 8 },
  checkBtn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  checkBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  resultCard: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 20, marginTop: 16, alignItems: 'center' },
  eligibleBadge: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  eligibleText: { color: '#fff', fontWeight: '600' },
  programName: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  programDetails: { color: '#6b7280', marginTop: 4 },
  benefits: { marginTop: 16, alignSelf: 'stretch' },
  benefitsTitle: { fontWeight: '600', marginBottom: 8 },
  benefit: { color: '#059669', fontSize: 14, marginVertical: 2 },
  applyBtn: { backgroundColor: '#0ea5e9', padding: 14, borderRadius: 8, marginTop: 16, alignSelf: 'stretch', alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '600' },
  programs: { marginTop: 24 },
  programsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  programCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadow: 1 },
  programCardName: { fontSize: 14, fontWeight: '600' },
  programCardMin: { color: '#0ea5e9', fontWeight: '600', marginTop: 4 },
  programCardValidity: { color: '#6b7280', fontSize: 12, marginTop: 4 },
});
