/**
 * SkipButton Component
 * Optional skip button for non-required sections
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface SkipButtonProps {
  onSkip: () => void;
  label?: string;
  reason?: string;
}

export default function SkipButton({ onSkip, label = 'Skip for now', reason }: SkipButtonProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onSkip}>
      <View style={styles.content}>
        <Ionicons name="time-outline" size={18} color={Colors.light.textSecondary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      {reason && <Text style={styles.reason}>{reason}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderStyle: 'dashed',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  reason: {
    fontSize: 12,
    color: Colors.light.textMuted,
    maxWidth: '40%',
    textAlign: 'right',
  },
});
