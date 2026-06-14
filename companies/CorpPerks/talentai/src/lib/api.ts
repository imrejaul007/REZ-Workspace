/**
 * API Client for TalentAI Platform
 */

const API_BASE = process.env.NEXT_PUBLIC_TALENT_API || 'https://api.talentai.rezapp.com';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
      return { success: false, error: data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// ─── Auth ────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'candidate' | 'employer';
  company?: string;
}) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyOTP(email: string, otp: string) {
  return apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function sendOTP(phone: string) {
  return apiRequest('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

// ─── Jobs ────────────────────────────────────────────────────

export async function getJobs(filters?: {
  type?: string;
  city?: string;
  remote?: boolean;
  skills?: string[];
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.city) params.set('city', filters.city);
  if (filters?.remote) params.set('remote', 'true');
  if (filters?.search) params.set('search', filters.search);
  if (filters?.skills?.length) params.set('skills', filters.skills.join(','));

  return apiRequest(`/jobs?${params}`);
}

export async function getJob(id: string) {
  return apiRequest(`/jobs/${id}`);
}

export async function createJob(data: Partial<{
  title: string;
  description: string;
  skills: string[];
  type: string;
  location: { city: string; remote: boolean; hybrid: boolean };
  salary: { min: number; max: number; period: string };
}>) {
  return apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Applications ────────────────────────────────────────────

export async function applyForJob(jobId: string, coverLetter?: string) {
  return apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify({ jobId, coverLetter }),
  });
}

export async function getMyApplications() {
  return apiRequest('/applications/me');
}

export async function getApplicationStatus(applicationId: string) {
  return apiRequest(`/applications/${applicationId}`);
}

// ─── Profile ─────────────────────────────────────────────────

export async function getProfile() {
  return apiRequest('/profile');
}

export async function updateProfile(data: {
  name?: string;
  title?: string;
  summary?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
}) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('resume', file);

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/profile/resume`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  return response.json();
}

// ─── Employers ────────────────────────────────────────────────

export async function getEmployerJobs() {
  return apiRequest('/employer/jobs');
}

export async function getEmployerCandidates(jobId?: string) {
  const params = jobId ? `?jobId=${jobId}` : '';
  return apiRequest(`/employer/candidates${params}`);
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  return apiRequest(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ─── Messaging ───────────────────────────────────────────────

export async function getConversations() {
  return apiRequest('/messages/conversations');
}

export async function getMessages(userId: string) {
  return apiRequest(`/messages/${userId}`);
}

export async function sendMessage(receiverId: string, content: string) {
  return apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content }),
  });
}

// ─── Insights ────────────────────────────────────────────────

export async function getMarketInsights() {
  return apiRequest('/insights/market');
}

export async function getSalaryData(role?: string) {
  const params = role ? `?role=${role}` : '';
  return apiRequest(`/insights/salary${params}`);
}

export async function getSkillDemand() {
  return apiRequest('/insights/skills');
}
