/**
 * Staff Service Adapter
 * Connects to rez-staff-service
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const staffClient = axios.create({
  baseURL: SERVICE_URLS.STAFF_SERVICE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const staffService = {
  // Staff CRUD
  createStaff: async (data) => {
    const response = await staffClient.post('/api/staff', data);
    return response.data;
  },

  getStaff: async (params?) => {
    const response = await staffClient.get('/api/staff', { params });
    return response.data;
  },

  getStaffById: async (staffId: string) => {
    const response = await staffClient.get(`/api/staff/${staffId}`);
    return response.data;
  },

  updateStaff: async (staffId: string, data) => {
    const response = await staffClient.put(`/api/staff/${staffId}`, data);
    return response.data;
  },

  deleteStaff: async (staffId: string) => {
    const response = await staffClient.delete(`/api/staff/${staffId}`);
    return response.data;
  },

  // Shifts
  createShift: async (data) => {
    const response = await staffClient.post('/api/shifts', data);
    return response.data;
  },

  createBulkShifts: async (data) => {
    const response = await staffClient.post('/api/shifts/bulk', data);
    return response.data;
  },

  getSchedule: async (params?) => {
    const response = await staffClient.get('/api/shifts/schedule', { params });
    return response.data;
  },

  getShift: async (shiftId: string) => {
    const response = await staffClient.get(`/api/shifts/${shiftId}`);
    return response.data;
  },

  updateShift: async (shiftId: string, data) => {
    const response = await staffClient.put(`/api/shifts/${shiftId}`, data);
    return response.data;
  },

  deleteShift: async (shiftId: string) => {
    const response = await staffClient.delete(`/api/shifts/${shiftId}`);
    return response.data;
  },

  swapShifts: async (data: { shift1Id: string; shift2Id: string }) => {
    const response = await staffClient.post('/api/shifts/swap', data);
    return response.data;
  },

  // Attendance
  checkIn: async (data) => {
    const response = await staffClient.post('/api/attendance/check-in', data);
    return response.data;
  },

  checkOut: async (data) => {
    const response = await staffClient.post('/api/attendance/check-out', data);
    return response.data;
  },

  getAttendance: async (params?) => {
    const response = await staffClient.get('/api/attendance', { params });
    return response.data;
  },

  getAttendanceByDate: async (date: string) => {
    const response = await staffClient.get(`/api/attendance/date/${date}`);
    return response.data;
  },

  // Performance
  getPerformance: async (staffId: string, period?: string) => {
    const response = await staffClient.get(`/api/performance/${staffId}`, { params: { period } });
    return response.data;
  },
};
