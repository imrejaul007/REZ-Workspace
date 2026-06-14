import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import clsx from 'clsx';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={clsx(
        'flex-row items-center justify-center rounded-xl',
        'transition-all duration-200 active:scale-95',
        {
          'bg-indigo-600': variant === 'primary' && !isDisabled,
          'bg-gray-100': variant === 'secondary' && !isDisabled,
          'border-2 border-indigo-600 bg-transparent': variant === 'outline' && !isDisabled,
          'bg-transparent': variant === 'ghost' && !isDisabled,
          'bg-gray-300': isDisabled,
          'px-3 py-2': size === 'sm',
          'px-4 py-3': size === 'md',
          'px-6 py-4': size === 'lg',
        },
        className
      )}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#6366f1'}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={clsx('font-semibold', {
              'text-white': variant === 'primary' && !isDisabled,
              'text-gray-800': variant === 'secondary' && !isDisabled,
              'text-indigo-600': variant === 'outline' && !isDisabled,
              'text-indigo-600': variant === 'ghost' && !isDisabled,
              'text-gray-500': isDisabled,
              'text-sm': size === 'sm',
              'text-base': size === 'md',
              'text-lg': size === 'lg',
              'ml-2': icon,
            })}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});
