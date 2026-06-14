/**
 * REZ Healthcare OS - Unified SDK
 */

import axios, { AxiosInstance } from 'axios';

export interface HealthcareSDKConfig {
  baseURL?: string;
  apiKey?: string;
}

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: HealthcareSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  protected async get<T>(path: string, params?: object): Promise<T> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  protected async post<T>(path: string, data?: object): Promise<T> {
    const response = await this.client.post(path, data);
    return response.data;
  }
}

// =============================================================================
// Healthcare Main
// =============================================================================

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  available: boolean;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth: Date;
  bloodGroup?: string;
  allergies: string[];
}

export class HealthcareClient extends BaseClient {
  constructor(config: HealthcareSDKConfig) {
    super(config.baseURL || 'http://localhost:4501', config);
  }

  async getDoctors(specialty?: string): Promise<Doctor[]> {
    return this.get('/api/doctors', { specialty });
  }

  async getPatient(id: string): Promise<Patient> {
    return this.get(`/api/patients/${id}`);
  }
}

// =============================================================================
// Appointments
// =============================================================================

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
  type: 'consultation' | 'followup' | 'procedure';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export class AppointmentClient extends BaseClient {
  constructor(config: HealthcareSDKConfig) {
    super(config.baseURL || 'http://localhost:4502', config);
  }

  async bookAppointment(data: Partial<Appointment>): Promise<Appointment> {
    return this.post('/api/appointments', data);
  }

  async getAppointment(id: string): Promise<Appointment> {
    return this.get(`/api/appointments/${id}`);
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    return this.get('/api/appointments/slots', { doctorId, date });
  }
}

// =============================================================================
// Pharmacy
// =============================================================================

export interface Medicine {
  id: string;
  name: string;
  composition: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
}

export class PharmacyClient extends BaseClient {
  constructor(config: HealthcareSDKConfig) {
    super(config.baseURL || 'http://localhost:4503', config);
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    return this.get('/api/medicines/search', { query });
  }

  async getMedicine(id: string): Promise<Medicine> {
    return this.get(`/api/medicines/${id}`);
  }

  async placeOrder(medicines: { id: string; quantity: number }[]): Promise<void> {
    await this.post('/api/orders', { medicines });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createHealthcareSDK(config: HealthcareSDKConfig = {}): {
  healthcare: HealthcareClient;
  appointments: AppointmentClient;
  pharmacy: PharmacyClient;
} {
  return {
    healthcare: new HealthcareClient(config),
    appointments: new AppointmentClient(config),
    pharmacy: new PharmacyClient(config),
  };
}

export default createHealthcareSDK;
