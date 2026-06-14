/**
 * ProgressBar Component
 * Shows onboarding progress with step dots and labels
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
  onStepPress?: (step: number) => void;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  stepNames,
  onStepPress,
}: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {/* Step dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isFuture = stepNum > currentStep;

          return (
            <React.Fragment key={stepNum}>
              {/* Step dot */}
              <TouchableOpacity
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                  isFuture && styles.dotFuture,
                ]}
                onPress={() => onStepPress?.(stepNum)}
                disabled={!onStepPress || isFuture}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.dotText,
                      isCurrent && styles.dotTextCurrent,
                      isFuture && styles.dotTextFuture,
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Connector line */}
              {stepNum < totalSteps && (
                <View
                  style={[
                    styles.connector,
                    isCompleted && styles.connectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step names */}
      {stepNames && (
        <View style={styles.namesContainer}>
          {stepNames.map((name, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <Text
                key={stepNum}
                style={[
                  styles.stepName,
                  isCompleted && styles.stepNameCompleted,
                  isCurrent && styles.stepNameCurrent,
                ]}
              >
                {name}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCompleted: {
    backgroundColor: Colors.light.success,
  },
  dotCurrent: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dotFuture: {
    backgroundColor: Colors.light.borderLight,
    borderWidth: 2,
    borderColor: Colors.light.borderMedium,
  },
  dotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotTextCurrent: {
    color: '#FFFFFF',
  },
  dotTextFuture: {
    color: Colors.light.textSecondary,
  },
  connector: {
    width: 40,
    height: 3,
    backgroundColor: Colors.light.borderLight,
    marginHorizontal: 4,
  },
  connectorCompleted: {
    backgroundColor: Colors.light.success,
  },
  namesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  stepName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textMuted,
    textAlign: 'center',
    flex: 1,
  },
  stepNameCompleted: {
    color: Colors.light.success,
  },
  stepNameCurrent: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
