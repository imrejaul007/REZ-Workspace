import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HomeHeaderProps {
  onSearchPress?: () => void;
  coinBalance?: number;
  onCoinPress?: () => void;
}

export default function HomeHeader({ onSearchPress, coinBalance, onCoinPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
