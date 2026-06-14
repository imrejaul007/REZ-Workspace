import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeErrorState() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Something went wrong</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
