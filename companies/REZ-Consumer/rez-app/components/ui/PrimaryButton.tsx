/**
 * PrimaryButton - LEGACY SHIM
 *
 * Canonical button component: @/components/ui/Button
 * This file re-exports Button with variant="primary" preset.
 * New code should use <Button variant="primary" ... /> directly.
 *
 * Canonical color source: @/constants/theme — import from there
 */

import React from 'react';
import Button from './Button';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;

// Re-export the original Button type alias so existing imports keep working
export type PrimaryButtonProps = ButtonProps;

/**
 * PrimaryButton wraps Button with variant="primary" preset.
 * All props are forwarded unchanged; variant defaults to "primary".
 */
const PrimaryButton: React.FC<ButtonProps> = (props) => (
  <Button variant="primary" {...props} />
);

export default React.memo(PrimaryButton);
