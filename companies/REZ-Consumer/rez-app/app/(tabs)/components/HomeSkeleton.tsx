import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <View style={styles.row}>
        <View style={styles.card} />
        <View style={styles.card} />
      </View>
      <View style={styles.largeCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    height: 100,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  largeCard: {
    height: 150,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
});
