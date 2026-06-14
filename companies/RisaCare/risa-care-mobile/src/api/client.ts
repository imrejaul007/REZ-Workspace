// RisaCare Mobile - API Client

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4700';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth
export interface AuthResponse {
  token: string;
  userId: string;
  expiresAt: string;
}

// Health Records
export interface HealthRecord {
  id: string;
  profileId: string;
  type: string;
  title: string;
  description?: string;
  fileUrl: string;
  extractedData?: {
    biomarkers: Biomarker[];
    date: string;
    doctorName?: string;
    hospitalName?: string;
  };
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Biomarker {
  name: string;
  value: string | number;
  unit?: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'borderline';
  referenceRange?: { min?: number; max?: number; text?: string };
}

// Medications
export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  purpose?: string;
  prescribedBy?: string;
  isActive: boolean;
  remainingPills?: number;
}

// Pregnancy
export interface PregnancyRecord {
  id: string;
  profileId: string;
  status: 'trying' | 'pregnant' | 'postpartum';
  dueDate?: string;
  currentWeek?: number;
  trimester?: 'first' | 'second' | 'third';
  checkups: Checkup[];
}

export interface Checkup {
  id: string;
  week: number;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'completed' | 'missed';
  doctorName?: string;
}

// Vaccination
export interface VaccineRecord {
  id: string;
  profileId: string;
  childName: string;
  dateOfBirth: string;
  vaccines: Vaccine[];
}

export interface Vaccine {
  id: string;
  vaccineType: string;
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'due' | 'overdue' | 'completed';
}

// Appointments
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualifications: string[];
  hospital: string;
  fees: number;
  rating: number;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

// Wellness
export interface WellnessEntry {
  id: string;
  profileId: string;
  type: 'cycle' | 'habit' | 'challenge';
  date: string;
  data: Record<string, unknown>;
}

// Profile
export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
}

// Health Score
export interface HealthScore {
  overall: number;
  grade: string;
  categories: {
    name: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
      (headers as Record<string, string>)['X-User-ID'] = 'current_user';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An error occurred',
      }));
      throw new Error(error.message || error.code || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(phone: string, otp: string): Promise<AuthResponse> {
    const response = await this.request<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    if (response.success && response.data) {
      this.setToken(response.data.token);
      return response.data;
    }
    throw new Error(response.error?.message || 'Login failed');
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  // Health Records
  async getRecords(profileId?: string): Promise<HealthRecord[]> {
    const endpoint = profileId ? `/records?profileId=${profileId}` : '/records';
    const response = await this.request<ApiResponse<HealthRecord[]>>(endpoint);
    return response.data || [];
  }

  async getRecord(recordId: string): Promise<HealthRecord | null> {
    const response = await this.request<ApiResponse<HealthRecord>>(`/records/${recordId}`);
    return response.data || null;
  }

  async uploadRecord(formData: FormData): Promise<HealthRecord> {
    const response = await fetch(`${this.baseUrl}/records/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error?.message || 'Upload failed');
  }

  // Medications
  async getMedications(profileId: string): Promise<Medication[]> {
    const response = await this.request<ApiResponse<Medication[]>>(`/wellness/medications?profileId=${profileId}`);
    return response.data || [];
  }

  async addMedication(medication: Partial<Medication>): Promise<Medication> {
    const response = await this.request<ApiResponse<Medication>>('/wellness/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
    if (response.data) return response.data;
    throw new Error(response.error?.message || 'Failed to add medication');
  }

  async markMedicationTaken(medicationId: string, doseIndex: number): Promise<void> {
    await this.request(`/wellness/medications/${medicationId}/take`, {
      method: 'POST',
      body: JSON.stringify({ doseIndex }),
    });
  }

  // Pregnancy
  async getPregnancy(profileId: string): Promise<PregnancyRecord | null> {
    const response = await this.request<ApiResponse<PregnancyRecord>>(`/wellness/pregnancy/${profileId}`);
    return response.data || null;
  }

  async startPregnancy(profileId: string, dueDate: string): Promise<PregnancyRecord> {
    const response = await this.request<ApiResponse<PregnancyRecord>>('/wellness/pregnancy', {
      method: 'POST',
      body: JSON.stringify({ profileId, dueDate, status: 'pregnant' }),
    });
    if (response.data) return response.data;
    throw new Error(response.error?.message || 'Failed to start pregnancy tracking');
  }

  async scheduleCheckup(pregnancyId: string, checkup: Partial<Checkup>): Promise<void> {
    await this.request(`/wellness/pregnancy/${pregnancyId}/checkup`, {
      method: 'POST',
      body: JSON.stringify(checkup),
    });
  }

  // Vaccination
  async getVaccinations(profileId: string): Promise<VaccineRecord[]> {
    const response = await this.request<ApiResponse<VaccineRecord[]>>(`/wellness/vaccination/child/${profileId}`);
    return response.data || [];
  }

  async addChildVaccination(child: { profileId: string; childName: string; dateOfBirth: string }): Promise<VaccineRecord> {
    const response = await this.request<ApiResponse<VaccineRecord>>('/wellness/vaccination/child', {
      method: 'POST',
      body: JSON.stringify(child),
    });
    if (response.data) return response.data;
    throw new Error(response.error?.message || 'Failed to add child');
  }

  async markVaccineComplete(vaccineRecordId: string, vaccineId: string): Promise<void> {
    await this.request(`/wellness/vaccination/child/${vaccineRecordId}/dose`, {
      method: 'POST',
      body: JSON.stringify({ vaccineId }),
    });
  }

  // Appointments
  async searchDoctors(specialization?: string, city?: string): Promise<Doctor[]> {
    const params = new URLSearchParams();
    if (specialization) params.append('specialization', specialization);
    if (city) params.append('city', city);
    const query = params.toString();
    const endpoint = `/booking/doctors${query ? `?${query}` : ''}`;
    const response = await this.request<ApiResponse<Doctor[]>>(endpoint);
    return response.data || [];
  }

  async getDoctorSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const response = await this.request<ApiResponse<{ slots: TimeSlot[] }>>(`/booking/doctors/${doctorId}/slots?date=${date}`);
    return response.data?.slots || [];
  }

  async bookAppointment(appointment: {
    doctorId: string;
    date: string;
    time: string;
    profileId: string;
  }): Promise<Appointment> {
    const response = await this.request<ApiResponse<Appointment>>('/booking/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    if (response.data) return response.data;
    throw new Error(response.error?.message || 'Booking failed');
  }

  async getAppointments(): Promise<Appointment[]> {
    const response = await this.request<ApiResponse<Appointment[]>>('/booking/appointments');
    return response.data || [];
  }

  // Wellness
  async getWellnessEntries(profileId: string, type?: string): Promise<WellnessEntry[]> {
    const endpoint = `/wellness/entries?profileId=${profileId}${type ? `&type=${type}` : ''}`;
    const response = await this.request<ApiResponse<WellnessEntry[]>>(endpoint);
    return response.data || [];
  }

  async logWellnessEntry(entry: Partial<WellnessEntry>): Promise<WellnessEntry> {
    const response = await this.request<ApiResponse<WellnessEntry>>('/wellness/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    if (response.data) return response.data;
    throw new Error(response.error?.message || 'Failed to log entry');
  }

  // Profile
  async getProfile(profileId: string): Promise<UserProfile | null> {
    const response = await this.request<ApiResponse<UserProfile>>(`/profile/${profileId}`);
    return response.data || null;
  }

  async updateProfile(profileId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.request<ApiResponse<UserProfile>>(`/profile/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.data) return response.data;
    throw new Error(response.error?.message || 'Failed to update profile');
  }

  // Health Score
  async getHealthScore(profileId: string): Promise<HealthScore | null> {
    const response = await this.request<ApiResponse<HealthScore>>(`/wellness/score?profileId=${profileId}`);
    return response.data || null;
  }

  // AI
  async interpretReport(recordId: string): Promise<unknown> {
    const response = await this.request<ApiResponse<unknown>>(`/ai/interpret`, {
      method: 'POST',
      body: JSON.stringify({ recordId }),
    });
    return response.data;
  }

  async assessSymptoms(symptoms: string[]): Promise<unknown> {
    const response = await this.request<ApiResponse<unknown>>('/ai/symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
