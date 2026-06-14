import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { AuditLogFilters, AuditSeverity, AuditAction, AuditResourceType } from '@/types/audit';

type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';

interface AuditFilterContextValue {
  filters: AuditLogFilters;
  dateRangePreset: DateRangePreset;
  activeFilterCount: number;
  updateFilters: (updates: Partial<AuditLogFilters>) => void;
  setDateRangePreset: (preset: DateRangePreset) => void;
  setSeverities: (severities: AuditSeverity[]) => void;
  setActions: (actions: AuditAction[]) => void;
  setResourceTypes: (types: AuditResourceType[]) => void;
  setSearch: (search: string) => void;
  setIpAddress: (ip: string) => void;
  resetFilters: () => void;
  applyFilters: () => AuditLogFilters;
}

const defaultFilters: AuditLogFilters = {
  page: 1,
  limit: 20,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

const defaultContextValue: AuditFilterContextValue = {
  filters: defaultFilters,
  dateRangePreset: 'last_7_days',
  activeFilterCount: 0,
  updateFilters: () => {},
  setDateRangePreset: () => {},
  setSeverities: () => {},
  setActions: () => {},
  setResourceTypes: () => {},
  setSearch: () => {},
  setIpAddress: () => {},
  resetFilters: () => {},
  applyFilters: () => defaultFilters,
};

const AuditFilterContext = createContext<AuditFilterContextValue>(defaultContextValue);

/**
 * Calculate date range based on preset
 */
function getDateRangeFromPreset(preset: DateRangePreset): { fromDate?: string; toDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return {
        fromDate: today.toISOString(),
        toDate: endOfDay.toISOString(),
      };
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return {
        fromDate: yesterday.toISOString(),
        toDate: endOfYesterday.toISOString(),
      };
    }
    case 'last_7_days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        fromDate: sevenDaysAgo.toISOString(),
        toDate: now.toISOString(),
      };
    }
    case 'last_30_days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        fromDate: thirtyDaysAgo.toISOString(),
        toDate: now.toISOString(),
      };
    }
    case 'last_90_days': {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return {
        fromDate: ninetyDaysAgo.toISOString(),
        toDate: now.toISOString(),
      };
    }
    case 'custom':
    default:
      return {};
  }
}

/**
 * Count active filters (excluding pagination and sorting defaults)
 */
function countActiveFilters(filters: AuditLogFilters, dateRangePreset: DateRangePreset): number {
  let count = 0;

  // Count severity filters
  if (filters.severity) {
    const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity];
    if (severities.length > 0) count++;
  }

  // Count action filters
  if (filters.action) {
    const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
    if (actions.length > 0) count++;
  }

  // Count resource type filters
  if (filters.resourceType) {
    const types = Array.isArray(filters.resourceType)
      ? filters.resourceType
      : [filters.resourceType];
    if (types.length > 0) count++;
  }

  // Count search filter
  if (filters.search && filters.search.trim() !== '') count++;

  // Count IP address filter
  if (filters.ipAddress && filters.ipAddress.trim() !== '') count++;

  // Count user ID filter
  if (filters.userId) count++;

  // Count resource ID filter
  if (filters.resourceId) count++;

  // Count date range (preset or custom dates)
  if (dateRangePreset !== 'custom' || filters.fromDate || filters.toDate) {
    if (dateRangePreset !== 'custom' || (filters.fromDate && filters.toDate)) {
      count++;
    }
  }

  return count;
}

export function AuditFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<AuditLogFilters>(defaultFilters);
  const [dateRangePreset, setDateRangePresetState] = useState<DateRangePreset>('last_7_days');

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return countActiveFilters(filters, dateRangePreset);
  }, [filters, dateRangePreset]);

  // Update filters with partial updates
  const updateFilters = useCallback((updates: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 when filters change (except when explicitly setting page)
      page: updates.page !== undefined ? updates.page : 1,
    }));
  }, []);

  // Set date range preset and update date filters accordingly
  const setDateRangePreset = useCallback((preset: DateRangePreset) => {
    setDateRangePresetState(preset);

    if (preset !== 'custom') {
      const dateRange = getDateRangeFromPreset(preset);
      setFilters((prev) => ({
        ...prev,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        dateRange: preset,
        page: 1, // Reset to page 1 when date range changes
      }));
    }
  }, []);

  // Set severity filters
  const setSeverities = useCallback((severities: AuditSeverity[]) => {
    setFilters((prev) => ({
      ...prev,
      severity: severities.length > 0 ? severities : undefined,
      page: 1,
    }));
  }, []);

  // Set action filters
  const setActions = useCallback((actions: AuditAction[]) => {
    setFilters((prev) => ({
      ...prev,
      action: actions.length > 0 ? actions : undefined,
      page: 1,
    }));
  }, []);

  // Set resource type filters
  const setResourceTypes = useCallback((types: AuditResourceType[]) => {
    setFilters((prev) => ({
      ...prev,
      resourceType: types.length > 0 ? types : undefined,
      page: 1,
    }));
  }, []);

  // Set search filter
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({
      ...prev,
      search: search.trim() || undefined,
      page: 1,
    }));
  }, []);

  // Set IP address filter
  const setIpAddress = useCallback((ip: string) => {
    setFilters((prev) => ({
      ...prev,
      ipAddress: ip.trim() || undefined,
      page: 1,
    }));
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setDateRangePresetState('last_7_days');
  }, []);

  // Apply filters and return the complete filter object
  const applyFilters = useCallback((): AuditLogFilters => {
    // If not using custom dates, apply the preset date range
    if (dateRangePreset !== 'custom') {
      const dateRange = getDateRangeFromPreset(dateRangePreset);
      return {
        ...filters,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        dateRange: dateRangePreset,
      };
    }

    return { ...filters };
  }, [filters, dateRangePreset]);

  const value: AuditFilterContextValue = useMemo(
    () => ({
      filters,
      dateRangePreset,
      activeFilterCount,
      updateFilters,
      setDateRangePreset,
      setSeverities,
      setActions,
      setResourceTypes,
      setSearch,
      setIpAddress,
      resetFilters,
      applyFilters,
    }),
    [
      filters,
      dateRangePreset,
      activeFilterCount,
      updateFilters,
      setDateRangePreset,
      setSeverities,
      setActions,
      setResourceTypes,
      setSearch,
      setIpAddress,
      resetFilters,
      applyFilters,
    ]
  );

  return <AuditFilterContext.Provider value={value}>{children}</AuditFilterContext.Provider>;
}

export function useAuditFilters() {
  return useContext(AuditFilterContext);
}
