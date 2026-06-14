import { v4 as uuidv4 } from 'uuid';
import type {
  Practice,
  Doctor,
  CreatePracticeInput,
  CreateDoctorInput,
} from '../types/schemas.js';
import {
  getPractice,
  getAllPractices,
  createPractice,
  updatePractice,
  getDoctor,
  getAllDoctors,
  getDoctorsByPractice,
  createDoctor,
  updateDoctor,
  store,
} from '../models/store.js';

export class PracticeService {
  /**
   * Setup a new practice with initial configuration
   */
  async setupPractice(input: CreatePracticeInput): Promise<Practice> {
    const now = new Date().toISOString();
    const practice: Practice = {
      practiceId: uuidv4(),
      name: input.name,
      type: input.type,
      specialty: input.specialty,
      address: input.address,
      doctors: [],
      staff: input.staff || [],
      operatingHours: input.operatingHours || [],
      services: input.services || [],
      phone: input.phone,
      email: input.email,
      logo: input.logo,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return createPractice(practice);
  }

  /**
   * Get practice by ID
   */
  async getPractice(practiceId: string): Promise<Practice | null> {
    return getPractice(practiceId) || null;
  }

  /**
   * Get all practices
   */
  async getAllPractices(): Promise<Practice[]> {
    return getAllPractices();
  }

  /**
   * Update practice information
   */
  async updatePractice(practiceId: string, updates: Partial<CreatePracticeInput>): Promise<Practice | null> {
    const existing = getPractice(practiceId);
    if (!existing) return null;

    return updatePractice(practiceId, updates) || null;
  }

  /**
   * Add a doctor to the practice
   */
  async addDoctor(practiceId: string, doctorInput: CreateDoctorInput): Promise<Doctor | null> {
    const practice = getPractice(practiceId);
    if (!practice) return null;

    const now = new Date().toISOString();
    const doctor: Doctor = {
      doctorId: uuidv4(),
      name: doctorInput.name,
      specialty: doctorInput.specialty,
      qualifications: doctorInput.qualifications,
      registrationNumber: doctorInput.registrationNumber,
      experience: doctorInput.experience,
      consultationFee: doctorInput.consultationFee,
      languages: doctorInput.languages || ['English'],
      availability: doctorInput.availability || [],
      profileImage: doctorInput.profileImage,
      bio: doctorInput.bio,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    createDoctor(doctor);

    // Add doctor to practice
    updatePractice(practiceId, {
      doctors: [...practice.doctors, doctor.doctorId],
    });

    return doctor;
  }

  /**
   * Get all doctors in a practice
   */
  async getDoctors(practiceId: string): Promise<Doctor[]> {
    return getDoctorsByPractice(practiceId);
  }

  /**
   * Get all doctors (global)
   */
  async getAllDoctors(): Promise<Doctor[]> {
    return getAllDoctors();
  }

  /**
   * Get doctor by ID
   */
  async getDoctor(doctorId: string): Promise<Doctor | null> {
    return getDoctor(doctorId) || null;
  }

  /**
   * Update doctor information
   */
  async updateDoctor(doctorId: string, updates: Partial<CreateDoctorInput>): Promise<Doctor | null> {
    const existing = getDoctor(doctorId);
    if (!existing) return null;

    return updateDoctor(doctorId, updates) || null;
  }

  /**
   * Add staff member to practice
   */
  async addStaffMember(
    practiceId: string,
    staff: { name: string; role: string; phone?: string }
  ): Promise<Practice | null> {
    const practice = getPractice(practiceId);
    if (!practice) return null;

    const staffMember = {
      staffId: uuidv4(),
      ...staff,
    };

    return updatePractice(practiceId, {
      staff: [...practice.staff, staffMember],
    }) || null;
  }

  /**
   * Add service to practice
   */
  async addService(
    practiceId: string,
    service: { name: string; description?: string; duration: number; fee: number }
  ): Promise<Practice | null> {
    const practice = getPractice(practiceId);
    if (!practice) return null;

    const newService = {
      serviceId: uuidv4(),
      ...service,
      isActive: true,
    };

    return updatePractice(practiceId, {
      services: [...practice.services, newService],
    }) || null;
  }

  /**
   * Update operating hours
   */
  async updateOperatingHours(
    practiceId: string,
    hours: Practice['operatingHours']
  ): Promise<Practice | null> {
    return updatePractice(practiceId, { operatingHours: hours }) || null;
  }

  /**
   * Deactivate practice
   */
  async deactivatePractice(practiceId: string): Promise<boolean> {
    const result = updatePractice(practiceId, { isActive: false });
    return result !== undefined;
  }

  /**
   * Get practice statistics
   */
  async getPracticeStats(practiceId: string): Promise<{
    totalDoctors: number;
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
  } | null> {
    const practice = getPractice(practiceId);
    if (!practice) return null;

    const totalDoctors = practice.doctors.length;
    const totalPatients = store.patients.size;
    const totalAppointments = store.appointments.size;
    const totalRevenue = Array.from(store.billings.values())
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.total, 0);

    return {
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalRevenue,
    };
  }
}

// Export singleton instance
export const practiceService = new PracticeService();
