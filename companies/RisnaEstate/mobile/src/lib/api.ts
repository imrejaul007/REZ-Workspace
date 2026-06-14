// RisnaEstate Mobile API Client

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000'; // Update for production

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user } = response.data.data;
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    return { token, user };
  },

  register: async (data: { name: string; email: string; phone: string; password: string }) => {
    const response = await api.post('/api/auth/register', data);
    const { token, user } = response.data.data;
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    return { token, user };
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user');
  },

  getUser: async () => {
    const userStr = await SecureStore.getItemAsync('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('auth_token');
  },
};

// Property API
export const propertyApi = {
  search: async (params?: Record<string, any>) => {
    const response = await api.get('/api/v1/properties', { params });
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/v1/properties/${id}`);
    return response.data.data;
  },

  getFeatured: async () => {
    const response = await api.get('/api/v1/properties/featured');
    return response.data.data;
  },
};

// Lead API
export const leadApi = {
  create: async (data: any) => {
    const response = await api.post('/api/v1/leads', data);
    return response.data.data;
  },

  getHot: async () => {
    const response = await api.get('/api/v1/leads/hot');
    return response.data.data;
  },
};

// Visa API
export const visaApi = {
  checkEligibility: async (data: any) => {
    const response = await api.post('/api/v1/visa/eligibility', data);
    return response.data.data;
  },

  getPrograms: async () => {
    const response = await api.get('/api/v1/visa/programs');
    return response.data.data;
  },
};

// CRM API
export const crmApi = {
  getFollowUps: async (brokerId: string) => {
    const response = await api.get('/api/v1/crm/follow-ups', { params: { brokerId } });
    return response.data.data;
  },

  createFollowUp: async (data: any) => {
    const response = await api.post('/api/v1/crm/follow-ups', data);
    return response.data.data;
  },

  getSiteVisits: async (params: any) => {
    const response = await api.get('/api/v1/crm/site-visits', { params });
    return response.data.data;
  },
};

export default api;
