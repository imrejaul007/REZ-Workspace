import { useState, useEffect, useCallback } from 'react';
import { Staff, Shift, Attendance, Performance, ShiftSwap, DashboardStats, StaffRole, StaffStatus } from '../types';
import { staffApi, shiftApi, attendanceApi, performanceApi, swapApi, dashboardApi } from '../services/api';

// Generic fetch hook
function useFetch<T>(fetchFn: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, setData, loading, error, refetch: fetch };
}

// Staff hooks
export function useStaff() {
  return useFetch<Staff[]>(() => staffApi.getAll(), []);
}

export function useStaffById(id: string | undefined) {
  return useFetch<Staff | undefined>(() => staffApi.getById(id!), [id]);
}

export function useFilteredStaff(filters: { role?: StaffRole; status?: StaffStatus; search?: string }) {
  return useFetch<Staff[]>(() => staffApi.filter(filters), [filters.role, filters.status, filters.search]);
}

// Shift hooks
export function useShifts() {
  return useFetch<Shift[]>(() => shiftApi.getAll(), []);
}

export function useShiftsByDate(date: string) {
  return useFetch<Shift[]>(() => shiftApi.getByDate(date), [date]);
}

export function useShiftsByStaff(staffId: string) {
  return useFetch<Shift[]>(() => shiftApi.getByStaff(staffId), [staffId]);
}

// Attendance hooks
export function useAttendance() {
  return useFetch<Attendance[]>(() => attendanceApi.getAll(), []);
}

export function useTodayAttendance() {
  const today = new Date().toISOString().split('T')[0];
  return useFetch<Attendance[]>(() => attendanceApi.getByDate(today), [today]);
}

export function useAttendanceByStaff(staffId: string) {
  return useFetch<Attendance[]>(() => attendanceApi.getByStaff(staffId), [staffId]);
}

// Performance hooks
export function usePerformance() {
  return useFetch<Performance[]>(() => performanceApi.getAll(), []);
}

export function usePerformanceByStaff(staffId: string) {
  return useFetch<Performance | undefined>(() => performanceApi.getByStaff(staffId), [staffId]);
}

export function useLeaderboard(limit: number = 10) {
  return useFetch<Performance[]>(() => performanceApi.getLeaderboard(limit), [limit]);
}

// Shift Swap hooks
export function useSwapRequests() {
  return useFetch<ShiftSwap[]>(() => swapApi.getAll(), []);
}

export function usePendingSwaps() {
  return useFetch<ShiftSwap[]>(() => swapApi.getPending(), []);
}

// Dashboard hooks
export function useDashboardStats() {
  return useFetch<DashboardStats>(() => dashboardApi.getStats(), []);
}

// Mutation hooks
export function useStaffMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Omit<Staff, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      return await staffApi.create(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Staff>) => {
    try {
      setLoading(true);
      setError(null);
      return await staffApi.update(id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await staffApi.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, update, remove, loading, error };
}

export function useShiftMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Omit<Shift, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      return await shiftApi.create(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Shift>) => {
    try {
      setLoading(true);
      setError(null);
      return await shiftApi.update(id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assign = useCallback(async (staffId: string, shiftId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await shiftApi.assign(staffId, shiftId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, update, assign, loading, error };
}

export function useAttendanceMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIn = useCallback(async (staffId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await attendanceApi.checkIn(staffId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkOut = useCallback(async (staffId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await attendanceApi.checkOut(staffId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkIn, checkOut, loading, error };
}

export function useSwapMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Omit<ShiftSwap, 'id' | 'status' | 'createdAt'>) => {
    try {
      setLoading(true);
      setError(null);
      return await swapApi.create(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await swapApi.respond(id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await swapApi.respond(id, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, approve, reject, loading, error };
}
