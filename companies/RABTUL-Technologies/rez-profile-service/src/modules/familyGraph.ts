/**
 * Family Graph Module for RABTUL Profile Service
 * Manages family relationships and health data sharing within families
 * Version: 1.0.0
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

// Family Structure
export interface Family {
  id: string;
  patientId: string; // Primary patient who owns the family
  familyName?: string;
  members: FamilyMember[];
  settings: FamilySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  userId: string;
  displayName: string;
  role: FamilyMemberRole;
  relationship: string; // e.g., "father", "mother", "spouse", "son", "daughter"
  dateOfBirth?: Date;
  contactInfo: ContactInfo;
  isPrimaryPatient: boolean;
  joinedAt: Date;
  permissions: FamilyMemberPermissions;
  emergencyContact: boolean;
  notificationsEnabled: boolean;
}

export type FamilyMemberRole =
  | 'patient'
  | 'primary_caregiver'
  | 'family'
  | 'spouse'
  | 'child'
  | 'other_caregiver';

export interface FamilyMemberPermissions {
  viewRecords: PermissionLevel;
  viewMedications: PermissionLevel;
  viewAppointments: PermissionLevel;
  receiveAlerts: boolean;
  canSchedule: boolean;
  canMessage: boolean;
  canMakePayments: boolean;
  emergencyAccess: boolean;
}

export type PermissionLevel = 'none' | 'limited' | 'full';

export interface FamilySettings {
  defaultAlertEnabled: boolean;
  alertOnEmergency: boolean;
  alertOnMissedMedication: boolean;
  alertOnAppointment: boolean;
  shareHealthData: boolean;
  shareMedications: boolean;
  shareAppointments: boolean;
  familyPoolEnabled: boolean;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Family Health Summary
export interface FamilyHealthSummary {
  familyId: string;
  generatedAt: Date;
  members: MemberHealthSummary[];
  upcomingAppointments: FamilyAppointment[];
  activeMedications: FamilyMedication[];
  recentAlerts: FamilyAlert[];
  careGiverNotes: string;
}

export interface MemberHealthSummary {
  memberId: string;
  userId: string;
  displayName: string;
  role: FamilyMemberRole;
  relationship: string;
  healthStatus: HealthStatus;
  lastCheckup?: Date;
  activeConditions: string[];
  recentVitals?: VitalSummary;
  adherenceRate?: number;
}

export interface VitalSummary {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  bloodGlucose?: number;
  weight?: number;
  recordedAt?: Date;
}

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical';

// Family Appointments
export interface FamilyAppointment {
  id: string;
  familyId: string;
  memberId: string;
  patientName: string;
  providerName: string;
  specialty: string;
  appointmentDate: Date;
  location?: string;
  isVirtual: boolean;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'checkup' | 'specialist' | 'urgent' | 'telehealth' | 'lab' | 'imaging' | 'procedure';

// Family Medications
export interface FamilyMedication {
  id: string;
  familyId: string;
  memberId: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  refillDate?: Date;
  prescribedBy?: string;
  status: MedicationStatus;
  adherenceRate?: number;
}

export type MedicationStatus = 'active' | 'completed' | 'discontinued' | 'paused';

// Family Alerts
export interface FamilyAlert {
  id: string;
  familyId: string;
  memberId: string;
  patientName: string;
  alertType: FamilyAlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export type FamilyAlertType =
  | 'missed_medication'
  | 'upcoming_appointment'
  | 'abnormal_result'
  | 'refill_needed'
  | 'emergency'
  | 'checkup_due';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Care Circle
export interface CareCircle {
  id: string;
  familyId: string;
  primaryMemberId: string;
  members: CareCircleMember[];
  settings: CareCircleSettings;
  createdAt: Date;
}

export interface CareCircleMember {
  userId: string;
  displayName: string;
  role: CareCircleRole;
  permissions: CareCirclePermissions;
  addedAt: Date;
  addedBy: string;
}

export type CareCircleRole = 'primary' | 'caregiver' | 'medical' | 'emergency';

export interface CareCirclePermissions {
  canViewRecords: boolean;
  canViewMedications: boolean;
  canViewAppointments: boolean;
  canReceiveAlerts: boolean;
  canCoordinateCare: boolean;
  isEmergencyContact: boolean;
}

export interface CareCircleSettings {
  emergencyAlerts: boolean;
  medicationAlerts: boolean;
  appointmentAlerts: boolean;
  labResultAlerts: boolean;
  alertDelayMinutes: number;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const FamilyMemberPermissionsSchema = z.object({
  viewRecords: z.enum(['none', 'limited', 'full']),
  viewMedications: z.enum(['none', 'limited', 'full']),
  viewAppointments: z.enum(['none', 'limited', 'full']),
  receiveAlerts: z.boolean(),
  canSchedule: z.boolean(),
  canMessage: z.boolean(),
  canMakePayments: z.boolean(),
  emergencyAccess: z.boolean(),
});

export const FamilyMemberSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1),
  role: z.enum(['patient', 'primary_caregiver', 'family', 'spouse', 'child', 'other_caregiver']),
  relationship: z.string().min(1),
  dateOfBirth: z.date().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }).optional(),
  }),
  isPrimaryPatient: z.boolean(),
  emergencyContact: z.boolean(),
  notificationsEnabled: z.boolean(),
});

export const FamilySettingsSchema = z.object({
  defaultAlertEnabled: z.boolean(),
  alertOnEmergency: z.boolean(),
  alertOnMissedMedication: z.boolean(),
  alertOnAppointment: z.boolean(),
  shareHealthData: z.boolean(),
  shareMedications: z.boolean(),
  shareAppointments: z.boolean(),
  familyPoolEnabled: z.boolean(),
});

export const FamilySchema = z.object({
  patientId: z.string().min(1),
  familyName: z.string().optional(),
  members: z.array(FamilyMemberSchema),
  settings: FamilySettingsSchema,
});

// ============================================================================
// Mock Data Stores (for development)
// ============================================================================

const mockFamilies: Map<string, Family> = new Map();
const mockCareCircles: Map<string, CareCircle> = new Map();
const mockFamilyAppointments: FamilyAppointment[] = [];
const mockFamilyMedications: FamilyMedication[] = [];
const mockFamilyAlerts: FamilyAlert[] = [];

// ============================================================================
// Service Class
// ============================================================================

export class FamilyGraphService {
  private readonly MAX_FAMILY_MEMBERS = 10;

  // ===========================================================================
  // Family Management
  // ===========================================================================

  /**
   * Create a new family
   */
  async createFamily(
    patientId: string,
    familyName?: string,
    settings?: Partial<FamilySettings>
  ): Promise<Family> {
    // Check if patient already has a family
    const existing = await this.getFamilyByPatient(patientId);
    if (existing) {
      throw new FamilyGraphError(
        'FAMILY_EXISTS',
        `Patient ${patientId} already belongs to a family`
      );
    }

    const now = new Date();
    const familyId = this.generateId();

    const defaultSettings: FamilySettings = {
      defaultAlertEnabled: true,
      alertOnEmergency: true,
      alertOnMissedMedication: true,
      alertOnAppointment: true,
      shareHealthData: true,
      shareMedications: true,
      shareAppointments: true,
      familyPoolEnabled: true,
      ...settings,
    };

    const family: Family = {
      id: familyId,
      patientId,
      familyName,
      members: [],
      settings: defaultSettings,
      createdAt: now,
      updatedAt: now,
    };

    mockFamilies.set(familyId, family);

    return family;
  }

  /**
   * Add a family member
   */
  async addFamilyMember(
    familyId: string,
    member: Omit<FamilyMember, 'id' | 'joinedAt' | 'permissions'>,
    addedBy: string
  ): Promise<Family> {
    const family = mockFamilies.get(familyId);

    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }

    if (family.members.length >= this.MAX_FAMILY_MEMBERS) {
      throw new FamilyGraphError(
        'MEMBER_LIMIT_REACHED',
        `Maximum ${this.MAX_FAMILY_MEMBERS} members allowed per family`
      );
    }

    // Check if user is already a member
    if (family.members.some(m => m.userId === member.userId)) {
      throw new FamilyGraphError(
        'ALREADY_MEMBER',
        `User ${member.userId} is already a family member`
      );
    }

    const newMember: FamilyMember = {
      ...member,
      id: this.generateId(),
      joinedAt: new Date(),
      permissions: this.getDefaultPermissions(member.role),
    };

    family.members.push(newMember);
    family.updatedAt = new Date();

    // Create care circle entry for new member
    await this.addToCareCircle(familyId, newMember.userId, newMember.displayName, 'caregiver');

    return family;
  }

  /**
   * Remove a family member
   */
  async removeFamilyMember(
    familyId: string,
    memberId: string,
    removedBy: string
  ): Promise<Family> {
    const family = mockFamilies.get(familyId);

    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }

    // Cannot remove primary patient
    const memberIndex = family.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      throw new FamilyGraphError('MEMBER_NOT_FOUND', `Member ${memberId} not found`);
    }

    const member = family.members[memberIndex];
    if (member.isPrimaryPatient) {
      throw new FamilyGraphError(
        'CANNOT_REMOVE_PATIENT',
        'Cannot remove the primary patient from family'
      );
    }

    family.members.splice(memberIndex, 1);
    family.updatedAt = new Date();

    // Remove from care circle
    await this.removeFromCareCircle(familyId, member.userId);

    return family;
  }

  /**
   * Update family member
   */
  async updateFamilyMember(
    familyId: string,
    memberId: string,
    updates: Partial<Omit<FamilyMember, 'id' | 'userId' | 'joinedAt'>>
  ): Promise<Family> {
    const family = mockFamilies.get(familyId);

    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }

    const memberIndex = family.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      throw new FamilyGraphError('MEMBER_NOT_FOUND', `Member ${memberId} not found`);
    }

    family.members[memberIndex] = {
      ...family.members[memberIndex],
      ...updates,
    };
    family.updatedAt = new Date();

    return family;
  }

  /**
   * Set a member as primary caregiver
   */
  async setPrimaryMember(
    familyId: string,
    memberId: string,
    updatedBy: string
  ): Promise<Family> {
    return this.updateFamilyMember(familyId, memberId, {
      role: 'primary_caregiver',
      permissions: {
        ...this.getDefaultPermissions('primary_caregiver'),
        viewRecords: 'full',
        viewMedications: 'full',
        viewAppointments: 'full',
        receiveAlerts: true,
        canSchedule: true,
        canMessage: true,
        canMakePayments: true,
        emergencyAccess: true,
      },
    });
  }

  /**
   * Set a member as caregiver
   */
  async setCaregiver(
    familyId: string,
    memberId: string,
    caregiverRole: 'primary_caregiver' | 'other_caregiver',
    permissions?: Partial<FamilyMemberPermissions>
  ): Promise<Family> {
    return this.updateFamilyMember(familyId, memberId, {
      role: caregiverRole,
      permissions: {
        ...this.getDefaultPermissions(caregiverRole),
        ...permissions,
      },
    });
  }

  /**
   * Update member permissions
   */
  async updateMemberPermissions(
    familyId: string,
    memberId: string,
    permissions: Partial<FamilyMemberPermissions>
  ): Promise<Family> {
    const family = mockFamilies.get(familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }

    const member = family.members.find(m => m.id === memberId);
    if (!member) {
      throw new FamilyGraphError('MEMBER_NOT_FOUND', `Member ${memberId} not found`);
    }

    return this.updateFamilyMember(familyId, memberId, {
      permissions: {
        ...member.permissions,
        ...permissions,
      },
    });
  }

  /**
   * Get family by ID
   */
  async getFamily(familyId: string): Promise<Family | null> {
    return mockFamilies.get(familyId) || null;
  }

  /**
   * Get family by patient ID
   */
  async getFamilyByPatient(patientId: string): Promise<Family | null> {
    for (const family of mockFamilies.values()) {
      if (family.patientId === patientId) {
        return family;
      }
      if (family.members.some(m => m.userId === patientId)) {
        return family;
      }
    }
    return null;
  }

  /**
   * Get family member by user ID
   */
  async getFamilyMember(familyId: string, userId: string): Promise<FamilyMember | null> {
    const family = mockFamilies.get(familyId);
    if (!family) return null;

    return family.members.find(m => m.userId === userId) || null;
  }

  /**
   * Get all family members
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const family = mockFamilies.get(familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }
    return family.members;
  }

  // ===========================================================================
  // Family Health Summary
  // ===========================================================================

  /**
   * Get family health summary
   */
  async getFamilyHealthSummary(familyId: string): Promise<FamilyHealthSummary> {
    const family = mockFamilies.get(familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }

    // Get member health summaries
    const memberSummaries = await Promise.all(
      family.members.map(async (member) => {
        const appointments = mockFamilyAppointments.filter(
          a => a.memberId === member.id && a.appointmentDate > new Date()
        );
        const medications = mockFamilyMedications.filter(
          m => m.memberId === member.id && m.status === 'active'
        );

        return {
          memberId: member.id,
          userId: member.userId,
          displayName: member.displayName,
          role: member.role,
          relationship: member.relationship,
          healthStatus: 'good' as HealthStatus,
          activeConditions: [],
          recentVitals: undefined,
          adherenceRate: medications.length > 0 ? 85 : undefined,
        } as MemberHealthSummary;
      })
    );

    // Get upcoming appointments
    const upcomingAppointments = mockFamilyAppointments
      .filter(a => a.familyId === familyId && a.appointmentDate > new Date())
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
      .slice(0, 10);

    // Get active medications
    const activeMedications = mockFamilyMedications
      .filter(m => m.familyId === familyId && m.status === 'active')
      .slice(0, 20);

    // Get recent alerts
    const recentAlerts = mockFamilyAlerts
      .filter(a => a.familyId === familyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      familyId,
      generatedAt: new Date(),
      members: memberSummaries,
      upcomingAppointments,
      activeMedications,
      recentAlerts,
      careGiverNotes: '',
    };
  }

  // ===========================================================================
  // Family Appointments
  // ===========================================================================

  /**
   * Get family appointments
   */
  async getFamilyAppointments(
    familyId: string,
    options?: {
      memberId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: AppointmentStatus;
      limit?: number;
    }
  ): Promise<FamilyAppointment[]> {
    let appointments = mockFamilyAppointments.filter(a => a.familyId === familyId);

    if (options?.memberId) {
      appointments = appointments.filter(a => a.memberId === options.memberId);
    }

    if (options?.startDate) {
      appointments = appointments.filter(a => a.appointmentDate >= options.startDate!);
    }

    if (options?.endDate) {
      appointments = appointments.filter(a => a.appointmentDate <= options.endDate!);
    }

    if (options?.status) {
      appointments = appointments.filter(a => a.status === options.status);
    }

    return appointments
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
      .slice(0, options?.limit || 50);
  }

  /**
   * Add appointment to family tracking
   */
  async addFamilyAppointment(
    appointment: Omit<FamilyAppointment, 'id'>
  ): Promise<FamilyAppointment> {
    const family = mockFamilies.get(appointment.familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${appointment.familyId} not found`);
    }

    const newAppointment: FamilyAppointment = {
      ...appointment,
      id: this.generateId(),
    };

    mockFamilyAppointments.push(newAppointment);

    return newAppointment;
  }

  /**
   * Get upcoming family appointments
   */
  async getUpcomingAppointments(
    familyId: string,
    daysAhead: number = 30
  ): Promise<FamilyAppointment[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    return this.getFamilyAppointments(familyId, {
      startDate: new Date(),
      endDate,
      status: 'scheduled',
    });
  }

  // ===========================================================================
  // Family Medications
  // ===========================================================================

  /**
   * Get family medications
   */
  async getFamilyMedications(
    familyId: string,
    options?: {
      memberId?: string;
      status?: MedicationStatus;
      limit?: number;
    }
  ): Promise<FamilyMedication[]> {
    let medications = mockFamilyMedications.filter(m => m.familyId === familyId);

    if (options?.memberId) {
      medications = medications.filter(m => m.memberId === options.memberId);
    }

    if (options?.status) {
      medications = medications.filter(m => m.status === options.status);
    }

    return medications.slice(0, options?.limit || 100);
  }

  /**
   * Add medication to family tracking
   */
  async addFamilyMedication(
    medication: Omit<FamilyMedication, 'id'>
  ): Promise<FamilyMedication> {
    const family = mockFamilies.get(medication.familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${medication.familyId} not found`);
    }

    const newMedication: FamilyMedication = {
      ...medication,
      id: this.generateId(),
    };

    mockFamilyMedications.push(newMedication);

    return newMedication;
  }

  /**
   * Get medications needing refill
   */
  async getMedicationsNeedingRefill(
    familyId: string,
    daysThreshold: number = 7
  ): Promise<FamilyMedication[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return mockFamilyMedications.filter(
      m =>
        m.familyId === familyId &&
        m.status === 'active' &&
        m.refillDate &&
        m.refillDate <= thresholdDate
    );
  }

  // ===========================================================================
  // Care Circle Management
  // ===========================================================================

  /**
   * Get care circle for family
   */
  async getCareCircle(familyId: string): Promise<CareCircle | null> {
    return mockCareCircles.get(familyId) || null;
  }

  /**
   * Create or update care circle
   */
  async createCareCircle(
    familyId: string,
    primaryMemberId: string,
    settings?: Partial<CareCircleSettings>
  ): Promise<CareCircle> {
    const family = mockFamilies.get(familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${familyId} not found`);
    }

    const now = new Date();
    const primaryMember = family.members.find(m => m.id === primaryMemberId);

    const defaultSettings: CareCircleSettings = {
      emergencyAlerts: true,
      medicationAlerts: true,
      appointmentAlerts: true,
      labResultAlerts: true,
      alertDelayMinutes: 0,
      ...settings,
    };

    const careCircle: CareCircle = {
      id: this.generateId(),
      familyId,
      primaryMemberId,
      members: primaryMember ? [
        {
          userId: primaryMember.userId,
          displayName: primaryMember.displayName,
          role: 'primary',
          permissions: {
            canViewRecords: true,
            canViewMedications: true,
            canViewAppointments: true,
            canReceiveAlerts: true,
            canCoordinateCare: true,
            isEmergencyContact: true,
          },
          addedAt: now,
          addedBy: primaryMemberId,
        },
      ] : [],
      settings: defaultSettings,
      createdAt: now,
    };

    mockCareCircles.set(familyId, careCircle);

    return careCircle;
  }

  /**
   * Add member to care circle
   */
  async addToCareCircle(
    familyId: string,
    userId: string,
    displayName: string,
    role: CareCircleRole
  ): Promise<CareCircle> {
    let careCircle = mockCareCircles.get(familyId);

    if (!careCircle) {
      careCircle = await this.createCareCircle(familyId, '');
    }

    if (careCircle.members.some(m => m.userId === userId)) {
      throw new FamilyGraphError(
        'ALREADY_IN_CIRCLE',
        `User ${userId} is already in the care circle`
      );
    }

    const newMember: CareCircleMember = {
      userId,
      displayName,
      role,
      permissions: {
        canViewRecords: role === 'primary' || role === 'caregiver',
        canViewMedications: true,
        canViewAppointments: true,
        canReceiveAlerts: role !== 'medical',
        canCoordinateCare: role === 'primary' || role === 'caregiver',
        isEmergencyContact: role === 'emergency' || role === 'primary',
      },
      addedAt: new Date(),
      addedBy: careCircle.primaryMemberId || '',
    };

    careCircle.members.push(newMember);

    return careCircle;
  }

  /**
   * Remove member from care circle
   */
  async removeFromCareCircle(familyId: string, userId: string): Promise<CareCircle> {
    const careCircle = mockCareCircles.get(familyId);

    if (!careCircle) {
      throw new FamilyGraphError('CIRCLE_NOT_FOUND', `Care circle for family ${familyId} not found`);
    }

    const memberIndex = careCircle.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new FamilyGraphError('MEMBER_NOT_IN_CIRCLE', `User ${userId} not in care circle`);
    }

    // Cannot remove primary member
    if (careCircle.members[memberIndex].role === 'primary') {
      throw new FamilyGraphError(
        'CANNOT_REMOVE_PRIMARY',
        'Cannot remove the primary member from care circle'
      );
    }

    careCircle.members.splice(memberIndex, 1);

    return careCircle;
  }

  // ===========================================================================
  // Family Alerts
  // ===========================================================================

  /**
   * Create family alert
   */
  async createFamilyAlert(
    alert: Omit<FamilyAlert, 'id' | 'createdAt' | 'acknowledgedAt' | 'acknowledgedBy'>
  ): Promise<FamilyAlert> {
    const family = mockFamilies.get(alert.familyId);
    if (!family) {
      throw new FamilyGraphError('FAMILY_NOT_FOUND', `Family ${alert.familyId} not found`);
    }

    const newAlert: FamilyAlert = {
      ...alert,
      id: this.generateId(),
      createdAt: new Date(),
    };

    mockFamilyAlerts.push(newAlert);

    // If high/critical severity, notify all care circle members
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await this.notifyCareCircleOfAlert(alert);
    }

    return newAlert;
  }

  /**
   * Acknowledge family alert
   */
  async acknowledgeFamilyAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<FamilyAlert> {
    const alert = mockFamilyAlerts.find(a => a.id === alertId);

    if (!alert) {
      throw new FamilyGraphError('ALERT_NOT_FOUND', `Alert ${alertId} not found`);
    }

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    return alert;
  }

  /**
   * Get family alerts
   */
  async getFamilyAlerts(
    familyId: string,
    options?: {
      memberId?: string;
      severity?: AlertSeverity;
      acknowledged?: boolean;
      limit?: number;
    }
  ): Promise<FamilyAlert[]> {
    let alerts = mockFamilyAlerts.filter(a => a.familyId === familyId);

    if (options?.memberId) {
      alerts = alerts.filter(a => a.memberId === options.memberId);
    }

    if (options?.severity) {
      alerts = alerts.filter(a => a.severity === options.severity);
    }

    if (options?.acknowledged !== undefined) {
      alerts = alerts.filter(
        a => (a.acknowledgedAt !== undefined) === options.acknowledged
      );
    }

    return alerts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, options?.limit || 50);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private getDefaultPermissions(role: FamilyMemberRole): FamilyMemberPermissions {
    switch (role) {
      case 'patient':
        return {
          viewRecords: 'full',
          viewMedications: 'full',
          viewAppointments: 'full',
          receiveAlerts: true,
          canSchedule: true,
          canMessage: true,
          canMakePayments: true,
          emergencyAccess: true,
        };
      case 'primary_caregiver':
        return {
          viewRecords: 'full',
          viewMedications: 'full',
          viewAppointments: 'full',
          receiveAlerts: true,
          canSchedule: true,
          canMessage: true,
          canMakePayments: true,
          emergencyAccess: true,
        };
      case 'spouse':
        return {
          viewRecords: 'full',
          viewMedications: 'full',
          viewAppointments: 'full',
          receiveAlerts: true,
          canSchedule: true,
          canMessage: true,
          canMakePayments: false,
          emergencyAccess: true,
        };
      case 'child':
        return {
          viewRecords: 'none',
          viewMedications: 'limited',
          viewAppointments: 'limited',
          receiveAlerts: false,
          canSchedule: false,
          canMessage: false,
          canMakePayments: false,
          emergencyAccess: false,
        };
      case 'other_caregiver':
        return {
          viewRecords: 'limited',
          viewMedications: 'limited',
          viewAppointments: 'limited',
          receiveAlerts: true,
          canSchedule: false,
          canMessage: true,
          canMakePayments: false,
          emergencyAccess: true,
        };
      case 'family':
      default:
        return {
          viewRecords: 'limited',
          viewMedications: 'limited',
          viewAppointments: 'limited',
          receiveAlerts: true,
          canSchedule: false,
          canMessage: false,
          canMakePayments: false,
          emergencyAccess: false,
        };
    }
  }

  private async notifyCareCircleOfAlert(alert: FamilyAlert): Promise<void> {
    // In production, integrate with notification service
    console.log(`Notifying care circle of ${alert.severity} alert: ${alert.title}`);
  }

  private generateId(): string {
    return `family_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class FamilyGraphError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'FamilyGraphError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createFamilyGraphService(): FamilyGraphService {
  return new FamilyGraphService();
}

// ============================================================================
// Default Export
// ============================================================================

export default FamilyGraphService;
