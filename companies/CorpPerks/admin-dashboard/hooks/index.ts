import { logger } from '../../shared/logger';
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Employee, EmployeeFilters, PaginatedResponse } from '@/types';
import { employees as mockEmployees } from '@/lib/mock-data';
import { debounce } from '@/lib/utils';

interface UseEmployeesOptions {
  initialFilters?: EmployeeFilters;
  pageSize?: number;
}

interface UseEmployeesReturn {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  filters: EmployeeFilters;
  setFilters: (filters: EmployeeFilters) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setPage: (page: number) => void;
  refresh: () => void;
}

export function useEmployees({
  initialFilters = {},
  pageSize = 10,
}: UseEmployeesOptions = {}): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EmployeeFilters>(initialFilters);
  const [page, setPageState] = useState(1);

  // Simulate API call
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filtered = [...mockEmployees];

      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.firstName.toLowerCase().includes(search) ||
            e.lastName.toLowerCase().includes(search) ||
            e.email.toLowerCase().includes(search) ||
            e.employeeId.toLowerCase().includes(search)
        );
      }

      if (filters.department) {
        filtered = filtered.filter(
          (e) => e.department.id === filters.department
        );
      }

      if (filters.status) {
        filtered = filtered.filter((e) => e.status === filters.status);
      }

      if (filters.employmentType) {
        filtered = filtered.filter(
          (e) => e.employmentType === filters.employmentType
        );
      }

      if (filters.location) {
        filtered = filtered.filter(
          (e) => e.location.toLowerCase() === filters.location!.toLowerCase()
        );
      }

      // Pagination
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedEmployees = filtered.slice(
        startIndex,
        startIndex + pageSize
      );

      setEmployees(paginatedEmployees);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const setFilters = useCallback((newFilters: EmployeeFilters) => {
    setFiltersState(newFilters);
    setPageState(1);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const refresh = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    filters,
    setFilters,
    pagination: {
      page,
      limit: pageSize,
      total: mockEmployees.length,
      totalPages: Math.ceil(mockEmployees.length / pageSize),
    },
    setPage,
    refresh,
  };
}

// Debounced search hook
export function useDebouncedSearch(
  onSearch: (query: string) => void,
  delay: number = 300
) {
  const [value, setValue] = useState('');

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, delay),
    [onSearch, delay]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  return { value, handleChange };
}

// Local storage hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Breakpoints
export function useBreakpoints() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return { isMobile, isTablet, isDesktop };
}
