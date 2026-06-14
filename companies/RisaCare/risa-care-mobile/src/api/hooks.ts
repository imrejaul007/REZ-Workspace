// RisaCare Mobile - API Hooks for React

import { useState, useEffect, useCallback } from 'react';
import apiClient, {
  HealthRecord,
  Medication,
  PregnancyRecord,
  VaccineRecord,
  Doctor,
  Appointment,
  WellnessEntry,
  UserProfile,
  HealthScore,
} from './client';

// Generic fetch hook
export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Records Hook
export function useRecords(profileId?: string) {
  return useApi<HealthRecord[]>(
    () => apiClient.getRecords(profileId),
    [profileId]
  );
}

export function useRecord(recordId: string) {
  return useApi<HealthRecord | null>(
    () => apiClient.getRecord(recordId),
    [recordId]
  );
}

// Medications Hook
export function useMedications(profileId: string) {
  return useApi<Medication[]>(
    () => apiClient.getMedications(profileId),
    [profileId]
  );
}

// Pregnancy Hook
export function usePregnancy(profileId: string) {
  return useApi<PregnancyRecord | null>(
    () => apiClient.getPregnancy(profileId),
    [profileId]
  );
}

// Vaccination Hook
export function useVaccinations(profileId: string) {
  return useApi<VaccineRecord[]>(
    () => apiClient.getVaccinations(profileId),
    [profileId]
  );
}

// Doctors Hook
export function useDoctors(specialization?: string, city?: string) {
  return useApi<Doctor[]>(
    () => apiClient.searchDoctors(specialization, city),
    [specialization, city]
  );
}

// Appointments Hook
export function useAppointments() {
  return useApi<Appointment[]>(() => apiClient.getAppointments(), []);
}

// Wellness Hook
export function useWellness(profileId: string, type?: string) {
  return useApi<WellnessEntry[]>(
    () => apiClient.getWellnessEntries(profileId, type),
    [profileId, type]
  );
}

// Profile Hook
export function useProfile(profileId: string) {
  return useApi<UserProfile | null>(
    () => apiClient.getProfile(profileId),
    [profileId]
  );
}

// Health Score Hook
export function useHealthScore(profileId: string) {
  return useApi<HealthScore | null>(
    () => apiClient.getHealthScore(profileId),
    [profileId]
  );
}

// Mutation Hook (for POST/PUT/DELETE)
export function useMutation<T, V>(
  mutationFn: (data: V) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(
    async (variables: V) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, loading, error, data };
}

// Medication Mutations
export function useAddMedication() {
  return useMutation<Medication, Partial<Medication>>((data) =>
    apiClient.addMedication(data)
  );
}

export function useMarkMedicationTaken() {
  return useMutation<void, { medicationId: string; doseIndex: number }>(
    ({ medicationId, doseIndex }) =>
      apiClient.markMedicationTaken(medicationId, doseIndex)
  );
}

// Pregnancy Mutations
export function useStartPregnancy() {
  return useMutation<PregnancyRecord, { profileId: string; dueDate: string }>(
    ({ profileId, dueDate }) => apiClient.startPregnancy(profileId, dueDate)
  );
}

export function useScheduleCheckup() {
  return useMutation<void, { pregnancyId: string; checkup: unknown }>(
    ({ pregnancyId, checkup }) =>
      apiClient.scheduleCheckup(pregnancyId, checkup as Parameters<typeof apiClient.scheduleCheckup>[1])
  );
}

// Vaccination Mutations
export function useAddChild() {
  return useMutation<
    VaccineRecord,
    { profileId: string; childName: string; dateOfBirth: string }
  >(({ profileId, childName, dateOfBirth }) =>
    apiClient.addChildVaccination({ profileId, childName, dateOfBirth })
  );
}

export function useMarkVaccineComplete() {
  return useMutation<void, { vaccineRecordId: string; vaccineId: string }>(
    ({ vaccineRecordId, vaccineId }) =>
      apiClient.markVaccineComplete(vaccineRecordId, vaccineId)
  );
}

// Appointment Mutations
export function useBookAppointment() {
  return useMutation<
    Appointment,
    { doctorId: string; date: string; time: string; profileId: string }
  >(({ doctorId, date, time, profileId }) =>
    apiClient.bookAppointment({ doctorId, date, time, profileId })
  );
}

// Wellness Mutations
export function useLogWellness() {
  return useMutation<WellnessEntry, Partial<WellnessEntry>>((data) =>
    apiClient.logWellnessEntry(data)
  );
}

// Profile Mutations
export function useUpdateProfile() {
  return useMutation<UserProfile, { profileId: string; data: Partial<UserProfile> }>(
    ({ profileId, data }) => apiClient.updateProfile(profileId, data)
  );
}

// Upload Hook with progress
export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress for now
      setProgress(30);
      const result = await apiClient.uploadRecord(formData);
      setProgress(100);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, progress, loading, error };
}

// Auth Hook
export function useAuth() {
  const [user, setUser] = useState<{ token: string; userId: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (phone: string, otp: string) => {
    setLoading(true);
    try {
      const result = await apiClient.login(phone, otp);
      setUser({ token: result.token, userId: result.userId });
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    apiClient.clearToken();
  }, []);

  return { user, loading, login, logout, isAuthenticated: !!user };
}
