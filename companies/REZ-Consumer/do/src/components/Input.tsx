import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}, ref) => {
  const { colors, borderRadius, spacing, typography } = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.labelSecondary,
              ...typography.bodySmall,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.fill,
            borderRadius: borderRadius.input,
            borderColor: error ? colors.systemRed : colors.separator,
            borderWidth: error ? 1 : 0,
          },
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              color: colors.label,
              ...typography.bodyLarge,
            },
            style,
          ]}
          placeholderTextColor={colors.labelTertiary}
          {...props}
        />

        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>

      {error && (
        <Text
          style={[
            styles.error,
            {
              color: colors.systemRed,
              ...typography.captionMedium,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  icon: {
    marginHorizontal: 8,
  },
  error: {
    marginTop: 4,
  },
});
