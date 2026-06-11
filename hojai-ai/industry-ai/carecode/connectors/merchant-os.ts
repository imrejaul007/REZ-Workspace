/**
 * Merchant OS Connector
 * Connects CARECODE to Merchant OS (REZ or Standalone)
 * Healthcare Practice Management System
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface AppointmentRequest {
  patientId?: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  department: string;
  dateTime: string;
  duration: number;
  type: 'consultation' | 'followup' | 'procedure' | 'emergency';
  reason?: string;
  insuranceId?: string;
}

export interface PrescriptionRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  patientId: string;
  amount: number;
  status: 'pending' | 'paid' | 'partial' | 'insurance';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'insurance';
  items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  insuranceClaimId?: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  /**
   * Get patient by phone
   */
  async getPatientByPhone(phone: string): Promise<PatientProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/patients/phone/${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get patient by phone');
      return null;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<PatientProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/patients/${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get patient by ID');
      return null;
    }
  }

  /**
   * Create or update patient
   */
  async upsertPatient(patient: Omit<PatientProfile, 'id'>): Promise<PatientProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/patients`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patient)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert patient');
      return null;
    }
  }

  /**
   * Update patient medical history
   */
  async updatePatientMedicalHistory(
    patientId: string,
    history: { allergies?: string[]; medicalHistory?: string[] }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/patients/${patientId}/medical-history`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(history)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get doctor availability
   */
  async getDoctorAvailability(
    doctorId: string,
    date: string
  ): Promise<{ time: string; available: boolean }[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/doctors/${doctorId}/availability?date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.slots || [];
    } catch {
      return [];
    }
  }

  /**
   * Book appointment
   */
  async bookAppointment(appointment: AppointmentRequest): Promise<{
    appointmentId: string;
    confirmationCode: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/appointments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointment)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to book appointment');
      return null;
    }
  }

  /**
   * Get appointment details
   */
  async getAppointment(appointmentId: string): Promise<unknown | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/appointments/${appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create prescription
   */
  async createPrescription(prescription: Omit<PrescriptionRecord, 'id' | 'createdAt'>): Promise<PrescriptionRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/prescriptions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prescription)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to create prescription');
      return null;
    }
  }

  /**
   * Get patient prescriptions
   */
  async getPatientPrescriptions(patientId: string): Promise<PrescriptionRecord[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/prescriptions?patientId=${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.prescriptions || [];
    } catch {
      return [];
    }
  }

  /**
   * Create billing record
   */
  async createBilling(billing: Omit<BillingRecord, 'id'>): Promise<BillingRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/billing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(billing)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to create billing record');
      return null;
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    billingId: string,
    amount: number,
    method: 'cash' | 'card' | 'upi' | 'insurance'
  ): Promise<{ success: boolean; transactionId?: string; message: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/billing/${billingId}/payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount, method })
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        transactionId: data.transactionId,
        message: data.message || (response.ok ? 'Payment successful' : 'Payment failed')
      };
    } catch {
      return { success: false, message: 'Payment processing failed' };
    }
  }

  /**
   * Get patient billing history
   */
  async getPatientBilling(patientId: string): Promise<BillingRecord[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/billing?patientId=${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.bills || [];
    } catch {
      return [];
    }
  }

  /**
   * Get departments
   */
  async getDepartments(): Promise<{ id: string; name: string; doctors: string[] }[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/departments`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.departments || [];
    } catch {
      return [];
    }
  }

  /**
   * Get doctors
   */
  async getDoctors(department?: string): Promise<{
    id: string;
    name: string;
    specialization: string;
    department: string;
    available: boolean;
  }[]> {
    try {
      const url = department
        ? `${this.config.baseUrl}/api/doctors?department=${department}`
        : `${this.config.baseUrl}/api/doctors`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.doctors || [];
    } catch {
      return [];
    }
  }

  /**
   * Check connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default MerchantOSConnector;
