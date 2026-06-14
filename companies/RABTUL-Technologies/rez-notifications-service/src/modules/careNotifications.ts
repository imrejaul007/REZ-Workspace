/**
 * Care Notifications Module for RABTUL Notifications Service
 * Manages healthcare notifications: medication reminders, appointments, family alerts
 * Version: 1.0.0
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

// Medication Reminders
export interface MedicationReminder {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  schedule: MedicationSchedule;
  times: MedicationTime[];
  frequency: MedicationFrequency;
  refillAlerts: RefillAlertSettings;
  status: ReminderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'as_needed';
  times: MedicationTime[];
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: DayOfWeek[];
}

export interface MedicationTime {
  time: string; // HH:mm format
  withFood?: boolean;
  beforeAfter?: 'before' | 'after' | 'with';
}

export interface MedicationFrequency {
  everyNHours?: number;
  everyNDays?: number;
  timesPerDay?: number;
  specificTimes?: string[]; // HH:mm format
}

export interface RefillAlertSettings {
  enabled: boolean;
  thresholdDays: number; // Alert when X days supply remaining
  autoRefillEnabled: boolean;
  pharmacyId?: string;
}

export type ReminderStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// Appointment Reminders
export interface AppointmentReminder {
  id: string;
  patientId: string;
  appointmentId: string;
  appointmentType: AppointmentType;
  providerName: string;
  providerId: string;
  location?: string;
  isVirtual: boolean;
  appointmentDate: Date;
  duration: number; // minutes
  reminderSchedule: AppointmentReminderSchedule;
  status: AppointmentReminderStatus;
  createdAt: Date;
}

export interface AppointmentReminderSchedule {
  reminders: ScheduledReminder[];
  advanceNoticeHours: number[];
  familyNotifications: boolean;
  rescheduleNotifications: boolean;
}

export interface ScheduledReminder {
  id: string;
  type: 'push' | 'sms' | 'email' | 'whatsapp';
  sendAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

export type AppointmentType = 'checkup' | 'specialist' | 'urgent' | 'telehealth' | 'lab' | 'imaging' | 'procedure';
export type AppointmentReminderStatus = 'scheduled' | 'sent' | 'cancelled' | 'completed';

// Family Alerts
export interface FamilyAlert {
  id: string;
  familyId: string;
  alertType: FamilyAlertType;
  priority: AlertPriority;
  recipientIds: string[];
  title: string;
  message: string;
  relatedEntity?: {
    type: 'medication' | 'appointment' | 'vital' | 'lab_result';
    id: string;
  };
  createdAt: Date;
  readAt?: Map<string, Date>;
}

export type FamilyAlertType = 'emergency' | 'medication_missed' | 'appointment_reminder' | 'vital_alert' | 'general';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

// Health Alerts
export interface HealthAlert {
  id: string;
  patientId: string;
  alertType: HealthAlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string; // lab system, device, provider
  relatedEntity?: {
    type: 'lab_result' | 'vital' | 'medication' | 'appointment';
    id: string;
  };
  recommendedAction?: string;
  acknowledgment?: {
    acknowledgedBy: string;
    acknowledgedAt: Date;
    notes?: string;
  };
  createdAt: Date;
}

export type HealthAlertType = 'abnormal_result' | 'follow_up_reminder' | 'critical_vital' | 'drug_interaction' | 'allergy_alert';
export type AlertSeverity = 'info' | 'warning' | 'critical';

// Snooze and Tracking
export interface ReminderSnooze {
  reminderId: string;
  originalTime: Date;
  snoozedUntil: Date;
  snoozeDuration: number; // minutes
  snoozedBy: string;
}

export interface MedicationLog {
  id: string;
  reminderId: string;
  medicationId: string;
  patientId: string;
  scheduledTime: Date;
  status: MedicationLogStatus;
  takenAt?: Date;
  skippedAt?: Date;
  skippedReason?: string;
  notes?: string;
  verifiedBy?: string; // Caregiver verification
}

export type MedicationLogStatus = 'pending' | 'taken' | 'skipped' | 'missed';

// Notification Channels
export interface NotificationChannel {
  type: 'push' | 'sms' | 'email' | 'whatsapp' | 'call';
  enabled: boolean;
  contactInfo?: string;
  quietHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const MedicationTimeSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'),
  withFood: z.boolean().optional(),
  beforeAfter: z.enum(['before', 'after', 'with']).optional(),
});

export const MedicationScheduleSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom', 'as_needed']),
  times: z.array(MedicationTimeSchema),
  startDate: z.date(),
  endDate: z.date().optional(),
  daysOfWeek: z.array(z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])).optional(),
});

export const RefillAlertSettingsSchema = z.object({
  enabled: z.boolean(),
  thresholdDays: z.number().min(1).max(30),
  autoRefillEnabled: z.boolean(),
  pharmacyId: z.string().optional(),
});

export const MedicationReminderSchema = z.object({
  patientId: z.string().min(1),
  medicationId: z.string().min(1),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  schedule: MedicationScheduleSchema,
  times: z.array(MedicationTimeSchema),
  refillAlerts: RefillAlertSettingsSchema,
});

export const AppointmentReminderScheduleSchema = z.object({
  reminders: z.array(z.object({
    id: z.string(),
    type: z.enum(['push', 'sms', 'email', 'whatsapp']),
    sendAt: z.date(),
    sentAt: z.date().optional(),
    status: z.enum(['pending', 'sent', 'failed']),
  })),
  advanceNoticeHours: z.array(z.number().min(1).max(168)), // up to 1 week
  familyNotifications: z.boolean(),
  rescheduleNotifications: z.boolean(),
});

// ============================================================================
// Mock Data Stores (for development)
// ============================================================================

const mockMedicationReminders: Map<string, MedicationReminder> = new Map();
const mockAppointmentReminders: Map<string, AppointmentReminder> = new Map();
const mockFamilyAlerts: FamilyAlert[] = [];
const mockHealthAlerts: Map<string, HealthAlert[]> = new Map();
const mockSnoozes: Map<string, ReminderSnooze> = new Map();
const mockMedicationLogs: MedicationLog[] = [];

// ============================================================================
// Service Class
// ============================================================================

export class CareNotificationsService {
  private readonly DEFAULT_SNOOZE_MINUTES = 15;
  private readonly DEFAULT_REFILL_THRESHOLD_DAYS = 7;

  // ===========================================================================
  // Medication Reminders
  // ===========================================================================

  /**
   * Schedule a medication reminder
   */
  async scheduleReminder(
    reminder: Omit<MedicationReminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<MedicationReminder> {
    const validated = MedicationReminderSchema.omit({
      times: true,
    }).safeParse(reminder);

    if (!validated.success) {
      throw new NotificationError(
        'VALIDATION_FAILED',
        `Invalid reminder data: ${validated.error.message}`
      );
    }

    const now = new Date();
    const newReminder: MedicationReminder = {
      ...reminder,
      id: this.generateId(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    mockMedicationReminders.set(newReminder.id, newReminder);

    // Schedule notifications for upcoming doses
    await this.scheduleMedicationNotifications(newReminder);

    return newReminder;
  }

  /**
   * Cancel a medication reminder
   */
  async cancelReminder(
    reminderId: string,
    patientId: string
  ): Promise<MedicationReminder> {
    const reminder = mockMedicationReminders.get(reminderId);

    if (!reminder) {
      throw new NotificationError('REMINDER_NOT_FOUND', `Reminder ${reminderId} not found`);
    }

    if (reminder.patientId !== patientId) {
      throw new NotificationError('UNAUTHORIZED', 'Not authorized to cancel this reminder');
    }

    reminder.status = 'cancelled';
    reminder.updatedAt = new Date();

    // Cancel scheduled notifications
    await this.cancelScheduledNotifications(reminderId);

    return reminder;
  }

  /**
   * Snooze a medication reminder
   */
  async snoozeReminder(
    reminderId: string,
    patientId: string,
    durationMinutes?: number
  ): Promise<ReminderSnooze> {
    const reminder = mockMedicationReminders.get(reminderId);

    if (!reminder) {
      throw new NotificationError('REMINDER_NOT_FOUND', `Reminder ${reminderId} not found`);
    }

    if (reminder.patientId !== patientId) {
      throw new NotificationError('UNAUTHORIZED', 'Not authorized to snooze this reminder');
    }

    const duration = durationMinutes || this.DEFAULT_SNOOZE_MINUTES;
    const snoozedUntil = new Date(Date.now() + duration * 60 * 1000);

    const snooze: ReminderSnooze = {
      reminderId,
      originalTime: new Date(),
      snoozedUntil,
      snoozeDuration: duration,
      snoozedBy: patientId,
    };

    mockSnoozes.set(reminderId, snooze);

    // Schedule delayed notification
    await this.scheduleSnoozedNotification(reminderId, snoozedUntil);

    return snooze;
  }

  /**
   * Mark medication as taken
   */
  async markTaken(
    reminderId: string,
    patientId: string,
    takenAt?: Date,
    notes?: string
  ): Promise<MedicationLog> {
    const reminder = mockMedicationReminders.get(reminderId);

    if (!reminder) {
      throw new NotificationError('REMINDER_NOT_FOUND', `Reminder ${reminderId} not found`);
    }

    const now = takenAt || new Date();

    const log: MedicationLog = {
      id: this.generateId(),
      reminderId,
      medicationId: reminder.medicationId,
      patientId,
      scheduledTime: now,
      status: 'taken',
      takenAt: now,
      notes,
    };

    mockMedicationLogs.push(log);

    // Remove snooze if exists
    mockSnoozes.delete(reminderId);

    // Check for refill alert
    await this.checkRefillAlert(reminder);

    return log;
  }

  /**
   * Mark medication as skipped
   */
  async markSkipped(
    reminderId: string,
    patientId: string,
    reason?: string
  ): Promise<MedicationLog> {
    const reminder = mockMedicationReminders.get(reminderId);

    if (!reminder) {
      throw new NotificationError('REMINDER_NOT_FOUND', `Reminder ${reminderId} not found`);
    }

    const now = new Date();

    const log: MedicationLog = {
      id: this.generateId(),
      reminderId,
      medicationId: reminder.medicationId,
      patientId,
      scheduledTime: now,
      status: 'skipped',
      skippedAt: now,
      skippedReason: reason,
    };

    mockMedicationLogs.push(log);

    // Remove snooze if exists
    mockSnoozes.delete(reminderId);

    // Notify family if configured
    await this.notifyFamilyOfSkippedMedication(reminder, patientId, reason);

    return log;
  }

  /**
   * Get medication reminders for a patient
   */
  async getMedicationReminders(
    patientId: string,
    status?: ReminderStatus
  ): Promise<MedicationReminder[]> {
    const reminders = Array.from(mockMedicationReminders.values()).filter(
      r => r.patientId === patientId
    );

    if (status) {
      return reminders.filter(r => r.status === status);
    }

    return reminders;
  }

  /**
   * Get medication log history
   */
  async getMedicationLogHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<MedicationLog[]> {
    let logs = mockMedicationLogs.filter(log => log.patientId === patientId);

    if (startDate) {
      logs = logs.filter(log => log.scheduledTime >= startDate);
    }

    if (endDate) {
      logs = logs.filter(log => log.scheduledTime <= endDate);
    }

    return logs
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())
      .slice(0, limit);
  }

  /**
   * Pause medication reminder
   */
  async pauseReminder(
    reminderId: string,
    patientId: string,
    pauseUntil?: Date
  ): Promise<MedicationReminder> {
    const reminder = mockMedicationReminders.get(reminderId);

    if (!reminder) {
      throw new NotificationError('REMINDER_NOT_FOUND', `Reminder ${reminderId} not found`);
    }

    if (reminder.patientId !== patientId) {
      throw new NotificationError('UNAUTHORIZED', 'Not authorized to pause this reminder');
    }

    reminder.status = 'paused';
    reminder.schedule.endDate = pauseUntil;
    reminder.updatedAt = new Date();

    await this.cancelScheduledNotifications(reminderId);

    return reminder;
  }

  /**
   * Resume medication reminder
   */
  async resumeReminder(
    reminderId: string,
    patientId: string
  ): Promise<MedicationReminder> {
    const reminder = mockMedicationReminders.get(reminderId);

    if (!reminder) {
      throw new NotificationError('REMINDER_NOT_FOUND', `Reminder ${reminderId} not found`);
    }

    if (reminder.patientId !== patientId) {
      throw new NotificationError('UNAUTHORIZED', 'Not authorized to resume this reminder');
    }

    if (reminder.status !== 'paused') {
      throw new NotificationError('INVALID_STATUS', 'Reminder is not paused');
    }

    reminder.status = 'active';
    reminder.schedule.endDate = undefined;
    reminder.updatedAt = new Date();

    await this.scheduleMedicationNotifications(reminder);

    return reminder;
  }

  // ===========================================================================
  // Appointment Reminders
  // ===========================================================================

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminder(
    appointment: Omit<AppointmentReminder, 'id' | 'createdAt' | 'status'>
  ): Promise<AppointmentReminder> {
    const now = new Date();
    const reminder: AppointmentReminder = {
      ...appointment,
      id: this.generateId(),
      status: 'scheduled',
      createdAt: now,
    };

    mockAppointmentReminders.set(reminder.id, reminder);

    // Schedule notifications based on advance notice hours
    await this.scheduleAppointmentNotifications(reminder);

    return reminder;
  }

  /**
   * Cancel appointment reminder
   */
  async cancelAppointmentReminder(
    appointmentId: string
  ): Promise<void> {
    const reminder = Array.from(mockAppointmentReminders.values()).find(
      r => r.appointmentId === appointmentId
    );

    if (reminder) {
      reminder.status = 'cancelled';
    }
  }

  /**
   * Get appointment reminders for a patient
   */
  async getAppointmentReminders(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AppointmentReminder[]> {
    let reminders = Array.from(mockAppointmentReminders.values()).filter(
      r => r.patientId === patientId && r.status === 'scheduled'
    );

    if (startDate) {
      reminders = reminders.filter(r => r.appointmentDate >= startDate);
    }

    if (endDate) {
      reminders = reminders.filter(r => r.appointmentDate <= endDate);
    }

    return reminders.sort(
      (a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()
    );
  }

  // ===========================================================================
  // Family Alerts
  // ===========================================================================

  /**
   * Notify a family member
   */
  async notifyFamilyMember(
    familyId: string,
    memberId: string,
    alert: Omit<FamilyAlert, 'id' | 'familyId' | 'createdAt' | 'readAt'>
  ): Promise<FamilyAlert> {
    const familyAlert: FamilyAlert = {
      ...alert,
      id: this.generateId(),
      familyId,
      recipientIds: [memberId],
      readAt: new Map(),
      createdAt: new Date(),
    };

    mockFamilyAlerts.push(familyAlert);

    // Send notification via configured channel
    await this.sendFamilyNotification(familyAlert, memberId);

    return familyAlert;
  }

  /**
   * Notify care circle (all designated family members)
   */
  async notifyCareCircle(
    familyId: string,
    alert: Omit<FamilyAlert, 'id' | 'familyId' | 'createdAt' | 'readAt'>
  ): Promise<FamilyAlert> {
    // In production, fetch care circle members from family graph
    const careCircleMembers = ['member_1', 'member_2', 'member_3']; // Mock

    const familyAlert: FamilyAlert = {
      ...alert,
      id: this.generateId(),
      familyId,
      recipientIds: careCircleMembers,
      readAt: new Map(),
      createdAt: new Date(),
    };

    mockFamilyAlerts.push(familyAlert);

    // Send notifications to all care circle members
    for (const memberId of careCircleMembers) {
      await this.sendFamilyNotification(familyAlert, memberId);
    }

    return familyAlert;
  }

  /**
   * Get unread family alerts for a member
   */
  async getUnreadFamilyAlerts(
    familyId: string,
    memberId: string
  ): Promise<FamilyAlert[]> {
    return mockFamilyAlerts.filter(
      alert =>
        alert.familyId === familyId &&
        alert.recipientIds.includes(memberId) &&
        !alert.readAt?.has(memberId)
    );
  }

  /**
   * Mark family alert as read
   */
  async markFamilyAlertRead(
    alertId: string,
    memberId: string
  ): Promise<void> {
    const alert = mockFamilyAlerts.find(a => a.id === alertId);

    if (alert && alert.recipientIds.includes(memberId)) {
      alert.readAt?.set(memberId, new Date());
    }
  }

  // ===========================================================================
  // Health Alerts
  // ===========================================================================

  /**
   * Create abnormal lab result alert
   */
  async createAbnormalResultAlert(
    patientId: string,
    resultId: string,
    resultName: string,
    value: string,
    normalRange: string,
    severity: AlertSeverity
  ): Promise<HealthAlert> {
    const alert: HealthAlert = {
      id: this.generateId(),
      patientId,
      alertType: 'abnormal_result',
      severity,
      title: `Abnormal Lab Result: ${resultName}`,
      description: `Your ${resultName} result of ${value} is outside the normal range (${normalRange}).`,
      source: 'lab_system',
      relatedEntity: {
        type: 'lab_result',
        id: resultId,
      },
      createdAt: new Date(),
    };

    // Store alert
    const patientAlerts = mockHealthAlerts.get(patientId) || [];
    patientAlerts.push(alert);
    mockHealthAlerts.set(patientId, patientAlerts);

    // Notify care circle for critical alerts
    if (severity === 'critical') {
      await this.notifyCareCircleOfHealthAlert(patientId, alert);
    }

    return alert;
  }

  /**
   * Create follow-up reminder alert
   */
  async createFollowUpReminder(
    patientId: string,
    appointmentId: string,
    providerName: string,
    reason: string,
    dueDate: Date
  ): Promise<HealthAlert> {
    const alert: HealthAlert = {
      id: this.generateId(),
      patientId,
      alertType: 'follow_up_reminder',
      severity: 'info',
      title: `Follow-up Reminder: ${providerName}`,
      description: reason,
      source: 'appointment_system',
      relatedEntity: {
        type: 'appointment',
        id: appointmentId,
      },
      createdAt: new Date(),
    };

    const patientAlerts = mockHealthAlerts.get(patientId) || [];
    patientAlerts.push(alert);
    mockHealthAlerts.set(patientId, patientAlerts);

    return alert;
  }

  /**
   * Get health alerts for a patient
   */
  async getHealthAlerts(
    patientId: string,
    acknowledged?: boolean,
    severity?: AlertSeverity,
    limit: number = 50
  ): Promise<HealthAlert[]> {
    let alerts = mockHealthAlerts.get(patientId) || [];

    if (acknowledged !== undefined) {
      alerts = alerts.filter(
        a => (a.acknowledgment !== undefined) === acknowledged
      );
    }

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Acknowledge a health alert
   */
  async acknowledgeHealthAlert(
    alertId: string,
    patientId: string,
    notes?: string
  ): Promise<HealthAlert> {
    const alerts = mockHealthAlerts.get(patientId);
    const alert = alerts?.find(a => a.id === alertId);

    if (!alert) {
      throw new NotificationError('ALERT_NOT_FOUND', `Alert ${alertId} not found`);
    }

    alert.acknowledgment = {
      acknowledgedBy: patientId,
      acknowledgedAt: new Date(),
      notes,
    };

    return alert;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async scheduleMedicationNotifications(reminder: MedicationReminder): Promise<void> {
    // In production, this would schedule actual notifications via push/SMS/etc
    console.log(`Scheduling medication notifications for ${reminder.medicationName}`);
  }

  private async cancelScheduledNotifications(reminderId: string): Promise<void> {
    // In production, cancel actual scheduled notifications
    console.log(`Cancelling notifications for reminder ${reminderId}`);
  }

  private async scheduleSnoozedNotification(
    reminderId: string,
    snoozedUntil: Date
  ): Promise<void> {
    // In production, schedule delayed notification
    console.log(`Snoozed notification for ${reminderId} until ${snoozedUntil}`);
  }

  private async checkRefillAlert(reminder: MedicationReminder): Promise<void> {
    if (reminder.refillAlerts.enabled) {
      // In production, check remaining supply and trigger refill alert if needed
      console.log(`Checking refill status for ${reminder.medicationName}`);
    }
  }

  private async notifyFamilyOfSkippedMedication(
    reminder: MedicationReminder,
    patientId: string,
    reason?: string
  ): Promise<void> {
    // In production, notify family members via care circle
    console.log(`Notifying family of skipped medication: ${reminder.medicationName}`);
  }

  private async scheduleAppointmentNotifications(reminder: AppointmentReminder): Promise<void> {
    // In production, schedule appointment notifications at configured intervals
    console.log(`Scheduling appointment notifications for ${reminder.appointmentId}`);
  }

  private async sendFamilyNotification(
    alert: FamilyAlert,
    memberId: string
  ): Promise<void> {
    // In production, send notification via configured channel (push/SMS/email)
    console.log(`Sending family notification to ${memberId}: ${alert.title}`);
  }

  private async notifyCareCircleOfHealthAlert(
    patientId: string,
    alert: HealthAlert
  ): Promise<void> {
    // In production, notify all care circle members
    console.log(`Notifying care circle of health alert: ${alert.title}`);
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class NotificationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCareNotificationsService(): CareNotificationsService {
  return new CareNotificationsService();
}

// ============================================================================
// Default Export
// ============================================================================

export default CareNotificationsService;
