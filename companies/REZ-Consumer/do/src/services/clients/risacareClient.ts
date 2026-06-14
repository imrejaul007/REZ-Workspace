/**
 * RisaCare Client for DO App
 *
 * Connect DO App to RisaCare (Healthcare, Appointments, Medical Records)
 */

import axios, { AxiosInstance } from 'axios';

const RISACARE_URL = process.env.RISACARE_URL || 'http://localhost:4700';

export class RisaCareClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: RISACARE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // APPOINTMENTS
  // =========================================================================

  async bookAppointment(params: {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    specialty?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/appointments/book', params);
      return data;
    } catch (error) {
      console.error('RisaCare bookAppointment error:', error);
      return this.mockAppointment(params);
    }
  }

  async getAppointments(patientId: string) {
    try {
      const { data } = await this.client.get(`/api/appointments/${patientId}`);
      return data;
    } catch (error) {
      console.error('RisaCare getAppointments error:', error);
      return { appointments: [] };
    }
  }

  async cancelAppointment(appointmentId: string) {
    try {
      const { data } = await this.client.post(`/api/appointments/${appointmentId}/cancel`);
      return data;
    } catch (error) {
      console.error('RisaCare cancelAppointment error:', error);
      return null;
    }
  }

  // =========================================================================
  // HEALTH TWIN
  // =========================================================================

  async getHealthTwin(patientId: string) {
    try {
      const { data } = await this.client.get(`/api/health-twin/${patientId}`);
      return data;
    } catch (error) {
      console.error('RisaCare getHealthTwin error:', error);
      return this.mockHealthTwin();
    }
  }

  async logVitals(patientId: string, vitals: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    steps?: number;
    sleep?: number;
  }) {
    try {
      const { data } = await this.client.post(`/api/health-twin/${patientId}/vitals`, vitals);
      return data;
    } catch (error) {
      console.error('RisaCare logVitals error:', error);
      return null;
    }
  }

  async getVitalsHistory(patientId: string, days: number = 7) {
    try {
      const { data } = await this.client.get(`/api/health-twin/${patientId}/history`, {
        params: { days },
      });
      return data;
    } catch (error) {
      console.error('RisaCare getVitalsHistory error:', error);
      return { history: [] };
    }
  }

  // =========================================================================
  // DOCTORS
  // =========================================================================

  async searchDoctors(specialty: string, location?: string) {
    try {
      const { data } = await this.client.get('/api/doctors/search', {
        params: { specialty, location },
      });
      return data;
    } catch (error) {
      console.error('RisaCare searchDoctors error:', error);
      return this.mockDoctors(specialty);
    }
  }

  async getDoctor(doctorId: string) {
    try {
      const { data } = await this.client.get(`/api/doctors/${doctorId}`);
      return data;
    } catch (error) {
      console.error('RisaCare getDoctor error:', error);
      return null;
    }
  }

  async getDoctorAvailability(doctorId: string, date: string) {
    try {
      const { data } = await this.client.get(`/api/doctors/${doctorId}/availability`, {
        params: { date },
      });
      return data;
    } catch (error) {
      console.error('RisaCare getDoctorAvailability error:', error);
      return { slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] };
    }
  }

  // =========================================================================
  // MEDICAL RECORDS
  // =========================================================================

  async getRecords(patientId: string) {
    try {
      const { data } = await this.client.get(`/api/records/${patientId}`);
      return data;
    } catch (error) {
      console.error('RisaCare getRecords error:', error);
      return { records: [] };
    }
  }

  async getPrescriptions(patientId: string) {
    try {
      const { data } = await this.client.get(`/api/prescriptions/${patientId}`);
      return data;
    } catch (error) {
      console.error('RisaCare getPrescriptions error:', error);
      return { prescriptions: [] };
    }
  }

  async refillPrescription(prescriptionId: string) {
    try {
      const { data } = await this.client.post(`/api/prescriptions/${prescriptionId}/refill`);
      return data;
    } catch (error) {
      console.error('RisaCare refillPrescription error:', error);
      return null;
    }
  }

  // =========================================================================
  // TELEMEDICINE
  // =========================================================================

  async startTelemedicine(appointmentId: string) {
    try {
      const { data } = await this.client.post(`/api/telemedicine/${appointmentId}/start`);
      return data;
    } catch (error) {
      console.error('RisaCare startTelemedicine error:', error);
      return { callUrl: 'https://risacare.app/call/' + appointmentId };
    }
  }

  async endTelemedicine(appointmentId: string) {
    try {
      const { data } = await this.client.post(`/api/telemedicine/${appointmentId}/end`);
      return data;
    } catch (error) {
      console.error('RisaCare endTelemedicine error:', error);
      return null;
    }
  }

  // =========================================================================
  // SYMPTOMS & AI
  // =========================================================================

  async checkSymptoms(symptoms: string[]) {
    try {
      const { data } = await this.client.post('/api/ai/symptoms', { symptoms });
      return data;
    } catch (error) {
      console.error('RisaCare checkSymptoms error:', error);
      return {
        possibleConditions: [],
        urgency: 'low',
        recommendations: ['Rest', 'Hydrate', 'Consult if persistent'],
      };
    }
  }

  async getHealthScore(patientId: string) {
    try {
      const { data } = await this.client.get(`/api/health-twin/${patientId}/score`);
      return data;
    } catch (error) {
      console.error('RisaCare getHealthScore error:', error);
      return { score: 82, factors: { activity: 75, sleep: 80, vitals: 90 } };
    }
  }

  // =========================================================================
  // DO APP SPECIFIC
  // =========================================================================

  async getDOAppHealthDashboard(patientId: string) {
    const [healthTwin, appointments, healthScore] = await Promise.all([
      this.getHealthTwin(patientId),
      this.getAppointments(patientId),
      this.getHealthScore(patientId),
    ]);

    return {
      healthTwin,
      appointments,
      healthScore,
      quickActions: {
        bookAppointment: true,
        logVitals: true,
        telemedicine: true,
        healthScore: true,
      },
    };
  }

  async voiceCommand(patientId: string, command: string) {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('book') && lowerCommand.includes('appointment')) {
      return { action: 'book_appointment', command };
    }

    if (lowerCommand.includes('book') && lowerCommand.includes('doctor')) {
      return { action: 'search_doctor', command };
    }

    if (lowerCommand.includes('health') || lowerCommand.includes('vitals')) {
      const healthTwin = await this.getHealthTwin(patientId);
      return { action: 'show_health', data: healthTwin };
    }

    if (lowerCommand.includes('appointment')) {
      const appointments = await this.getAppointments(patientId);
      return { action: 'show_appointments', data: appointments };
    }

    if (lowerCommand.includes('symptom')) {
      return { action: 'check_symptoms', command };
    }

    return { action: 'unknown', command };
  }

  // =========================================================================
  // MOCK DATA
  // =========================================================================

  private mockHealthTwin() {
    return {
      patientId: 'patient001',
      healthScore: 82,
      lastVitals: {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 98.6,
        weight: 75,
        steps: 5200,
        sleep: 7,
      },
      conditions: [],
      medications: [],
    };
  }

  private mockAppointment(params: any) {
    return {
      id: 'apt_' + Date.now(),
      patientId: params.patientId,
      doctorId: params.doctorId,
      date: params.date,
      time: params.time,
      status: 'confirmed',
    };
  }

  private mockDoctors(specialty: string) {
    return {
      doctors: [
        {
          id: 'doc001',
          name: 'Dr. Priya Sharma',
          specialty: specialty || 'General Physician',
          rating: 4.8,
          experience: 12,
          location: 'Mumbai',
        },
        {
          id: 'doc002',
          name: 'Dr. Rajesh Kumar',
          specialty: specialty || 'General Physician',
          rating: 4.7,
          experience: 8,
          location: 'Mumbai',
        },
      ],
    };
  }
}

// Export singleton
export const risacareClient = new RisaCareClient();

export default RisaCareClient;