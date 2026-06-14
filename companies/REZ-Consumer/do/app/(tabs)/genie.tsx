/**
 * Genie Tab - Personal AI Memory
 *
 * Full memory management interface accessible from tab bar
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { GenieScreen } from '@/screens/GenieScreen';
import { useUserStore } from '@/stores';

export default function GenieTab() {
  const router = useRouter();
  const { user } = useUserStore();

  const handleClose = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <GenieScreen
        userId={user?.id || 'default'}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});