import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:4770';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export const MOBILE_API = {
  // Auth
  login: (data: { phone: string; password: string }) => api.post('/api/auth/login', data),
  register: (data: any) => api.post('/api/auth/register', data),

  // Profile
  getProfile: () => api.get('/api/profile'),
  updateProfile: (data: any) => api.patch('/api/profile', data),

  // Doctors
  getDoctors: (params?: { specialization?: string; search?: string }) =>
    api.get('/api/doctors', { params }),
  getDoctor: (id: string) => api.get(`/api/doctors/${id}`),

  // Appointments
  getAppointments: () => api.get('/api/appointments'),
  createAppointment: (data: any) => api.post('/api/appointments', data),
  updateAppointment: (id: string, data: any) => api.patch(`/api/appointments/${id}`, data),

  // Records
  getRecords: () => api.get('/api/records'),
  addRecord: (data: any) => api.post('/api/records', data),

  // Prescriptions
  getPrescriptions: () => api.get('/api/prescriptions'),

  // Notifications
  getNotifications: () => api.get('/api/notifications'),
};

export const TELEMEDICINE_API = {
  baseURL: process.env.TELEMEDICINE_URL || 'http://localhost:4773',
  getDoctors: () => axios.get(`${process.env.TELEMEDICINE_URL || 'http://localhost:4773'}/api/doctors`),
  getAvailability: (id: string, date: string) =>
    axios.get(`${process.env.TELEMEDICINE_URL || 'http://localhost:4773'}/api/doctors/${id}/availability`, { params: { date } }),
  bookConsultation: (data: any) =>
    axios.post(`${process.env.TELEMEDICINE_URL || 'http://localhost:4773'}/api/consultations`, data),
};

export const LAB_API = {
  baseURL: process.env.LAB_URL || 'http://localhost:4777',
  getTests: (params?: { category?: string; search?: string }) =>
    axios.get(`${process.env.LAB_URL || 'http://localhost:4777'}/api/tests`, { params }),
  getPackages: () => axios.get(`${process.env.LAB_URL || 'http://localhost:4777'}/api/tests/packages`),
  bookTest: (data: any) => axios.post(`${process.env.LAB_URL || 'http://localhost:4777'}/api/bookings`, data),
};

export const PHARMACY_API = {
  baseURL: process.env.PHARMACY_URL || 'http://localhost:4757',
  search: (query: string) =>
    axios.get(`${process.env.PHARMACY_URL || 'http://localhost:4757'}/api/medicines/search`, { params: { query } }),
  getCart: (userId: string) =>
    axios.get(`${process.env.PHARMACY_URL || 'http://localhost:4757'}/api/cart/${userId}`),
  addToCart: (userId: string, item: any) =>
    axios.post(`${process.env.PHARMACY_URL || 'http://localhost:4757'}/api/cart/${userId}/items`, item),
  placeOrder: (data: any) => axios.post(`${process.env.PHARMACY_URL || 'http://localhost:4757'}/api/orders`, data),
};

export const WALLET_API = {
  baseURL: process.env.WALLET_URL || 'http://localhost:4781',
  getWallet: (userId: string) =>
    axios.get(`${process.env.WALLET_URL || 'http://localhost:4781'}/api/wallet/${userId}`),
  addBalance: (userId: string, amount: number) =>
    axios.post(`${process.env.WALLET_URL || 'http://localhost:4781'}/api/wallet/${userId}/add`, { amount }),
};

export const EMR_API = {
  baseURL: process.env.EMR_URL || 'http://localhost:4778',
  getPatient: (id: string) => axios.get(`${process.env.EMR_URL || 'http://localhost:4778'}/api/patients/${id}`),
  getSummary: (id: string) => axios.get(`${process.env.EMR_URL || 'http://localhost:4778'}/api/patients/${id}/summary`),
};

export default api;
