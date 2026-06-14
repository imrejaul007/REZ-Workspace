import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignTokens';

export default function CreatePurchaseOrderScreen() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Purchase Order</Text>
        <Text style={styles.stepIndicator}>Step {step} of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Select Supplier</Text>
          <Text style={styles.stepDescription}>Choose which supplier to create this order for</Text>
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  stepIndicator: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  stepContainer: { minHeight: 300 },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
  },
  nextButtonText: { color: 'white', fontSize: Typography.fontSize.base, fontWeight: '700' },
});
