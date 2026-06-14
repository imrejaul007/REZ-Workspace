// Mobile Onboarding Screen
import { View, Text, StyleSheet, TouchableOpacity, useState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const slides = [
  { title: 'Find Your Dream Property', desc: 'Search Dubai & India properties with AI recommendations' },
  { title: 'Golden Visa Support', desc: 'Check eligibility & invest with confidence' },
  { title: 'Earn Rewards', desc: 'Refer friends & earn on bookings' },
];

export default function OnboardingScreen({ navigation }: any) {
  const [active] = useState(0);

  return (
    <LinearGradient colors={['#0ea5e9', '#0369a1']} style={styles.container}>
      <View style={styles.slides}>
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { display: active === i ? 'flex' : 'none' }]}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>{i === 0 ? '🏠' : i === 1 ? '🌍' : '💰'}</Text>
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.desc}>{s.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, active === i && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.btnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>Skip</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  slides: { flex: 1, justifyContent: 'center' },
  slide: { alignItems: 'center' },
  icon: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  iconText: { fontSize: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 32 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff', width: 24 },
  actions: { paddingBottom: 40, gap: 16 },
  btn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#0ea5e9', fontWeight: '600', fontSize: 16 },
  link: { color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
});
