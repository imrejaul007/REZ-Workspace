import { v4 as uuidv4 } from 'uuid';
import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Medical Mode Service
 * Handles medical emergency info Safe QR functionality
 */

export interface CreateMedicalQRInput {
 ownerId: string;
 profile: {
   displayName: string;
   age?: number;
   gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
   bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown' | 'not-sure';
   allergies?: Array<{
     allergen: string;
     severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
     notes?: string;
   }>;
   medicalConditions?: string[];
   medications?: Array<{
     name: string;
     dosage?: string;
     frequency?: string;
     notes?: string;
   }>;
   organDonor?: boolean;
   emergencyContacts?: Array<{
     name: string;
     phone: string;
     relationship?: string;
   }>;
   primaryPhysician?: string;
   physicianPhone?: string;
   insuranceProvider?: string;
   insurancePolicy?: string;
   medicalNotes?: string;
 };
 settings?: {
   notifyOnScan?: boolean;
 };
}

export interface UpdateMedicalProfileInput {
 displayName?: string;
 age?: number;
 gender?: string;
 bloodType?: string;
 allergies?: Array<{ allergen: string; severity?: string; notes?: string }>;
 medicalConditions?: string[];
 medications?: Array<{ name: string; dosage?: string; frequency?: string; notes?: string }>;
 organDonor?: boolean;
 emergencyContacts?: Array<{ name: string; phone: string; relationship?: string }>;
 primaryPhysician?: string;
 physicianPhone?: string;
 insuranceProvider?: string;
 insurancePolicy?: string;
 medicalNotes?: string;
}

/**
 * Create a new Medical Safe QR
 */
export async function createMedicalQR(input: CreateMedicalQRInput): Promise<SafeQR> {
 const shortcode = `REZM${generateShortcodeSuffix()}`;
 const qrId = generateQRId('medical' as SafeQRMode);

 const profile = {
   mode: 'medical' as const,
   displayName: input.profile.displayName,
   age: input.profile.age,
   gender: input.profile.gender,
   bloodType: input.profile.bloodType,
   allergies: input.profile.allergies || [],
   medicalConditions: input.profile.medicalConditions || [],
   medications: input.profile.medications || [],
   organDonor: input.profile.organDonor || false,
   emergencyContacts: input.profile.emergencyContacts || [],
   primaryPhysician: input.profile.primaryPhysician,
   physicianPhone: input.profile.physicianPhone,
   insuranceProvider: input.profile.insuranceProvider,
   insurancePolicy: input.profile.insurancePolicy,
   medicalNotes: input.profile.medicalNotes,
   disclaimer: 'Information is self-declared. Verify independently during emergencies.',
   disclaimerAcceptedAt: new Date(),
   lastVerifiedAt: new Date(),
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'medical',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: false, // Medical QR doesn't allow messages
     allowContactRequests: true, // Contact for emergency
     shareLocationOnScan: true,
     notifyOnScan: input.settings?.notifyOnScan ?? true,
     autoActivateLost: false,
     requireApproval: false, // Emergency contacts accessible without approval
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'medical',
     id: qrId,
     shortcode,
   },
   stats: {
     totalScans: 0,
     uniqueScanners: 0,
     totalMessages: 0,
   },
   karma: {
     isRegistered: true,
   },
 });

 await qr.save();
 return qr;
}

/**
 * Get Public Medical Info (Emergency Access)
 */
export async function getPublicMedicalInfo(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical') return null;

 const profile = qr.profile as unknown;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   displayName: profile.displayName,
   age: profile.age,
   bloodType: profile.bloodType,
   allergies: profile.allergies,
   medicalConditions: profile.medicalConditions,
   medications: profile.medications,
   organDonor: profile.organDonor,
   disclaimer: profile.disclaimer,
   // Note: Emergency contacts are NOT exposed for privacy
 };
}

/**
 * Get Full Medical Profile (Owner Only)
 */
export async function getFullMedicalProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical' || qr.ownerId !== ownerId) return null;

 return {
   ...qr.profile,
   shortcode: qr.shortcode,
   qrId: qr.qrId,
   status: qr.status,
   stats: qr.stats,
   createdAt: qr.createdAt,
 };
}

/**
 * Update Medical Profile
 */
export async function updateMedicalProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdateMedicalProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical' || qr.ownerId !== ownerId) return null;

 qr.profile = {
   ...qr.profile,
   ...updates,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Refresh Medical Info Disclaimer
 */
export async function refreshDisclaimer(shortcode: string, ownerId: string): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).disclaimerAcceptedAt = new Date();
 (qr.profile as unknown).lastVerifiedAt = new Date();
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Emergency Contacts
 */
export async function updateEmergencyContacts(
 shortcode: string,
 ownerId: string,
 contacts: Array<{
   name: string;
   phone: string;
   relationship?: string;
 }>
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical' || qr.ownerId !== ownerId) return null;

 if (contacts.length === 0) {
   throw new Error('At least one emergency contact is required');
 }

 (qr.profile as unknown).emergencyContacts = contacts;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Add Allergy
 */
export async function addAllergy(
 shortcode: string,
 ownerId: string,
 allergy: {
   allergen: string;
   severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
   notes?: string;
 }
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical' || qr.ownerId !== ownerId) return null;

 const profile = qr.profile as unknown;
 if (!profile.allergies) profile.allergies = [];
 profile.allergies.push(allergy);
 qr.profile = profile;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Add Medication
 */
export async function addMedication(
 shortcode: string,
 ownerId: string,
 medication: {
   name: string;
   dosage?: string;
   frequency?: string;
   notes?: string;
 }
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'medical' || qr.ownerId !== ownerId) return null;

 const profile = qr.profile as unknown;
 if (!profile.medications) profile.medications = [];
 profile.medications.push(medication);
 qr.profile = profile;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}
