/**
 * Dashboard formatters — lifted out of app/(dashboard)/index.tsx during the
 * Sprint -1a dashboard split. Previously these were closures inside
 * DashboardScreen() captured by ~7 inline card bodies; extracting to a
 * shared util unblocks those cards to live in their own files without
 * each one redeclaring the helper or importing it from a deep path.
 *
 * All three are pure — safe to import from anywhere, safe to call in
 * render bodies.
 */

/** Indian currency, 0 decimal places. `formatCurrency(1234.56)` → `"₹1,235"`. */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '₹0';
  const rounded = Math.round(value);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

/** Percentage with 1 decimal. `formatPercentage(42.347)` → `"42.3%"`. */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

/** Generic integer formatter with Indian locale thousands separators. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return Math.round(value).toLocaleString('en-IN');
}

/** Compact notation for big counters (e.g. 12,345 → "12.3K"). */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}
