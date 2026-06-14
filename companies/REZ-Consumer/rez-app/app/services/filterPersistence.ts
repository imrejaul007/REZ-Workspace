/**
 * Filter Persistence Utility
 * Stub implementation for missing module
 */

export interface FilterState {
  [key: string]: unknown;
}

export function saveFilterState(key: string, state: FilterState): void {
  try {
    localStorage?.setItem(`filter_${key}`, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function loadFilterState(key: string): FilterState | null {
  try {
    const data = localStorage?.getItem(`filter_${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearFilterState(key: string): void {
  try {
    localStorage?.removeItem(`filter_${key}`);
  } catch {
    // Ignore storage errors
  }
}

export function getActiveFilterCount(filters: FilterState): number {
  return Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length;
}
