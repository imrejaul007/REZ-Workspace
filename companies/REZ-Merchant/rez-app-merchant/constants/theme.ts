/**
 * Merchant App Design Tokens
 *
 * Re-exports from @rez/brand-tokens and adds merchant-specific colors.
 *
 * Brand colours:
 *   Primary indigo: #6366f1 (indigo-500) — used for primary actions
 *   Brand purple:   #7C3AED (violet-700) — merchant app identity colour
 */

import { colors as brandColors, spacing as brandSpacing, borderRadius as brandRadius } from '@rez/brand-tokens';

// Re-export from canonical source
export const colors = {
  ...brandColors,
  // Merchant App Identity Colors
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  brandPurple: '#7C3AED',
  brandPurpleDark: '#4f46e5',
  // Override text colors for merchant context
  text: '#1f2937',
  textMuted: '#6b7280',
  // Merchant-specific status colors
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const spacing = brandSpacing;
export const Spacing = brandSpacing;
export const borderRadius = brandRadius;

// Re-export all brand tokens for convenience
export * from '@rez/brand-tokens';
