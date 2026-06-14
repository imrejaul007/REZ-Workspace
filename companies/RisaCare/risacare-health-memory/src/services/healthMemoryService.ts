/**
 * Health Memory Service
 *
 * Core service for storing and retrieving health memories
 * Following RTNM Doctrine: Identity → Memory → Knowledge → Twin → Agent → Intelligence
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../models/database.js';
import {
  Person, PersonSchema,
  MedicalReport, MedicalReportSchema,
  Medication, MedicationSchema,
  Symptom, SymptomSchema,
  Condition, ConditionSchema,
  Appointment, AppointmentSchema,
  Allergy, AllergySchema,
  Vaccination, VaccinationSchema,
  Procedure, ProcedureSchema,
  MenstrualCycle, MenstrualCycleSchema,
  Pregnancy, PregnancySchema,
  FertilityWindow, FertilityWindowSchema,
  FamilyMember, FamilyMemberSchema,
  LifeEvent, LifeEventSchema,
  HealthInsurance, HealthInsuranceSchema,
  HealthMemoryStats,
  HealthTimelineQuery,
  HealthSummaryQuery
} from '../types/index.js';

// ============================================
// PERSON MANAGEMENT
// ============================================

export class HealthMemoryService {

  /**
   * Create or get person by CorpID
   */
  async getOrCreatePerson(corpId: string, personData?: Partial<Person>): Promise<Person> {
    // Check if person exists
    const existing = await query(
      'SELECT * FROM persons WHERE corp_id = $1',
      [corpId]
    );

    if (existing.rows.length > 0) {
      return this.mapPersonFromDb(existing.rows[0]);
    }

    // Create new person
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO persons (id, corp_id, first_name, last_name, date_of_birth, gender, blood_type, height_cm, weight_kg, allergies, emergency_contact, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        corpId,
        personData?.firstName || null,
        personData?.lastName || null,
        personData?.dateOfBirth || null,
        personData?.gender || null,
        personData?.bloodType || null,
        personData?.heightCm || null,
        personData?.weightKg || null,
        JSON.stringify(personData?.allergies || []),
        JSON.stringify(personData?.emergencyContact || null),
        now,
        now
      ]
    );

    return this.mapPersonFromDb(result.rows[0]);
  }

  /**
   * Get person by ID
   */
  async getPerson(personId: string): Promise<Person | null> {
    const result = await query('SELECT * FROM persons WHERE id = $1', [personId]);
    if (result.rows.length === 0) return null;
    return this.mapPersonFromDb(result.rows[0]);
  }

  /**
   * Get person by CorpID
   */
  async getPersonByCorpId(corpId: string): Promise<Person | null> {
    const result = await query('SELECT * FROM persons WHERE corp_id = $1', [corpId]);
    if (result.rows.length === 0) return null;
    return this.mapPersonFromDb(result.rows[0]);
  }

  /**
   * Update person
   */
  async updatePerson(personId: string, data: Partial<Person>): Promise<Person | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }
    if (data.dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      values.push(data.dateOfBirth);
    }
    if (data.gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(data.gender);
    }
    if (data.bloodType !== undefined) {
      updates.push(`blood_type = $${paramIndex++}`);
      values.push(data.bloodType);
    }
    if (data.heightCm !== undefined) {
      updates.push(`height_cm = $${paramIndex++}`);
      values.push(data.heightCm);
    }
    if (data.weightKg !== undefined) {
      updates.push(`weight_kg = $${paramIndex++}`);
      values.push(data.weightKg);
    }
    if (data.allergies !== undefined) {
      updates.push(`allergies = $${paramIndex++}`);
      values.push(JSON.stringify(data.allergies));
    }
    if (data.emergencyContact !== undefined) {
      updates.push(`emergency_contact = $${paramIndex++}`);
      values.push(JSON.stringify(data.emergencyContact));
    }

    if (updates.length === 0) return this.getPerson(personId);

    values.push(personId);
    const result = await query(
      `UPDATE persons SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return this.mapPersonFromDb(result.rows[0]);
  }

  // ============================================
  // MEDICAL REPORTS
  // ============================================

  async addMedicalReport(personId: string, report: Omit<MedicalReport, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<MedicalReport> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO medical_reports (id, person_id, title, type, report_date, facility, doctor_name, specialty, summary, findings, attachments, extracted_text, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        id, personId, report.title, report.type, report.reportDate,
        report.facility || null, report.doctorName || null, report.specialty || null,
        report.summary || null, JSON.stringify(report.findings),
        JSON.stringify(report.attachments), report.extractedText || null,
        JSON.stringify(report.metadata || {}), now, now
      ]
    );

    return this.mapReportFromDb(result.rows[0]);
  }

  async getMedicalReports(personId: string, options?: { limit?: number; type?: string; startDate?: string; endDate?: string }): Promise<MedicalReport[]> {
    let sql = 'SELECT * FROM medical_reports WHERE person_id = $1';
    const params: any[] = [personId];
    let paramIndex = 2;

    if (options?.type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(options.type);
    }
    if (options?.startDate) {
      sql += ` AND report_date >= $${paramIndex++}`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ` AND report_date <= $${paramIndex++}`;
      params.push(options.endDate);
    }

    sql += ' ORDER BY report_date DESC';
    if (options?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }

    const result = await query(sql, params);
    return result.rows.map(this.mapReportFromDb);
  }

  async getMedicalReport(reportId: string): Promise<MedicalReport | null> {
    const result = await query('SELECT * FROM medical_reports WHERE id = $1', [reportId]);
    if (result.rows.length === 0) return null;
    return this.mapReportFromDb(result.rows[0]);
  }

  // ============================================
  // MEDICATIONS
  // ============================================

  async addMedication(personId: string, medication: Omit<Medication, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO medications (id, person_id, name, generic_name, dosage, frequency, route, start_date, end_date, prescribed_by, purpose, side_effects, interactions, is_active, reminders, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        id, personId, medication.name, medication.genericName || null,
        medication.dosage, medication.frequency, medication.route,
        medication.startDate, medication.endDate || null,
        medication.prescribedBy || null, medication.purpose || null,
        JSON.stringify(medication.sideEffects),
        JSON.stringify(medication.interactions),
        medication.isActive ?? true,
        JSON.stringify(medication.reminders),
        now, now
      ]
    );

    return this.mapMedicationFromDb(result.rows[0]);
  }

  async getMedications(personId: string, activeOnly?: boolean): Promise<Medication[]> {
    let sql = 'SELECT * FROM medications WHERE person_id = $1';
    if (activeOnly) {
      sql += ' AND is_active = true';
    }
    sql += ' ORDER BY start_date DESC';

    const result = await query(sql, [personId]);
    return result.rows.map(this.mapMedicationFromDb);
  }

  async updateMedicationStatus(medicationId: string, isActive: boolean): Promise<Medication | null> {
    const result = await query(
      'UPDATE medications SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, medicationId]
    );
    if (result.rows.length === 0) return null;
    return this.mapMedicationFromDb(result.rows[0]);
  }

  // ============================================
  // SYMPTOMS
  // ============================================

  async logSymptom(personId: string, symptom: Omit<Symptom, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Symptom> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO symptoms (id, person_id, name, severity, body_area, description, started_at, ended_at, duration, triggers, remedies, related_conditions, notes, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        id, personId, symptom.name, symptom.severity,
        symptom.bodyArea || null, symptom.description || null,
        symptom.startedAt, symptom.endedAt || null,
        symptom.duration || null,
        JSON.stringify(symptom.triggers),
        JSON.stringify(symptom.remedies),
        JSON.stringify(symptom.relatedConditions),
        symptom.notes || null,
        JSON.stringify(symptom.metadata || {}),
        now, now
      ]
    );

    return this.mapSymptomFromDb(result.rows[0]);
  }

  async getSymptoms(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<Symptom[]> {
    let sql = 'SELECT * FROM symptoms WHERE person_id = $1';
    const params: any[] = [personId];
    let paramIndex = 2;

    if (options?.startDate) {
      sql += ` AND started_at >= $${paramIndex++}`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ` AND started_at <= $${paramIndex++}`;
      params.push(options.endDate);
    }

    sql += ' ORDER BY started_at DESC';
    if (options?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }

    const result = await query(sql, params);
    return result.rows.map(this.mapSymptomFromDb);
  }

  // ============================================
  // CONDITIONS
  // ============================================

  async addCondition(personId: string, condition: Omit<Condition, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Condition> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO conditions (id, person_id, name, icd_code, category, severity, diagnosed_date, resolved_date, status, diagnosed_by, facility, notes, medications, related_symptoms, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        id, personId, condition.name, condition.icdCode || null,
        condition.category || null, condition.severity,
        condition.diagnosedDate, condition.resolvedDate || null,
        condition.status, condition.diagnosedBy || null,
        condition.facility || null, condition.notes || null,
        JSON.stringify(condition.medications),
        JSON.stringify(condition.relatedSymptoms),
        JSON.stringify(condition.metadata || {}),
        now, now
      ]
    );

    return this.mapConditionFromDb(result.rows[0]);
  }

  async getConditions(personId: string, activeOnly?: boolean): Promise<Condition[]> {
    let sql = 'SELECT * FROM conditions WHERE person_id = $1';
    if (activeOnly) {
      sql += " AND status IN ('active', 'chronic')";
    }
    sql += ' ORDER BY diagnosed_date DESC';

    const result = await query(sql, [personId]);
    return result.rows.map(this.mapConditionFromDb);
  }

  // ============================================
  // APPOINTMENTS
  // ============================================

  async scheduleAppointment(personId: string, appointment: Omit<Appointment, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO appointments (id, person_id, doctor_name, specialty, facility, address, appointment_date, duration, type, status, notes, follow_up, cost, insurance_claimed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        id, personId, appointment.doctorName, appointment.specialty || null,
        appointment.facility || null, appointment.address || null,
        appointment.appointmentDate, appointment.duration || null,
        appointment.type, appointment.status,
        appointment.notes || null, JSON.stringify(appointment.followUp || null),
        appointment.cost || null, appointment.insuranceClaimed,
        now, now
      ]
    );

    return this.mapAppointmentFromDb(result.rows[0]);
  }

  async getAppointments(personId: string, upcoming?: boolean): Promise<Appointment[]> {
    let sql = 'SELECT * FROM appointments WHERE person_id = $1';
    if (upcoming) {
      sql += " AND status = 'scheduled' AND appointment_date > NOW()";
    }
    sql += ' ORDER BY appointment_date DESC';

    const result = await query(sql, [personId]);
    return result.rows.map(this.mapAppointmentFromDb);
  }

  async updateAppointmentStatus(appointmentId: string, status: string): Promise<Appointment | null> {
    const result = await query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, appointmentId]
    );
    if (result.rows.length === 0) return null;
    return this.mapAppointmentFromDb(result.rows[0]);
  }

  // ============================================
  // ALLERGIES
  // ============================================

  async addAllergy(personId: string, allergy: Omit<Allergy, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Allergy> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO allergies (id, person_id, allergen, type, severity, reactions, diagnosed_date, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, personId, allergy.allergen, allergy.type, allergy.severity,
        JSON.stringify(allergy.reactions), allergy.diagnosedDate || null,
        allergy.notes || null, now, now
      ]
    );

    return this.mapAllergyFromDb(result.rows[0]);
  }

  async getAllergies(personId: string): Promise<Allergy[]> {
    const result = await query('SELECT * FROM allergies WHERE person_id = $1 ORDER BY created_at DESC', [personId]);
    return result.rows.map(this.mapAllergyFromDb);
  }

  // ============================================
  // VACCINATIONS
  // ============================================

  async addVaccination(personId: string, vaccination: Omit<Vaccination, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Vaccination> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO vaccinations (id, person_id, vaccine, vaccine_code, dose_number, total_doses, date_administered, facility, administered_by, next_dose_date, side_effects, batch_number, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        id, personId, vaccination.vaccine, vaccination.vaccineCode || null,
        vaccination.doseNumber, vaccination.totalDoses,
        vaccination.dateAdministered, vaccination.facility || null,
        vaccination.administeredBy || null, vaccination.nextDoseDate || null,
        JSON.stringify(vaccination.sideEffects),
        vaccination.batchNumber || null,
        JSON.stringify(vaccination.metadata || {}),
        now, now
      ]
    );

    return this.mapVaccinationFromDb(result.rows[0]);
  }

  async getVaccinations(personId: string): Promise<Vaccination[]> {
    const result = await query('SELECT * FROM vaccinations WHERE person_id = $1 ORDER BY date_administered DESC', [personId]);
    return result.rows.map(this.mapVaccinationFromDb);
  }

  // ============================================
  // WOMEN'S HEALTH
  // ============================================

  async logMenstrualCycle(personId: string, cycle: Omit<MenstrualCycle, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<MenstrualCycle> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO menstrual_cycles (id, person_id, start_date, end_date, duration, flow_intensity, symptoms, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, personId, cycle.startDate, cycle.endDate || null,
        cycle.duration || null, cycle.flowIntensity || null,
        JSON.stringify(cycle.symptoms), cycle.notes || null,
        now, now
      ]
    );

    return this.mapMenstrualCycleFromDb(result.rows[0]);
  }

  async getMenstrualCycles(personId: string, limit?: number): Promise<MenstrualCycle[]> {
    let sql = 'SELECT * FROM menstrual_cycles WHERE person_id = $1 ORDER BY start_date DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    const result = await query(sql, [personId]);
    return result.rows.map(this.mapMenstrualCycleFromDb);
  }

  async createPregnancy(personId: string, pregnancy: Omit<Pregnancy, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Pregnancy> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO pregnancies (id, person_id, conception_date, due_date, status, trimester, outcomes, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, personId, pregnancy.conceptionDate || null,
        pregnancy.dueDate, pregnancy.status,
        pregnancy.trimester || null, JSON.stringify(pregnancy.outcomes || null),
        pregnancy.notes || null, now, now
      ]
    );

    return this.mapPregnancyFromDb(result.rows[0]);
  }

  async getPregnancies(personId: string): Promise<Pregnancy[]> {
    const result = await query('SELECT * FROM pregnancies WHERE person_id = $1 ORDER BY due_date DESC', [personId]);
    return result.rows.map(this.mapPregnancyFromDb);
  }

  async recordFertilityWindow(personId: string, window: Omit<FertilityWindow, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<FertilityWindow> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO fertility_windows (id, person_id, cycle_start_date, fertile_window_start, fertile_window_end, ovulation_date, conception_probability, method, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id, personId, window.cycleStartDate, window.fertileWindowStart,
        window.fertileWindowEnd, window.ovulationDate || null,
        window.conceptionProbability || null, window.method,
        window.notes || null, now, now
      ]
    );

    return this.mapFertilityWindowFromDb(result.rows[0]);
  }

  // ============================================
  // FAMILY MEMBERS
  // ============================================

  async addFamilyMember(personId: string, member: Omit<FamilyMember, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<FamilyMember> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO family_members (id, person_id, first_name, last_name, relationship, date_of_birth, gender, health_context, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, personId, member.firstName, member.lastName || null,
        member.relationship, member.dateOfBirth || null,
        member.gender || null, member.healthContext,
        now, now
      ]
    );

    return this.mapFamilyMemberFromDb(result.rows[0]);
  }

  async getFamilyMembers(personId: string): Promise<FamilyMember[]> {
    const result = await query('SELECT * FROM family_members WHERE person_id = $1 ORDER BY relationship', [personId]);
    return result.rows.map(this.mapFamilyMemberFromDb);
  }

  // ============================================
  // LIFE EVENTS
  // ============================================

  async recordLifeEvent(personId: string, event: Omit<LifeEvent, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<LifeEvent> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO life_events (id, person_id, event_type, event_date, title, description, impact, related_entities, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id, personId, event.eventType, event.eventDate, event.title,
        event.description || null, JSON.stringify(event.impact || {}),
        JSON.stringify(event.relatedEntities || {}),
        JSON.stringify(event.metadata || {}),
        now, now
      ]
    );

    return this.mapLifeEventFromDb(result.rows[0]);
  }

  async getLifeEvents(personId: string): Promise<LifeEvent[]> {
    const result = await query('SELECT * FROM life_events WHERE person_id = $1 ORDER BY event_date DESC', [personId]);
    return result.rows.map(this.mapLifeEventFromDb);
  }

  // ============================================
  // HEALTH INSURANCE
  // ============================================

  async addHealthInsurance(personId: string, insurance: Omit<HealthInsurance, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<HealthInsurance> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO health_insurance (id, person_id, provider, policy_number, plan_type, coverage_start, coverage_end, monthly_premium, deductible, copay, covered_services, exclusions, status, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        id, personId, insurance.provider, insurance.policyNumber,
        insurance.planType, insurance.coverageStart,
        insurance.coverageEnd || null, insurance.monthlyPremium || null,
        insurance.deductible || null, insurance.copay || null,
        JSON.stringify(insurance.coveredServices),
        JSON.stringify(insurance.exclusions),
        insurance.status,
        JSON.stringify(insurance.metadata || {}),
        now, now
      ]
    );

    return this.mapHealthInsuranceFromDb(result.rows[0]);
  }

  async getHealthInsurance(personId: string): Promise<HealthInsurance[]> {
    const result = await query('SELECT * FROM health_insurance WHERE person_id = $1 ORDER BY coverage_start DESC', [personId]);
    return result.rows.map(this.mapHealthInsuranceFromDb);
  }

  // ============================================
  // HEALTH TIMELINE & ANALYTICS
  // ============================================

  async getHealthTimeline(query: HealthTimelineQuery): Promise<any[]> {
    const events: any[] = [];

    // Get conditions
    if (query.includeConditions) {
      const conditions = await this.getConditions(query.personId);
      conditions.forEach(c => events.push({
        type: 'condition',
        date: c.diagnosedDate,
        title: c.name,
        data: c
      }));
    }

    // Get symptoms
    if (query.includeSymptoms) {
      const symptoms = await this.getSymptoms(query.personId, { startDate: query.startDate, endDate: query.endDate });
      symptoms.forEach(s => events.push({
        type: 'symptom',
        date: s.startedAt,
        title: s.name,
        data: s
      }));
    }

    // Get reports
    if (query.includeReports) {
      const reports = await this.getMedicalReports(query.personId, { startDate: query.startDate, endDate: query.endDate });
      reports.forEach(r => events.push({
        type: 'report',
        date: r.reportDate,
        title: r.title,
        data: r
      }));
    }

    // Get life events
    if (query.includeLifeEvents) {
      const lifeEvents = await this.getLifeEvents(query.personId);
      lifeEvents.forEach(e => events.push({
        type: 'life_event',
        date: e.eventDate,
        title: e.title,
        data: e
      }));
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
  }

  async getHealthSummary(personId: string, period: HealthSummaryQuery['period'] = 'month'): Promise<HealthMemoryStats> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const startDateStr = startDate.toISOString();

    // Get all stats in parallel
    const [reports, medications, conditions, symptoms, appointments] = await Promise.all([
      query('SELECT COUNT(*) as count, MAX(report_date) as last FROM medical_reports WHERE person_id = $1 AND report_date >= $2', [personId, startDateStr]),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM medications WHERE person_id = $1 AND start_date >= $2', [personId, startDateStr]),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active, COUNT(*) FILTER (WHERE status = \'chronic\') as chronic FROM conditions WHERE person_id = $1 AND diagnosed_date >= $2', [personId, startDateStr]),
      query('SELECT COUNT(*) as count FROM symptoms WHERE person_id = $1 AND started_at >= $2', [personId, startDateStr]),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'scheduled\' AND appointment_date > NOW()) as upcoming, MAX(appointment_date) as last FROM appointments WHERE person_id = $1 AND appointment_date >= $2', [personId, startDateStr])
    ]);

    return {
      totalReports: parseInt(reports.rows[0].count) || 0,
      lastReportDate: reports.rows[0].last || null,
      totalMedications: parseInt(medications.rows[0].total) || 0,
      activeMedications: parseInt(medications.rows[0].active) || 0,
      totalConditions: parseInt(conditions.rows[0].total) || 0,
      activeConditions: parseInt(conditions.rows[0].active) || 0,
      chronicConditions: parseInt(conditions.rows[0].chronic) || 0,
      totalSymptoms: parseInt(symptoms.rows[0].count) || 0,
      totalAppointments: parseInt(appointments.rows[0].total) || 0,
      upcomingAppointments: parseInt(appointments.rows[0].upcoming) || 0,
      lastAppointmentDate: appointments.rows[0].last || null,
      healthScore: 85 // Placeholder - will be calculated by AI
    };
  }

  // ============================================
  // MAPPING HELPERS
  // ============================================

  private mapPersonFromDb(row: any): Person {
    return {
      id: row.id,
      corpId: row.corp_id,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth?.toISOString().split('T')[0],
      gender: row.gender,
      bloodType: row.blood_type,
      heightCm: row.height_cm ? parseFloat(row.height_cm) : undefined,
      weightKg: row.weight_kg ? parseFloat(row.weight_kg) : undefined,
      allergies: row.allergies || [],
      emergencyContact: row.emergency_contact,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapReportFromDb(row: any): MedicalReport {
    return {
      id: row.id,
      personId: row.person_id,
      title: row.title,
      type: row.type,
      reportDate: row.report_date.toISOString().split('T')[0],
      facility: row.facility,
      doctorName: row.doctor_name,
      specialty: row.specialty,
      summary: row.summary,
      findings: row.findings || [],
      attachments: row.attachments || [],
      extractedText: row.extracted_text,
      metadata: row.metadata || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapMedicationFromDb(row: any): Medication {
    return {
      id: row.id,
      personId: row.person_id,
      name: row.name,
      genericName: row.generic_name,
      dosage: row.dosage,
      frequency: row.frequency,
      route: row.route,
      startDate: row.start_date.toISOString().split('T')[0],
      endDate: row.end_date?.toISOString().split('T')[0],
      prescribedBy: row.prescribed_by,
      purpose: row.purpose,
      sideEffects: row.side_effects || [],
      interactions: row.interactions || [],
      isActive: row.is_active,
      reminders: row.reminders || [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapSymptomFromDb(row: any): Symptom {
    return {
      id: row.id,
      personId: row.person_id,
      name: row.name,
      severity: row.severity,
      bodyArea: row.body_area,
      description: row.description,
      startedAt: row.started_at.toISOString(),
      endedAt: row.ended_at?.toISOString(),
      duration: row.duration,
      triggers: row.triggers || [],
      remedies: row.remedies || [],
      relatedConditions: row.related_conditions || [],
      notes: row.notes,
      metadata: row.metadata || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapConditionFromDb(row: any): Condition {
    return {
      id: row.id,
      personId: row.person_id,
      name: row.name,
      icdCode: row.icd_code,
      category: row.category,
      severity: row.severity,
      diagnosedDate: row.diagnosed_date.toISOString().split('T')[0],
      resolvedDate: row.resolved_date?.toISOString().split('T')[0],
      status: row.status,
      diagnosedBy: row.diagnosed_by,
      facility: row.facility,
      notes: row.notes,
      medications: row.medications || [],
      relatedSymptoms: row.related_symptoms || [],
      metadata: row.metadata || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapAppointmentFromDb(row: any): Appointment {
    return {
      id: row.id,
      personId: row.person_id,
      doctorName: row.doctor_name,
      specialty: row.specialty,
      facility: row.facility,
      address: row.address,
      appointmentDate: row.appointment_date.toISOString(),
      duration: row.duration,
      type: row.type,
      status: row.status,
      notes: row.notes,
      followUp: row.follow_up,
      cost: row.cost ? parseFloat(row.cost) : undefined,
      insuranceClaimed: row.insurance_claimed,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapAllergyFromDb(row: any): Allergy {
    return {
      id: row.id,
      personId: row.person_id,
      allergen: row.allergen,
      type: row.type,
      severity: row.severity,
      reactions: row.reactions || [],
      diagnosedDate: row.diagnosed_date?.toISOString().split('T')[0],
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapVaccinationFromDb(row: any): Vaccination {
    return {
      id: row.id,
      personId: row.person_id,
      vaccine: row.vaccine,
      vaccineCode: row.vaccine_code,
      doseNumber: row.dose_number,
      totalDoses: row.total_doses,
      dateAdministered: row.date_administered.toISOString().split('T')[0],
      facility: row.facility,
      administeredBy: row.administered_by,
      nextDoseDate: row.next_dose_date?.toISOString().split('T')[0],
      sideEffects: row.side_effects || [],
      batchNumber: row.batch_number,
      metadata: row.metadata || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapMenstrualCycleFromDb(row: any): MenstrualCycle {
    return {
      id: row.id,
      personId: row.person_id,
      startDate: row.start_date.toISOString().split('T')[0],
      endDate: row.end_date?.toISOString().split('T')[0],
      duration: row.duration,
      flowIntensity: row.flow_intensity,
      symptoms: row.symptoms || [],
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapPregnancyFromDb(row: any): Pregnancy {
    return {
      id: row.id,
      personId: row.person_id,
      conceptionDate: row.conception_date?.toISOString().split('T')[0],
      dueDate: row.due_date.toISOString().split('T')[0],
      status: row.status,
      trimester: row.trimester,
      outcomes: row.outcomes,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapFertilityWindowFromDb(row: any): FertilityWindow {
    return {
      id: row.id,
      personId: row.person_id,
      cycleStartDate: row.cycle_start_date.toISOString().split('T')[0],
      fertileWindowStart: row.fertile_window_start.toISOString().split('T')[0],
      fertileWindowEnd: row.fertile_window_end.toISOString().split('T')[0],
      ovulationDate: row.ovulation_date?.toISOString().split('T')[0],
      conceptionProbability: row.conception_probability ? parseFloat(row.conception_probability) : undefined,
      method: row.method,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapFamilyMemberFromDb(row: any): FamilyMember {
    return {
      id: row.id,
      personId: row.person_id,
      firstName: row.first_name,
      lastName: row.last_name,
      relationship: row.relationship,
      dateOfBirth: row.date_of_birth?.toISOString().split('T')[0],
      gender: row.gender,
      healthContext: row.health_context,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapLifeEventFromDb(row: any): LifeEvent {
    return {
      id: row.id,
      personId: row.person_id,
      eventType: row.event_type,
      eventDate: row.event_date.toISOString().split('T')[0],
      title: row.title,
      description: row.description,
      impact: row.impact || { health: 5, mental: 5, financial: 5, social: 5 },
      relatedEntities: row.related_entities || {},
      metadata: row.metadata || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  private mapHealthInsuranceFromDb(row: any): HealthInsurance {
    return {
      id: row.id,
      personId: row.person_id,
      provider: row.provider,
      policyNumber: row.policy_number,
      planType: row.plan_type,
      coverageStart: row.coverage_start.toISOString().split('T')[0],
      coverageEnd: row.coverage_end?.toISOString().split('T')[0],
      monthlyPremium: row.monthly_premium ? parseFloat(row.monthly_premium) : undefined,
      deductible: row.deductible ? parseFloat(row.deductible) : undefined,
      copay: row.copay ? parseFloat(row.copay) : undefined,
      coveredServices: row.covered_services || [],
      exclusions: row.exclusions || [],
      status: row.status,
      metadata: row.metadata || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }
}

// Export singleton instance
export const healthMemoryService = new HealthMemoryService();