/**
 * AnimatedButton - LEGACY SHIM
 *
 * Canonical button component: @/components/ui/Button
 * This file adapts the old AnimatedButton API (children: string) to
 * the canonical Button API (title: string) so existing callers work unchanged.
 *
 * New code should use <Button ... /> directly.
 *
 * Canonical color source: @/constants/theme — import from there
 */

import React from 'react';
import Button from './Button';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;

// Old AnimatedButton used children: string and size='sm'|'md'|'lg'
// Button uses title: string and size='small'|'medium'|'large'
// This adapter handles both differences transparently.

interface AnimatedButtonProps extends Omit<ButtonProps, 'title' | 'size'> {
  /** Label text — maps to Button's `title` prop */
  children: string;
  /** Size alias: 'sm' → 'small', 'md' → 'medium', 'lg' → 'large' */
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
}

const SIZE_MAP: Record<string, ButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  small: 'small',
  medium: 'medium',
  large: 'large',
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  ...rest
}) => (
  <Button
    title={children}
    size={SIZE_MAP[size] ?? 'medium'}
    variant={variant}
    {...rest}
  />
);

export default React.memo(AnimatedButton);
