import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';
import { createFeedPost } from '../../shared/services/karma';

/**
 * Vehicle Mode Service
 * Handles vehicle (car, bike, etc.) Safe QR functionality
 */

export interface CreateVehicleQRInput {
 ownerId: string;
 profile: {
   vehicleType: 'car' | 'bike' | 'truck' | 'van' | 'auto' | 'other';
   make: string;
   model?: string;
   year?: number;
   color?: string;
   plateNumber?: string;
   plateState?: string;
   parkingNotes?: string;
   preferredContact?: 'message' | 'call' | 'both' | 'none';
   alertsEnabled?: {
     parkingIssue?: boolean;
     damageAlert?: boolean;
     lightsOn?: boolean;
     towingWarning?: boolean;
     emergency?: boolean;
   };
   photos?: string[];
 };
}

export interface UpdateVehicleProfileInput {
 vehicleType?: string;
 make?: string;
 model?: string;
 year?: number;
 color?: string;
 plateNumber?: string;
 plateState?: string;
 parkingNotes?: string;
 preferredContact?: 'message' | 'call' | 'both' | 'none';
 alertsEnabled?: {
   parkingIssue?: boolean;
   damageAlert?: boolean;
   lightsOn?: boolean;
   towingWarning?: boolean;
   emergency?: boolean;
 };
 photos?: string[];
}

/**
 * Create a new Vehicle Safe QR
 */
export async function createVehicleQR(input: CreateVehicleQRInput): Promise<SafeQR> {
 const shortcode = `REZV${generateShortcodeSuffix()}`;
 const qrId = generateQRId('vehicle' as SafeQRMode);

 const profile = {
   mode: 'vehicle' as const,
   vehicleType: input.profile.vehicleType,
   make: input.profile.make,
   model: input.profile.model,
   year: input.profile.year,
   color: input.profile.color,
   plateNumber: input.profile.plateNumber,
   plateState: input.profile.plateState,
   parkingNotes: input.profile.parkingNotes,
   preferredContact: input.profile.preferredContact || 'message',
   alertsEnabled: {
     parkingIssue: true,
     damageAlert: true,
     lightsOn: true,
     towingWarning: true,
     emergency: true,
     ...input.profile.alertsEnabled,
   },
   photos: input.profile.photos || [],
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'vehicle',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: true,
     allowContactRequests: true,
     shareLocationOnScan: true,
     notifyOnScan: true,
     autoActivateLost: false,
     requireApproval: false, // Vehicle alerts accessible
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'vehicle',
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
 * Get Public Vehicle Info
 */
export async function getPublicVehicleInfo(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'vehicle') return null;

 const profile = qr.profile as unknown;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   vehicleType: profile.vehicleType,
   make: profile.make,
   model: profile.model,
   color: profile.color,
   plateDisplay: profile.plateNumber ? `${profile.plateState || ''} ${profile.plateNumber}` : undefined,
   parkingNotes: profile.parkingNotes,
   preferredContact: profile.preferredContact,
 };
}

/**
 * Get Full Vehicle Profile (Owner Only)
 */
export async function getFullVehicleProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'vehicle' || qr.ownerId !== ownerId) return null;

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
 * Update Vehicle Profile
 */
export async function updateVehicleProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdateVehicleProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'vehicle' || qr.ownerId !== ownerId) return null;

 const profile = qr.profile as unknown;
 qr.profile = {
   ...profile,
   ...updates,
   alertsEnabled: updates.alertsEnabled ? {
     ...profile.alertsEnabled,
     ...updates.alertsEnabled,
   } : profile.alertsEnabled,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Alert Settings
 */
export async function updateAlertSettings(
 shortcode: string,
 ownerId: string,
 alerts: {
   parkingIssue?: boolean;
   damageAlert?: boolean;
   lightsOn?: boolean;
   towingWarning?: boolean;
   emergency?: boolean;
 }
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'vehicle' || qr.ownerId !== ownerId) return null;

 const profile = qr.profile as unknown;
 profile.alertsEnabled = {
   ...profile.alertsEnabled,
   ...alerts,
 };
 qr.profile = profile;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Parking Notes
 */
export async function updateParkingNotes(
 shortcode: string,
 ownerId: string,
 notes: string
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'vehicle' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).parkingNotes = notes;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}
