import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="construct-outline" size={64} color="#ffcd57" />
      <Text style={styles.title}>Under Maintenance</Text>
      <Text style={styles.subtitle}>We'll be back shortly.{'\n'}Thank you for your patience!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3a52',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
