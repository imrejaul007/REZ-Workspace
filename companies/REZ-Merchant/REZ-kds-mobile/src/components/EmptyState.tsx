/**
 * KDS Mobile - EmptyState Component
 * Shown when there are no orders in the queue
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KitchenStation } from '../types';
import { getStationLabel } from '../utils/helpers';

interface EmptyStateProps {
  station?: KitchenStation;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  station,
  message,
}) => {
  const defaultMessage = station
    ? `No active orders for ${getStationLabel(station)} station`
    : 'No active orders in queue';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>CHECKLIST</Text>
      </View>
      <Text style={styles.title}>All Caught Up!</Text>
      <Text style={styles.message}>{message || defaultMessage}</Text>
      <View style={styles.divider} />
      <Text style={styles.hint}>
        New orders will appear here automatically
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginBottom: 24,
  },
  hint: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EmptyState;
