/**
 * StepCard Component
 * Card wrapper for onboarding steps with consistent styling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface StepCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onContinue?: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  skipLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  footer?: React.ReactNode;
}

export default function StepCard({
  title,
  subtitle,
  children,
  onContinue,
  onSkip,
  continueLabel = 'Continue',
  skipLabel,
  loading = false,
  disabled = false,
  footer,
}: StepCardProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </ScrollView>

      {/* Footer with actions */}
      {(onContinue || onSkip || footer) && (
        <View style={styles.footer}>
          {footer}
          <View style={styles.footerButtons}>
            {onSkip && skipLabel && (
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>{skipLabel}</Text>
              </TouchableOpacity>
            )}
            {onContinue && (
              <TouchableOpacity
                style={[styles.continueButton, disabled && styles.continueButtonDisabled]}
                onPress={onContinue}
                disabled={disabled || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.continueButtonText}>{continueLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  continueButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
