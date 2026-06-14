import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

function UpdateRequiredScreen() {
  const openStore = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/rez/id000000000'
        : 'https://play.google.com/store/apps/details?id=com.rez.consumer';
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.subtitle}>A new version of REZ is available with important improvements.</Text>
      <TouchableOpacity style={styles.button} onPress={openStore}>
        <Text style={styles.buttonText}>Update Now</Text>
      </TouchableOpacity>
    </View>
  );
}

export default withErrorBoundary(UpdateRequiredScreen, 'UpdateRequired');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#ffcd57',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a52',
  },
});
