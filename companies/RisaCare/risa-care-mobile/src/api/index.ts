// RisaCare Mobile - API Client

import axios from 'axios';

const API_BASE_URL = 'http://localhost:4700/health/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const recordsApi = {
  upload: async (formData: FormData) => {
    return api.post('/records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  list: async (params?: Record<string, any>) => {
    return api.get('/records', { params });
  },
  get: async (id: string) => {
    return api.get(`/records/${id}`);
  },
  delete: async (id: string) => {
    return api.delete(`/records/${id}`);
  },
  timeline: async (params?: Record<string, any>) => {
    return api.get('/records/timeline', { params });
  },
  biomarkerHistory: async (name: string, params?: Record<string, any>) => {
    return api.get(`/records/biomarker/${name}`, { params });
  }
};

export const aiApi = {
  interpret: async (data: { recordId: string; profileId: string }) => {
    return api.post('/ai/interpret', data);
  },
  symptoms: async (data: { profileId: string; symptoms: string[] }) => {
    return api.post('/ai/symptoms', data);
  },
  copilot: async (data: { message: string; profileId: string; sessionId?: string }) => {
    return api.post('/ai/copilot', data);
  },
  trends: async (biomarkerName: string, params?: Record<string, any>) => {
    return api.get(`/ai/trends/${biomarkerName}`, { params });
  }
};

export const profileApi = {
  get: async () => {
    return api.get('/profile');
  },
  update: async (data: Record<string, any>) => {
    return api.put('/profile', data);
  },
  addFamily: async (data: Record<string, any>) => {
    return api.post('/profile/family', data);
  },
  updateHealth: async (profileId: string, data: Record<string, any>) => {
    return api.put(`/profile/${profileId}/health`, data);
  }
};

export const bookingApi = {
  searchDoctors: async (params?: Record<string, any>) => {
    return api.get('/booking/doctors', { params });
  },
  getDoctor: async (id: string) => {
    return api.get(`/booking/doctors/${id}`);
  },
  getSlots: async (doctorId: string, params?: Record<string, any>) => {
    return api.get(`/booking/doctors/${doctorId}/slots`, { params });
  },
  book: async (data: Record<string, any>) => {
    return api.post('/booking/appointments', data);
  },
  listAppointments: async (params?: Record<string, any>) => {
    return api.get('/booking/appointments', { params });
  },
  cancel: async (id: string, reason?: string) => {
    return api.delete(`/booking/appointments/${id}`, { data: { reason } });
  }
};

export const marketplaceApi = {
  searchLabs: async (params?: Record<string, any>) => {
    return api.get('/marketplace/labs', { params });
  },
  searchTests: async (params?: Record<string, any>) => {
    return api.get('/marketplace/tests', { params });
  },
  createOrder: async (data: Record<string, any>) => {
    return api.post('/marketplace/orders', data);
  },
  listOrders: async (params?: Record<string, any>) => {
    return api.get('/marketplace/orders', { params });
  }
};

export const wellnessApi = {
  getCycle: async (params?: Record<string, any>) => {
    return api.get('/wellness/cycle', { params });
  },
  logCycle: async (data: Record<string, any>) => {
    return api.post('/wellness/cycle', data);
  },
  getHabits: async (params?: Record<string, any>) => {
    return api.get('/wellness/habits', { params });
  },
  logHabit: async (data: Record<string, any>) => {
    return api.post('/wellness/habits', data);
  },
  getChallenges: async (params?: Record<string, any>) => {
    return api.get('/wellness/challenges', { params });
  },
  joinChallenge: async (id: string, data?: Record<string, any>) => {
    return api.post(`/wellness/challenges/${id}/join`, data);
  },
  getScore: async (params?: Record<string, any>) => {
    return api.get('/wellness/score', { params });
  }
};

export const corporateApi = {
  get: async (id: string) => {
    return api.get(`/corporate/corporates/${id}`);
  },
  listEmployees: async (id: string, params?: Record<string, any>) => {
    return api.get(`/corporate/corporates/${id}/employees`, { params });
  },
  enroll: async (corporateId: string, data: Record<string, any>) => {
    return api.post(`/corporate/corporates/${corporateId}/enroll`, data);
  }
};

export default api;
