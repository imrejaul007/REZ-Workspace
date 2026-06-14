/**
 * API Client Service
 * Real API connections for all apps
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://rez-auth-service.onrender.com';

// ─── API Response Types ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Fetch Wrapper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'API Error' };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  login: (phone: string) =>
    apiFetch<{ userId: string; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (userId: string, otp: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    }),

  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
};

// ─── Employee API ──────────────────────────────────────────────────────────────

export const employeeApi = {
  list: () => apiFetch<Employee[]>('/api/employees'),

  get: (id: string) => apiFetch<Employee>(`/api/employees/${id}`),

  create: (data: Partial<Employee>) =>
    apiFetch<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Employee>) =>
    apiFetch<Employee>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Attendance API ──────────────────────────────────────────────────────────────

export const attendanceApi = {
  checkIn: (data: { locationId: string; lat: number; lng: number }) =>
    apiFetch<AttendanceRecord>('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkOut: (data: { attendanceId: string }) =>
    apiFetch<AttendanceRecord>('/api/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  history: (employeeId: string) =>
    apiFetch<AttendanceRecord[]>(`/api/attendance/history/${employeeId}`),

  today: (employeeId: string) =>
    apiFetch<AttendanceRecord>(`/api/attendance/today/${employeeId}`),
};

// ─── Jobs API ──────────────────────────────────────────────────────────────

export const jobsApi = {
  list: (params?: { search?: string; location?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<Job[]>(`/api/jobs?${query}`);
  },

  get: (id: string) => apiFetch<Job>(`/api/jobs/${id}`),

  apply: (jobId: string, data: { resumeUrl?: string; coverLetter?: string }) =>
    apiFetch<Application>(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  myApplications: () => apiFetch<Application[]>('/api/jobs/my-applications'),
};

// ─── Employer API ──────────────────────────────────────────────────────────────

export const employerApi = {
  dashboard: () => apiFetch<EmployerDashboard>('/api/employer/dashboard'),

  postJob: (data: Partial<Job>) =>
    apiFetch<Job>('/api/employer/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  candidates: () => apiFetch<Candidate[]>('/api/employer/candidates'),

  applications: (jobId?: string) =>
    apiFetch<Application[]>(`/api/employer/applications${jobId ? `?jobId=${jobId}` : ''}`),

  updateStatus: (applicationId: string, status: string) =>
    apiFetch(`/api/employer/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ─── Onboarding API ──────────────────────────────────────────────────────────────

export const onboardingApi = {
  getTasks: (employeeId: string) =>
    apiFetch<OnboardingTask[]>(`/api/onboarding/tasks/${employeeId}`),

  completeTask: (taskId: string) =>
    apiFetch<OnboardingTask>(`/api/onboarding/tasks/${taskId}/complete`, {
      method: 'POST',
    }),

  uploadDocument: (taskId: string, document: File) => {
    const formData = new FormData();
    formData.append('document', document);
    return fetch(`${API_BASE}/api/onboarding/tasks/${taskId}/document`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    }).then(r => r.json());
  },
};

// ─── Assessment API ──────────────────────────────────────────────────────────────

export const assessmentApi = {
  list: (category?: string) =>
    apiFetch<Assessment[]>(`/api/assessments${category ? `?category=${category}` : ''}`),

  get: (id: string) => apiFetch<Assessment>(`/api/assessments/${id}`),

  submit: (assessmentId: string, answers: Record<string, string>) =>
    apiFetch<AssessmentResult>(`/api/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  myResults: () => apiFetch<AssessmentResult[]>('/api/assessments/my-results'),
};

// ─── Notifications API ──────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => apiFetch<Notification[]>(`/api/notifications`),

  markRead: (id: string) =>
    apiFetch(`/api/notifications/${id}/read`, { method: 'POST' }),

  markAllRead: () =>
    apiFetch('/api/notifications/read-all', { method: 'POST' }),

  subscribe: (subscription: PushSubscriptionJSON) =>
    apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    }),
};

// ─── Types ──────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'probation';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  locationId: string;
  type: 'clock_in' | 'clock_out';
  timestamp: string;
  status: 'present' | 'outside' | 'late';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  skills: string[];
  matchScore?: number;
  karmaMatch?: number;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  appliedAt: string;
}

export interface EmployerDashboard {
  activeJobs: number;
  totalApplications: number;
  pendingReviews: number;
  interviewsScheduled: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: string[];
  matchScore: number;
  karmaLevel: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'task' | 'training' | 'signature';
  status: 'pending' | 'completed';
  dueDate: string;
}

export interface Assessment {
  id: string;
  title: string;
  category: string;
  questions: Question[];
  timeLimit?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'code';
  options?: string[];
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}
