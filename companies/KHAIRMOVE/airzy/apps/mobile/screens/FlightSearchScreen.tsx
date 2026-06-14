/**
 * Airzy Flight Search Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FlightSearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flight Search</Text>
      <Text style={styles.subtitle}>Search results will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});
