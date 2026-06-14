/**
 * Vaccination Service - Core vaccination tracking operations
 */
import { v4 as uuidv4 } from 'uuid';
import {
  VaccinationRecord,
  VaccinationReminder,
  Vaccine,
  ImmunizationCertificate,
  ComplianceReport,
  AddRecordInput,
  SetReminderInput,
  AgeGroup,
} from '../models/vaccination';

// In-memory storage
const records: Map<string, VaccinationRecord> = new Map();
const reminders: Map<string, VaccinationReminder> = new Map();
const certificates: Map<string, ImmunizationCertificate> = new Map();

// Sample vaccine catalog
const vaccineCatalog: Map<string, Vaccine> = new Map([
  ['COVID-19', {
    vaccineId: 'v001',
    name: 'COVID-19 Vaccine',
    code: 'COVID-19',
    manufacturer: 'Multiple',
    description: 'COVID-19 vaccination',
    dosesRequired: 2,
    doseInterval: { recommendedDays: 21 },
    ageGroup: ['adult', 'senior'],
    contraindications: [],
    sideEffects: ['fever', 'fatigue', 'headache'],
  }],
  ['Influenza', {
    vaccineId: 'v002',
    name: 'Influenza Vaccine',
    code: 'FLU',
    manufacturer: 'Multiple',
    description: 'Annual flu shot',
    dosesRequired: 1,
    ageGroup: ['child', 'adolescent', 'adult', 'senior'],
    contraindications: [],
    sideEffects: ['soreness', 'fever'],
  }],
  ['Hepatitis B', {
    vaccineId: 'v003',
    name: 'Hepatitis B Vaccine',
    code: 'HEP-B',
    manufacturer: 'Multiple',
    description: 'Hepatitis B protection',
    dosesRequired: 3,
    doseInterval: { recommendedDays: 30 },
    ageGroup: ['infant', 'child', 'adult'],
    contraindications: [],
    sideEffects: ['soreness'],
  }],
  ['Tetanus', {
    vaccineId: 'v004',
    name: 'Tetanus Vaccine',
    code: 'TT',
    manufacturer: 'Multiple',
    description: 'Tetanus booster',
    dosesRequired: 1,
    ageGroup: ['child', 'adolescent', 'adult', 'senior'],
    contraindications: [],
    sideEffects: ['soreness'],
  }],
]);

export const addVaccinationRecord = (input: AddRecordInput): VaccinationRecord => {
  const record: VaccinationRecord = {
    recordId: uuidv4(),
    ...input,
  };
  records.set(record.recordId, record);
  return record;
};

export const getVaccinationRecords = (userId: string): VaccinationRecord[] => {
  return Array.from(records.values())
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime());
};

export const getVaccinationRecord = (recordId: string): VaccinationRecord | undefined => {
  return records.get(recordId);
};

export const getUpcomingVaccinations = (userId: string): VaccinationRecord[] => {
  const now = new Date();
  return Array.from(records.values())
    .filter(r => r.userId === userId && r.nextDoseDue && new Date(r.nextDoseDue) > now)
    .sort((a, b) => new Date(a.nextDoseDue!).getTime() - new Date(b.nextDoseDue!).getTime());
};

export const getOverdueVaccinations = (userId: string): VaccinationRecord[] => {
  const now = new Date();
  return Array.from(records.values())
    .filter(r => r.userId === userId && r.nextDoseDue && new Date(r.nextDoseDue) <= now)
    .sort((a, b) => new Date(a.nextDoseDue!).getTime() - new Date(b.nextDoseDue!).getTime());
};

export const setReminder = (input: SetReminderInput): VaccinationReminder => {
  const reminder: VaccinationReminder = {
    reminderId: uuidv4(),
    ...input,
    sent: false,
  };
  reminders.set(reminder.reminderId, reminder);
  return reminder;
};

export const getReminders = (userId: string): VaccinationReminder[] => {
  return Array.from(reminders.values())
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

export const markReminderSent = (reminderId: string): VaccinationReminder | undefined => {
  const reminder = reminders.get(reminderId);
  if (reminder) {
    reminder.sent = true;
    reminder.sentAt = new Date().toISOString();
    reminders.set(reminderId, reminder);
  }
  return reminder;
};

export const getVaccineCatalog = (ageGroup?: AgeGroup): Vaccine[] => {
  let vaccines = Array.from(vaccineCatalog.values());
  if (ageGroup) {
    vaccines = vaccines.filter(v => v.ageGroup.includes(ageGroup));
  }
  return vaccines;
};

export const getVaccine = (code: string): Vaccine | undefined => {
  return vaccineCatalog.get(code);
};

export const generateCertificate = (userId: string): ImmunizationCertificate => {
  const userRecords = getVaccinationRecords(userId);
  const certificate: ImmunizationCertificate = {
    certificateId: uuidv4(),
    userId,
    issuedAt: new Date().toISOString(),
    vaccines: userRecords.map(r => ({
      vaccineName: r.vaccineName,
      vaccineCode: r.vaccineCode,
      doseNumber: r.doseNumber,
      administeredAt: r.administeredAt,
      location: r.location,
    })),
    verificationCode: uuidv4().substring(0, 8).toUpperCase(),
    isVerified: true,
  };
  certificates.set(certificate.certificateId, certificate);
  return certificate;
};

export const getCertificate = (certificateId: string): ImmunizationCertificate | undefined => {
  return certificates.get(certificateId);
};

export const getComplianceReport = (userId: string): ComplianceReport => {
  const userRecords = getVaccinationRecords(userId);
  const completedVaccines = new Set(userRecords.map(r => r.vaccineCode));
  const catalog = getVaccineCatalog();

  let totalRequired = catalog.length;
  let totalCompleted = completedVaccines.size;

  const missingVaccines = catalog
    .filter(v => !completedVaccines.has(v.code))
    .map(v => ({
      vaccineCode: v.code,
      vaccineName: v.name,
      dosesRequired: v.dosesRequired,
      dosesCompleted: 0,
      dueDate: undefined,
    }));

  const overdueVaccines = getOverdueVaccinations(userId).map(r => ({
    vaccineCode: r.vaccineCode,
    vaccineName: r.vaccineName,
    overdueBy: Math.floor((Date.now() - new Date(r.nextDoseDue!).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const complianceRate = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 100;
  let status: 'compliant' | 'partial' | 'non-compliant' = 'compliant';
  if (complianceRate < 50) status = 'non-compliant';
  else if (complianceRate < 100) status = 'partial';

  return {
    userId,
    status,
    complianceRate: Math.round(complianceRate),
    totalRequired,
    totalCompleted,
    missingVaccines,
    overdueVaccines,
    checkedAt: new Date().toISOString(),
  };
};
