import { v4 as uuidv4 } from 'uuid';
import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Helmet Mode Service
 * Handles helmet safety QR functionality
 */

export interface CreateHelmetQRInput {
 ownerId: string;
 profile: {
   displayName: string;
   bloodType?: string;
   allergies?: string[];
   medicalNotes?: string;
   emergencyContacts: Array<{
     name: string;
     phone: string;
     relationship?: string;
   }>;
   ridingExperience?: 'beginner' | 'intermediate' | 'expert';
   hasInsurance?: boolean;
   insurancePolicyNumber?: string;
   vehicleInfo?: {
     make?: string;
     model?: string;
     plateNumber?: string;
     color?: string;
   };
 };
}

export interface UpdateHelmetProfileInput {
 displayName?: string;
 bloodType?: string;
 allergies?: string[];
 medicalNotes?: string;
 emergencyContacts?: Array<{ name: string; phone: string; relationship?: string }>;
 ridingExperience?: 'beginner' | 'intermediate' | 'expert';
 hasInsurance?: boolean;
 insurancePolicyNumber?: string;
 vehicleInfo?: {
   make?: string;
   model?: string;
   plateNumber?: string;
   color?: string;
 };
}

/**
 * Create a new Helmet Safe QR
 */
export async function createHelmetQR(input: CreateHelmetQRInput): Promise<SafeQR> {
 const shortcode = `REZH${generateShortcodeSuffix()}`;
 const qrId = generateQRId('helmet' as SafeQRMode);

 const profile = {
   mode: 'helmet' as const,
   displayName: input.profile.displayName,
   bloodType: input.profile.bloodType,
   allergies: input.profile.allergies || [],
   medicalNotes: input.profile.medicalNotes,
   emergencyContacts: input.profile.emergencyContacts,
   ridingExperience: input.profile.ridingExperience || 'intermediate',
   hasInsurance: input.profile.hasInsurance || false,
   insurancePolicyNumber: input.profile.insurancePolicyNumber,
   vehicleInfo: input.profile.vehicleInfo,
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'helmet',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: false,
     allowContactRequests: true,
     shareLocationOnScan: true,
     notifyOnScan: true,
     autoActivateLost: false,
     requireApproval: false, // Emergency SOS accessible
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'helmet',
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
 * Get Public Helmet Info (Emergency Access)
 */
export async function getPublicHelmetInfo(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'helmet') return null;

 const profile = qr.profile as unknown;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   displayName: profile.displayName,
   bloodType: profile.bloodType,
   allergies: profile.allergies,
   medicalNotes: profile.medicalNotes,
   ridingExperience: profile.ridingExperience,
 };
}

/**
 * Get Full Helmet Profile (Owner Only)
 */
export async function getFullHelmetProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'helmet' || qr.ownerId !== ownerId) return null;

 return {
   ...qr.profile,
   shortcode: qr.shortcode,
   qrId: qr.qrId,
   stats: qr.stats,
   createdAt: qr.createdAt,
 };
}

/**
 * Update Helmet Profile
 */
export async function updateHelmetProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdateHelmetProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'helmet' || qr.ownerId !== ownerId) return null;

 qr.profile = {
   ...qr.profile,
   ...updates,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Emergency Contacts
 */
export async function updateHelmetEmergencyContacts(
 shortcode: string,
 ownerId: string,
 contacts: Array<{ name: string; phone: string; relationship?: string }>
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'helmet' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).emergencyContacts = contacts;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}
