/**
 * FormField Component
 * Reusable form field with label and validation state
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  required?: boolean;
  optional?: boolean;
  helperText?: string;
  onChangeText?: (text: string) => void;
}

export default function FormField({
  label,
  icon,
  error,
  required = false,
  optional = false,
  helperText,
  value,
  onChangeText,
  ...textInputProps
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
        {optional && <Text style={styles.optional}>(Optional)</Text>}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? Colors.light.primary : Colors.light.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.light.textMuted}
          {...textInputProps}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={Colors.light.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  required: {
    fontSize: 14,
    color: Colors.light.error,
    marginLeft: 4,
  },
  optional: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginLeft: 6,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.background,
  },
  inputContainerError: {
    borderColor: Colors.light.error,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 6,
  },
});
