/**
 * Airzy Lounge Details Screen
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function LoungeDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lounge Details</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
});
