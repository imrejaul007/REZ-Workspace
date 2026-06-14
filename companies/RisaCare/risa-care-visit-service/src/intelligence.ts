import { logger } from '../../shared/logger';
/**
 * RisaCare Visit Service - Intelligence Integration
 *
 * Connects healthcare visit operations to RisaCare Intelligence
 * for patient insights and health analytics.
 */

import { createRisaCareIntelligence, RisaCareIntelligence } from '../../../../product-intelligence/risacare-intelligence/src/index.js';

let intel: RisaCareIntelligence | null = null;

/**
 * Initialize RisaCare Intelligence
 */
export async function initializeRisaCareIntelligence(config?: {
  facilityId?: string;
  facilityName?: string;
}): Promise<RisaCareIntelligence> {
  if (intel) return intel;

  try {
    intel = createRisaCareIntelligence(config);
    await intel.initialize();
    logger.info('✅ RisaCare Intelligence initialized');
    return intel;
  } catch (error) {
    logger.error('Failed to initialize RisaCare Intelligence:', error);
    return null as any;
  }
}

/**
 * Get intelligence instance
 */
export function getRisaCareIntelligence(): RisaCareIntelligence | null {
  return intel;
}

// ============================================
// PATIENT HOOKS
// ============================================

/**
 * Emit when a patient is registered
 */
export async function onPatientRegistered(params: {
  patientId: string;
  name: string;
  phone: string;
  conditions?: string[];
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'risa-care-visit-service',
    name: 'patient_registered',
    payload: params,
    priority: 'high',
  });
}

// ============================================
// VISIT HOOKS
// ============================================

/**
 * Emit when a visit is scheduled
 */
export async function onVisitScheduled(params: {
  visitId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: Date;
  type: 'in-person' | 'telemedicine' | 'home-visit';
  chiefComplaint: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'risa-care-visit-service',
    name: 'visit_scheduled',
    payload: params,
    priority: 'medium',
  });
}

/**
 * Emit when a visit is completed
 */
export async function onVisitCompleted(params: {
  visitId: string;
  patientId: string;
  diagnosis: string;
  prescription?: string;
  followUpDate?: Date;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'risa-care-visit-service',
    name: 'visit_completed',
    payload: params,
    priority: 'high',
  });
}

/**
 * Emit when vitals are recorded
 */
export async function onVitalsRecorded(params: {
  patientId: string;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'risa-care-visit-service',
    name: 'vitals_recorded',
    payload: params,
    priority: 'medium',
  });
}

// ============================================
// PRESCRIPTION HOOKS
// ============================================

/**
 * Emit when a prescription is created
 */
export async function onPrescriptionCreated(params: {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medications: Array<{ name: string; dosage: string }>;
  diagnosis: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'user_action',
    source: 'risa-care-visit-service',
    name: 'prescription_created',
    payload: params,
    priority: 'medium',
  });
}

// ============================================
// TELEMEDICINE HOOKS
// ============================================

/**
 * Emit when telemedicine session starts
 */
export async function onTelemedicineStarted(params: {
  sessionId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'system',
    source: 'risa-care-visit-service',
    name: 'telemedicine_started',
    payload: params,
    priority: 'high',
  });
}

/**
 * Emit when telemedicine session ends
 */
export async function onTelemedicineEnded(params: {
  sessionId: string;
  patientId: string;
  diagnosis?: string;
  prescription?: string;
  duration: number;
}): Promise<void> {
  if (!intel) return;

  await intel.emitSignal({
    type: 'system',
    source: 'risa-care-visit-service',
    name: 'telemedicine_ended',
    payload: params,
    priority: 'high',
  });
}

// ============================================
// INSIGHTS
// ============================================

/**
 * Get patient health insights
 */
export async function getPatientInsights(patientId: string) {
  if (!intel) return null;

  try {
    return await intel.patients.getPatientInsights(patientId);
  } catch (error) {
    logger.error('Failed to get patient insights:', error);
    return null;
  }
}

/**
 * Get patient vitals trend
 */
export async function getVitalsTrend(patientId: string, metric: string, days: number = 30) {
  if (!intel) return [];

  try {
    return await intel.vitals.getVitalTrends(patientId, metric, days);
  } catch (error) {
    logger.error('Failed to get vitals trend:', error);
    return [];
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get intelligence stats
 */
export function getIntelligenceStats() {
  if (!intel) return { status: 'not_initialized', totalSignals: 0 };
  return intel.getStats();
}

/**
 * Shutdown intelligence
 */
export async function shutdownRisaCareIntelligence() {
  if (intel) {
    await intel.shutdown();
    intel = null;
    logger.info('🛑 RisaCare Intelligence shutdown');
  }
}
