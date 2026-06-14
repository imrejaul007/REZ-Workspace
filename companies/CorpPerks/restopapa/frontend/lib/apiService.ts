import { api } from './api';

export const apiService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Jobs API
  getJobs: async (params: any = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  getJob: async (id: string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData: any) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Products API
  getProducts: async (params: any = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Orders API
  getOrders: async (params: any = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // User Profile API
  getUserProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateUserProfile: async (profileData: any) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};

export default apiService;