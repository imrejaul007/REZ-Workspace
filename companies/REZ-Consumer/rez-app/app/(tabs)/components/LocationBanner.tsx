import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LocationBannerProps {
  onEnablePress?: () => void;
  onDismiss?: () => void;
}

export default function LocationBanner({ onEnablePress, onDismiss }: LocationBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enable location</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
});
