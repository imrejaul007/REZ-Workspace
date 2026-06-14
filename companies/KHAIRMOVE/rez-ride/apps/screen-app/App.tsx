import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Screen App - DOOH Display for vehicle screens
export const ScreenApp: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ReZ Ride</Text>
        <Text style={styles.tagline}>Safe Rides, Zero Commission</Text>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        <View style={styles.adSpace}>
          <Text style={styles.adPlaceholder}>Advertisement Space</Text>
          <Text style={styles.adHint}>Partner with us for brand visibility</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>50K+</Text>
            <Text style={styles.statLabel}>Happy Riders</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>10%</Text>
            <Text style={styles.statLabel}>Cashback</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
        </View>
        <Text style={styles.scanText}>Scan QR to book your ride</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#6B4EFF' },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 4 },
  main: { flex: 1, justifyContent: 'center', padding: 24 },
  adSpace: { flex: 1, backgroundColor: '#2d2d44', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  adPlaceholder: { fontSize: 28, color: '#6B4EFF', fontWeight: 'bold' },
  adHint: { fontSize: 14, color: '#9ca3af', marginTop: 12 },
  footer: { padding: 24, backgroundColor: '#2d2d44' },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#22c55e' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  scanText: { textAlign: 'center', color: '#9ca3af', marginTop: 16, fontSize: 14 },
});

export default ScreenApp;
