import { apiClient } from './client';

export interface ServiceAppointment {
  _id: string;
  appointmentNumber: string;
  store: string;
  user: {
    _id: string;
    fullName?: string;
    phoneNumber?: string;
  };
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  staffMember?: string;
  staffId?: string;
  staffName?: string;
  depositAmount?: number;
  cancellationFee?: number;
  groupBookingId?: string;
  treatmentNotes?: {
    stylistNotes?: string;
    clientVisibleNotes?: string;
    colourFormula?: string;
    productsUsed?: string[];
    photos?: { before?: string; after?: string };
  };
  recurrence?: {
    enabled?: boolean;
    frequency?: string;
    seriesIndex?: number;
  };
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  todayCount: number;
}

class AppointmentService {
  async getStoreAppointments(
    storeId: string,
    params?: { date?: string; status?: string; page?: number; limit?: number }
  ): Promise<{ appointments: ServiceAppointment[]; pagination: unknown }> {
    try {
      const queryParams = new URLSearchParams();
      if (storeId) queryParams.append('storeId', storeId);
      if (params?.date) queryParams.append('date', params.date);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/appointments?${queryString}`
        : `merchant/appointments?storeId=${storeId}`;

      const response = await apiClient.get<unknown>(url);
      const appointments: ServiceAppointment[] = response.data?.appointments || [];

      return {
        appointments,
        pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get appointments'
      );
    }
  }

  async getAppointment(appointmentId: string): Promise<ServiceAppointment> {
    try {
      const response = await apiClient.get<unknown>(`merchant/appointments/${appointmentId}`);
      if (!response.data?.appointment) {
        throw new Error('Appointment not found');
      }
      return response.data.appointment;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get appointment'
      );
    }
  }

  async updateStatus(
    appointmentId: string,
    status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
    reason?: string
  ): Promise<ServiceAppointment> {
    try {
      const payload: Record<string, string> = { status };
      if (reason) payload.reason = reason;
      const response = await apiClient.patch<unknown>(
        `merchant/appointments/${appointmentId}/status`,
        payload
      );
      if (!response.data?.appointment) {
        throw new Error('Failed to update appointment status');
      }
      return response.data.appointment;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${status.replace('_', ' ')} appointment`
      );
    }
  }

  async addTreatmentNotes(
    appointmentId: string,
    notes: {
      stylistNotes?: string;
      clientVisibleNotes?: string;
      colourFormula?: string;
      productsUsed?: string[];
      resultRating?: number;
      photosBefore?: string;
      photosAfter?: string;
    }
  ): Promise<ServiceAppointment> {
    try {
      const response = await apiClient.patch<unknown>(
        `merchant/appointments/${appointmentId}/treatment-notes`,
        notes
      );
      if (!response.data?.appointment) {
        throw new Error('Failed to add treatment notes');
      }
      return response.data.appointment;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to add treatment notes'
      );
    }
  }

  async getAvailableSlots(
    storeId: string,
    date: string
  ): Promise<Array<{ time: string; available: boolean }>> {
    try {
      const response = await apiClient.get<unknown>(`merchant/appointments/slots/${storeId}`, {
        params: { date },
      });
      return response.data?.slots || [];
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get available slots'
      );
    }
  }

  async updateAppointment(
    appointmentId: string,
    updates: {
      appointmentDate?: string;
      appointmentTime?: string;
      staffId?: string;
      staffName?: string;
      duration?: number;
      specialInstructions?: string;
    }
  ): Promise<ServiceAppointment> {
    try {
      const response = await apiClient.put<unknown>(`merchant/appointments/${appointmentId}`, updates);
      if (!response.data?.appointment) {
        throw new Error('Failed to update appointment');
      }
      return response.data.appointment;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to update appointment'
      );
    }
  }

  async createAppointment(data: {
    storeId: string;
    serviceType: string;
    appointmentDate: string;
    appointmentTime: string;
    duration?: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    specialInstructions?: string;
    staffId?: string;
    staffName?: string;
  }): Promise<ServiceAppointment> {
    try {
      const response = await apiClient.post<unknown>('merchant/appointments', data);
      if (!response.data?.appointment) {
        throw new Error('Failed to create appointment');
      }
      return response.data.appointment;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to create appointment'
      );
    }
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
