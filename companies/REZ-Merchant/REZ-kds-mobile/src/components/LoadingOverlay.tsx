/**
 * KDS Mobile - LoadingOverlay Component
 * Loading indicator overlay
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    backgroundColor: '#2a2a3e',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
