/**
 * Table Booking Service Adapter
 * Connects to rez-table-booking-service
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const bookingClient = axios.create({
  baseURL: SERVICE_URLS.TABLE_BOOKING,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const tableBookingService = {
  // Reservations
  createReservation: async (data) => {
    const response = await bookingClient.post('/api/reservations', data);
    return response.data;
  },

  getReservations: async (params?) => {
    const response = await bookingClient.get('/api/reservations', { params });
    return response.data;
  },

  getReservation: async (reservationId: string) => {
    const response = await bookingClient.get(`/api/reservations/${reservationId}`);
    return response.data;
  },

  updateReservation: async (reservationId: string, data) => {
    const response = await bookingClient.put(`/api/reservations/${reservationId}`, data);
    return response.data;
  },

  cancelReservation: async (reservationId: string, reason?: string) => {
    const response = await bookingClient.post(`/api/reservations/${reservationId}/cancel`, { reason });
    return response.data;
  },

  confirmReservation: async (reservationId: string) => {
    const response = await bookingClient.post(`/api/reservations/${reservationId}/confirm`);
    return response.data;
  },

  // Tables
  getTables: async (params?) => {
    const response = await bookingClient.get('/api/tables', { params });
    return response.data;
  },

  getTable: async (tableId: string) => {
    const response = await bookingClient.get(`/api/tables/${tableId}`);
    return response.data;
  },

  updateTable: async (tableId: string, data) => {
    const response = await bookingClient.put(`/api/tables/${tableId}`, data);
    return response.data;
  },

  updateTableStatus: async (tableId: string, status: string) => {
    const response = await bookingClient.post(`/api/tables/${tableId}/status`, { status });
    return response.data;
  },

  // Availability
  checkAvailability: async (params) => {
    const response = await bookingClient.get('/api/reservations/availability', { params });
    return response.data;
  },

  // Waitlist
  addToWaitlist: async (data) => {
    const response = await bookingClient.post('/api/waitlist', data);
    return response.data;
  },

  getWaitlist: async (params?) => {
    const response = await bookingClient.get('/api/waitlist', { params });
    return response.data;
  },

  updateWaitlistEntry: async (entryId: string, data) => {
    const response = await bookingClient.put(`/api/waitlist/${entryId}`, data);
    return response.data;
  },

  removeFromWaitlist: async (entryId: string) => {
    const response = await bookingClient.delete(`/api/waitlist/${entryId}`);
    return response.data;
  },
};
